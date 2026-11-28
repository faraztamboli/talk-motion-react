// Browser checks for the Subtitle Designer end-to-end test: choose a video, record two signing
// takes with a fake camera (Record -> 3-2-1 -> sign -> Stop), watch them back, reopen the
// recording, add a caption, publish, then watch it in the viewer.
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
const quiet = (problems) => problems.filter((p) => !/favicon|ERR_|net::|DevTools|websocket|WebSocket/i.test(p));

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

async function newPage(token) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["camera"] });
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

/** Click the designer's timeline at `seconds` (the fake video is 120 s long). */
async function clickTimelineAt(page, seconds, duration = 120) {
  const box = await page.getByRole("slider", { name: /video timeline/i }).boundingBox();
  await page.mouse.click(box.x + (box.width * seconds) / duration, box.y + box.height / 2);
}

/** Record -> countdown -> sign for `ms` -> Stop. Returns whether the countdown showed. */
async function recordTake(page, buttonName, ms) {
  await page.getByRole("button", { name: buttonName }).click({ timeout: 15000 });
  const counted = await waitFor(() => page.getByText("Get ready to sign").isVisible(), { timeout: 10000, every: 100 });
  const recording = await waitFor(async () => (await page.locator(".tm-stage-badge.is-rec").isVisible()) && (await yt(page, "return p.getPlayerState();")) === 1, { timeout: 10000, every: 100 });
  await sleep(ms);
  await page.getByRole("button", { name: /stop recording/i }).click();
  return { counted, recording };
}

