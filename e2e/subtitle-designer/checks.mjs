// Browser checks for the Subtitle Designer end-to-end test: create a recording, record two
// signing segments with a fake camera, upload them, then watch them overlaid in the viewer.
// Normally started by run.mjs, which also starts the mock server and the Vite dev server.
// Usage: node checks.mjs <webUrl> <mockHttpUrl> <outDir> <mockDataDir>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const WEB = process.argv[2] || "http://localhost:5181";
const MOCK = process.argv[3] || "http://localhost:8792";
const OUT = path.resolve(process.argv[4] || "./out");
const DATA = path.resolve(process.argv[5] || path.join(OUT, "..", "data"));
fs.mkdirSync(OUT, { recursive: true });
const CHROME = findChrome();
const VIDEO = "dQw4w9WgXcQ";
const FAKE_YT = fs.readFileSync(new URL("./fake-youtube.js", import.meta.url), "utf8");

// Google Chrome rather than Playwright's Chromium: the segments are H.264 MP4, which
// Chromium builds without proprietary codecs can't play.
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = {
    win32: [
      `${process.env.PROGRAMFILES || "C:/Program Files"}/Google/Chrome/Application/chrome.exe`,
      `${process.env["PROGRAMFILES(X86)"] || "C:/Program Files (x86)"}/Google/Chrome/Application/chrome.exe`,
      `${process.env.LOCALAPPDATA || ""}/Google/Chrome/Application/chrome.exe`,
    ],
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
    linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome"],
  }[process.platform] || [];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error("Google Chrome not found. Install it or set CHROME_PATH.");
  return found;
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = async () => (await fetch(`${MOCK}/state`)).json();
async function waitFor(fn, { timeout = 30000, every = 250 } = {}) {
  const until = Date.now() + timeout;
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() > until) return null;
    await sleep(every);
  }
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

