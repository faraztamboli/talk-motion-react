# Subtitle Designer end-to-end test

This test drives the real web app in Google Chrome against a mock RemotePy server. It goes through
what a sign language translator does, then what a viewer sees:

1. **Choose a video.** Paste a YouTube link, give the recording a title and create it. The
   test checks that the YouTube title is saved straight after create.
2. **Sign.** One button turns the camera on (Chrome's fake camera, shown picture-in-picture
   on the video), counts down 3-2-1 and records while the video plays; Stop ends the take.
   A click on the timeline moves to 0:10 for a second take. While the server converts each
   take the designer shows "Preparing video", then "Saved". ffprobe confirms each file is
   H.264, at most 720p, of the length that was signed.
3. **Watch back.** The takes play over the video in the designer, in step with it.
4. **Reopen.** After a reload the video and both takes are back, and Record works.
5. **Captions.** A caption typed into the box is saved by itself, timed where typing began.
6. **Privacy and publish.** Another user can't open the private recording; "Everyone on
   TalkMotion" makes it public.
7. **Viewer.** The signer and the caption are in step with the video (within 0.5 s), the
   signer hides between takes, switches on a seek, sits side by side when asked, and pauses
   with the video. Once public, another user can watch but not edit.

## Run it

```sh
npm ci
npm run test:e2e:subtitles
```

The checks take about two minutes. Before them, the runner waits for Vite to pre-bundle the app's
dependencies, which can take several minutes on a fresh install or a busy machine. It waits up
to 15 minutes; set `E2E_VITE_WARMUP_MS` to change that. The run exits with 0 when every check
passes. Screenshots, `results.json`, the mock server's call log (`data/calls.jsonl`) and
both servers' logs go to `e2e/subtitle-designer/.output/current/`. That folder is gitignored.

The test needs:

- **Google Chrome**, not Playwright's Chromium, which can't play H.264. Chrome is found in its
  usual place on Windows, macOS and Linux. Set `CHROME_PATH` if it's installed somewhere else.
- **ffmpeg and ffprobe** on `PATH`, or set `FFMPEG` and `FFPROBE` to their full paths.
- **Free ports** 8792 (mock server) and 5181 (Vite). Set `E2E_MOCK_PORT` or `E2E_WEB_PORT` to
  use others.

### Replay a lost reply

```sh
npm run test:e2e:subtitles -- --lost-reply
```

The mock does the work of the first finalize but drops the connection instead of replying,
which is what happened in production on 2026-11-27 when a long conversion froze the server.
Every check should still pass: the page asks the server where the take stands and shows it
as saved. Its output goes to `.output/lost-reply/`.

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
| Server | `mock-server.mjs`, a Node copy of the recording and caption RPCs in `server/talkmotion/TalkMotionServer.py` (talkmotion repo), including the background conversion of RemotePy `0.0.7-classic` |
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
