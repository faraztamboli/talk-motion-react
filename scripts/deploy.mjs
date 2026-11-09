#!/usr/bin/env node
/**
 * Build TalkMotion (app + landing page) and roll it out to the cluster.
 *
 *   npm run deploy                 from a clean checkout of the commit you want live (normally main)
 *   npm run deploy -- --dry-run    build and check everything, then stop before push/rollout
 *
 * Steps:
 *   1. Builds the app and landing page into <Projects>/talk-motion-react/dist and
 *      ".../Landing Page/dist". Those are the folders docker-images/web/Dockerfile copies,
 *      so a later full rebuild of the shared image ships what is live.
 *   2. Fails if the build contains either regression the old manual dist edits patched by hand.
 *   3. Builds deploy/web-overlay.Dockerfile: the shared multi-site image with only the two
 *      talk-motion sites replaced. Tag: farukh/web:<base tag>-tm-<git sha>.
 *   4. Pushes it, rolls fweb-deployment to it, waits, and undoes the rollout if it fails.
 *   5. Points deployment_web.yaml at the new tag, so `kubectl apply -f` can't roll back.
 *
 * Roll back by hand: kubectl rollout undo deployment/fweb-deployment
 *
 * Written in Node rather than bash because on this machine `bash` on PATH is WSL.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Real paths: C:\Users\faruk is a junction to D:\Users\faruk, and Vite fails when
// the root and the resolved files sit on different drives.
const REPO = fs.realpathSync.native(path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const PROJECTS = process.env.PROJECTS || path.dirname(REPO);
const OUT = process.env.TM_DEPLOY_DIR || path.join(PROJECTS, "talk-motion-react");
const IMAGE = process.env.IMAGE || "farukh/web";
const BASE_TAG = process.env.BASE_TAG || "12.2.2-ubuntu20.04";
const DEPLOYMENT = "deployment/fweb-deployment";
const CONTAINER = "nginx";
const MANIFEST =
  process.env.MANIFEST ||
  path.join(PROJECTS, "alpharithmic", "PycharmProjects", "Alpharithmic.FundManagerWeb", "deployment_web.yaml");
const APP_URL = "https://app.talk-motion.com/";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const allowDirty = args.has("--allow-dirty");

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function run(cmd, cmdArgs, { cwd = REPO, env, allowFail = false } = {}) {
  console.log(`\n$ ${cmd} ${cmdArgs.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ")}`);
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
  if (r.status !== 0) {
    if (allowFail) return false;
    fail(`${cmd} failed (${r.error ? r.error.message : `exit ${r.status}`})`);
  }
  return true;
}

function capture(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { cwd: REPO, encoding: "utf8" });
  if (r.status !== 0) fail(`${cmd} ${cmdArgs.join(" ")} failed: ${r.stderr || r.error}`);
  return r.stdout.trim();
}

function viteBuild(projectDir, outDir) {
  const vite = path.join(projectDir, "node_modules", "vite", "bin", "vite.js");
  if (!fs.existsSync(vite)) fail(`No node_modules in ${projectDir}. Run: npm ci`);
  run(process.execPath, [vite, "build", "--outDir", outDir, "--emptyOutDir"], { cwd: projectDir });
}

// Guards for the two bugs that used to need hand edits in dist/ after every build.
function checkBuild(distDir) {
  const problems = [];
  const classesDir = path.join(distDir, "video_subtitles_classes");
  if (fs.existsSync(classesDir)) {
    for (const f of fs.readdirSync(classesDir)) {
      const src = fs.readFileSync(path.join(classesDir, f), "utf8");
      if (/^\s*export\s/m.test(src)) {
        problems.push(`video_subtitles_classes/${f} contains "export", but it is loaded as a classic <script>`);
      }
    }
  }
  const assetsDir = path.join(distDir, "assets");
  for (const f of fs.readdirSync(assetsDir).filter((n) => n.endsWith(".js"))) {
    const m = fs.readFileSync(path.join(assetsDir, f), "utf8").match(/new [A-Za-z_$][\w$]{0,2}\.Camera\(/);
    if (m) problems.push(`assets/${f} has "${m[0]}" (mis-bundled @mediapipe/camera_utils; use window.Camera)`);
  }
  if (problems.length) fail(`Build check failed:\n  - ${problems.join("\n  - ")}`);
  console.log("✓ build check passed");
}

// --- preconditions -----------------------------------------------------------
const dirty = capture("git", ["status", "--porcelain"]);
if (dirty && !allowDirty) fail(`Uncommitted changes in ${REPO}. Commit them, or pass --allow-dirty.\n${dirty}`);
const sha = capture("git", ["rev-parse", "--short", "HEAD"]);
const branch = capture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
const subject = capture("git", ["log", "-1", "--format=%s"]);
spawnSync("git", ["fetch", "-q", "origin", "main"], { cwd: REPO });
const mainSha = spawnSync("git", ["rev-parse", "--short", "origin/main"], { cwd: REPO, encoding: "utf8" }).stdout.trim();
if (mainSha && mainSha !== sha) {
  console.warn(`! Deploying ${sha} (${branch}), which is not origin/main (${mainSha}).`);
}
const tag = `${BASE_TAG}-tm-${sha}${dirty ? `-dirty${Date.now()}` : ""}`;
const ref = `${IMAGE}:${tag}`;
console.log(`Deploying ${sha} "${subject}" as ${ref}\n  build output: ${OUT}`);

// --- build -------------------------------------------------------------------
const appDist = path.join(OUT, "dist");
viteBuild(REPO, appDist);
viteBuild(path.join(REPO, "Landing Page"), path.join(OUT, "Landing Page", "dist"));
checkBuild(appDist);

run("docker", [
  "build", "--pull",
  "-f", path.join(REPO, "deploy", "web-overlay.Dockerfile"),
  "--build-arg", `BASE=${IMAGE}:${BASE_TAG}`,
  "-t", ref,
  OUT,
], { env: { DOCKER_BUILDKIT: "1" } });

if (dryRun) {
  console.log(`\n✓ Dry run done. Built ${ref}; nothing pushed or rolled out.`);
  process.exit(0);
}

// --- ship ----------------------------------------------------------------------
run("docker", ["push", ref]);
run("kubectl", ["set", "image", DEPLOYMENT, `${CONTAINER}=${ref}`]);
run("kubectl", ["annotate", DEPLOYMENT, `kubernetes.io/change-cause=talk-motion ${sha} (${branch}): ${subject}`, "--overwrite"]);
if (!run("kubectl", ["rollout", "status", DEPLOYMENT, "--timeout=300s"], { allowFail: true })) {
  run("kubectl", ["rollout", "undo", DEPLOYMENT], { allowFail: true });
  fail("Rollout did not become ready; rolled back to the previous revision.");
}

if (fs.existsSync(MANIFEST)) {
  const yaml = fs.readFileSync(MANIFEST, "utf8");
  const updated = yaml.replace(new RegExp(`(image:\\s*)${IMAGE.replace("/", "\\/")}:[^\\s#]+`), `$1${ref}`);
  if (updated !== yaml) {
    fs.writeFileSync(MANIFEST, updated);
    console.log(`✓ ${MANIFEST} now points at ${ref} (commit it in that repo)`);
  }
}

// --- smoke check ------------------------------------------------------------------
// The old pod can keep answering for a few seconds after `rollout status` returns.
const entry = fs.readFileSync(path.join(appDist, "index.html"), "utf8").match(/assets\/index\.[\w]+\.js/)?.[0];
let served = false;
let lastError = "";
for (let attempt = 0; attempt < 12 && !served; attempt++) {
  if (attempt) await new Promise((resolve) => setTimeout(resolve, 5000));
  try {
    served = (await (await fetch(`${APP_URL}?deploy=${sha}-${attempt}`, { cache: "no-store" })).text()).includes(entry);
  } catch (err) {
    lastError = err.message;
  }
}
if (served) console.log(`✓ ${APP_URL} is serving ${entry}`);
else console.warn(`! ${APP_URL} still doesn't reference ${entry} after 60s${lastError ? ` (${lastError})` : ""}. Check it in a browser.`);
console.log(`\n✓ Deployed ${ref}`);
