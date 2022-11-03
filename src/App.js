import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import 'antd/dist/antd.min.css';
import JS2Py from './remotepyjs';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import { Statuses } from './components/ui/Statuses';
import { useSelector, useDispatch } from 'react-redux';
import { login } from './app/features/loginSlice';
import { setServerConnected, setServerStatus } from './app/features/serverSlice';
import Spinner from './components/ui/Spinner';
import ServerError from './components/ui/ServerError';
import Error from './pages/404Error';
import { JS2PyConnect } from './data/JS2PyConnectFunctions/JS2PyConnect';
import GuidePage from './pages/GuidePage';
import Home from './pages/Home';

// React lazy components
const Converter = React.lazy(() => import('./pages/Converter'));
const Trainer = React.lazy(() => import('./pages/Trainer'));
const Models = React.lazy(() => import('./pages/Models'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Signup = React.lazy(() => import('./pages/Signup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));

const { Content } = Layout;

const App = props => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [collapsedWidth, setCollapsedWidth] = React.useState(80);
  const [sideBarWidth, setSideBarWidth] = React.useState(200);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [sm, setSm] = React.useState(false);
  const [md, setMd] = React.useState(false);
  const [lg, setLg] = React.useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(state => state.login.isLoggedIn);
  const isServerConnected = useSelector(state => state.server.serverConnected);
  const serverStatus = useSelector(state => state.server.serverStatus);

  const onCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // initialize remote python server.
  React.useEffect(() => {
    let conn = null;
    JS2Py.serverName = 'wss://talk-motion.com:8083';

    // Push function to onopen array of functions
    JS2Py.subOnOpen(() => {
      dispatch(setServerConnected(true));
      dispatch(setServerStatus('Connected'));
    });

    // called JS2PyConnect to get all the functions of JS2Py
    JS2PyConnect();

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

  React.useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      // if user is logged in, dispatch login action
      const loginPayload = {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
      };
      dispatch(login(loginPayload));
      navigate('/');
    } /* else {
      navigate('/login');
    } */
    //eslint-disable-next-line
  }, [isLoggedIn]);

  React.useEffect(() => {
    setWindowWidth(window.innerWidth);
    if (windowWidth <= 992) {
      setLg(true);
    } else {
      setLg(false);
    }
    if (windowWidth <= 768) {
      setMd(true);
    } else if (windowWidth > 768) {
      setMd(false);
    }
    if (windowWidth < 576) {
      setSm(true);
      setCollapsedWidth(0);
      setSideBarWidth(60);
      setCollapsed(true);
    } else if (windowWidth > 576) {
      setSm(false);
      setCollapsedWidth(60);
      setSideBarWidth(200);
    }
    window.addEventListener('resize', () => {
      setWindowWidth(window.innerWidth);
      if (windowWidth <= 992) {
        setLg(true);
      } else {
        setLg(false);
      }
      if (windowWidth <= 768) {
        setMd(true);
      } else if (windowWidth > 768) {
        setMd(false);
      }
      if (windowWidth < 576) {
        setCollapsedWidth(0);
        setSideBarWidth(60);
        setCollapsed(true);
      } else if (windowWidth > 576) {
        setCollapsedWidth(80);
        setSideBarWidth(200);
      }
    });
  }, [windowWidth, collapsedWidth]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" exact element={<Home md={md} />} />
      </Routes>
      {isServerConnected ? (
        isLoggedIn ? (
          <Layout>
            <Sidebar
              collapsed={collapsed}
              onCollapsed={onCollapsed}
              sideBarWidth={sideBarWidth}
              collapsedWidth={collapsedWidth}
            />
            <Layout>
              <Header collapsed={collapsed} onCollapsed={onCollapsed} />
              <Content>
                <div className="site-layout-background" style={{ minHeight: 360 }}>
                  <Routes>
                    <Route
                      index
                      path="/"
                      element={
                        <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                          <Converter collapsedWidth={collapsedWidth} />
                        </React.Suspense>
                      }
                    />
                    <Route exact path="/converter" element={<PrivateRoute />}>
                      <Route path="/converter" element={<Converter />} />
                    </Route>
                    {/* <Route
                      path="trainer"
                      exact
                      element={
                        <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                          <Trainer collapsedWidth={collapsedWidth} />
                        </React.Suspense>
                      }
                    /> */}
                    <Route
                      path="models"
                      exact="exact"
                      element={
                        <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                          <Models collapsedWidth={collapsedWidth} />
                        </React.Suspense>
                      }
                    />
                    <Route
                      path="my-models"
                      exact
                      element={
                        <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                          <Models collapsedWidth={collapsedWidth} />
                        </React.Suspense>
                      }
                    />
                    <Route
                      path="profile"
                      exact
                      element={
                        <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                          <Profile collapsedWidth={collapsedWidth} />
                        </React.Suspense>
                      }
                    />
                    <Route
                      path="settings"
                      exact
                      element={
                        <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                          <Models collapsedWidth={collapsedWidth} />
                        </React.Suspense>
                      }
                    />
                    <Route path="*" element={<Error />} />
                  </Routes>
                </div>
              </Content>
              <Footer />
            </Layout>
          </Layout>
        ) : (
          <Routes>
            <Route
              path="/signup"
              exact
              element={
                <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                  <Signup md={md} />
                </React.Suspense>
              }
            />
            <Route path="/login" exact element={<Login md={md} />} />
            <Route
              path="/forgetpassword"
              exact
              element={
                <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                  <ForgotPassword md={md} />
                </React.Suspense>
              }
            />
            <Route path="/guide" exact element={<GuidePage sm={sm} md={md} lg={lg} />} />
            {/* <Route path="/" exact element={<Home md={md} />} /> */}
          </Routes>
        )
      ) : (
        serverStatus !== 'Disconnected' && <Spinner size="large" pageSize="large" />
      )}
      {serverStatus === 'Disconnected' && <ServerError />}
      <Statuses collapsedWidth={collapsedWidth} />
    </div>
  );
};

export default App;
