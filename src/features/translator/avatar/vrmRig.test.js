import { describe, expect, it } from "vitest";
import { Euler, Object3D, Quaternion, Vector3 } from "three";
import { createRigDriver } from "./vrmRig";

// A T-pose rig with the bone names the driver uses. Left is +x, like a VRM 1.0 model facing +z.
const FINGER_BASES = { Index: [0.08, 0, 0.02], Middle: [0.09, 0, 0.005], Ring: [0.085, 0, -0.01], Little: [0.075, 0, -0.025] };

function buildRig() {
  const nodes = {};
  const add = (name, parent, x, y, z) => {
    const o = new Object3D();
    o.name = name;
    o.position.set(x, y, z);
    if (parent) nodes[parent].add(o);
    nodes[name] = o;
  };
  add("hips", null, 0, 1, 0);
  add("spine", "hips", 0, 0.1, 0);
  add("chest", "spine", 0, 0.15, 0);
  add("neck", "chest", 0, 0.25, 0);
  add("head", "neck", 0, 0.1, 0);
  for (const [side, sign] of [["left", 1], ["right", -1]]) {
    add(`${side}UpperArm`, "chest", 0.2 * sign, 0.15, 0);
    add(`${side}LowerArm`, `${side}UpperArm`, 0.3 * sign, 0, 0);
    add(`${side}Hand`, `${side}LowerArm`, 0.25 * sign, 0, 0);
    add(`${side}ThumbMetacarpal`, `${side}Hand`, 0.02 * sign, -0.005, 0.03);
    add(`${side}ThumbProximal`, `${side}ThumbMetacarpal`, 0.03 * sign, 0, 0.015);
    add(`${side}ThumbDistal`, `${side}ThumbProximal`, 0.03 * sign, 0, 0.01);
    for (const [name, [x, y, z]] of Object.entries(FINGER_BASES)) {
      add(`${side}${name}Proximal`, `${side}Hand`, x * sign, y, z);
      add(`${side}${name}Intermediate`, `${side}${name}Proximal`, 0.03 * sign, 0, 0);
      add(`${side}${name}Distal`, `${side}${name}Intermediate`, 0.02 * sign, 0, 0);
    }
  }
  return nodes;
}

const lm = (v) => [v.x, -v.y, -v.z]; // world -> landmark
const zeros = (n) => Array.from({ length: n }, () => [0, 0, 0]);

/** Pose landmarks (viewer orientation) for given world points by index. */
function poseWith(points) {
  const pose = zeros(33);
  for (const [i, v] of Object.entries(points)) pose[i] = lm(v);
  return pose;
}

/** A left-hand landmark set: the rig's own finger layout, rotated by `rot`, moved to `origin`. */
function leftHand(rot = new Quaternion(), origin = new Vector3()) {
  const rel = zeros(21).map(() => new Vector3());
  rel[0].set(0, 0, 0);
  rel[1].set(0.02, -0.005, 0.03);
  rel[2].set(0.05, -0.005, 0.045);
  rel[3].set(0.08, -0.005, 0.055);
  rel[4].set(0.1, -0.005, 0.06);
  [["Index", 5], ["Middle", 9], ["Ring", 13], ["Little", 17]].forEach(([n, base]) => {
    const [x, y, z] = FINGER_BASES[n];
    rel[base].set(x, y, z);
    rel[base + 1].set(x + 0.03, y, z);
    rel[base + 2].set(x + 0.05, y, z);
    rel[base + 3].set(x + 0.07, y, z);
  });
  return rel.map((v) => lm(v.applyQuaternion(rot).add(origin)));
}

const worldPos = (node) => node.getWorldPosition(new Vector3());
const worldDir = (a, b) => worldPos(b).sub(worldPos(a)).normalize();
const settle = (driver, frame) => {
  for (let i = 0; i < 3; i++) driver.apply(frame, 10); // dt large: no smoothing lag
};
const near = (a, b, eps = 1e-3) => expect(a.distanceTo(b)).toBeLessThan(eps);

