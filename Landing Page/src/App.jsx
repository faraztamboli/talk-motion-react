import React, { useEffect } from "react";
// import "antd/dist/antd.css";
import Home from "./pages/Home";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { track } from "./components/marketing/track";
import Changelog from "./pages/Changelog";
import StaffGuide from "./pages/StaffGuide";
import useResizeEvent from "./hooks/useResizeEvent";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Leadership from "./pages/Leadership"
import ContactUs from "./pages/ContactUs";
import About from "./pages/About";
import Payment from "./pages/Payment";
import NotFound from "./pages/404NotFound";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import OpenBuild from "./pages/OpenBuild";
import Feedback from "./pages/Feedback";

function usePageviews() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === "/guide") return; // redirects to /how-it-works, which is counted
    track("pageview");
  }, [pathname]);
}

// Counts presses of the links that matter for the funnel, without touching each link.
function useLinkCounts() {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.includes("app.talk-motion.com/signup")) track("cta_signup");
      else if (href.includes("/one-pagers/")) track("onepager_open");
      else if (/pilot/i.test(a.textContent || "")) track("cta_pilot");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

function App() {
  const { md } = useResizeEvent();
  usePageviews();
  useLinkCounts();

  return (
    <Routes>
      <Route path="/" element={<Home md={md} />} />
      {/* The old Features guide described v1 (gesture translation, custom gestures). */}
      <Route path="/guide" element={<Navigate to="/how-it-works" replace />} />
      <Route path="/how-it-works" element={<HowItWorks md={md} />} />
      <Route path="/pricing" element={<Pricing md={md} />} />
      <Route path="/open-build" element={<OpenBuild md={md} />} />
      <Route path="/feedback" element={<Feedback md={md} />} />
      <Route path="/changelog" element={<Changelog md={md} />} />
      <Route path="/staff-guide" element={<StaffGuide md={md} />} />
      <Route path="/about" element={<About md={md} />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy md={md} />} />
      <Route path="/terms" element={<TermsAndConditions md={md} />} />
      <Route path="/leadership" element={<Leadership md={md} />} />
      <Route path="/contact-us" element={<ContactUs md={md} />} />
      <Route path="/payment" element={<Payment md={md} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
