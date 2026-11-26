import { Matrix4, Quaternion, Vector3 } from "three";
import { isZero } from "../avatarFrames";

/**
 * Drives a VRM humanoid from pose frames { lh, rh, pose } (MediaPipe landmarks, viewer
 * orientation, x and z on the same scale as y; see avatarFrames and pose_extractor.py).
 *
 * Every bone is aimed in world space: its rest direction is turned to the direction the
 * landmarks give, then converted to a local rotation under its parent. That is stable (no
 * accumulated error down a chain) and needs no per-model calibration beyond the rig's own T-pose.
 * Hands use a full three-axis basis so the palm faces the right way, not just the fingers.
 *
 * World axes: +x is the signer's left (viewer's right), +y up, +z toward the viewer, which is the
 * way a VRM 1.0 model faces. Landmark -> world: (x, -y, -z).
 */

const SMOOTHING_RATE = 28; // 1/s; higher follows the frames more tightly
const MAX_BODY_TURN = 0.5; // radians the chest may follow the shoulders
const MAX_HEAD_TURN = 0.7;

const FINGERS = [
  ["Index", 5],
  ["Middle", 9],
  ["Ring", 13],
  ["Little", 17],
];

const POSE = { nose: 0, earLeft: 7, earRight: 8, shoulder: { left: 11, right: 12 }, elbow: { left: 13, right: 14 }, wrist: { left: 15, right: 16 } };

/** Relaxed arms for when nothing is tracked: hanging, forearms a little forward. */
const RELAXED = {
  left: { upper: new Vector3(0.1, -1, 0.05).normalize(), lower: new Vector3(0.05, -1, 0.35).normalize() },
  right: { upper: new Vector3(-0.1, -1, 0.05).normalize(), lower: new Vector3(-0.05, -1, 0.35).normalize() },
};

const point = (block, i) => {
  const p = block?.[i];
  if (!p || isZero(p)) return null;
  return new Vector3(p[0], -p[1], -p[2]);
};

const direction = (from, to) => {
  if (!from || !to) return null;
  const d = to.clone().sub(from);
  return d.lengthSq() > 1e-10 ? d.normalize() : null;
};

/** Orthonormal frame with its y along `forward` and its z across `side` x `forward`. */
function basisQuaternion(forward, side) {
  const y = forward.clone().normalize();
  const z = new Vector3().crossVectors(side, y);
  if (z.lengthSq() < 1e-10) return null;
  z.normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}

/** Keep a rotation within `max` radians of no rotation. */
function limited(q, max) {
  const angle = 2 * Math.acos(Math.min(1, Math.abs(q.w)));
  if (angle <= max) return q;
  return new Quaternion().slerp(q, max / angle);
}

/** Bone specs: name, the bone whose position gives its rest direction (`child`) or the previous bone (`prev`). */
function boneSpecs() {
  const specs = [];
  const add = (name, extra) => specs.push({ name, ...extra });
  add("hips", {});
  add("spine", {});
  add("chest", {});
  add("neck", {});
  add("head", {});
  for (const side of ["left", "right"]) {
    add(`${side}UpperArm`, { child: `${side}LowerArm` });
    add(`${side}LowerArm`, { child: `${side}Hand` });
    add(`${side}Hand`, {});
    add(`${side}ThumbMetacarpal`, { child: `${side}ThumbProximal` });
    add(`${side}ThumbProximal`, { child: `${side}ThumbDistal` });
    add(`${side}ThumbDistal`, { prev: `${side}ThumbProximal` });
    for (const [finger] of FINGERS) {
      add(`${side}${finger}Proximal`, { child: `${side}${finger}Intermediate` });
      add(`${side}${finger}Intermediate`, { child: `${side}${finger}Distal` });
      add(`${side}${finger}Distal`, { prev: `${side}${finger}Intermediate` });
    }
  }
  return specs;
}

const worldPosition = (node) => {
  node.updateWorldMatrix(true, false);
  return node.getWorldPosition(new Vector3());
};

/**
 * @param getBone (name) => Object3D | null, the normalized humanoid bone (rest pose = T-pose).
 * @returns { apply(frame, dt), bones } where bones lists the names that were found.
 */
