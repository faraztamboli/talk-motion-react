import React from "react";
import "antd/dist/antd.min.css";
import "./index.css";
import Home from "./pages/Home";
import { Routes, Route } from "react-router-dom";
import GuidePage from "./pages/Guide";
import useResizeEvent from "./hooks/useResizeEvent";

function App() {
  const { sm, md, lg } = useResizeEvent();

  return (
    <Routes>
      <Route path="/" element={<Home md={md} />} />
      <Route path="/guide" element={<GuidePage sm={sm} md={md} lg={lg} />} />
    </Routes>
  );
}

export default App;
