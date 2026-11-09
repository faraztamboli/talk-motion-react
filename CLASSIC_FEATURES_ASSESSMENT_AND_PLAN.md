# Classic features: assessment and revision plan

Date: 2026-11-08
Scope: Translator (`/converter`), Trainer (collect / train / upload), Video Subtitles (designer, viewer, libraries), Model and concept ("class") management, and the backend they depend on (`talkmotion/server`).

Method: full read of every file in those areas in the frontend working tree, HEAD (`c85a6a0`), and the backend repo. Nothing was run in a browser; items marked *(inferred)* should be confirmed visually.

---

## 1. Executive summary

The classic feature set is not fixable by polishing. It fails for five structural reasons, and every visible symptom (video not playing, signer overlay frozen, camera button dead, wrong model shown, "Saved" segments with no file) traces back to one of them:

1. **The RPC bridge is unsafe.** `src/remotepyjs/index.js` matches responses to callers by *function name only* (no request id), has no timeouts, drops calls silently when the socket is closed, and delivers server errors to the success callback. Every page built on it inherits cross-wired results, promises that never resolve, and false "success" toasts.
2. **Three versions of the code exist and none is coherent.** Production is approximately HEAD (legacy global-script subtitles that need the README's manual post-build edits; a Holistic camera that Pause cannot stop; a global `Array.prototype.shift` monkey-patch). The working tree holds ~2,000 lines of uncommitted rewrite (new MediaPipe Tasks, capture wizard, continuous translator, TF.js, avatar, RecordingEngine) that depends on **eleven server RPCs that exist only in an uncommitted backend diff**, whose Docker image will not build (`requirements.txt:33` reads `openaitensorflowjs`).
3. **Two auth systems, not unified.** RemotePy session (MySQL) and the 2.0 API JWT (Postgres) are separate identities. API-only accounts can never use classic pages. On refresh or deep link, classic-only users are bounced to `/login` because the guard resolves before the socket connects.
4. **No information architecture.** Models are listed in six places via five RPCs. One model's detail spans four thin pages. Concepts are created implicitly by typing free text in the Collector. Collect, Train and Upload are unlinked pages tied by a global Redux model id that is shared with the Translator. Payments are woven into `useModels` and into every model card.
5. **No engineering safety net.** Zero tests on any of the classic flows, no error boundary (several render-time crashes white-screen the app), `App.jsx` renders *nothing* during socket retry, all styling inline, zero i18n on these pages, dead legacy code in a dozen places.

Recommendation: **a staged rebuild on a hardened transport**, not a UI reskin. Fix the bridge and auth first (everything else is unverifiable until then), ship the backend WIP so the frontend WIP has something to talk to, then rebuild each area as a single guided flow with a shared model/concept data layer. Details and sequencing are in §6.

---

## 2. State of the code

| Layer | HEAD (≈ production) | Working tree (uncommitted) |
|---|---|---|
| Landmarks | MediaPipe Holistic via unpinned CDN `<script>` tags; `var camera` in hook body so Pause can't stop it | `@mediapipe/tasks-vision` 0.10.35, rAF loop, mirrored to legacy convention; GPU-only, model URL on `/latest/` |
| Collector | per-frame `collectGestureAndConcept2` | `useCaptureWizard` → `submitGestureSample` (WT-only RPC) |
| Train | sync `train2` + pushed `jsOnUpdateTrainingStatus` | `trainModelAsync` + 2 s polling (WT-only RPC), falls back to `train2` |
| Translator G→V | per-frame `translateGestureToWords2` | `useContinuousTranslator` → `translateGestureSample` or in-browser TF.js via `useLocalModel` + `featurePipeline` (WT-only RPCs) |
| Translator V→G | Web Speech + `Array.prototype.shift` override, nested-array queue | Whisper (`transcribeAudio`) or Web Speech → `englishToGloss` → videos or three.js avatar (`getConceptPose`) (WT-only RPCs) |
| Subtitles designer | window-global `camcorder/recording/youtube_player` classes, four of them loaded from `https://app.talk-motion.com/...`; local copies have `export default` and are SyntaxErrors as classic scripts | `RecordingEngine` + `YouTubePlayerController` + `UploadManager` (chunked, resumable, IndexedDB) |
| Subtitles viewer | stale-closure sync loop re-seeks every 100 ms | fixed loop, but overlay stays paused after any pause/resume |
| Backend | 158 RPCs | 167 RPCs; training worker, `gesture_sample` index, LLM/Whisper/pose services all untracked; image build broken |

Untracked frontend files the modified files import (build breaks if committed without them): `conversationSlice.js`, `ConversationTranscript.jsx`, `AvatarCanvas.jsx`, `SkeletonReplay.jsx`, `useAvatarPlayback.js`, `useCaptureWizard.js`, `useContinuousTranslator.js`, `useLocalModel.js`, `useWhisperVoice.js`, `featurePipeline.js`, `landmarkConnections.js`, `youtubeUrl.js`, `talkmotionRecordings.js`, `features/videoSubtitles/**`.

---

## 3. Cross-cutting root causes (fix these first)

### 3.1 RemotePy bridge (`src/remotepyjs/index.js`)
- Callbacks stored as `pythonMultipleCallbackDict[function_name]` (lines 92-94, 112-114): a second in-flight call to the same function overwrites the first. Concrete victims: `UserModel` shows model #1 (leftover debug `getModel(1)`), search results resolve with the unfiltered first page, avatar pose fetches hang, overlapping subtitle chunk uploads corrupt offsets, model A's TF.js weights load under model B.
- Socket closed → logs "Connection not open." and never calls back (102-110). No timeouts anywhere. "Saving sample...", "Uploading", "Speak" all hang forever.
- Errors delivered to the success callback (400-401). Wrappers check `result.error` / `result.ok === false`, but errors arrive as plain strings, so segments are marked Saved with `video_url` undefined, "Model created" shows on failure, etc.
- Every call and response is `console.log`ged, including 1 MB base64 chunks and full landmark segments.
- `useModels` fires two list fetches on every mount; it is mounted by every `ModelsCard`, so `/my-models` with 10 cards makes ~25 calls and `/models` ~24.

### 3.2 Auth and session
- `useAuthStatus` resolves "not logged in" when the socket is not yet connected (lines 20-24). `PrivateRoute` then redirects to `/login` before the socket opens; the re-check on connect never runs because the guard unmounted. Login does not return the user to the deep link.
- `login.isLoggedIn` is not persisted; only `localStorage.token` is.
- API-only users (registered via `/auth/register`, Postgres only) have no RemotePy identity and no REST model API, so classic pages are unreachable for them by design. `loginWithApiToken` exists only in an unverified image tag, is not in source, and is never called.
- `App.jsx:39-57` renders nothing for statuses "Retrying connection…", "Error: …", "Connection failed…". A socket blip unmounts the designer, the translator, or the collector mid-session, killing camera, mic, queue and in-flight uploads.

### 3.3 App hygiene
- No `ErrorBoundary` anywhere. Render-time crashes found: `VideoSubtitlesLibrary.jsx:93-95` (`.match(...)[1]` on watch URLs, which the WIP now stores), `ModelsCard.jsx:240,253` (`JSON.parse(model.recurring)`, `model.trainers.map`), `SubscriptionCard.jsx:71,94` (`products[0]`).
- Zero i18n on classic pages although react-i18next is wired and `en.json` has unused `models.*` keys. 55+ inline `style={{}}` in model files alone; hover effects via `onMouseEnter` style mutation.
- Dead code: `remotepyjs/index_old.js`, 0-byte `remotepy.1.1.0.min.js`, `TrainerCanvas.jsx` (broken, unused), `deviceSlice` (Leap Motion), `useSlSubtitles.js`, `useVideoWithSlSubtitles.js`, legacy subtitle Redux slices, `FolderManager`/`SaveFolderContent`/`FolderContent` (unrouted, broken, stub), `jsOnSignPrediction` legacy push path, `getModelVideos`/`setModelPrice`/`setCartProductQuantity` wrappers, ~14 unused converter CSS classes, duplicate `/video-subtitles/folder-manager/:folderId` route, sidebar link to non-existent `/video-subtitles`.
- Hard-coded debug values: `getModel(1)`, model id `121` fallback in `ModelsDropdown`, `"testuser4"` in `PublicUserProfile`, Stripe `return_url: http://localhost:5173/models`, test publishable key in source.
- Tests: none for wizard, translator, feature pipeline, RecordingEngine, UploadManager, player, or any model page.

---

## 4. Findings by area

### 4.1 Translator (`/converter`)
Flow (WIP): camera → Tasks landmarker → hand-motion segmentation → top-3 prediction (server or TF.js) → firm/tentative words → sentence closes after ~1.5 s with no hands → `smoothGlossToEnglish` → Web Speech TTS. Voice side: Whisper or Web Speech → `englishToGloss` → `translateWordsToGestures` videos at 1.5x, or avatar via `getConceptPose`.

Critical:
- Camera denied / engine load failure is unrecoverable: no `onUserMediaError`, `isModelLoading` stuck true, Pause button has `loading={isModelLoading}` so antd ignores clicks; the hook's error toasts never render because its `contextHolder` is not mounted.
- Sentence model is unusable: speech only when hands leave frame ~1.5 s with no on-screen hint and no manual "send"; resting hands in view spam predictions every ~10 frames (no "no-sign" class); repeats ("very very") dropped; tentative words discarded; same sentence twice is never spoken (effect keyed on text); last sentence is **re-spoken on remount** because `speakText` lives in global Redux.
- `pendingRef` counter sticks on a dropped callback and then blocks all later sentences; `reset()` mid-flight drives it negative.
- Stale closures: `handlePredictions` frozen on first render's `token`/`dispatch`; `useWhisperVoice.start` in `useCallback([])`.
- Voice failures invisible: Firefox without server Whisper → console only; Web Speech `not-allowed`/`network`/`no-speech` → console; Whisper `transcription_failed` → dropped, no Web Speech fallback despite the server contract; `isTranscribing` never displayed.
- Video queue stalls permanently if fullscreen is toggled mid-clip (element swap kills `ended`); "fullscreen" is a 75% modal with a 200 px video; "Click Speak to start" overlay covers clips still playing after Stop.
- Leaks: rAF loop and 2 s start timer not cleaned up on unmount; TTS never `cancel()`ed; `AvatarCanvas` creates a new WebGL renderer on every toggle and disposes nothing but the renderer; `useLocalModel` never `dispose()`s the old model.
- Layout *(inferred)*: `.converter-content` is fixed height with `overflow:hidden`; voice box has `minHeight: 725px`; plus a new transcript row. On a laptop the Speak button and transcript are likely clipped with no scrollbar.
- Model dead end when `legacy_models_visible=false`: picker hidden, silent auto-pick, and a user with no usable models gets "Please select a model first" with no way to do so.

### 4.2 Trainer: Collect / Train / Upload
Critical:
- **Turn On Camera is unclickable on a fresh session** (WIP regression): `converterSlice.isModelLoading` defaults true and the WIP moved `loading={isModelLoading}` onto the start button.
- **Captured data is bad**: `targetFrames` comes from `sequenceLength`, which defaults to 10 and is never dispatched, so samples are ~0.3-0.6 s; frames without a hand are spliced out, so samples are not continuous in time and defeat the pipeline's gap interpolation; length is not tied to the model's `input_sequence_length`.
- No timeouts: recording waits forever if no hand is seen (no hint); "Saving sample..." has no cancel and Retake is disabled.
- 2 s `setTimeout` never cleared → orphan rAF loop after Stop/unmount. No camera-error handling; "Camera ready" shown while model still downloads or when permission was denied.
- Model can be switched mid-capture; `keep` uses the current `modelId`.
- Train page: **failed jobs show "Training completed successfully!" at 100%**; accuracy panel always visible with placeholder text; Pause does nothing server-side and appends the literal `"false"` to the log; polling has no error branch, timeout or in-flight guard; errors silently fall through to legacy `train2`; state is stale across models and visits; progress is a fake percentage.
- Upload page: `Upload.Dragger` has no `beforeUpload`/`customRequest`, so files POST to the current page URL; no required-field validation; TypeError when no file chosen; record modal needs a hidden "useVideo" tick, labels WebM as `.mp4`, calls setState during render; entire file sent as one base64 WebSocket message with no progress; copy implies videos become training data, which the server does not do (they are word reference videos).
- No concept model: concepts are free text, duplicates by case/whitespace, no per-concept target, no sample list/undo/delete in the Collector; a permanent red "Collection Stopped" pill because the wizard never dispatches the legacy status.
- Server side: training reads parquet built asynchronously by a separate watcher pod, so freshly captured samples may not be in the next training run; models are cached per connection and stay stale after retrain.

### 4.3 Video Subtitles
Important: "subtitles" here are **sign-language video segments overlaid picture-in-picture**, not text. There is no `<track>`, VTT, ASR or caption text anywhere; the server's `enhanceSubtitles` is a stub. Source can only be YouTube.

Why "video is not working":
- No YouTube `onError` handler anywhere; errors 101/150 (embedding disabled) and 153 (referrer) are invisible. Search does not filter `videoEmbeddable=true`.
- Designer hangs silently: player is created inside a `display:none` card and Step 2 only appears after `onReady`, with no timeout.
- Selecting a second video before ready throws (`cueVideoById` on a half-built player).
- Viewer: a server error string is treated as a recording with `youtubeVideoId=null` → blank black box. Duration read once at `onReady` (usually 0) → slider max stuck at 100 s. Time display frozen for recordings with no segments (WIP regression). Volume/mute controls affect only the silent signer video. `controls:0` leaves no native UI.
- Public Library white-screens the app on any watch-URL recording (`.match(/embed\//)[1]`), and the WIP stores watch URLs.
- HEAD/production: designer depends on classes served from production and on manual `export default` removal in `dist/`; `new YT.Player` runs before the API script loads.

Why "subtitle is not working":
- WIP viewer: after pause/resume within a segment the overlay stays paused (same-shot branch never calls `play()`; pause path doesn't reset the shot index).
- `play()` is called from a `setInterval`, unmuted by default; when playback starts by clicking inside the cross-origin iframe there is no user activation → `NotAllowedError`, logged only. The signer has no audio track and should simply be muted.
- `src !== shot.videoUrl` guard fails for relative or non-normalised URLs.
- HEAD viewer re-seeks every 100 ms (stale `startSync`), so the signer looks frozen/choppy.
- Saving: errors arrive as strings and pass the `result.error` check → segment marked Saved with no `video_url`. Overlapping segment uploads cross-wire chunk callbacks. Rapid play/pause can upload segment 2 into segment 1's row. Disarm during upload leaves a recorder running unsaved. Retry re-awaits the same rejected id promise. Server finalize requires WebM, so **Safari recordings fail after fully uploading**. `updateVideoRecording` overwrites columns with nulls, contrary to the frontend wrapper's comment.
- Data: changing video reuses the previous recording row; title/description lost (paste flow creates blank title, YouTube title overwrites on every first play, description never saved); orphan rows created by merely previewing; edit mode ignores existing segments; no segment preview/delete; no Finish/Publish step; privacy switch shows wrong state and is offered to non-owners. `getVideoRecording` has no server-side access check.

### 4.4 Model and concept management
- Six model lists via five RPCs (`/models` store, `/my-models`, `/models/training-models`, profile, dropdown, course pickers); three near-identical list pages; one model split over four pages with no breadcrumbs, name, concept count, training state, or Collect/Train actions.
- `ModelsCard` is context-blind: Edit/Delete/Clone/Purchase/Set Price/Add trainer on every model with no ownership check; Delete has no confirmation and **throws** on `/models`, `/models/training-models` and `/profile` (no `setLoading` passed).
- Mutations don't refresh: concept delete, sample delete, clone, purchase, free, price, add trainer, cancel subscription. `MyModels` uses a `loading` boolean as a refetch trigger that fires before the mutation completes. Pagination is uncontrolled, shared across lists via Redux, and search always resets to offset 0 while the pager stays put. `setPublicLoading(false)` runs before the promise resolves so the empty state flashes on every load.
- Forms: `NewModel` default `modifier:"public"` matches no radio and sends `is_public="public"`; `UpdateModel` fetches once on mount and collides with the page's own `getModel`; antd demo leftovers ("Please input the title of collection!").
- Concepts/samples: timestamps rendered with `getUTCSeconds()` (0-59), "Quality %" computed from outlier counts (can go negative), "Delete N Concepts" deletes samples, concept names unencoded in URLs, a `<video>` per card with leftover `movie.ogg`, no pagination.
- Server: no concept table (concept = parquet file, plus WT `gesture_sample` index); `getModelConcepts` reads every parquet file per call; `getConceptDetails` returns a JSON string; deletes return `None`; list totals count only owned models; `trainable` badge is last-trainer-wins; `getPublicModels` hides purchased; `deleteModel` leaves `.h5`, meta, TF.js export, samples, trainers; `cloneModel` copies only `.h5` (clone unloadable) and crashes in WT leaving an orphan row; `getModel`/`cloneModel`/`loadModel2` have no access check.
- Payments tangled in: `useModels` imports `usePayment`; three purchase paths; `purchaseModel` is **commented out on the server** but still wired to the Purchase button; Stripe on test key; `confirmPurchase` trusts client `redirect_status`; webhook server not deployed; metered pricing creates N duplicate prices; `Cart` redirects on mount before `getCart` resolves; `/cart`, `/payment` render without the app shell.
- Classrooms (brief): two generations of pages side by side; detail page fetches all classrooms (limit 99999) and filters; "public classrooms" tab only filters ones you already belong to; copy-pasted username modals; same `setLoading`-as-refetch pattern.

### 4.5 Backend
- 11 frontend-called RPCs exist only in the uncommitted server diff; `requirements.txt:33` (`openaitensorflowjs`) breaks the image build; training worker manifest and SQL untracked; WT adds an Origin allowlist that will 403 localhost once shipped.
- REST API (`/api/v1`) has auth/me/flags/conversations/health only. `src/api/talkmotionRecordings.js` and `talkmotionUploads.js` are RemotePy wrappers, not REST. Postgres target tables for models/recordings/subtitles exist with no routes and no ETL. API ingress is 1 MB body limit and reportedly not yet applied.
- Single RemotePy pod, `maxSurge: 0` → every deploy is downtime; TLS terminated in-process on :8083 (already caused an expiry outage); all caches in memory; sync training and ffmpeg share Twisted's thread pool.
- Security (HEAD ≈ production): MySQL root password hard-coded, search text interpolated into SQL f-strings, concept string unsanitised into filenames, secrets (`sk_live_`, DB password) in git history, folder mutations and `getFolderContents` without access checks (returns emails).
- Broken endpoints: `getFolderPermissions` missing `return`; `deleteFolderPermission` SQL `where id = %;`; `addContactUsMessage` writes to schema `` `talk - motion` ``; purchase list joins on a Stripe JSON path removed in the pinned API version.

---

## 5. Target experience (what "works smoothly" should mean)

**Models hub (one place).** `/models` lists *my* models (owned, trainer-of, purchased) with status chips (Draft / Collecting / Training / Ready / Failed), concept count, sample count, last trained. Store and subscriptions move to a separate Marketplace section behind the flag. A model page has tabs: Overview, Concepts, Collect, Train, Test, Trainers, Settings. Breadcrumbs everywhere.

**Concepts are first-class.** Create/rename/merge/delete concepts explicitly, with normalisation (trim, case-fold) and a per-concept target (e.g. 20 samples). Each concept row shows count vs target, duration stats, a replayable sample list (SkeletonReplay) with delete.

**Collect is a guided wizard inside the model.** Camera check (with device picker, mirrored preview, permission error state) → pick concept → countdown → record a continuous clip of the model's sequence length → review replay → Keep/Retake → running tally against target → "Next concept". Never blocks on global state; model is locked during a session; all server calls time out with a visible retry.

**Train is a job view.** Dataset summary and validation gate (min concepts, min samples per concept, samples not yet indexed) → Start → live log and real progress → result card with accuracy and a "Test it" link → job history (`getModelTrainingJobs`). Re-attaches to a running job on reload.

**Translator.** Full-height two-pane layout that scrolls. Gesture pane: camera state machine with explicit errors, confidence chips with alternatives, a visible "sentence will send when you lower your hands" hint plus a manual Send/Clear/Undo, local-vs-server indicator. Voice pane: engine state (listening / transcribing), explicit fallback from Whisper to Web Speech with a message, playback controls (stop, replay, speed), real fullscreen, avatar as a working alternative. Half-duplex gating so TTS output is not re-captured.

**Video Subtitles.** Clear 3-step flow: Choose video (embeddable only, errors shown) → Record segments (opt-in camera, mirrored preview, per-segment status, preview/delete, resume after reload, Safari handled) → Review & Publish (title, description, privacy, link to viewer). Viewer: reliable YouTube + muted signer overlay, movable/resizable/hideable PiP, native-feeling controls, correct duration, graceful empty/error states. Text captions are a separate, later feature that needs a backend model.

---

## 6. Plan

Phases are ordered by dependency. Each item lists acceptance criteria. Estimates are working days for one engineer familiar with the repo; they are rough.

### Phase 0: Stabilise what exists (3-4 days)
Goal: stop the bleeding and make the rest measurable.
1. **Decide and reconcile the WIP** (frontend ~2,000 lines, backend ~1,560 lines). Either commit it on a feature branch with all untracked files, or stash it. It must not stay half-applied. *AC: `git status` clean on both repos; `npm run build` succeeds; backend image builds.*
2. **Fix `server/docker/requirements.txt:33`** (`openai` / `tensorflowjs` newline). Track `training_worker.py`, `sample_index.py`, SQL and the worker manifest. *AC: image `talkmotion:0.0.2` builds and starts; `getPythonFunctionLibrary` lists the 11 new RPCs.*
3. **Add an `ErrorBoundary`** at route level and around every card list. *AC: the Library watch-URL crash shows an error card instead of a white screen.*
4. **Fix `App.jsx` connection states** so retry/error statuses keep the routed page mounted and show a non-blocking banner. *AC: killing the socket mid-session shows a banner; camera and uploads survive reconnect.*
5. **Quick wins that are one-liners**: `isModelLoading` default false; `sequenceLength` from the model's `input_sequence_length`; remove `getModel(1)`, model `121`, `testuser4`; stop logging payloads in the bridge; `onUserMediaError` on both `<Webcam>` uses; mute the signer overlay.

### Phase 1: Transport and auth foundation (5-7 days)
1. **Rewrite the RPC bridge** as a thin typed client: per-call request id (needs a small server-side change in the compiled remotepy, or a wrapper that serialises same-name calls as an interim), per-call timeout, reject on closed socket, reject on error payloads of every known shape (`{error}`, `{ok:false}`, `{success:false}`, string, `None`-as-success whitelist), reconnect-aware queue. Expose `rpc.call("TalkMotionServer.getModel", {...})` returning a Promise. *AC: unit tests for correlation, timeout, error normalisation; all hooks migrated; `useModels` no longer fetches on mount.*
2. **Data layer**: introduce a query/cache layer (RTK Query, since Redux Toolkit is already present) with entities `models`, `concepts`, `samples`, `trainingJobs`, `recordings`, `shots`. Mutations invalidate tags, so refresh-after-mutation is automatic. *AC: create/update/delete model, concept, sample each update lists without manual `setLoading`.*
3. **Auth**: persist login state; make `PrivateRoute` wait for the socket (with a timeout) before deciding; return to the deep link after login; one `useSession` hook that exposes `{ classic, api, user, flags }`. Ship `loginWithApiToken` into the tracked server so an API JWT can mint a RemotePy session, then remove the "Conversation Mode only" explainer. *AC: refresh on `/models/42/concepts` keeps you there; an API-registered account can open classic pages.*
4. **Remove dead code** listed in §3.3. *AC: lint passes; bundle shrinks; no references to removed globals.*

### Phase 2: Models and concepts hub (6-8 days)
1. One `ModelsPage` with tabs/filters (Mine / Training for / Purchased), server-side pagination with correct totals (fix server count queries), search, sort, empty states, confirm-on-delete, ownership-aware actions. Delete `MyModels`, `TrainingModels`, duplicate list code.
2. `ModelPage` with Overview / Concepts / Collect / Train / Test / Trainers / Settings tabs and breadcrumbs. Fix `NewModel`/`UpdateModel` forms (visibility default, fresh fetch, ARIA, copy).
3. **Concept management**: explicit create/rename/merge/delete with normalisation; sample table with correct durations, pagination, replay, delete, URL-encoding. Server: add a `concept` table (or promote the WT `gesture_sample` index) so counts and lists do not require scanning parquet; make `getConceptDetails` return JSON; make deletes return a status.
4. **Split the store out**: `Marketplace` module (`/store/*`) owning cart, pricing, subscriptions; `useModels` no longer imports payments. Remove the Purchase button until `purchaseModel` exists server-side; fix `confirmPurchase` to verify with Stripe, deploy the webhook, move keys to env. *AC: a user managing their own models never sees Stripe code paths.*
5. i18n every string on these pages; replace inline styles with CSS modules or antd tokens.

### Phase 3: Collect and Train (6-8 days)
1. **Capture wizard** inside `ModelPage › Collect`: camera check step with device picker and explicit error states; concept picker from real concepts with target progress; continuous-time clips at the model's sequence length (keep timestamps, do not drop no-hand frames, mark them instead); no-hand timeout with hint; cancel in every phase; model locked during a session; session sample list with undo/delete; all RPCs through the new bridge with timeout and retry; fallback to `collectGestureAndConcept2` when `submitGestureSample` is absent.
2. **Landmarker hardening**: CPU fallback delegate, pinned `.task` URL, per-frame error surfacing, single-shot `isModelLoading` dispatch, canvas resize only on dimension change, cleanup of timers and rAF on unmount; share one `useLandmarker` between Collector and Translator.
3. **Training job view**: dataset validation gate, `trainModelAsync` with proper status mapping (failed is red), polling with in-flight guard, timeout and error branch, re-attach on reload via `getModelTrainingJobs`, real progress from `seq/total`, result card with accuracy, job history. Remove fake Pause or implement a server cancel. Server: invalidate the per-connection model cache on job completion for all connections; make the watcher-to-parquet lag visible ("N samples pending indexing").
4. **Upload page**: fold into Concepts as "Reference video" per concept; proper `customRequest`, validation, chunked upload via `UploadManager`, correct MIME, progress; or drop it if reference videos are not needed.
5. Tests: wizard state machine, feature pipeline parity against a Python-generated fixture, training status reducer.

### Phase 4: Translator (5-7 days)
1. Layout: scrolling two-pane, equal heights, responsive stack on mobile; remove fixed heights and `overflow:hidden`.
2. Gesture pane: camera state machine with explicit error/recovery; confidence chips with top-3; "Send", "Clear", "Undo" plus the auto-send hint; configurable idle threshold; a "no-sign" guard (ignore predictions while wrists are still for longer than N frames unless confidence is very high); per-session speech state (not global Redux) so nothing re-speaks on mount; fix stale closures and the pending counter (use request ids from the new bridge); dispose TF.js models; local/server indicator.
3. Voice pane: engine state display (listening / transcribing / playing); Whisper → Web Speech fallback on `transcription_failed`; surface every recognition error; language from `useLanguages`; half-duplex gating during TTS; playback controls (stop, replay, speed), real fullscreen via the Fullscreen API without swapping elements; avatar: fix mirroring, stream poses as they arrive, dispose WebGL resources, stop control.
4. `ModelsDropdown` rewrite: selected model always visible, no hard-coded fallback, no `loadModel2` on trainer pages, empty state that links to the models hub.
5. Tests: segmentation and sentence reducer, engine fallback, playlist queue.

### Phase 5: Video Subtitles (7-9 days)
1. **Choose video**: filter `videoEmbeddable=true`; handle `onError` codes with messages; timeout on `onReady`; serialise `loadVideo` calls; do not create a recording row until the user confirms; new recording per video change.
2. **Record**: camera opt-in with mirrored preview and device picker; per-segment status with preview and delete (needs a `deleteVideoRecordingShot` RPC); disarm waits for the recorder to stop before allowing a new segment; serialise uploads per recording; resume from IndexedDB after reload; `beforeunload` guard; detect seek/rate changes during a segment and split or discard; Safari: record WebM where supported, otherwise transcode server-side (extend finalize to accept mp4) or show a clear unsupported message.
3. **Review and publish**: title, description, privacy, owner-only edit, "View" link; `updateVideoRecording` with partial updates (server: `COALESCE` or explicit field list).
4. **Viewer**: muted overlay, `play()` driven from a real user gesture plus a resume path, correct duration via `onStateChange` PLAYING, time display independent of shots, volume/mute mapped to the YouTube player, movable/resizable/hideable PiP, fullscreen with controls, error and empty states; fix URL comparison by id not `src`.
5. Libraries: single response-shape normaliser, pagination, thumbnails via `hqdefault` with fallback, no raw `.match()[1]`.
6. Server: access check in `getVideoRecording`; fix `getVideoRecordings` leaking private rows; YouTube oEmbed fetch server-side for title/author so the client stops supplying metadata.
7. Text captions (if wanted): new feature after this phase. Requires a `subtitle_tracks`/`subtitle_cues` API (tables already exist in Postgres), ASR source (Kyutai in the API or Whisper in RemotePy), and `<track>` rendering. Do not promise it inside this revision.

### Phase 6: Hardening and release (3-4 days)
- Backend security fixes reachable from classic pages: access checks on `getModel`, `cloneModel`, `loadModel2`, `translateWordsToGestures`, folder mutations; parameterised search queries; concept name sanitising; move DB and Stripe secrets to env and rotate the leaked ones.
- Deployment: `maxSurge: 1` or a second replica with sticky sessions; keep the Origin allowlist but include dev/preview origins; drop README steps 3-6 once the WIP build is the only build.
- Playwright smoke tests for the five flows against a staging server; accessibility pass (contrast on Pause button, `role="img"` wrapping live regions, focusable icon buttons, labelled controls).

**Total: roughly 35-47 engineer-days.** Phases 2-5 can overlap once Phase 1 lands; Phases 3 and 4 share the landmarker work.

---

## 7. Decisions needed

1. **Keep or stash the WIP?** The recommended path is to commit it on a branch and finish it, because it is the only path to the new RPCs. Stashing means rebuilding on HEAD's per-frame protocol, which is slower and worse.
2. **Does "subtitles" need text captions**, or only the sign-video overlay? Text captions are a new backend feature (ASR + cue storage) and are planned as a follow-on, not part of fixing the current feature.
3. **Is the Marketplace (Stripe) in scope now?** Recommendation: move it behind the flag and out of the model pages in Phase 2, and fix payments properly as a separate project.
4. **Is the Upload (reference video per word) feature still wanted?** The server does not use these videos for training. If not wanted, delete the page.
5. **Single sign-on direction**: ship `loginWithApiToken` into RemotePy (fast), or build classic REST endpoints in the 2.0 API (months). The plan assumes the first.
