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
import { setServerConnected, setServerStatus } from './app/features/serverSlice';
import JS2Py from 'remotepy';

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
    console.log(JS2Py);
    JS2Py.serverName = 'wss://talk-motion.com:8083';

    // Push function to onopen array of functions
    JS2Py.subOnOpen(() => {
      dispatch(setServerConnected(true));
      dispatch(setServerStatus('Connected'));
    });

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
                  <Route path="*" element={<h1>404</h1>} />
                </Routes>
              </div>
            </Content>
            <Footer />
          </Layout>
        </Layout>
      ) : (
        <Routes>
          <Route exact path="login" element={<Login />} />
        </Routes>
      )}
      <Statuses />
    </div>
  );
};

export default App;
