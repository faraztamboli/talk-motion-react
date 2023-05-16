import { useRef } from "react";
import * as cam from "@mediapipe/camera_utils";
import JS2Py from "../remotepyjs";
import { useDispatch, useSelector } from "react-redux";
import {
  setTrainingStatusOff,
  setTrainingStatusOn,
} from "../app/features/trainerSlice";
import useMessageApi from "./useMessageApi";
import { setIsSpeaking, setSpeakText } from "../app/features/speechSlice";
import {
  setIsModelLoading,
  setIsRecording,
} from "../app/features/converterSlice";
import useLocalStorage from "./useLocalStorage";

function useHolisticModel1() {
  const [token] = useLocalStorage("token");
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const { contextHolder, showMessage } = useMessageApi();

  const dispatch = useDispatch();

  const { modelId } = useSelector((state) => state.model);
  const { sequenceLength } = useSelector((state) => state.model);
  const { concept } = useSelector((state) => state.model);
  const { isModelLoading } = useSelector((state) => state.converter);

  const mpHolistic = window;
  const drawingUtils = window;

  const connect = window.drawConnectors;
  var camera = null;

  let activeEffect = "mask";

  // used for gesture collection breaks
  let last_gesture_collection_timestamp = Date.now();
  let collection_pause_time_millisec = 3000;


  const onResults = (results) => {
    //console.log("onresults", isModelLoading);

    dispatch(setIsModelLoading(false));

    sendToServer(results);

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    // set canvas width and height
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;

    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.segmentationMask) {
      canvasCtx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Only overwrite existing pixels.
      if (activeEffect === "mask" || activeEffect === "both") {
        canvasCtx.globalCompositeOperation = "source-in";
        // This can be a color or a texture or whatever...
        canvasCtx.fillStyle = "#00FF007F";
        canvasCtx.fillRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      } else {
        canvasCtx.globalCompositeOperation = "source-out";
        canvasCtx.fillStyle = "#0000FF7F";
        canvasCtx.fillRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }

      // Only overwrite missing pixels.
      canvasCtx.globalCompositeOperation = "destination-atop";
      canvasRef.current &&
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

      canvasCtx.globalCompositeOperation = "source-over";
    } else {
      canvasRef.current &&
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
    }

    // Connect elbows to hands. Do this first so that the other graphics will draw
    // on top of these marks.
    canvasCtx.lineWidth = 1;
    if (results.poseLandmarks) {
      if (results.rightHandLandmarks) {
        canvasCtx.strokeStyle = "white";
        connect(canvasCtx, [
          [
            results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
            results.rightHandLandmarks[0],
          ],
        ]);
      }
      if (results.leftHandLandmarks) {
        canvasCtx.strokeStyle = "white";
        connect(canvasCtx, [
          [
            results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW],
            results.leftHandLandmarks[0],
          ],
        ]);
      }
    }

    /*
    // Pose...
    drawingUtils.drawConnectors(
      canvasCtx,
      results?.poseLandmarks,
      mpHolistic.POSE_CONNECTIONS,
      { color: "rgba(255,230,250,0.2)" }
    );
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpHolistic.POSE_LANDMARKS_LEFT).map(
        (index) => results?.poseLandmarks && results?.poseLandmarks[index]
      ),
      {
        visibilityMin: 0.65,
        color: "rgba(255,230,250,0.2)",
        fillColor: "rgba(255,138,0, 0.1)",
      }
    );
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpHolistic.POSE_LANDMARKS_RIGHT).map(
        (index) => results?.poseLandmarks && results?.poseLandmarks[index]
      ),
      {
        visibilityMin: 0.65,
        color: "rgba(255,230,250,0.2)",
        fillColor: "rgba(0,217,231, 0.1)",
      }
    );
    */

    // Hands...
    drawingUtils.drawConnectors(
      canvasCtx,
      results.rightHandLandmarks,
      mpHolistic.HAND_CONNECTIONS,
      { color: "rgba(255,230,250,0.2)" }
    );
    drawingUtils.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "white",
      fillColor: "rgb(0,217,231)",
      lineWidth: 1,
      radius: (data) => {
        return drawingUtils.lerp(data.from.z, -0.15, 0.1, 6, 1);
      },
    });
    drawingUtils.drawConnectors(
      canvasCtx,
      results.leftHandLandmarks,
      mpHolistic.HAND_CONNECTIONS,
      { color: "rgba(255,230,250,0.2)" }
    );
    drawingUtils.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "white",
      fillColor: "rgb(255,138,0)",
      lineWidth: 1,
      radius: (data) => {
        return drawingUtils.lerp(data.from.z, -0.15, 0.1, 6, 1);
      },
    });


    const page = window.location.pathname;

    if (page === "/trainer/collect") {
        // Face...
        drawingUtils.drawConnectors(
          canvasCtx,
          results.faceLandmarks,
          mpHolistic.FACEMESH_TESSELATION,
          { color: "rgba(192,192,192,0.1)", lineWidth: 1 }
        );
        drawingUtils.drawConnectors(
          canvasCtx,
          results.faceLandmarks,
          mpHolistic.FACEMESH_RIGHT_EYE,
          { color: "rgba(0,217,231,0.1)" }
        );
        drawingUtils.drawConnectors(
          canvasCtx,
          results.faceLandmarks,
          mpHolistic.FACEMESH_RIGHT_EYEBROW,
          { color: "rgba(0,217,231,0.1)" }
        );
        drawingUtils.drawConnectors(
          canvasCtx,
          results.faceLandmarks,
          mpHolistic.FACEMESH_LEFT_EYE,
          { color: "rgba(255,138,0,0.1)" }
        );
        drawingUtils.drawConnectors(
          canvasCtx,
          results.faceLandmarks,
          mpHolistic.FACEMESH_LEFT_EYEBROW,
          { color: "rgba(255,138,0,0.1)" }
        );
        drawingUtils.drawConnectors(
          canvasCtx,
          results.faceLandmarks,
          mpHolistic.FACEMESH_FACE_OVAL,
          { color: "rgba(224, 224, 224, 0.1)", lineWidth: 1 }
        );
        drawingUtils.drawConnectors(
          canvasCtx,
          results.faceLandmarks,
          mpHolistic.FACEMESH_LIPS,
          { color: "rgba(224, 224, 224, 0.1)", lineWidth: 1 }
        );
    }


    canvasCtx.restore();
  };

  // useEffect(() => {
  const startHolisticModel = () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      const holistic = new mpHolistic.Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        },
      });

      holistic.setOptions({
        selfieMode: true,
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        effect: "background",
      });

      // holistic.initialize();

      holistic.onResults(onResults);

      //console.log(holistic);

      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await holistic.send({ image: webcamRef.current.video });
        },
         width: 512,
         height: 300,
      });
      camera.start();
    }
  };

  const sendToServer = (data) => {
    const page = window.location.pathname;

    if (page === "/trainer/collect") {
        //console.log('sequenceLength:');
        //console.log(sequenceLength);
      // variable to hold the time of successful gesture collection
      if (last_gesture_collection_timestamp !== null && (Date.now()-last_gesture_collection_timestamp)>collection_pause_time_millisec) {
          dispatch(setTrainingStatusOn());
          JS2Py.PythonFunctions.TalkMotionServer.collectGestureAndConcept2(
            token,
            modelId,
            data,
            Date.now(),
            concept,
            sequenceLength,
            function (res) {
              let sample_count = res[1];
              let status = res[0];
              //console.log(status);
              if (status == -1) {
                //dispatch(setTrainingStatusOff());
              } else if (status == 0) {
                //dispatch(setTrainingStatusOn());
              } else if (status == 1) {
                showMessage("success", "sample collected: " + sample_count);
                last_gesture_collection_timestamp = Date.now();
                dispatch(setTrainingStatusOff());
              }
            }
          );
      }
    } else if (page === "/converter") {

      // send to server only if one or both hands present in the frame:
      //console.log('page converter');
      if ('leftHandLandmarks' in data || 'rightHandLandmarks' in data) {
          JS2Py.PythonFunctions.TalkMotionServer.translateGestureToWords2(
            token,
            data,
            Date.now(),
            modelId,
            sequenceLength,
            function (res) {
              //console.log(res);
              if (res.status == -1) {
                dispatch(setIsRecording(false));
                dispatch(setIsSpeaking(false));
              } else if (res.status == 0) {
                dispatch(setIsRecording(true));
                dispatch(setIsSpeaking(false));
              } else {
                console.log('dispatching setIsSpeaking true');
                dispatch(setIsSpeaking(true));
                dispatch(setSpeakText(res.prediction));
              }
            }
          );
      }
    }
  };

  return {
    webcamRef,
    audioRef,
    canvasRef,
    startHolisticModel,
    contextHolder,
    showMessage,
  };
}

export default useHolisticModel1;
