import React from "react";
// import "antd/dist/antd.css";
import Home from "./pages/Home";
import { Routes, Route } from "react-router-dom";
import GuidePage from "./pages/Guide";
import useResizeEvent from "./hooks/useResizeEvent";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import About from "./pages/About";

function App() {
  const { sm, md, lg } = useResizeEvent();

  return (
    <Routes>
      <Route path="/" element={<Home md={md} />} />
      <Route path="/guide" element={<GuidePage sm={sm} md={md} lg={lg} />} />
      <Route path="/about" element={<About md={md} />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy md={md} />} />
      <Route path="/contact-us" element={<ContactUs md={md} />} />
    </Routes>
  );
}

export default App;
