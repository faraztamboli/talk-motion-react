# Subtitle Designer end-to-end test

This test drives the real web app in Google Chrome against a mock RemotePy server. It goes through
what a sign language translator does, then what a viewer sees:

1. **Choose a video.** Paste a YouTube link, give the recording a title and create it. The
   test checks that the YouTube title is saved straight after create.
2. **Record.** Turn on the camera (Chrome's fake camera), turn recording on, and play 0–4 s.
   Then seek to 10 s and play about 3 s more, which gives two segments.
3. **Upload.** Both segments are registered, uploaded in chunks, checked, and converted with
   ffmpeg to H.264 MP4, the same way the server does it. ffprobe confirms each file's codec and
   length. The designer lists both as Saved, and still does after a reload.
4. **Watch.** The viewer overlays the signer on the video, within 0.5 s of it. The signer is
   hidden and paused between segments, switches to segment 2 on a seek, and pauses when the
   video pauses.
5. **Privacy.** A different user sees "This recording isn't available".

## Run it

```sh
npm ci
npm run test:e2e:subtitles
```

The run takes a minute or two; Vite's first page load is slow. It exits with 0 when every
check passes. Screenshots, `results.json`, the mock server's call log (`data/calls.jsonl`) and
both servers' logs go to `e2e/subtitle-designer/.output/current/`. That folder is gitignored.

The test needs:

- **Google Chrome**, not Playwright's Chromium, which can't play H.264. Chrome is found in its
  usual place on Windows, macOS and Linux. Set `CHROME_PATH` if it's installed somewhere else.
- **ffmpeg and ffprobe** on `PATH`, or set `FFMPEG` and `FFPROBE` to their full paths.
- **Free ports** 8792 (mock server) and 5181 (Vite). Set `E2E_MOCK_PORT` or `E2E_WEB_PORT` to
  use others.

### Reproduce the owner-check bug

```sh
npm run test:e2e:subtitles -- --legacy
```

This makes the mock refuse owners the way servers before RemotePy `0.0.6-classic` did. Those
servers treated a recording as yours only when its YouTube title or author was set, and a new
recording has neither. The run should fail: both segments show "Upload failed — Sorry, this
video recording doesn't belong to you!" Its output goes to `.output/legacy/`.

## What's real and what's mocked

| Part | In this test |
| --- | --- |
| Web app (designer, recorder, uploader, viewer) | Real, served by Vite |
| Browser and MediaRecorder | Real Google Chrome, headless |
| Camera | Chrome's fake camera (`--use-fake-device-for-media-stream`) |
| YouTube player | `fake-youtube.js`, a stand-in for the IFrame API with a real-time clock and the same state events |
| Server | `mock-server.mjs`, a Node copy of the recording RPCs in `server/talkmotion/TalkMotionServer.py` (talkmotion repo) |
| Video conversion | Real ffmpeg, with the same arguments as the server |

The test doesn't cover real YouTube, the real Python server, MySQL or production storage. Check
those with one short recording in production after a server or player change.

## Files

- `run.mjs` starts both servers, runs the checks, and stops the servers.
- `checks.mjs` contains the browser steps and checks. You can run it on its own against servers
  you started yourself: `node checks.mjs <webUrl> <mockUrl> <outDir> <mockDataDir>`.
- `mock-server.mjs` is the mock RemotePy server. It speaks the production protocol and serves the
  converted segments over HTTP with Range support. `GET /state` returns its recordings and shots.
- `fake-youtube.js` is the fake YouTube player.
- `library.json` is the live server's function library, which the app uses to build its RPC
  stubs.

### Refresh `library.json`

If the server adds or renames functions, copy the
`{'getPythonFunctionLibrary': ...}` line from the RemotePy pod's startup log. Convert it from
Python literal syntax to JSON:

```sh
python -c "import ast,json,sys; print(json.dumps(ast.literal_eval(sys.stdin.read()), indent=1))" < line.txt > library.json
```

If the server's recording functions change, update `mock-server.mjs` to match.
