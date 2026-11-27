import { Matrix4, Quaternion, Vector3 } from "three";
import { isZero } from "../avatarFrames";

/**
 * Drives a VRM humanoid from pose frames { lh, rh, pose } (MediaPipe landmarks, viewer
 * orientation, x and z on the same scale as y; see avatarFrames and pose_extractor.py).
 *
 * Every bone gets a world-space target, then a local rotation under its parent. A bone is aimed
 * starting from where its parent's turn leaves it, so it never twists against its parent.
 * Arms: only x and y of the pose are trusted; depth comes from the arm's length (limbVector),
 * and the wrist is put at the same place on the body as the signer's (armToWrist).
 * Hands use a full three-axis basis so the palm faces the right way; finger joints after the
 * knuckle are hinges that curl toward the palm. No per-model calibration beyond the rig's T-pose.
 *
 * World axes: +x is the signer's left (viewer's right), +y up, +z toward the viewer, which is the
 * way a VRM 1.0 model faces. Landmark -> world: (x, -y, -z).
 */

const SMOOTHING_RATE = 28; // 1/s; higher follows the frames more tightly
const MAX_BODY_TURN = 0.5; // radians the chest may follow the shoulders
const MAX_HEAD_TURN = 0.7;
const MAX_JOINT_CURL = 1.9; // radians a finger joint may bend
const LOOSE_CURL = 0.3; // radians each joint of an untracked hand is curled
const FOREARM_TWIST_SHARE = 0.5; // how much of the wrist's turn the forearm takes
const BODY_DEPTH = 0.35; // how far the shoulders' depth values are believed
const BODY_CLEARANCE = 0.75; // shoulder widths a wrist stays in front of the chest and face
/** Arm lengths as a share of the shoulder width (joint to joint), for an average adult. */
const LIMB_RATIO = { upper: 0.95, lower: 0.8 };

const FINGERS = [
  ["Index", 5],
  ["Middle", 9],
  ["Ring", 13],
  ["Little", 17],
];

