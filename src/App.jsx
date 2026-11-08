import React from "react";
import "./index.css";
import LayoutWrapper from "./components/Layout/Layout";
import { useSelector } from "react-redux";
import Spinner from "./components/ui/Spinner";
import ServerError from "./pages/Errors/ServerError";
import { Statuses } from "./components/ui/Statuses";
import useServerConnection from "./hooks/useServerConnection";
import useMediaQueries from "./hooks/useMediaQueries";
import AppRoutes from "./routes/AppRoutes";
import jsOnUpdateTrainingStatus from "./utils/jsOnUpdateTrainingStatus";
import jsOnSignPrediction from "./utils/jsOnSignPrediction";
import { ConfigProvider } from "antd";
import { useLocation } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext";
import { useApiAuthBootstrap } from "./hooks/useApiAuth";
import { isRemotePyOptionalPath } from "./config/layoutConfig";

const App = () => {
  const { collapsed, collapsedWidth, onCollapsed, sideBarWidth, sm, md } =
    useMediaQueries();
  const isServerConnected = useSelector(
    (state) => state.server.serverConnected
  );
  const serverStatus = useSelector((state) => state.server.serverStatus);
  const { direction, isRTL } = useLanguage();
  const location = useLocation();

  // connect to server
  useServerConnection();
  // restore the TalkMotion 2.0 API session (JWT) and the user's feature flags
  useApiAuthBootstrap();

  jsOnUpdateTrainingStatus();
  jsOnSignPrediction();

  // Legacy pages need the RemotePy socket; Conversation Mode pages talk to the new API and
  // render even while the socket is connecting or down.
  const canRender = isServerConnected || isRemotePyOptionalPath(location.pathname);

  return (
    <ConfigProvider direction={direction}>
      <div className="App">
        {canRender ? (
          <LayoutWrapper
            collapsed={collapsed}
            onCollapsed={onCollapsed}
            sideBarWidth={sideBarWidth}
            collapsedWidth={collapsedWidth}
          >
            <AppRoutes sm={sm} md={md} collapsedWidth={collapsedWidth} />
          </LayoutWrapper>
        ) : serverStatus === "Connecting..." ? (
          <Spinner size="large" pageSize="large" />
        ) : (
          serverStatus === "Disconnected" && <ServerError />
        )}
        <Statuses collapsedWidth={collapsedWidth} />
      </div>
    </ConfigProvider>
  );
};

export default App;
