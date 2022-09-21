/* eslint-disable no-undef */
import serverConnObserver from './server-connection-observer.js';
import JS2Py from './JS2PyCode';
import leapmotion from './leapmotion';

// Connection Open and Close Triggers
serverConnObserver.subConOpen(init);
serverConnObserver.subConOpen(init_speech);
serverConnObserver.subConOpen(load_speaker_list);

JS2Py.onopen = function () {
  serverConnObserver.triggerConOpen();
  JS2Py.PythonFunctions.SessionServer.startSessionIfNotStarted(getSessionId(), function () {});

  JS2Py.registerJSFunctionToBeCalledByPython('jsOnUpdateTrainingStatus', jsOnUpdateTrainingStatus);
};

JS2Py.onclose = function () {
  serverConnObserver.triggerConClose();
};
