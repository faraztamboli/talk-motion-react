import serverConnObserver from "./server-connection-observer.js" 

// Connection Open and Close Triggers
serverConnObserver.subConOpen(init);
serverConnObserver.subConOpen(init_speech);
serverConnObserver.subConOpen(load_speaker_list);

JS2Py.onopen = function () {
  serverConnObserver.triggerConOpen(); 
  JS2Py.PythonFunctions.SessionServer.startSessionIfNotStarted(getSessionId(), function() {
  });  

  JS2Py.registerJSFunctionToBeCalledByPython(
    "jsOnUpdateTrainingStatus",
    jsOnUpdateTrainingStatus
  );
};

JS2Py.onclose = function () {
  serverConnObserver.triggerConClose();
};