const POSE = { nose: 0, eyeLeft: 2, eyeRight: 5, earLeft: 7, earRight: 8, shoulder: { left: 11, right: 12 }, elbow: { left: 13, right: 14 }, wrist: { left: 15, right: 16 } };

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

  // Which way each palm faces relative to its hand basis (rest pose: T-pose, palms down)
  const palmSign = {};
  for (const side of ["left", "right"]) {
    if (!handRest[side]) continue;
    const z = new Vector3(0, 0, 1).applyQuaternion(handRest[side]);
    palmSign[side] = z.y <= 0 ? 1 : -1;
  }
  // The axis the fingers curl around, in the rest pose (turning about it bends toward the palm)
  const hingeRest = {};
  for (const side of ["left", "right"]) {
    if (!handRest[side]) continue;
    const forward = new Vector3(0, 1, 0).applyQuaternion(handRest[side]);
    const normal = new Vector3(0, 0, palmSign[side]).applyQuaternion(handRest[side]);
    hingeRest[side] = new Vector3().crossVectors(forward, normal).normalize();
  }

  // The signer's size in the picture, learnt as frames arrive (see limbVector)
  const body = { shoulderWidth: 0, eyeHeight: 0, upper: LIMB_RATIO.upper, lower: LIMB_RATIO.lower };

  /**
   * Direction of a limb from two picture points. Only x and y are trusted: the depth comes from
   * the limb's length (what is missing in the picture must go toward or away from the camera).
   * MediaPipe's own pose depth is far too exaggerated to aim a bone with; it only says which way.
   */
  const limbVector = (from, to, part, towardViewer) => {
    if (!from || !to) return null;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const flat = Math.hypot(dx, dy);
    if (body.shoulderWidth) {
      const seen = flat / body.shoulderWidth;
      if (seen > body[part]) body[part] = Math.min(seen, LIMB_RATIO[part] * 1.35);
    }
    const length = Math.max(body[part] * body.shoulderWidth, flat);
    const depth = Math.sqrt(Math.max(0, length * length - flat * flat));
    const d = new Vector3(dx, dy, towardViewer ? depth : -depth);
    return d.lengthSq() > 1e-10 ? d : null;
  };

  // The model's own measurements (rest pose), for putting the hands where the signer's are
  const model = (() => {
    const l = restPos("leftUpperArm");
    const r = restPos("rightUpperArm");
    if (!l || !r) return null;
    const m = { shoulder: { left: l, right: r }, mid: l.clone().add(r).multiplyScalar(0.5), width: l.distanceTo(r), upper: {}, lower: {}, eyeHeight: 0 };
    for (const side of ["left", "right"]) {
      const elbow = restPos(`${side}LowerArm`);
      const wrist = restPos(`${side}Hand`);
      if (!elbow || !wrist) return null;
      m.upper[side] = m.shoulder[side].distanceTo(elbow);
      m.lower[side] = elbow.distanceTo(wrist);
    }
    const eyeNodes = ["leftEye", "rightEye"].map((n) => getBone(n)).filter(Boolean);
    if (eyeNodes.length) m.eyeHeight = eyeNodes.reduce((sum, n) => sum + worldPosition(n).y, 0) / eyeNodes.length - m.mid.y;
    return m.width > 1e-6 ? m : null;
  })();

  /**
   * Arm directions that put the model's wrist where the signer's wrist is *on the body*: the
   * same number of shoulder widths to the side, the same share of the way from shoulders to
   * eyes. Signs are made at places (chin, chest, forehead), and a model's proportions differ
   * from the signer's, so copying arm angles alone would miss those places. Two-bone IK, with
   * the signer's elbow as the bend hint.
   */
  const armToWrist = (side, upperVec, lowerVec, shoulderMid, wrist, chestDelta) => {
    if (!model || !body.shoulderWidth || !upperVec || !lowerVec || !shoulderMid || !wrist) return null;
    const h = model.width / body.shoulderWidth;
    let v = h;
    if (model.eyeHeight > 0 && body.eyeHeight > 0) v = Math.max(0.7 * h, Math.min(1.5 * h, model.eyeHeight / body.eyeHeight));
    const up = wrist.y - shoulderMid.y;
    const target = new Vector3(
      model.mid.x + (wrist.x - shoulderMid.x) * h,
      model.mid.y + up * (up > 0 ? v : h),
      model.mid.z + (upperVec.z + lowerVec.z) * h
    );
    // Keep the wrist in front of the chest and face, never inside them
    const inFront = Math.abs(target.x - model.mid.x) < 0.7 * model.width && target.y > model.mid.y - 1.6 * model.width;
    if (inFront) target.z = Math.max(target.z, model.mid.z + BODY_CLEARANCE * model.width);

    const shoulderRest = model.shoulder[side].clone().sub(model.mid);
    const shoulder = (chestDelta ? shoulderRest.applyQuaternion(chestDelta) : shoulderRest).add(model.mid);
    const a = model.upper[side];
    const b = model.lower[side];
    const reach = target.clone().sub(shoulder);
    const c = Math.max(Math.abs(a - b) + 1e-4, Math.min(a + b - 1e-4, reach.length()));
    if (reach.lengthSq() < 1e-10) return null;
    reach.normalize();
    // Bend toward where the signer's elbow is; if that is in line with the wrist, bend down and out
    let pole = upperVec.clone().addScaledVector(reach, -upperVec.dot(reach));
    if (pole.lengthSq() < 1e-8) pole = new Vector3(side === "left" ? 0.4 : -0.4, -1, -0.2).addScaledVector(reach, -reach.y);
    pole.normalize();
    const along = (a * a + c * c - b * b) / (2 * c);
    const out = Math.sqrt(Math.max(0, a * a - along * along));
    const elbow = shoulder.clone().addScaledVector(reach, along).addScaledVector(pole, out);
    const wristAt = shoulder.clone().addScaledVector(reach, c);
    return { upper: elbow.clone().sub(shoulder).normalize(), lower: wristAt.sub(elbow).normalize() };
  };

  const deltaOf = (name, world) => world.clone().multiply(bones[name].restQ.clone().invert());

  /** Aim a bone along `dir`, starting from where its parent's turn (`parentDelta`) leaves it. */
  const aimFrom = (name, parentDelta, dir) => {
    const b = bones[name];
    if (!b || !b.restDir || !dir) return null;
    if (!parentDelta) return new Quaternion().setFromUnitVectors(b.restDir, dir).multiply(b.restQ);
    const from = b.restDir.clone().applyQuaternion(parentDelta);
    return new Quaternion().setFromUnitVectors(from, dir).multiply(parentDelta).multiply(b.restQ);
  };

  /** The part of rotation `q` that turns around `axis` (swing-twist split). */
  const twistAround = (q, axis) => {
    const dot = q.x * axis.x + q.y * axis.y + q.z * axis.z;
    const t = new Quaternion(axis.x * dot, axis.y * dot, axis.z * dot, q.w);
    if (t.lengthSq() < 1e-10) return new Quaternion();
    return t.normalize();
  };

  const angleBetween = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dot(b))));

  function targetsFor(frame) {
    const t = new Map();
    const pose = frame?.pose;

    // Body: chest follows the shoulder line, head follows the ears and nose
    const ls = point(pose, POSE.shoulder.left);
    const rs = point(pose, POSE.shoulder.right);
    if (ls && rs) {
      const width = Math.hypot(ls.x - rs.x, ls.y - rs.y);
      // Quick to grow, slow to shrink: a turned body shows narrower shoulders than it has
      body.shoulderWidth = width > body.shoulderWidth ? width : body.shoulderWidth * 0.98 + width * 0.02;
    }
    const axis = ls && rs ? direction(new Vector3(rs.x, rs.y, rs.z * BODY_DEPTH), new Vector3(ls.x, ls.y, ls.z * BODY_DEPTH)) : null;
    if (axis && shoulderAxisRest && bones.chest) {
      const q = new Quaternion().setFromUnitVectors(shoulderAxisRest, axis);
      t.set("chest", limited(q, MAX_BODY_TURN).multiply(bones.chest.restQ));
    }
    const chestDelta = t.get("chest") ? deltaOf("chest", t.get("chest")) : null;
    const shoulderMid = ls && rs ? ls.clone().add(rs).multiplyScalar(0.5) : null;
    const eyeL = point(pose, POSE.eyeLeft);
    const eyeR = point(pose, POSE.eyeRight);
    if (shoulderMid && eyeL && eyeR) {
      const height = (eyeL.y + eyeR.y) / 2 - shoulderMid.y;
      if (height > 0) body.eyeHeight = body.eyeHeight ? body.eyeHeight * 0.9 + height * 0.1 : height;
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
      const poseWrist = point(pose, POSE.wrist[side]);
      const wrist = (hand && point(hand, 0)) || poseWrist;

      // Arms. Elbows may be behind the shoulders; hands are in front unless clearly not.
      const elbowForward = shoulder && elbow ? elbow.z - shoulder.z >= 0 : true;
      const wristForward = elbow && poseWrist ? poseWrist.z - elbow.z > -0.25 * body.shoulderWidth : true;
      // An arm that leaves the picture with no hand found is a guess by the tracker: let it hang
      const guessed = !hand && [elbow, poseWrist].some((p) => p && -p.y > 1);
      const upperVec = guessed ? null : limbVector(shoulder, elbow, "upper", elbowForward);
      const lowerVec = guessed ? null : limbVector(elbow, wrist, "lower", wristForward);
      const placed = armToWrist(side, upperVec, lowerVec, shoulderMid, wrist, chestDelta);
      const upperDir = placed?.upper || upperVec?.clone().normalize() || RELAXED[side].upper;
      const lowerDir = placed?.lower || lowerVec?.clone().normalize() || RELAXED[side].lower;
      const upperWorld = aimFrom(`${side}UpperArm`, null, upperDir);
      const upperDelta = upperWorld ? deltaOf(`${side}UpperArm`, upperWorld) : null;
      let lowerWorld = aimFrom(`${side}LowerArm`, upperDelta, lowerDir);
      t.set(`${side}UpperArm`, upperWorld);

      // Hand orientation: from the hand's own landmarks, else continuing the forearm
      let handWorld = null;
      let palm = null; // { forward, normal } in world, when the hand is tracked
      const handB = bones[`${side}Hand`];
      if (hand && handRest[side] && handB) {
        const w = point(hand, 0);
        const mid = point(hand, 9);
        const idx = point(hand, 5);
        const pinky = point(hand, 17);
        if (w && mid && idx && pinky) {
          const now = basisQuaternion(mid.clone().sub(w), pinky.clone().sub(idx));
          if (now) {
            palm = {
              forward: new Vector3(0, 1, 0).applyQuaternion(now),
              normal: new Vector3(0, 0, palmSign[side] || 1).applyQuaternion(now),
            };
            handWorld = now.multiply(handRest[side].clone().invert()).multiply(handB.restQ);
          }
        }
      }
      if (lowerWorld && handWorld && handB) {
        // Share the wrist's turn with the forearm, as a real forearm does (no wrung-out wrist)
        const lowerDelta = deltaOf(`${side}LowerArm`, lowerWorld);
        const extra = deltaOf(`${side}Hand`, handWorld).multiply(lowerDelta.clone().invert());
        const twist = twistAround(extra, lowerDir);
        if (twist.w < 0) twist.set(-twist.x, -twist.y, -twist.z, -twist.w);
        const half = new Quaternion().slerp(twist, FOREARM_TWIST_SHARE);
        lowerWorld = half.multiply(lowerWorld);
      }
      t.set(`${side}LowerArm`, lowerWorld);
      if (!handWorld && handB) {
        handWorld = lowerWorld ? deltaOf(`${side}LowerArm`, lowerWorld).multiply(handB.restQ) : handB.restQ.clone();
      }
      t.set(`${side}Hand`, handWorld);

      // Fingers. Each bone starts from its parent's turn, so nothing twists against the hand.
      const handDelta = handWorld && handB ? deltaOf(`${side}Hand`, handWorld) : null;
      const segment = (a, b) => (hand ? direction(point(hand, a), point(hand, b)) : null);
      const place = (name, parentDelta, dir) => {
        if (!bones[name]) return parentDelta;
        const world = aimFrom(name, parentDelta, dir) || (parentDelta ? parentDelta.clone().multiply(bones[name].restQ) : null);
        if (!world) return parentDelta;
        t.set(name, world);
        return deltaOf(name, world);
      };
      // Thumb: three free segments
      let chain = handDelta;
      chain = place(`${side}ThumbMetacarpal`, chain, segment(1, 2));
      chain = place(`${side}ThumbProximal`, chain, segment(2, 3));
      place(`${side}ThumbDistal`, chain, segment(3, 4));
      // Other fingers: the knuckle is aimed; the two joints after it are hinges that can only
      // curl toward the palm, by the angle the landmarks show. That keeps a noisy depth value
      // from bending a finger sideways or backwards.
      const hinge = palm ? new Vector3().crossVectors(palm.forward, palm.normal).normalize() : null;
      const looseHinge = !hand && handDelta && hingeRest[side] ? hingeRest[side].clone().applyQuaternion(handDelta) : null;
      for (const [name, base] of FINGERS) {
        let s1 = segment(base, base + 1);
        const s2 = segment(base + 1, base + 2);
        const s3 = segment(base + 2, base + 3);
        let d2 = s2;
        let d3 = s3;
        const knuckle = bones[`${side}${name}Proximal`];
        if (looseHinge && knuckle?.restDir) {
          // No hand found: a loose, slightly curled hand instead of a stiff flat one
          s1 = knuckle.restDir.clone().applyQuaternion(handDelta).applyAxisAngle(looseHinge, LOOSE_CURL);
          d2 = s1.clone().applyAxisAngle(looseHinge, LOOSE_CURL);
          d3 = d2.clone().applyAxisAngle(looseHinge, LOOSE_CURL);
        }
        chain = place(`${side}${name}Proximal`, handDelta, s1);
        if (hinge && s1 && s2) {
          d2 = s1.clone().applyAxisAngle(hinge, Math.min(MAX_JOINT_CURL, angleBetween(s1, s2)));
          d3 = s3 ? d2.clone().applyAxisAngle(hinge, Math.min(MAX_JOINT_CURL, angleBetween(s2, s3))) : null;
        }
        chain = place(`${side}${name}Intermediate`, chain, d2);
        place(`${side}${name}Distal`, chain, d3);
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
