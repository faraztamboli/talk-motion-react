import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import { Layout } from 'antd';
import 'antd/dist/antd.min.css';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Converter from './pages/Converter';
import Trainer from './pages/Trainer';
import Models from './pages/Models';
import Login from './pages/Login';
import { Statuses } from './components/ui/Statuses';
import { useSelector, useDispatch } from 'react-redux';
import { login } from './app/features/loginSlice';
import JS2Py from './remotepyjs';
// import './remotepyjs(f)/remotepy.1.0.0.min';
import { setServerConnected, setServerStatus } from './app/features/serverSlice';
import Profile from './pages/Profile';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

const { Content } = Layout;

const App = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.login.isLoggedIn);

  const [collapsed, setCollapsed] = React.useState(false);
  const onCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // initialize remote python server
  React.useEffect(() => {
    let conn = null;
    // console.log(JS2Py);
    JS2Py.serverName = 'wss://talk-motion.com:8083';

    // Push function to onopen array of functions
    JS2Py.subOnOpen(() => {
      dispatch(setServerConnected(true));
      dispatch(setServerStatus('Connected'));
      console.log('connected');
      console.log('hey I am working', JS2Py);
    });

    // ------------testing ----------------------
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

    // ----------------end testing----------------

    // Push function to onclose array of functions
    JS2Py.subOnClose(() => {
      dispatch(setServerConnected(false));
      dispatch(setServerStatus('Disconnected'));
    });

    // starting connection and taking instance to close on unmounts
    conn = JS2Py.start();

    // stop server when component unmounts
    return () => {
      conn.close(1000, 'Rerendered close!');
    };
    //eslint-disable-next-line
  }, []);

  const navigate = useNavigate(); // use navigate hook from react-router-dom

  React.useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      // if user is logged in, dispatch login action
      const loginPayload = {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
      };
      dispatch(login(loginPayload));

      navigate('/');
    } else {
      navigate('/login');
    }
    //eslint-disable-next-line
  }, [isLoggedIn]);

  return (
    <div className="App">
      {isLoggedIn ? (
        <Layout>
          <Sidebar collapsed={collapsed} />
          <Layout>
            <Header collapsed={collapsed} onCollapsed={onCollapsed} />
            <Content
              style={{
                margin: '24px 16px 0',
              }}
            >
              <div
                className="site-layout-background"
                style={{
                  padding: 24,
                  minHeight: 360,
                }}
              >
                <Routes>
                  <Route index path="/" element={<Home />} />
                  <Route path="converter" exact element={<Converter />} />
                  <Route path="trainer" exact element={<Trainer />} />
                  <Route path="models" exact element={<Models />} />
                  <Route path="profile" exact element={<Profile />} />
                  <Route path="*" element={<h1>404</h1>} />
                </Routes>
              </div>
            </Content>
            <Footer />
          </Layout>
        </Layout>
      ) : (
        <Routes>
          {/* --------Will be continued----------- */}
          <Route path="/signup" exact element={<Signup />} />
          <Route path="/login" exact element={<Login />} />
          <Route path="/forgetpassword" exact element={<ForgotPassword />} />
        </Routes>
      )}
      <Statuses />
    </div>
  );
};

export default App;
