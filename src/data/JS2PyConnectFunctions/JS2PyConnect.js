import JS2Py from '../../remotepyjs';

export const JS2PyConnect = () => {
  JS2Py.onopen = function () {
    // console.log(JS2Py);
    var funcList = [];
    for (var key in JS2Py.PythonFunctionsArgs) {
      var argArray = JS2Py.PythonFunctionsArgs[key];
      argArray = argArray.slice(0, argArray.length - 2);
      var funcSignature = key + '(' + argArray.join(', ') + ')';
      funcList.push(funcSignature);
    }

    // signatures.innerHTML = '<br/><h2>Function signatures:</h2><ul><li>' + funcList.join('</li><li>') + '</li>';

    JS2Py.callPythonFunction('getPythonFunctionLibraryHelp', {}, function (PythonFunctionsHelp) {
      //JS2PySelf.PythonFunctionsHelp = funcDict;
      var funcLibrary = [];

      for (var key in PythonFunctionsHelp) {
        var funcHelp = '<h4>' + key + ':</h4>';
        funcHelp += '<p>' + PythonFunctionsHelp[key] + '</p>';
        funcLibrary.push(funcHelp);
      }
      // console.log(JS2Py);

      // help.innerHTML = '<br/><h2>Function Help:</h2>' + funcLibrary.join('');
    });
  };

  JS2Py.onclose = function () {
    // divStatus.innerHTML = 'connection closed';
  };
};