async function newPage(token) {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, permissions: ["camera"] });
  await context.addInitScript((t) => localStorage.setItem("token", t), token);
  await context.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ contentType: "text/javascript", body: FAKE_YT }));
  await context.route(/https:\/\/(i\.ytimg\.com|www\.googleapis\.com|www\.youtube\.com)\/.*/, (r) =>
    r.request().url().endsWith("iframe_api") ? r.fallback() : r.fulfill({ status: 204, body: "" }));
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 300)}`); });
  return { context, page, problems };
}

const yt = (page, js) => page.evaluate(`(() => { const p = window.__fakeYT.players[window.__fakeYT.players.length - 1]; ${js} })()`);

let recordingId = null;
try {
  // ------------------------------------------------------------ designer: choose a video
  const { page, problems } = await newPage("tok-signer");
  await page.goto(`${WEB}/video-subtitles/designer`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await page.getByText("Paste a link").first().click({ timeout: 30000 }).catch(() => {});
  const url = page.getByPlaceholder("https://www.youtube.com/watch?v=…");
  await url.waitFor({ timeout: 30000 });
  await url.fill(`https://www.youtube.com/watch?v=${VIDEO}`);
  await url.press("Enter");
  const useBtn = page.getByRole("button", { name: "Use this video" });
  await useBtn.waitFor({ timeout: 30000 });
  await page.locator("#tm-sub-title").fill("E2E signing test");
  await useBtn.click();

  const created = await waitFor(async () => (await state()).recordings[0]);
  check("recording created on the server", created, created && `id ${created.id}`);
  recordingId = created?.id;
  await waitFor(async () => (await state()).recordings[0]?.original_video_title, { timeout: 5000 });
  const afterUpdate = (await state()).recordings[0];
  check("YouTube title saved right after create (owner check)", afterUpdate?.original_video_title === "Test lecture",
    `original_video_title=${JSON.stringify(afterUpdate?.original_video_title)}`);
  check("URL switched to the recording", page.url().endsWith(`/video-subtitles/designer/${recordingId}`), page.url());

  // ------------------------------------------------------------ camera and recording
  await page.getByRole("button", { name: "Turn on camera" }).click({ timeout: 15000 });
  const camOn = await waitFor(() => page.evaluate(() => {
    const v = document.querySelector(".tm-sub-camera-video");
    return v && v.srcObject && v.videoWidth > 0 ? `${v.videoWidth}x${v.videoHeight}` : null;
  }), { timeout: 15000 });
  check("camera preview live (fake device)", camOn, camOn || "");
  await page.getByRole("button", { name: "Turn recording on" }).click();
  await page.getByText("Recording is on. Play the video to record.").first().waitFor({ timeout: 5000 });

  // Segment 1: 0s -> ~4s
  await yt(page, "p.playVideo();");
  const rec1 = await waitFor(() => page.getByText("REC", { exact: true }).isVisible(), { timeout: 5000 });
  check("REC shows while the video plays", rec1);
  await sleep(4000);
  await yt(page, "p.pauseVideo();");

  // Segment 2: from 10s, ~3s
  await sleep(800);
  await yt(page, "p.seekTo(10, true);");
  await sleep(300);
  await yt(page, "p.playVideo();");
  await sleep(3000);
  await yt(page, "p.pauseVideo();");
  await page.screenshot({ path: path.join(OUT, "1-designer-recorded.png"), fullPage: true });

  const saved = await waitFor(async () => {
    const s = await state();
    return s.shots.length >= 2 && s.shots.every((x) => x.status === "complete") ? s.shots : null;
  }, { timeout: 60000 });
  const shots = saved || (await state()).shots;
  check("two segments registered with openVideoRecordingShot", shots.length === 2, `${shots.length} shots`);
  check("both segments uploaded and converted (status complete)", saved, shots.map((s) => `${s.id}:${s.status}${s.error_message ? " " + s.error_message : ""}`).join(", "));
  const uiSaved = await waitFor(async () => (await page.locator(".tm-sub-segment").filter({ hasText: "Saved" }).count()) >= 2, { timeout: 15000 });
  check("designer lists both segments as Saved", uiSaved);
  const failedText = await page.locator(".tm-sub-segment").filter({ hasText: "Upload failed" }).allInnerTexts();
  if (failedText.length) console.log("  failed segment text:", failedText.join(" | "));

  const sorted = [...shots].sort((a, b) => a.original_video_start - b.original_video_start);
  const [s1, s2] = sorted;
  if (s1 && s2) {
    check("segment 1 timing on the YouTube timeline", s1.original_video_start < 0.6 && s1.original_video_end > 3.4 && s1.original_video_end < 4.8,
      `${s1.original_video_start?.toFixed?.(2)} -> ${s1.original_video_end?.toFixed?.(2)}`);
    check("segment 2 starts at the seek point", Math.abs(s2.original_video_start - 10) < 0.6 && s2.original_video_end - s2.original_video_start > 2.4,
      `${s2.original_video_start?.toFixed?.(2)} -> ${s2.original_video_end?.toFixed?.(2)}`);
    for (const s of sorted) {
      const file = path.join(DATA, "media", "subtitles", `${s.id}_sl_webm.mp4`);
      let probe = "";
      try {
        probe = execFileSync(process.env.FFPROBE || "ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate:format=duration", "-of", "compact=p=0:nk=1", file]).toString().trim().replace(/\r?\n/g, " | ");
      } catch (ex) { probe = `ffprobe failed: ${ex.message}`; }
      const dur = Number((probe.match(/\|\s*([\d.]+)\s*$/) || [])[1]);
      const want = s.original_video_end - s.original_video_start;
      check(`segment ${s.id} file is H.264 MP4 of the right length`, probe.startsWith("h264") && Math.abs(dur - want) < 1.0, `${probe}; segment ${want.toFixed(2)}s`);
    }
  }
  await page.getByRole("button", { name: "Stop recording" }).click().catch(() => {});

  // ------------------------------------------------------------ reopen in edit mode
  await page.reload({ waitUntil: "domcontentloaded" });
  const reopened = await waitFor(async () => (await page.locator(".tm-sub-segment").filter({ hasText: "Saved" }).count()) >= 2, { timeout: 30000 });
  check("reopening the recording lists both saved segments from the server", reopened);
  check("no page errors in the designer", problems.filter((p) => !/favicon|ERR_|net::|DevTools|websocket/i.test(p)).length === 0, problems.slice(0, 5).join(" || "));

  // ------------------------------------------------------------ viewer: signer overlay in sync
  const viewer = await newPage("tok-signer");
  await viewer.page.goto(`${WEB}/video-subtitles/library/${recordingId}`, { waitUntil: "domcontentloaded" });
  await viewer.page.locator(".tm-viewer-signer-video").waitFor({ state: "attached", timeout: 30000 });
  await waitFor(() => viewer.page.evaluate(() => window.__fakeYT && window.__fakeYT.players.length > 0), { timeout: 20000 });
  await sleep(500);
  await yt(viewer.page, "p.seekTo(1, true); p.playVideo();");
  await sleep(1800);
  const v1 = await viewer.page.evaluate(() => {
    const v = document.querySelector(".tm-viewer-signer-video");
    const wrap = v.closest(".tm-viewer-signer");
    const p = window.__fakeYT.players.at(-1);
    return { src: v.currentSrc, paused: v.paused, t: v.currentTime, ready: v.readyState, w: v.videoWidth,
      hidden: wrap.classList.contains("is-hidden"), yt: p.getCurrentTime(), err: v.error && v.error.message };
  });
  check("viewer: signer shows segment 1 while the video is inside it", s1 && v1.src.endsWith(`${s1.id}_sl_webm.mp4`) && !v1.hidden && !v1.paused && v1.ready >= 2 && v1.w > 0,
    JSON.stringify(v1));
  check("viewer: signer is in sync with YouTube (offset within 0.5 s)", s1 && Math.abs(v1.t - (v1.yt - s1.original_video_start)) < 0.5,
    `signer ${v1.t.toFixed(2)}s vs expected ${(v1.yt - (s1?.original_video_start ?? 0)).toFixed(2)}s`);
  await viewer.page.screenshot({ path: path.join(OUT, "2-viewer-segment1.png") });

  await yt(viewer.page, "p.seekTo(6.5, true);");
  await sleep(1200);
  const gap = await viewer.page.evaluate(() => {
    const v = document.querySelector(".tm-viewer-signer-video");
    return { paused: v.paused, hidden: v.closest(".tm-viewer-signer").classList.contains("is-hidden") };
  });
  check("viewer: signer hidden and paused between segments", gap.hidden && gap.paused, JSON.stringify(gap));

  await yt(viewer.page, "p.seekTo(11, true);");
  await sleep(1500);
  const v2 = await viewer.page.evaluate(() => {
    const v = document.querySelector(".tm-viewer-signer-video");
    const p = window.__fakeYT.players.at(-1);
    return { src: v.currentSrc, paused: v.paused, t: v.currentTime, hidden: v.closest(".tm-viewer-signer").classList.contains("is-hidden"), yt: p.getCurrentTime() };
  });
  check("viewer: signer switches to segment 2 after a seek", s2 && v2.src.endsWith(`${s2.id}_sl_webm.mp4`) && !v2.hidden && !v2.paused, JSON.stringify(v2));
  check("viewer: segment 2 in sync (offset within 0.5 s)", s2 && Math.abs(v2.t - (v2.yt - s2.original_video_start)) < 0.5,
    `signer ${v2.t.toFixed(2)}s vs expected ${(v2.yt - (s2?.original_video_start ?? 0)).toFixed(2)}s`);
  await viewer.page.screenshot({ path: path.join(OUT, "3-viewer-segment2.png") });
  await yt(viewer.page, "p.pauseVideo();");
  await sleep(600);
  const paused = await viewer.page.evaluate(() => document.querySelector(".tm-viewer-signer-video").paused);
  check("viewer: pausing YouTube pauses the signer", paused);
  check("no page errors in the viewer", viewer.problems.filter((p) => !/favicon|ERR_|net::|DevTools|websocket/i.test(p)).length === 0, viewer.problems.slice(0, 5).join(" || "));

  // ------------------------------------------------------------ privacy: another user
  const other = await newPage("tok-other");
  await other.page.goto(`${WEB}/video-subtitles/library/${recordingId}`, { waitUntil: "domcontentloaded" });
  const hiddenFromOther = await waitFor(async () => (await other.page.getByText("This recording isn't available").count()) > 0, { timeout: 20000 });
  check("a different user can't open the private recording", hiddenFromOther);
  await other.page.screenshot({ path: path.join(OUT, "4-other-user.png") });
} catch (ex) {
  check("test ran to completion", false, ex.stack?.split("\n").slice(0, 4).join(" / "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