describe("createRigDriver", () => {
  it("finds the bones", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n] || null);
    expect(driver.bones).toContain("leftIndexDistal");
    expect(driver.bones).toContain("rightUpperArm");
  });

  it("does nothing without bones", () => {
    const driver = createRigDriver(() => null);
    expect(() => driver.apply({}, 0.1)).not.toThrow();
  });

  it("relaxes the arms with no frame", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    settle(driver, null);
    const d = worldDir(nodes.leftUpperArm, nodes.leftLowerArm);
    expect(d.y).toBeLessThan(-0.9); // hanging down
    expect(d.x).toBeGreaterThan(0); // still on the left side
    const r = worldDir(nodes.rightUpperArm, nodes.rightLowerArm);
    expect(r.x).toBeLessThan(0);
    // out from the body far enough to clear a shirt and hips, not straight down inside them
    expect(d.x).toBeGreaterThan(0.3);
    expect(r.x).toBeLessThan(-0.3);
  });

  it("aims the arm along the picture when only one shoulder is known", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const shoulder = new Vector3(0.2, 1.4, 0);
    const elbow = new Vector3(0.2, 1.7, 0); // upper arm straight up
    const wrist = new Vector3(0.5, 1.7, 0); // forearm straight out
    settle(driver, { pose: poseWith({ 11: shoulder, 13: elbow, 15: wrist }) });
    near(worldDir(nodes.leftUpperArm, nodes.leftLowerArm), new Vector3(0, 1, 0));
    near(worldDir(nodes.leftLowerArm, nodes.leftHand), new Vector3(1, 0, 0));
  });

  it("puts the wrist where the signer's wrist is on the body", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    // a signer the size of the model: the wrist is in front of the chest, a little left of centre
    const pose = poseWith({
      11: new Vector3(0.2, 1.4, 0),
      12: new Vector3(-0.2, 1.4, 0),
      13: new Vector3(0.2, 1.12, 0),
      15: new Vector3(0.05, 1.3, 0),
    });
    settle(driver, { pose });
    const hand = worldPos(nodes.leftHand);
    expect(hand.x).toBeCloseTo(0.05, 2);
    expect(hand.y).toBeCloseTo(1.3, 2);
    expect(hand.z).toBeGreaterThan(0.15); // in front of the body: the picture shows shortened arms
    // the elbow bends the way the signer's does: below the shoulder, not above the wrist
    expect(worldPos(nodes.leftLowerArm).y).toBeLessThan(1.3);
  });

  it("ignores MediaPipe's exaggerated pose depth", () => {
    const run = (wristDepth) => {
      const nodes = buildRig();
      const driver = createRigDriver((n) => nodes[n]);
      const pose = poseWith({
        11: new Vector3(0.2, 1.4, 0),
        12: new Vector3(-0.2, 1.4, 0),
        13: new Vector3(0.2, 1.12, 0.1),
        15: new Vector3(0.05, 1.3, wristDepth),
      });
      settle(driver, { pose });
      return worldPos(nodes.leftHand);
    };
    near(run(0.3), run(3), 1e-6);
  });

  it("lets an arm hang when it leaves the picture and no hand was found", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    // landmark y > 1 is below the bottom edge: world y < -1
    const pose = poseWith({
      11: new Vector3(0.2, -0.5, 0),
      12: new Vector3(-0.2, -0.5, 0),
      13: new Vector3(0.6, -0.8, 0),
      15: new Vector3(0.9, -1.2, 0),
    });
    settle(driver, { pose });
    expect(worldDir(nodes.leftUpperArm, nodes.leftLowerArm).y).toBeLessThan(-0.9);
  });

  it("an arm that is not tracked relaxes while the other keeps signing", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const frame = { pose: poseWith({ 12: new Vector3(-0.2, 1.4, 0), 14: new Vector3(-0.2, 1.7, 0), 16: new Vector3(-0.2, 2, 0) }) };
    settle(driver, frame);
    near(worldDir(nodes.rightUpperArm, nodes.rightLowerArm), new Vector3(0, 1, 0));
    expect(worldDir(nodes.leftUpperArm, nodes.leftLowerArm).y).toBeLessThan(-0.9);
  });

  it("a hand in the rest layout leaves the hand and fingers at rest", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const rest = nodes.leftHand.getWorldQuaternion(new Quaternion());
    // arm along the T-pose direction so the hand keeps its rest orientation
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.5, 1.4, 0), 15: new Vector3(0.75, 1.4, 0) });
    settle(driver, { pose, lh: leftHand(new Quaternion(), new Vector3(0.75, 1.4, 0)) });
    expect(nodes.leftHand.getWorldQuaternion(new Quaternion()).angleTo(rest)).toBeLessThan(1e-2);
    near(worldDir(nodes.leftIndexProximal, nodes.leftIndexIntermediate), new Vector3(1, 0, 0));
  });

  it("turns the palm with the hand landmarks", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const rest = nodes.leftHand.getWorldQuaternion(new Quaternion());
    const turn = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0)); // roll the hand a quarter turn
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.5, 1.4, 0), 15: new Vector3(0.75, 1.4, 0) });
    settle(driver, { pose, lh: leftHand(turn, new Vector3(0.75, 1.4, 0)) });
    const expected = turn.clone().multiply(rest);
    expect(nodes.leftHand.getWorldQuaternion(new Quaternion()).angleTo(expected)).toBeLessThan(1e-2);
    // the index finger's knuckle moved with the roll: its world offset from the wrist is the rolled layout
    const offset = worldPos(nodes.leftIndexProximal).sub(worldPos(nodes.leftHand));
    near(offset, new Vector3(...FINGER_BASES.Index).applyQuaternion(turn), 1e-2);
  });

  it("bends fingers to the landmark directions", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.5, 1.4, 0), 15: new Vector3(0.75, 1.4, 0) });
    const hand = leftHand(new Quaternion(), new Vector3(0.75, 1.4, 0));
    // curl the index finger: PIP -> DIP and DIP -> TIP point down (world -y)
    const mcp = new Vector3(...hand[5]).multiply(new Vector3(1, -1, -1));
    hand[6] = lm(mcp.clone().add(new Vector3(0.03, 0, 0)));
    hand[7] = lm(mcp.clone().add(new Vector3(0.03, -0.03, 0)));
    hand[8] = lm(mcp.clone().add(new Vector3(0.03, -0.06, 0)));
    settle(driver, { pose, lh: hand });
    near(worldDir(nodes.leftIndexIntermediate, nodes.leftIndexDistal), new Vector3(0, -1, 0), 0.08);
  });

  it("finger joints only curl toward the palm, whatever the depth noise says", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.5, 1.4, 0), 15: new Vector3(0.75, 1.4, 0) });
    const hand = leftHand(new Quaternion(), new Vector3(0.75, 1.4, 0));
    // the landmarks say the fingertip went sideways (z), which a finger joint can't do
    const mcp = new Vector3(...hand[5]).multiply(new Vector3(1, -1, -1));
    hand[6] = lm(mcp.clone().add(new Vector3(0.03, 0, 0)));
    hand[7] = lm(mcp.clone().add(new Vector3(0.03, 0, 0.03)));
    hand[8] = lm(mcp.clone().add(new Vector3(0.03, 0, 0.06)));
    settle(driver, { pose, lh: hand });
    const d = worldDir(nodes.leftIndexIntermediate, nodes.leftIndexDistal);
    expect(Math.abs(d.z)).toBeLessThan(0.1);
    expect(d.y).toBeLessThan(-0.9); // bent, but toward the palm (down in the rest pose)
  });

  it("fingers follow the hand without twisting against it", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const turn = new Quaternion().setFromEuler(new Euler(Math.PI, 0, 0)); // palm turned up
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.5, 1.4, 0), 15: new Vector3(0.75, 1.4, 0) });
    settle(driver, { pose, lh: leftHand(turn, new Vector3(0.75, 1.4, 0)) });
    const handQ = nodes.leftHand.getWorldQuaternion(new Quaternion());
    const fingerQ = nodes.leftIndexProximal.getWorldQuaternion(new Quaternion());
    expect(fingerQ.angleTo(handQ)).toBeLessThan(0.05); // same turn as the hand, no extra roll
  });

  it("smooths: one short step does not reach the target", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const shoulder = new Vector3(0.2, 1.4, 0);
    const frame = { pose: poseWith({ 11: shoulder, 13: new Vector3(0.2, 1.7, 0), 15: new Vector3(0.2, 2, 0) }) };
    driver.apply(frame, 1 / 120);
    const d = worldDir(nodes.leftUpperArm, nodes.leftLowerArm);
    expect(d.y).toBeLessThan(0.9); // not there yet
    settle(driver, frame);
    expect(worldDir(nodes.leftUpperArm, nodes.leftLowerArm).y).toBeGreaterThan(0.99);
  });

  it("an untracked hand follows the forearm, loosely curled", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.2, 1.1, 0), 15: new Vector3(0.2, 0.8, 0) });
    settle(driver, { pose });
    // forearm points down, so the fingers (rest: along the arm) point down too
    expect(worldDir(nodes.leftIndexProximal, nodes.leftIndexIntermediate).y).toBeLessThan(-0.9);
  });

  it("scales each sign by its own clip, not by the sign before it", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    // a sign filmed close up (shoulders twice as wide in the picture) ...
    const wide = poseWith({ 11: new Vector3(0.4, 1.4, 0), 12: new Vector3(-0.4, 1.4, 0), 13: new Vector3(0.4, 0.9, 0), 15: new Vector3(0.1, 1.2, 0) });
    settle(driver, { pose: wide, body: { shoulderWidth: 0.8, eyeHeight: 0 } });
    // ... then one filmed at the model's size: its hand goes where the clip says, at once
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 12: new Vector3(-0.2, 1.4, 0), 13: new Vector3(0.2, 1.12, 0), 15: new Vector3(0.05, 1.3, 0) });
    settle(driver, { pose, body: { shoulderWidth: 0.4, eyeHeight: 0 } });
    expect(worldPos(nodes.leftHand).x).toBeCloseTo(0.05, 2);
    expect(worldPos(nodes.leftHand).y).toBeCloseTo(1.3, 2);
  });

  it("does not flip the forearm when the wrist turns past half a turn", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    // arm straight out to the side; the hand rolls about the forearm from 170 to 190 degrees
    const pose = poseWith({ 11: new Vector3(0.2, 1.4, 0), 12: new Vector3(-0.2, 1.4, 0), 13: new Vector3(0.5, 1.4, 0), 15: new Vector3(0.75, 1.4, 0) });
    const rolled = (deg) => ({ pose, lh: leftHand(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (deg * Math.PI) / 180), new Vector3(0.75, 1.4, 0)), rh: zeros(21) });
    settle(driver, rolled(170));
    const before = nodes.leftLowerArm.getWorldQuaternion(new Quaternion());
    settle(driver, rolled(190));
    const after = nodes.leftLowerArm.getWorldQuaternion(new Quaternion());
    // the forearm takes half of the 20 degrees, not a half turn the other way
    expect((before.angleTo(after) * 180) / Math.PI).toBeLessThan(15);
  });

  it("never turns a bone faster than a signer could", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const up = { pose: poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.2, 1.7, 0), 15: new Vector3(0.2, 2.0, 0) }) };
    const out = { pose: poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.5, 1.4, 0), 15: new Vector3(0.8, 1.4, 0) }) };
    settle(driver, up);
    settle(driver, up);
    const before = nodes.leftUpperArm.quaternion.clone();
    driver.apply(out, 1 / 60); // a tracking glitch: the arm "jumps" 90 degrees in one frame
    expect((before.angleTo(nodes.leftUpperArm.quaternion) * 180) / Math.PI).toBeLessThan(12.5);
  });

  it("relaxes gently when signing stops", () => {
    const nodes = buildRig();
    const driver = createRigDriver((n) => nodes[n]);
    const frame = { pose: poseWith({ 11: new Vector3(0.2, 1.4, 0), 13: new Vector3(0.2, 1.7, 0), 15: new Vector3(0.5, 1.7, 0) }) };
    settle(driver, frame);
    driver.apply(null, 1 / 60);
    // one screen refresh later the raised arm has barely started to come down
    expect(worldDir(nodes.leftUpperArm, nodes.leftLowerArm).y).toBeGreaterThan(0.8);
  });
});
