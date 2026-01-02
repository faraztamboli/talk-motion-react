Steps to build talk-motion web app front-end react based

1. Go to: C:\Users\faruk\Projects\freelancers\bilal\talk-motion-react
2.  npm run dev [I also did npm run build]
3. open C:\Users\faruk\Projects\freelancers\bilal\talk-motion-react\dist\assets\useHolisticModel.xxxxxxxx.js
4. Ctrl-F ".Camera", and replace et.Camera with B.Camera    Note: B is located in the front of the file as import{az as B,h as K   change accordingly if it is different. [Note: it could be some other letter than B, depending upon what is exported from index.xxxxxxxx.js file in this case it was ,Vt as B, ]
5. go to C:\Users\faruk\Projects\freelancers\bilal\talk-motion-react\dist\video_subtitles_classes
6. from each of the files camcorder.js, recording.js ... update the line: from the build (dist) folder above  from : export default class camcorder {to: class camcorder {
7. go to C:\Users\faruk\Projects on anaconda prompt
8. run dockerbuild.sh
9. run kubectl delete -f alpharithmic/PycharmProjects/Alpharithmic.FundManagerWeb/deployment_web.yaml
10. run kubectl apply -f alpharithmic/PycharmProjects/Alpharithmic.FundManagerWeb/deployment_web.yaml



Search gmail for:
talkmotion fps fix, if you ever get low frames per second on video for mediapipe then make sure to check below
https://www.lifewire.com/hardware-acceleration-in-chrome-4125122

image.png

image.png

