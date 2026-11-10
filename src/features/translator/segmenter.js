/**
 * Cuts the landmark stream into sign segments, one per sign, for translateGestureSample.
 *
 * A segment starts when a hand moves and ends when the hands go still, leave the frame, or the
 * buffer reaches its cap. Hands resting in view are not signs: still frames are not buffered,
 * and a segment with too little movement is dropped instead of being sent for prediction (the
 * old translator predicted roughly every 10 frames on resting hands and firmed random words).
 *
 *   const seg = createSegmenter({ idleMs: 1500 });
 *   for each frame: seg.push(frame, timestampMs) -> array of events:
 *     { type: "segment", frames: [{ t, data }] }  a sign to predict
 *     { type: "signing" } | { type: "resting" }    hands started / stopped moving (UI)
 *     { type: "handsGone" }                        hands left the frame
 *     { type: "idle" }                             no hands for idleMs (once per pause)
 */

export const SEGMENTER_DEFAULTS = {
  minSegmentFrames: 8, // shortest segment worth predicting on (~0.3 s)
  maxSegmentFrames: 90, // force a cut on very long signs (~3 s)
  stillFrames: 6, // consecutive near-still frames = sign boundary
  handsGoneFrames: 5, // frames without hands = sign boundary
  velocityThreshold: 0.012, // wrist movement per frame, normalized image units
  minPathLength: 0.06, // total wrist travel a real sign has; less = resting hands
  prerollFrames: 3, // frames kept from just before movement started
  restZoneY: 0.85, // wrists below this (near the bottom edge) are resting, not signing
  idleMs: 1500, // no hands this long = pause (auto-send)
};

function wristOf(data) {
  const hand = data?.rightHandLandmarks || data?.leftHandLandmarks;
  const w = hand && hand[0];
  return w && typeof w.x === "number" ? w : null;
}

export function createSegmenter(options = {}) {
  const opts = { ...SEGMENTER_DEFAULTS, ...options };
  let buffer = [];
  let preroll = [];
  let path = 0;
  let still = 0;
  let moving = false;
  let lastWrist = null;
  let handsGone = 0;
  let lastHandsAt = null;
  let idleSent = true; // nothing to report until hands have been seen
  let signing = false;

  const reset = () => {
    buffer = [];
    preroll = [];
    path = 0;
    still = 0;
    moving = false;
    lastWrist = null;
    handsGone = 0;
    lastHandsAt = null;
    idleSent = true;
    signing = false;
  };

  /** Emit the buffered segment if it looks like a sign; always clears the buffer. */
  const cut = (events) => {
    if (buffer.length >= opts.minSegmentFrames && path >= opts.minPathLength) {
      events.push({ type: "segment", frames: buffer });
    }
    buffer = [];
    path = 0;
  };

  const setSigning = (on, events) => {
    if (on === signing) return;
    signing = on;
    events.push({ type: on ? "signing" : "resting" });
  };

  const push = (data, t = Date.now()) => {
    const events = [];
    const wrist = wristOf(data);
    const hands = Boolean(data?.leftHandLandmarks || data?.rightHandLandmarks);

    if (!hands) {
      handsGone += 1;
      lastWrist = null;
      still = 0;
      if (handsGone === opts.handsGoneFrames) {
        cut(events);
        moving = false;
        preroll = [];
        setSigning(false, events);
        events.push({ type: "handsGone" });
      }
      if (!idleSent && lastHandsAt !== null && t - lastHandsAt >= opts.idleMs) {
        idleSent = true;
        events.push({ type: "idle" });
      }
      return events;
    }

    handsGone = 0;
    lastHandsAt = t;
    idleSent = false;
    const frame = { t, data };

    let velocity = 0;
    if (wrist && lastWrist) velocity = Math.hypot(wrist.x - lastWrist.x, wrist.y - lastWrist.y);
    lastWrist = wrist;
    // Hands lowered to the lap or the bottom edge are resting: they never start a sign.
    const resting = wrist && wrist.y > opts.restZoneY;
    if (resting) velocity = 0;

    if (velocity >= opts.velocityThreshold) {
      still = 0;
      if (!moving) {
        moving = true;
        buffer = preroll.slice();
        preroll = [];
        setSigning(true, events);
      }
    } else {
      still += 1;
    }

    if (moving) {
      buffer.push(frame);
      path += velocity;
      if (still >= opts.stillFrames) {
        // the hands stopped: the sign is over; stop buffering until they move again
        cut(events);
        moving = false;
        setSigning(false, events);
      } else if (buffer.length >= opts.maxSegmentFrames) {
        cut(events);
      }
    } else {
      preroll.push(frame);
      if (preroll.length > opts.prerollFrames) preroll.shift();
    }
    return events;
  };

  /** Cut whatever is buffered now (manual Send while signing). */
  const flush = () => {
    const events = [];
    if (moving) cut(events);
    moving = false;
    return events;
  };

  return { push, flush, reset, options: opts };
}
