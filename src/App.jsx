import React from "react";
import { Routes, Route } from "react-router-dom";
import LayoutWrapper from "./components/Layout/Layout";
import "./index.css";
import Login from "./pages/Login/Login";
import PrivateRoute from "./components/PrivateRoute";
import Converter from "./pages/Converter/Converter";
import { Statuses } from "./components/ui/Statuses";
import { useSelector } from "react-redux";
import Spinner from "./components/ui/Spinner";
import ServerError from "./components/ui/ServerError";
import Error from "./pages/404Error/404Error";
import useConnectToServer from "./hooks/useConnectToServer";
import useAuthStatus from "./hooks/useAuthStatus";
import useResizeEvent from "./hooks/useResizeEvent";
import UploadVideo from "./components/ui/UploadVideo";

// React lazy components
const Trainer = React.lazy(() => import("./pages/Trainer/Trainer"));
const Models = React.lazy(() => import("./pages/Models/Models"));
const Profile = React.lazy(() => import("./pages/Profile/Profile"));
const Signup = React.lazy(() => import("./pages/Signup/Signup"));
const ForgotPassword = React.lazy(() =>
  import("./pages/ForgotPassword/ForgotPassword")
);

// const { Content } = Layout;

const App = () => {
  const { collapsed, collapsedWidth, onCollapsed, sideBarWidth, md, sm } =
    useResizeEvent();
  const isServerConnected = useSelector(
    (state) => state.server.serverConnected
  );
  const serverStatus = useSelector((state) => state.server.serverStatus);

  // connect to server;
  useConnectToServer();

  // check if user is logged in
  useAuthStatus();

  return (
    <div className="App">
      {isServerConnected ? (
        <LayoutWrapper
          collapsed={collapsed}
          onCollapsed={onCollapsed}
          sideBarWidth={sideBarWidth}
          collapsedWidth={collapsedWidth}
        >
          <Routes>
            <Route element={<PrivateRoute />}>
              <Route
                index
                path="/"
                element={
                  <React.Suspense
                    fallback={<Spinner size="large" pageSize="large" />}
                  >
                    <Converter
                      sm={sm}
                      md={md}
                      collapsedWidth={collapsedWidth}
                    />
                  </React.Suspense>
                }
              />
            </Route>
            <Route exact path="/converter" element={<PrivateRoute />}>
              <Route
                path="/converter"
                element={
                  <React.Suspense
                    fallback={<Spinner size="large" pageSize="large" />}
                  >
                    <Converter
                      sm={sm}
                      md={md}
                      collapsedWidth={collapsedWidth}
                    />
                  </React.Suspense>
                }
              />
            </Route>
            <Route path="/trainer" element={<PrivateRoute />}>
              <Route
                path="/trainer"
                element={
                  <React.Suspense
                    fallback={<Spinner size="large" pageSize="large" />}
                  >
                    <Trainer collapsedWidth={collapsedWidth} sm={sm} />
                  </React.Suspense>
                }
              />
            </Route>
            <Route path="/uploadvideo" element={<UploadVideo />} />
            <Route exact path="/models" element={<PrivateRoute />}>
              <Route
                path="/models"
                element={
                  <React.Suspense
                    fallback={<Spinner size="large" pageSize="large" />}
                  >
                    <Models collapsedWidth={collapsedWidth} sm={sm} />
                  </React.Suspense>
                }
              />
            </Route>
            <Route
              path="my-models"
              exact
              element={
                <React.Suspense
                  fallback={<Spinner size="large" pageSize="large" />}
                >
                  <Models collapsedWidth={collapsedWidth} />
                </React.Suspense>
              }
            />
            <Route
              path="profile"
              exact
              element={
                <React.Suspense
                  fallback={<Spinner size="large" pageSize="large" />}
                >
                  <Profile collapsedWidth={collapsedWidth} />
                </React.Suspense>
              }
            />
            <Route
              path="settings"
              exact
              element={
                <React.Suspense
                  fallback={<Spinner size="large" pageSize="large" />}
                >
                  <Models collapsedWidth={collapsedWidth} />
                </React.Suspense>
              }
            />
            <Route
              path="/signup"
              exact
              element={
                <React.Suspense
                  fallback={<Spinner size="large" pageSize="large" />}
                >
                  <Signup md={md} />
                </React.Suspense>
              }
            />
            <Route path="/login" exact element={<Login md={md} />} />
            <Route
              path="/forgetpassword"
              exact
              element={
                <React.Suspense
                  fallback={<Spinner size="large" pageSize="large" />}
                >
                  <ForgotPassword md={md} />
                </React.Suspense>
              }
            />
            <Route path="*" element={<Error />} />
          </Routes>
        </LayoutWrapper>
      ) : serverStatus === "Connecting..." ? (
        <Spinner size="large" pageSize="large" />
      ) : (
        serverStatus === "Disconnected" && <ServerError />
      )}
      <Statuses collapsedWidth={collapsedWidth} />
    </div>
  );
};

export default App;
