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

const App = () => {
  const { collapsed, collapsedWidth, onCollapsed, sideBarWidth, sm, md } =
    useMediaQueries();
  const isServerConnected = useSelector(
    (state) => state.server.serverConnected
  );
  const serverStatus = useSelector((state) => state.server.serverStatus);

  // connect to server;
  useServerConnection();

  return (
    <div className="App">
      {isServerConnected ? (
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
  );
};

export default App;
