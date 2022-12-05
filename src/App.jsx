import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
// import { Layout } from "antd";
import LayoutWrapper from "./components/Layout/Layout";
// import "antd/dist/antd.min.css";n
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
  const { collapsed, collapsedWidth, onCollapsed, sideBarWidth, md } =
    useResizeEvent();
  const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
  const isServerConnected = useSelector(
    (state) => state.server.serverConnected
  );
  const serverStatus = useSelector((state) => state.server.serverStatus);
  const location = useLocation();

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
            <Route
              index
              path="/"
              element={<Converter collapsedWidth={collapsedWidth} />}
            />
            {/* <Route exact path="/converter" element={<PrivateRoute />}> */}
            <Route path="/converter" element={<Converter />} />
            {/* </Route> */}
            <Route
              path="trainer"
              exact
              element={
                <React.Suspense
                  fallback={<Spinner size="large" pageSize="large" />}
                >
                  <Trainer collapsedWidth={collapsedWidth} />
                </React.Suspense>
              }
            />
            <Route
              path="models"
              exact="exact"
              element={
                <React.Suspense
                  fallback={<Spinner size="large" pageSize="large" />}
                >
                  <Models collapsedWidth={collapsedWidth} />
                </React.Suspense>
              }
            />
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
            <Route
              path="*"
              element={
                <PrivateRoute>
                  <Error />
                </PrivateRoute>
              }
            />
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
