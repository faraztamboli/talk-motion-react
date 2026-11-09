import React from "react";
import "./index.css";
import LayoutWrapper from "./components/Layout/Layout";
import { useSelector } from "react-redux";
import Spinner from "./components/ui/Spinner";
import useServerConnection from "./hooks/useServerConnection";
import useClassicSession from "./hooks/useClassicSession";
import useMediaQueries from "./hooks/useMediaQueries";
import AppRoutes from "./routes/AppRoutes";
import useTrainingStatusPush from "./utils/jsOnUpdateTrainingStatus";
import { ConfigProvider } from "antd";
import { useLocation } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext";
import { useApiAuthBootstrap } from "./hooks/useApiAuth";
import { isRemotePyOptionalPath } from "./config/layoutConfig";
import ErrorBoundary from "./components/ErrorBoundary";
import ConnectionBanner from "./components/ConnectionBanner";
import { ServerUnavailable } from "./components/PrivateRoute";

const App = () => {
  const { collapsed, collapsedWidth, onCollapsed, sideBarWidth, sm, md } = useMediaQueries();
  const { phase, everConnected } = useSelector((state) => state.server);
  const { direction } = useLanguage();
  const location = useLocation();

  // RemotePy socket, kept open with backoff for as long as the page is open
  useServerConnection();
  // TalkMotion 2.0 API session (JWT) and the user's feature flags
  useApiAuthBootstrap();
  // classic session check on every (re)connect, plus single sign-in for linked accounts
  useClassicSession();
  useTrainingStatusPush();

  // Classic pages need the server's function library before their first call. Once the app
  // has connected, pages stay mounted through reconnects (ConnectionBanner explains), so the
  // camera, microphone and uploads on the page survive a blip. Conversation Mode pages use the
  // TalkMotion 2.0 API and never wait for the socket.
  const canRender = everConnected || isRemotePyOptionalPath(location.pathname);

  let body;
  if (canRender) {
    body = (
      <LayoutWrapper
        collapsed={collapsed}
        onCollapsed={onCollapsed}
        sideBarWidth={sideBarWidth}
        collapsedWidth={collapsedWidth}
      >
        <ConnectionBanner />
        <ErrorBoundary resetKey={location.pathname}>
          <AppRoutes sm={sm} md={md} collapsedWidth={collapsedWidth} />
        </ErrorBoundary>
      </LayoutWrapper>
    );
  } else if (phase === "offline") {
    body = (
      <div className="mh-100vh flex flex-center-center">
        <ServerUnavailable />
      </div>
    );
  } else {
    body = <Spinner size="large" pageSize="large" />;
  }

  return (
    <ConfigProvider direction={direction}>
      <div className="App">
        {body}
      </div>
    </ConfigProvider>
  );
};

export default App;
