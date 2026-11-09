// Privacy-respecting counts for the public site (marketing ticket M1.5).
// One small beacon per page view or button press. No cookie, no device id, nothing stored in
// the browser. The server keeps daily totals per page and never stores the IP address.
// Browsers with Do Not Track switched on send nothing.

const EVENTS_URL = import.meta.env.VITE_EVENTS_URL ?? "https://app.talk-motion.com/api/v1/events";

let referrerSent = false;

export function track(event) {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
    if (window.location.hostname === "localhost" && !import.meta.env.VITE_EVENTS_URL) return;
    // The referring site only matters for the page someone arrived on.
    const r = event === "pageview" && !referrerSent ? document.referrer || "" : "";
    if (event === "pageview") referrerSent = true;
    const body = JSON.stringify({ e: event, p: window.location.pathname, r });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(EVENTS_URL, new Blob([body], { type: "text/plain" }));
    } else {
      fetch(EVENTS_URL, { method: "POST", body, mode: "no-cors", keepalive: true }).catch(() => {});
    }
  } catch {
    // counting must never break the page
  }
}
