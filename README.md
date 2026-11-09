Steps to build and deploy the talk-motion web app (React front-end) and landing page

1. Go to a clean checkout of main, e.g. C:\Users\faruk\Projects\talk-motion-react
   (git switch main && git pull; npm ci once, and once in "Landing Page")
2. npm run deploy
   - builds the app and the landing page into talk-motion-react\dist and
     talk-motion-react\Landing Page\dist (the folders docker-images/web/Dockerfile copies)
   - fails if the build has either bug that used to need hand edits in dist (see below)
   - builds deploy/web-overlay.Dockerfile: the shared farukh/web image with only the two
     talk-motion sites replaced, tagged farukh/web:12.2.2-ubuntu20.04-tm-<git sha>
   - pushes it, rolls fweb-deployment to it, waits, and undoes the rollout if it fails
   - points alpharithmic/.../deployment_web.yaml at the new tag (commit that change there)
   Try it without shipping: npm run deploy -- --dry-run
   Roll back: kubectl rollout undo deployment/fweb-deployment
   History:   kubectl rollout history deployment/fweb-deployment

Works from Anaconda Prompt, PowerShell or Git Bash, and from C:\ or D:\ paths.

Do not hand-edit anything in dist. The old manual steps are fixed in the source:
- "et.Camera -> B.Camera": src/hooks/useHolisticModel.js imported @mediapipe/camera_utils,
  which is not a real ES module, and the production build mis-linked it. Landmarks now come
  from @mediapipe/tasks-vision (a real ES module); no camera_utils and no MediaPipe <script>s.
- "export default class X -> class X" in dist\video_subtitles_classes: those files were
  loaded with plain <script> tags, which can't contain `export`. The subtitle designer now
  uses src\features\videoSubtitles (RecordingEngine), bundled normally; the classes are gone.
- Building from C:\Users\faruk\Projects failed with "The fileName or name properties of
  emitted files must be ... neither absolute nor relative paths": C:\Users\faruk is a
  junction to D:\Users\faruk. Both vite.config.js files now build from the real path.

Full rebuild of the shared image (all sites, not just talk-motion), only when another site
changed: run dockerbuild.sh in C:\Users\faruk\Projects (it copies the talk-motion dist folders
that the last npm run deploy left in place), then
kubectl set image deployment/fweb-deployment nginx=farukh/web:12.2.2-ubuntu20.04
or, if the deployment already uses that exact tag, kubectl rollout restart deployment/fweb-deployment.
Avoid kubectl delete + apply: it takes every site in that image offline until the new pod starts.
The next npm run deploy overlays talk-motion on top of that new full image.



Search gmail for:
talkmotion fps fix, if you ever get low frames per second on video for mediapipe then make sure to check below
https://www.lifewire.com/hardware-acceleration-in-chrome-4125122

image.png

image.png
