var wsLeapMotion;
var paused = false;
var mode = false;
var focusListener;
var blurListener;
var activate_transmission = false;

// Support both the WebSocket and MozWebSocket objects
if (typeof WebSocket == "undefined" && typeof MozWebSocket != "undefined") {
  WebSocket = MozWebSocket;
}

// Create the socket with event handlers
function init() {
  // Create and open the socket
  wsLeapMotion = new WebSocket("ws://localhost:6437/v7.json");
  // wsLeapMotion = new WebSocket("wss://localhost:6436/v6.json");

  // On successful connection
  wsLeapMotion.onopen = function (event) {
    const deviceConnStatus = document.querySelector("#deviceStatus");
    wsLeapMotion.send(JSON.stringify({ focused: true })); // claim focus

    focusListener = window.addEventListener("focus", function (e) {
      wsLeapMotion.send(JSON.stringify({ focused: true })); // claim focus
    });

    blurListener = window.addEventListener("blur", function (e) {
      wsLeapMotion.send(JSON.stringify({ focused: false })); // relinquish focus
    });

    document.getElementById("main").style.visibility = "visible";
    //document.getElementById("connection").innerHTML = "WebSocket connection open!";
    // document.getElementById("connection_img").src = 'img/10388_bulb_green_icon.png';
    // document.getElementById("connection_img").alt='Connection Open';

    deviceConnStatus.className = "badge badge-success";
    deviceConnStatus.innerText = "Device connected!";

    /*
        var enableMessage = JSON.stringify({enableGestures: true});
        wsLeapMotion.send(enableMessage); // Enable gestures
        var backgroundMessage = JSON.stringify({background: true});
        wsLeapMotion.send(backgroundMessage); // Get frames in background
        */
  };

  // On message received
  wsLeapMotion.onmessage = function (event) {
    if (!paused) {
      var obj = JSON.parse(event.data);
      var str = JSON.stringify(obj, undefined, 2);
      if (!obj.hasOwnProperty("timestamp")) {
        console.log(str);
      } else {
        //document.getElementById("output").innerHTML = '<pre>' + str + '</pre>';
        if (mode) {
          let model_id = document.querySelector("#model_id option:checked").text;
          JS2Py.PythonFunctions.TalkMotionServer.collect_getsture_and_concept(
            model_id,
            event.data,
            Date.now(),
            document.getElementById("concept").value,
            function (obj) {
              if (obj == -1) {
                document.getElementById("output").innerHTML = "<pre>No data</pre>";
              } else {
                document.getElementById("output").innerHTML = "<pre>Collecting sample</pre>";
              }
            }
          );
        } else {
          let model_id = "all";
          if (JSON.parse(event.data).hands.length > 0) {
            activate_transmission = true;
            document.getElementById("transmission_status").style.visibility = "visible";
          }
          if (activate_transmission) {
            JS2Py.PythonFunctions.TalkMotionServer.translateGestureToWords(
              event.data,
              Date.now(),
              model_id,
              function (result) {
                if (result["status"] == -1) {
                  // document.getElementById("output").innerHTML = '<pre>No hand!</pre>';
                } else if (result["status"] == 1) {
                  let output = "";
                  output = "<pre>" + result["prediction"] + "</pre>";
                  output += "<pre>" + result["prediction_indices"] + "</pre>";
                  document.getElementById("output").innerHTML = output;
                  activate_transmission = false;
                  document.getElementById("transmission_status").style.visibility = "hidden";
                  speak(result["prediction"]);
                } else {
                  // document.getElementById("output").innerHTML = '<pre>undefined</pre>';
                }
              }
            );
          }
        }
      }
    }
  };

  // On socket close
  wsLeapMotion.onclose = function (event) {
    const deviceConnStatus = document.querySelector("#deviceStatus");
    wsLeapMotion = null;
    window.removeEventListener("focus", focusListener);
    window.removeEventListener("blur", blurListener);
    document.getElementById("main").style.visibility = "hidden";
    //document.getElementById("connection").innerHTML = "WebSocket connection closed";
    // document.getElementById("connection_img").src = 'img/10389_bulb_red_icon.png';
    // document.getElementById("connection_img").alt='Connection Closed';
    deviceConnStatus.className = "badge badge-danger";
    deviceConnStatus.innerText = "Device not connected!";
  };

  // On socket error
  wsLeapMotion.onerror = function (event) {
    //   alert("Received error" + event);
    console.log(event);
  };
}

function jsOnUpdateTrainingStatus(message) {
  document.getElementById("training_status").innerHTML += message["result"] + "<br/>";
  if (message["result"] == "Training Complete!") {
    document.getElementById("output").innerHTML = "Training Complete!";
  } else {
    document.getElementById("output").innerHTML += "&#9646;";
  }
}

function togglePause() {
  paused = !paused;

  //   if (paused) {
  //     document.getElementById("pause").innerText = "Resume";
  //   } else {
  //     document.getElementById("pause").innerText = "Pause";
  //   }
}

function toggleMode() {
  mode = !mode;

  if (mode) {
    //document.getElementById("mode").innerText = "Predict";
    //document.getElementById("concept").style.visibility = "visible";
    //document.getElementById("title").innerText = "Training";
  } else {
    //document.getElementById("mode").innerText = "Collect";
    //document.getElementById("concept").style.visibility = "hidden";
    //document.getElementById("title").innerText = "Predicting";
  }
}

function trainModel() {
  let model_id = document.querySelector("#model_id option:checked").text;
  JS2Py.PythonFunctions.TalkMotionServer.train(model_id, function (results) {
    let output = "";
    for (let i in results) {
      result = results[i];
      output += "<pre>" + result + "</pre>";
    }
    document.getElementById("output").innerHTML = output;
  });
}