let recordingId = null;
try {
  // ------------------------------------------------------------ 1 choose a video
  const { page, problems } = await newPage("tok-signer");
  await page.goto(`${WEB}/video-subtitles/designer`, { waitUntil: "domcontentloaded", timeout: 240000 });
  await page.getByText("Paste a link").first().click({ timeout: 60000 }).catch(() => {});
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

  // ------------------------------------------------------------ 2 sign: two takes
  check("Sign step explains what to do before the first take", await waitFor(() => page.getByText("No signing yet").isVisible(), { timeout: 10000 }));
  const take1 = await recordTake(page, /turn on camera and record/i, 4000);
  const camOn = await page.evaluate(() => {
    const v = document.querySelector(".tm-sub-camera-video");
    return v && v.srcObject && v.videoWidth > 0 ? `${v.videoWidth}x${v.videoHeight}` : null;
  });
  check("one button turns the camera on (picture-in-picture on the video)", camOn, camOn || "");
  check("a 3-2-1 countdown comes before recording", take1.counted);
  check("recording starts after the countdown, with the video playing", take1.recording);

  await sleep(800);
  await clickTimelineAt(page, 10);
  const at10 = await waitFor(() => page.getByRole("button", { name: /record from 0:1\d/i }).isVisible(), { timeout: 5000 });
  check("clicking the timeline moves the video there", at10, await page.locator(".tm-bigbtn").innerText().catch(() => ""));
  const take2 = await recordTake(page, /record from 0:1\d/i, 3000);
  check("second take recorded from the new point", take2.counted && take2.recording);
  await page.screenshot({ path: path.join(OUT, "1-designer-recorded.png") });

  const sawPreparing = await waitFor(() => page.locator(".tm-take").filter({ hasText: "Preparing video" }).first().isVisible(), { timeout: 30000, every: 100 });
  check("a take shows 'Preparing video' while the server converts it", sawPreparing);
  const saved = await waitFor(async () => {
    const s = await state();
    return s.shots.length >= 2 && s.shots.every((x) => x.status === "complete") ? s.shots : null;
  }, { timeout: 90000 });
  const shots = saved || (await state()).shots;
  check("two takes registered with openVideoRecordingShot", shots.length === 2, `${shots.length} shots`);
  check("both takes uploaded and converted (status complete)", saved, shots.map((s) => `${s.id}:${s.status}${s.error_message ? " " + s.error_message : ""}`).join(", "));
  const uiSaved = await waitFor(async () => (await page.locator(".tm-take").filter({ hasText: "Saved" }).count()) >= 2, { timeout: 20000 });
  check("the designer lists both takes as Saved", uiSaved, (await page.locator(".tm-takes").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 200));
  check("the header says all changes are saved", await waitFor(() => page.getByText("All changes saved").isVisible(), { timeout: 10000 }));

  const sorted = [...shots].sort((a, b) => a.original_video_start - b.original_video_start);
  const [s1, s2] = sorted;
  if (s1 && s2) {
    check("take 1 timing on the YouTube timeline", s1.original_video_start < 0.6 && s1.original_video_end > 3.4 && s1.original_video_end < 5,
      `${s1.original_video_start?.toFixed?.(2)} -> ${s1.original_video_end?.toFixed?.(2)}`);
    check("take 2 starts where the timeline was clicked", Math.abs(s2.original_video_start - 10) < 0.8 && s2.original_video_end - s2.original_video_start > 2.4,
      `${s2.original_video_start?.toFixed?.(2)} -> ${s2.original_video_end?.toFixed?.(2)}`);
    for (const s of sorted) {
      const file = path.join(DATA, "media", "subtitles", `${s.id}_sl_webm.mp4`);
      let probe = "";
      try {
        probe = execFileSync(process.env.FFPROBE || "ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate:format=duration", "-of", "compact=p=0:nk=1", file]).toString().trim().replace(/\r?\n/g, " | ");
      } catch (ex) { probe = `ffprobe failed: ${ex.message}`; }
      const [codec, , height] = probe.split(/[|\s]+/);
      const dur = Number((probe.match(/\|\s*([\d.]+)\s*$/) || [])[1]);
      const want = s.original_video_end - s.original_video_start;
      check(`take ${s.id} is H.264 MP4, at most 720p, of the right length`, codec === "h264" && Number(height) <= 720 && Math.abs(dur - want) < 1.0, `${probe}; take ${want.toFixed(2)}s`);
    }
  }

  // ------------------------------------------------------------ watch back
  await page.getByText("Watch back", { exact: true }).click();
  await clickTimelineAt(page, 1);
  await page.getByRole("button", { name: /play with my signing/i }).click();
  await sleep(1800);
  const wb = await page.evaluate(() => {
    const v = document.querySelector(".tm-pip-take");
    const p = window.__fakeYT.players.at(-1);
    return { src: v.currentSrc.slice(0, 60), paused: v.paused, t: v.currentTime, ready: v.readyState,
      shown: !v.closest(".tm-pip").classList.contains("is-hidden") && !v.hidden, yt: p.getCurrentTime() };
  });
  check("Watch back plays your take over the video, in sync", s1 && wb.shown && !wb.paused && wb.ready >= 2 && Math.abs(wb.t - (wb.yt - s1.original_video_start)) < 0.5,
    `take ${wb.t.toFixed(2)}s vs expected ${(wb.yt - (s1?.original_video_start ?? 0)).toFixed(2)}s, ${JSON.stringify({ ...wb, t: undefined, yt: undefined })}`);
  await page.screenshot({ path: path.join(OUT, "2-designer-watch-back.png") });
  await page.getByRole("button", { name: /^pause$/i }).click().catch(() => {});

  // ------------------------------------------------------------ reopen in edit mode (black player bug)
  await page.reload({ waitUntil: "domcontentloaded" });
  const reopened = await waitFor(async () => (await page.locator(".tm-take").filter({ hasText: "Saved" }).count()) >= 2, { timeout: 30000 });
  check("reopening the recording lists both saved takes", reopened);
  const playerVideo = await waitFor(() => page.evaluate(() => {
    const p = window.__fakeYT?.players?.at(-1);
    return p && document.body.contains(p.box) ? p.videoId : null;
  }), { timeout: 20000 });
  check("reopening shows the YouTube video again (no black player)", playerVideo === VIDEO, String(playerVideo));
  const recordBtn = page.getByRole("button", { name: /turn on camera and record/i });
  const readyToRecord = await waitFor(() => recordBtn.isEnabled(), { timeout: 15000 });
  const btnStyle = await recordBtn.evaluate((b) => {
    const cs = getComputedStyle(b);
    return { disabled: b.disabled, opacity: cs.opacity, background: cs.backgroundColor, color: cs.color };
  }).catch((e) => String(e));
  check("after reopening, Record is ready to use", readyToRecord, JSON.stringify(btnStyle));
  await page.screenshot({ path: path.join(OUT, "3-designer-reopened.png") });

  // ------------------------------------------------------------ 3 captions
  await page.getByRole("button", { name: /next: captions/i }).click();
  const box = page.getByPlaceholder(/type what is said/i);
  await box.waitFor({ timeout: 10000 });
  await clickTimelineAt(page, 2);
  await sleep(300);
  await box.fill("Hello everyone");
  await box.press("Enter");
  const cue = await waitFor(async () => {
    const tracks = (await state()).captions?.[recordingId] || {};
    return tracks.en?.cues?.[0] || null;
  }, { timeout: 15000 });
  check("a typed caption saves by itself, timed where typing began", cue && cue.text === "Hello everyone" && Math.abs(cue.start_ms - 2000) < 700, JSON.stringify(cue));
  check("the captions panel says Saved", await waitFor(() => page.locator(".tm-cc-save").getByText("Saved").isVisible(), { timeout: 10000 }));
  await page.screenshot({ path: path.join(OUT, "4-designer-captions.png") });

  // ------------------------------------------------------------ privacy before publishing
  const stranger = await newPage("tok-other");
  await stranger.page.goto(`${WEB}/video-subtitles/library/${recordingId}`, { waitUntil: "domcontentloaded" });
  const hiddenFromOther = await waitFor(async () => (await stranger.page.getByText("This recording isn't available").count()) > 0, { timeout: 20000 });
  check("while private, a different user can't open it", hiddenFromOther);
  await stranger.context.close();

  // ------------------------------------------------------------ 4 publish
  await page.getByRole("button", { name: /next: publish/i }).click();
  check("Publish shows the video as viewers will see it", await waitFor(() => page.locator(".tm-publish .tm-viewer").isVisible(), { timeout: 10000 }));
  await page.getByRole("button", { name: /everyone on talkmotion/i }).click();
  await page.getByRole("button", { name: /make it public/i }).click();
  const isPublic = await waitFor(async () => (await state()).recordings[0]?.is_public === 1, { timeout: 10000 });
  check("choosing 'Everyone' makes the recording public", isPublic);
  await page.screenshot({ path: path.join(OUT, "5-designer-publish.png") });
  check("no page errors in the designer", quiet(problems).length === 0, quiet(problems).slice(0, 5).join(" || "));

  // ------------------------------------------------------------ viewer: signer and caption in sync
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
      hidden: wrap.classList.contains("is-hidden"), yt: p.getCurrentTime(), err: v.error && v.error.message,
      caption: document.querySelector(".tm-viewer-caption")?.textContent || null };
  });
  check("viewer: signer shows take 1 while the video is inside it", s1 && v1.src.endsWith(`${s1.id}_sl_webm.mp4`) && !v1.hidden && !v1.paused && v1.ready >= 2 && v1.w > 0,
    JSON.stringify({ ...v1, caption: undefined }));
  check("viewer: signer is in sync with YouTube (offset within 0.5 s)", s1 && Math.abs(v1.t - (v1.yt - s1.original_video_start)) < 0.5,
    `signer ${v1.t.toFixed(2)}s vs expected ${(v1.yt - (s1?.original_video_start ?? 0)).toFixed(2)}s`);
  check("viewer: the caption shows at its time", v1.caption === "Hello everyone", String(v1.caption));
  await viewer.page.screenshot({ path: path.join(OUT, "6-viewer-take1.png") });

  await yt(viewer.page, "p.seekTo(6.5, true);");
  await sleep(1200);
  const gap = await viewer.page.evaluate(() => {
    const v = document.querySelector(".tm-viewer-signer-video");
    return { paused: v.paused, hidden: v.closest(".tm-viewer-signer").classList.contains("is-hidden") };
  });
  check("viewer: signer hidden and paused between takes", gap.hidden && gap.paused, JSON.stringify(gap));

  await yt(viewer.page, "p.seekTo(11, true);");
  await sleep(1500);
  const v2 = await viewer.page.evaluate(() => {
    const v = document.querySelector(".tm-viewer-signer-video");
    const p = window.__fakeYT.players.at(-1);
    return { src: v.currentSrc, paused: v.paused, t: v.currentTime, hidden: v.closest(".tm-viewer-signer").classList.contains("is-hidden"), yt: p.getCurrentTime() };
  });
  check("viewer: signer switches to take 2 after a seek", s2 && v2.src.endsWith(`${s2.id}_sl_webm.mp4`) && !v2.hidden && !v2.paused, JSON.stringify(v2));
  check("viewer: take 2 in sync (offset within 0.5 s)", s2 && Math.abs(v2.t - (v2.yt - s2.original_video_start)) < 0.5,
    `signer ${v2.t.toFixed(2)}s vs expected ${(v2.yt - (s2?.original_video_start ?? 0)).toFixed(2)}s`);

  await viewer.page.getByText("Side by side", { exact: true }).click();
  await sleep(600);
  const side = await viewer.page.evaluate(() => {
    const wrap = document.querySelector(".tm-viewer");
    const stage = document.querySelector(".tm-viewer-stage").getBoundingClientRect();
    const signer = document.querySelector(".tm-viewer-signer").getBoundingClientRect();
    const player = document.querySelector(".tm-viewer-player").getBoundingClientRect();
    return { side: wrap.classList.contains("is-side"), besideVideo: signer.left >= player.right - 1, inside: signer.right <= stage.right + 1,
      playing: !document.querySelector(".tm-viewer-signer-video").paused };
  });
  check("viewer: 'Side by side' puts the signer next to the video", side.side && side.besideVideo && side.inside && side.playing, JSON.stringify(side));
  await viewer.page.screenshot({ path: path.join(OUT, "7-viewer-side-by-side.png") });
  await yt(viewer.page, "p.pauseVideo();");
  await sleep(600);
  const paused = await viewer.page.evaluate(() => document.querySelector(".tm-viewer-signer-video").paused);
  check("viewer: pausing YouTube pauses the signer", paused);
  check("no page errors in the viewer", quiet(viewer.problems).length === 0, quiet(viewer.problems).slice(0, 5).join(" || "));

  // ------------------------------------------------------------ privacy: another user (it is public now)
  const other = await newPage("tok-other");
  await other.page.goto(`${WEB}/video-subtitles/library/${recordingId}`, { waitUntil: "domcontentloaded" });
  const visibleToOther = await waitFor(async () => (await other.page.locator(".tm-viewer-signer-video").count()) > 0, { timeout: 20000 });
  check("once public, another user can watch it but not edit it", visibleToOther && (await other.page.getByRole("button", { name: /^edit$/i }).count()) === 0);
  await other.page.screenshot({ path: path.join(OUT, "8-other-user.png") });
} catch (ex) {
  check("test ran to completion", false, ex.stack?.split("\n").slice(0, 4).join(" / "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
