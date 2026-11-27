// Subtitle Designer end-to-end test: starts the mock RemotePy server and the Vite dev server,
// runs the browser checks (checks.mjs) in Google Chrome, then stops both servers.
//
//   npm run test:e2e:subtitles               # the real check; exits 0 when every check passes
//   npm run test:e2e:subtitles -- --legacy   # the mock refuses owners like the pre-0.0.6 server;
//                                            # the run should fail with "doesn't belong to you"
//
// Needs Google Chrome and ffmpeg/ffprobe (see README.md). Results and screenshots go to
// e2e/subtitle-designer/.output/.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const LEGACY = process.argv.includes("--legacy");
const MOCK_PORT = Number(process.env.E2E_MOCK_PORT || 8792);
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 5181);
const OUTPUT = path.join(HERE, ".output", LEGACY ? "legacy" : "current");
const OUT = path.join(OUTPUT, "out");
const DATA = path.join(OUTPUT, "data");
const MOCK = `http://localhost:${MOCK_PORT}`;
const WEB = `http://localhost:${WEB_PORT}`;

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const children = [];
function start(name, args, env = {}) {
  const log = fs.createWriteStream(path.join(OUTPUT, `${name}.log`));
  const child = spawn(process.execPath, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on("exit", (code) => { child.exited = true; if (code) console.error(`${name} exited with code ${code} (see ${name}.log)`); });
  children.push(child);
  return child;
}
function stopAll() {
  for (const c of children) if (!c.exited) c.kill();
}
process.on("SIGINT", () => { stopAll(); process.exit(130); });

async function waitForHttp(url, timeoutMs, child) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (child.exited) return false;
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

let code = 1;
try {
  const mock = start("mock-server", [path.join(HERE, "mock-server.mjs"), String(MOCK_PORT), DATA], LEGACY ? { LEGACY_OWNER_CHECK: "1" } : {});
  if (!(await waitForHttp(`${MOCK}/state`, 15000, mock))) throw new Error(`mock server didn't start on port ${MOCK_PORT}`);

  const vite = start("vite", [path.join(ROOT, "node_modules", "vite", "bin", "vite.js"), "--port", String(WEB_PORT), "--strictPort", "--host", "localhost"],
    { VITE_WS_SERVER_URL: `ws://localhost:${MOCK_PORT}` });
  if (!(await waitForHttp(WEB, 120000, vite))) throw new Error(`Vite didn't start on port ${WEB_PORT} (is the port free?)`);

  // Vite pre-bundles the app's dependencies on the first page load, which can take several
  // minutes on a busy machine. Do that here, without the browser's page-load timeout:
  // transforming the entry waits for the dependency scan, and fetching one pre-bundled
  // dependency waits for the bundling itself.
  const warmupMs = Number(process.env.E2E_VITE_WARMUP_MS || 900000);
  const t0 = Date.now();
  process.stdout.write("warming up Vite (pre-bundling dependencies)... ");
  const entry = await fetch(`${WEB}/src/main.jsx`, { signal: AbortSignal.timeout(warmupMs) }).then((r) => r.text());
  const dep = (entry.match(/["'](\/node_modules\/\.vite\/deps\/[^"']+)["']/) || [])[1];
  if (dep) await fetch(`${WEB}${dep}`, { signal: AbortSignal.timeout(Math.max(1000, warmupMs - (Date.now() - t0))) });
  console.log(`${Math.round((Date.now() - t0) / 1000)} s`);

  console.log(`mock server ${MOCK}${LEGACY ? " (legacy owner check)" : ""}, web ${WEB}\n`);
  const checks = spawn(process.execPath, [path.join(HERE, "checks.mjs"), WEB, MOCK, OUT, DATA], { cwd: ROOT, stdio: "inherit" });
  code = await new Promise((resolve) => checks.on("exit", (c) => resolve(c ?? 1)));
  console.log(`\nScreenshots and results.json: ${OUT}\nServer calls: ${path.join(DATA, "calls.jsonl")}`);
} catch (ex) {
  console.error(ex.message);
} finally {
  stopAll();
}
process.exit(code);
