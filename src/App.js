import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import 'antd/dist/antd.min.css';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Login from './pages/Login/Login';
import PrivateRoute from './components/PrivateRoute';
import { Statuses } from './components/ui/Statuses';
import { useSelector } from 'react-redux';
import Spinner from './components/ui/Spinner';
import ServerError from './components/ui/ServerError';
import Error from './pages/404Error/404Error';
import connectToServer from './hooks/connectToServer';
import useAuthStatus from './hooks/useAuthStatus';
import useResizeEvent from './hooks/useResizeEvent';

// React lazy components
const Converter = React.lazy(() => import('./pages/Converter/Converter'));
const Trainer = React.lazy(() => import('./pages/Trainer/Trainer'));
const Models = React.lazy(() => import('./pages/Models/Models'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const Signup = React.lazy(() => import('./pages/Signup/Signup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword/ForgotPassword'));

const { Content } = Layout;

const App = () => {
  const { collapsed, collapsedWidth, onCollapsed, sideBarWidth, md } = useResizeEvent();
  const isLoggedIn = useSelector(state => state.login.isLoggedIn);
  const isServerConnected = useSelector(state => state.server.serverConnected);
  const serverStatus = useSelector(state => state.server.serverStatus);

  // connect to server
  connectToServer();

  // check if user is logged in
  useAuthStatus();
  return (
    <div className="App">
      {isServerConnected ? (
        // isLoggedIn ? (
        <>
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
                    <Route
                      path="trainer"
                      exact
                      element={
                        <React.Suspense fallback={<Spinner size="large" pageSize="large" />}>
                          <Trainer collapsedWidth={collapsedWidth} />
                        </React.Suspense>
                      }
                    />
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
                    <Route
                      path="*"
                      element={
                        <PrivateRoute>
                          <Error />
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                </div>
              </Content>
              <Footer />
            </Layout>
          </Layout>
          {/* ) : ( */}
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
          </Routes>
        </>
      ) : (
        // )
        serverStatus !== 'Disconnected' && <Spinner size="large" pageSize="large" />
      )}
      {serverStatus === 'Disconnected' && <ServerError />}
      <Statuses collapsedWidth={collapsedWidth} />
    </div>
  );
};

export default App;
