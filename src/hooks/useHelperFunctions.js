import JS2Py from '../remotepyjs';

// Helper functions for getting session id
function inside_session(callback) {
  var data = sessionStorage.getItem('JS2PY_SESSION_ID');
  if (data == null) {
    generateNewSessionId(callback);
  } else {
    callback(data);
  }
}

function generateNewSessionId(callback) {
  JS2Py.PythonFunctions.SessionServer.getNewSessionId(function (uuid) {
    sessionStorage.setItem('JS2PY_SESSION_ID', uuid);
    if (callback !== undefined) {
      callback(uuid);
    }
  });
}

// Start the session and check if user logged in already
JS2Py.open = function () {
  inside_session(function (session_id) {
    // Start the session on server
    JS2Py.PythonFunctions.SessionServer.startSessionIfNotStarted(session_id, function () {
      // HERE: enable login button. this is only after session starts
      // update status that session started
    });

    // Check if user logged in
    JS2Py.PythonFunctions.SessionServer.isLoggedIn(session_id, function (loginInfo) {
      if (loginInfo.isLoggedIn) {
        // disable/hide login button as you are already logged in
        // enable/display logoff button to give option to logout
      } else {
        // enable/display login button as you are already logged in
        // disable/hide logoff button to give option to logout
      }
    });
  });
};

// Login or logout event handlers
function on_login_click() {
  // Validate the session on the server

  inside_session(function (session_id) {
    let username = document.getElementById('user').value;
    let password = document.getElementById('pass').value;
    let currentUrl = 'http://localhost:63344/Projects/test/web/kubloy/index.html',
      afterLoginUrl = 'http://localhost:63344/Projects/test/web/kubloy/index.html';
    JS2Py.PythonFunctions.validateLogin(
      session_id,
      username,
      password,
      remember,
      currentUrl,
      afterLoginUrl,
      function (result) {
        // disable / hide login button
        // enable / display logout button
        // call any function that needs to be called after login
      },
    );
  });
}

function on_logout_click() {
  inside_session(function (session_id) {
    JS2Py.PythonFunctions.logOut(function (result) {
      // enable / display login button
      // disable / hidelogout button
      // call any function that needs to be called after logout
    });
  });
}