export function createRigDriver(getBone) {
  const specs = boneSpecs();
  const bones = {};
  const first = specs.map((s) => getBone(s.name)).find(Boolean);
  if (!first) return { apply() {}, bones: [] };
  let top = first;
  while (top.parent) top = top.parent;
  top.updateMatrixWorld(true);

  for (const spec of specs) {
    const node = getBone(spec.name);
    if (!node) continue;
    bones[spec.name] = { node, restQ: node.getWorldQuaternion(new Quaternion()), restDir: null, rest: node.quaternion.clone() };
  }
  for (const spec of specs) {
    const b = bones[spec.name];
    if (!b) continue;
    const other = spec.child ? bones[spec.child] : spec.prev ? bones[spec.prev] : null;
    if (!other) continue;
    const dir = spec.child
      ? direction(worldPosition(b.node), worldPosition(other.node))
      : direction(worldPosition(other.node), worldPosition(b.node));
    if (dir) b.restDir = dir;
  }

  const restPos = (name) => (bones[name] ? worldPosition(bones[name].node) : null);
  // Rest bases for the hands and the head
  const handRest = {};
  for (const side of ["left", "right"]) {
    const hand = restPos(`${side}Hand`);
    const mid = restPos(`${side}MiddleProximal`);
    const index = restPos(`${side}IndexProximal`);
    const little = restPos(`${side}LittleProximal`);
    if (hand && mid && index && little) {
      handRest[side] = basisQuaternion(mid.clone().sub(hand), little.clone().sub(index));
    }
  }
  const headRest = basisQuaternion(new Vector3(0, -0.15, 1), new Vector3(1, 0, 0));
  const shoulderAxisRest =
    bones.leftUpperArm && bones.rightUpperArm ? direction(worldPosition(bones.rightUpperArm.node), worldPosition(bones.leftUpperArm.node)) : null;

  const aim = (name, dir) => {
    const b = bones[name];
    if (!b || !b.restDir || !dir) return null;
    return new Quaternion().setFromUnitVectors(b.restDir, dir).multiply(b.restQ);
  };

  const parentWorld = new Quaternion();
  const local = new Quaternion();
  const setBone = (name, desiredWorld, alpha) => {
    const b = bones[name];
    if (!b || !desiredWorld) return;
    if (b.node.parent) {
      b.node.parent.getWorldQuaternion(parentWorld);
      local.copy(parentWorld).invert().multiply(desiredWorld);
    } else local.copy(desiredWorld);
    b.node.quaternion.slerp(local, alpha);
  };
  const setRest = (name, alpha) => {
    const b = bones[name];
    if (b) b.node.quaternion.slerp(b.rest, alpha);
  };

  function targetsFor(frame) {
    const t = new Map();
    const pose = frame?.pose;

    // Body: chest follows the shoulder line, head follows the ears and nose
    const ls = point(pose, POSE.shoulder.left);
    const rs = point(pose, POSE.shoulder.right);
    const axis = direction(rs, ls);
    if (axis && shoulderAxisRest && bones.chest) {
      const q = new Quaternion().setFromUnitVectors(shoulderAxisRest, axis);
      t.set("chest", limited(q, MAX_BODY_TURN).multiply(bones.chest.restQ));
    }
    const earL = point(pose, POSE.earLeft);
    const earR = point(pose, POSE.earRight);
    const nose = point(pose, POSE.nose);
    if (earL && earR && nose && headRest && bones.head) {
      const mid = earL.clone().add(earR).multiplyScalar(0.5);
      const now = basisQuaternion(nose.clone().sub(mid), earL.clone().sub(earR));
      if (now) {
        const delta = now.multiply(headRest.clone().invert());
        t.set("head", limited(delta, MAX_HEAD_TURN).multiply(bones.head.restQ));
      }
    }

    for (const side of ["left", "right"]) {
      const block = side === "left" ? frame?.lh : frame?.rh;
      const hand = block && block.some((p) => !isZero(p)) ? block : null;
      const shoulder = point(pose, POSE.shoulder[side]);
      const elbow = point(pose, POSE.elbow[side]);
      const wrist = (hand && point(hand, 0)) || point(pose, POSE.wrist[side]);

      const upperDir = direction(shoulder, elbow) || RELAXED[side].upper;
      const lowerDir = direction(elbow, wrist) || RELAXED[side].lower;
      t.set(`${side}UpperArm`, aim(`${side}UpperArm`, upperDir));
      t.set(`${side}LowerArm`, aim(`${side}LowerArm`, lowerDir));

      // Hand orientation: from the hand's own landmarks, else continuing the forearm
      let handWorld = null;
      const handB = bones[`${side}Hand`];
      if (hand && handRest[side] && handB) {
        const w = point(hand, 0);
        const mid = point(hand, 9);
        const idx = point(hand, 5);
        const pinky = point(hand, 17);
        if (w && mid && idx && pinky) {
          const now = basisQuaternion(mid.clone().sub(w), pinky.clone().sub(idx));
          if (now) handWorld = now.multiply(handRest[side].clone().invert()).multiply(handB.restQ);
        }
      }
      if (!handWorld && handB) {
        const forearm = t.get(`${side}LowerArm`);
        const forearmB = bones[`${side}LowerArm`];
        handWorld = forearm && forearmB ? forearm.clone().multiply(forearmB.restQ.clone().invert()).multiply(handB.restQ) : handB.restQ.clone();
      }
      t.set(`${side}Hand`, handWorld);

      // Fingers: tracked directions, or rigid with the hand when untracked
      const handDelta = handWorld && handB ? handWorld.clone().multiply(handB.restQ.clone().invert()) : null;
      const finger = (name, a, b) => {
        const dir = hand ? direction(point(hand, a), point(hand, b)) : null;
        const q = aim(name, dir);
        if (q) t.set(name, q);
        else if (handDelta && bones[name]) t.set(name, handDelta.clone().multiply(bones[name].restQ));
      };
      finger(`${side}ThumbMetacarpal`, 1, 2);
      finger(`${side}ThumbProximal`, 2, 3);
      finger(`${side}ThumbDistal`, 3, 4);
      for (const [name, base] of FINGERS) {
        finger(`${side}${name}Proximal`, base, base + 1);
        finger(`${side}${name}Intermediate`, base + 1, base + 2);
        finger(`${side}${name}Distal`, base + 2, base + 3);
      }
    }
    return t;
  }

  const ORDER = specs.map((s) => s.name); // parents come before children by construction

  return {
    bones: Object.keys(bones),
    /** Pose the rig for `frame` (null = relaxed). dt is seconds since the last call. */
    apply(frame, dt = 1 / 60) {
      const alpha = 1 - Math.exp(-SMOOTHING_RATE * Math.max(0, dt));
      const targets = targetsFor(frame);
      for (const name of ORDER) {
        const desired = targets.get(name);
        if (desired) setBone(name, desired, alpha);
        else setRest(name, alpha);
      }
      top.updateMatrixWorld(true);
    },
  };
}
