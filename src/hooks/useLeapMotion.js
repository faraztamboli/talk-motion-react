import { useState } from "react";
import JS2Py from "../remotepyjs";
import {
  deviceConnected,
  deviceDisconnected,
} from "../app/features/deviceSlice";
import { useDispatch } from "react-redux";

function useLeapMotion() {
  const [paused, setPaused] = useState();
  const [mode, setMode] = useState();
  const [modalId, setModalId] = useState();
  const [concept, setConcept] = useState();
  const [transmission, setTransmission] = useState(false);
  const dispatch = useDispatch();

  let wsLeapMotion;

  // Create the socket with event handlers
  function init() {
    // Create and open the socket
    wsLeapMotion = new WebSocket("ws://127.0.0.1:6437/v6.json");

    // On successful connection
    wsLeapMotion.onopen = function (event) {
      console.log(event);
      dispatch(deviceConnected());

      window.addEventListener("focus", () => {
        wsLeapMotion.send(JSON.stringify({ focused: true }));
      });
      window.addEventListener("blur", () => {
        wsLeapMotion.send(JSON.stringify({ focused: false }));
      });
    };

    // On message received
    wsLeapMotion.onmessage = function (event) {
      if (!paused) {
        const obj = JSON.parse(event.data);
        console.log(obj);
      } else {
        if (mode) {
          JS2Py.PythonFunctions.TalkMotionServer.collect_gesture_and_concept(
            modalId,
            event.data,
            Date.now(),
            concept,
            function (res) {
              console.log(res);
            }
          );
        } else {
          if (JSON.parse(event.data).hands.length > 0) {
            setTransmission(true);
          }
          if (transmission) {
            JS2Py.PythonFunctions.TalkMotionServer.translateGesturesToWords(
              event.data,
              Date.now(),
              modalId,
              function (result) {
                console.log(result);
                setTransmission(false);
              }
            );
          }
        }
      }
    };

    // On socket close
    wsLeapMotion.onclose = function (event) {
      console.log(event);
      wsLeapMotion = null;
      dispatch(deviceDisconnected());
      window.removeEventListener(focus);
      window.removeEventListener(blur);
    };

    // On socket error
    wsLeapMotion.onerror = function (event) {
      console.log(event);
    };
  }

  function jsOnUpdateTrainingStatus(message) {
    const training_status = message.training_complete;
    return training_status;
  }

  function trainModel() {
    JS2Py.PythonFunctions.TalkMotionServer.train(modalId, function (results) {
      for (let i in results) {
        console.log(results[i]);
      }
    });
  }

  // function to get values from trianer components
  function getComponentDetails(
    pausedVal,
    isTrainerControl,
    modalId,
    collectionText
  ) {
    setPaused(pausedVal);
    setMode(isTrainerControl);
    setModalId(modalId);
    setConcept(collectionText);
  }

  return {
    init,
    jsOnUpdateTrainingStatus,
    trainModel,
    getComponentDetails,
  };
}

export default useLeapMotion;
