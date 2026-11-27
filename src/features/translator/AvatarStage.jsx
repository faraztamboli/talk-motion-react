import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import { HAND_CONNECTIONS, POSE_CONNECTIONS } from "../../utils/landmarkConnections";
import { isZero, present } from "./avatarFrames";

// Loaded with React.lazy: three.js is only downloaded when someone switches to the avatar.

const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const SHOULDERS_WIDE = 0.8; // scene units the shoulders are drawn across
const SHOULDERS_AT = 0.2; // scene height of the shoulder line
const HEAD_SIZE = 0.3; // head radius, in shoulder widths
const DEFAULT_FIT = { cx: 0.5, cy: 0.5, k: 2.2 };

/**
 * How to place a frame in the scene so the signer always fills it the same way: shoulders centred
 * and a fixed width, whatever the camera distance was. Follows the body smoothly (`previous`).
 */
export function fitFrame(pose, previous) {
  const l = pose?.[LEFT_SHOULDER];
  const r = pose?.[RIGHT_SHOULDER];
  if (isZero(l) || isZero(r)) return previous || DEFAULT_FIT;
  const width = Math.hypot(l[0] - r[0], l[1] - r[1]);
  if (width < 0.02) return previous || DEFAULT_FIT;
  const now = { cx: (l[0] + r[0]) / 2, cy: (l[1] + r[1]) / 2, k: SHOULDERS_WIDE / width, shoulders: true };
  if (!previous?.shoulders) return now;
  const mix = (a, b, w) => a + (b - a) * w;
  return { cx: mix(previous.cx, now.cx, 0.2), cy: mix(previous.cy, now.cy, 0.2), k: mix(previous.k, now.k, 0.1), shoulders: true };
}

/** Scene position of a landmark. Body depth is left out: MediaPipe's is too wild to draw. */
export function toScene(p, fit, depth = 0) {
  const up = fit.shoulders ? SHOULDERS_AT : 0;
  return new THREE.Vector3((p[0] - fit.cx) * fit.k, -(p[1] - fit.cy) * fit.k + up, -p[2] * fit.k * depth);
}

/**
 * Signing avatar: a 3D skeleton driven directly by pose frames (viewer orientation, see
 * avatarFrames.toViewer). Everything it creates on the GPU is released on unmount.
 */
export default function AvatarStage({ frame }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (err) {
      console.warn("WebGL is unavailable; the avatar can't be shown", err);
      setWebglFailed(true);
      return undefined;
    }
    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 360;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14161a);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 2.6);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1, 1, 2);
    scene.add(keyLight);

    const joints = (count, color, radius) => {
      const material = new THREE.MeshStandardMaterial({ color });
      const geometry = new THREE.SphereGeometry(radius, 12, 12);
      return Array.from({ length: count }, () => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        scene.add(mesh);
        return mesh;
      });
    };
    const bones = (connections, color) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(connections.length * 6), 3));
      const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color }));
      lines.visible = false;
      scene.add(lines);
      return lines;
    };
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), new THREE.MeshStandardMaterial({ color: 0x8899aa }));
    head.visible = false;
    scene.add(head);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      head,
      leftJoints: joints(21, 0xff8a00, 0.016),
      rightJoints: joints(21, 0x00d9e7, 0.016),
      poseJoints: joints(33, 0x8899aa, 0.02),
      leftBones: bones(HAND_CONNECTIONS, 0xff8a00),
      rightBones: bones(HAND_CONNECTIONS, 0x00d9e7),
      poseBones: bones(POSE_CONNECTIONS, 0x556070),
    };
    renderer.render(scene, camera);

    const resize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(mount);

    return () => {
      observer?.disconnect();
      // Release every geometry and material (shared ones once), then the context itself.
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((obj) => {
        if (obj.geometry) geometries.add(obj.geometry);
        if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => materials.add(m));
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const o = sceneRef.current;
    if (!o) return;
    const fit = frame ? fitFrame(frame.pose, o.fit) : null;
    o.fit = fit;
    const setJoints = (meshes, points, visible, depth) => {
      meshes.forEach((mesh, i) => {
        mesh.visible = Boolean(visible && points?.[i] && !isZero(points[i]));
        if (mesh.visible) mesh.position.copy(toScene(points[i], fit, depth));
      });
    };
    const setBones = (lines, connections, points, visible, depth) => {
      lines.visible = visible;
      if (!visible) return;
      const attr = lines.geometry.getAttribute("position");
      connections.forEach(([a, b], k) => {
        // A bone with an untracked end is drawn with no length
        const ends = isZero(points[a]) || isZero(points[b]) ? [points[a] || points[b] || [0, 0, 0]] : [points[a], points[b]];
        const pa = toScene(ends[0], fit, depth);
        const pb = toScene(ends[ends.length - 1], fit, depth);
        attr.setXYZ(k * 2, pa.x, pa.y, pa.z);
        attr.setXYZ(k * 2 + 1, pb.x, pb.y, pb.z);
      });
      attr.needsUpdate = true;
    };
    const lh = present(frame?.lh);
    const rh = present(frame?.rh);
    const pose = present(frame?.pose);
    setJoints(o.leftJoints, frame?.lh, lh, 1);
    setJoints(o.rightJoints, frame?.rh, rh, 1);
    setJoints(o.poseJoints, frame?.pose, pose, 0);
    setBones(o.leftBones, HAND_CONNECTIONS, frame?.lh, lh, 1);
    setBones(o.rightBones, HAND_CONNECTIONS, frame?.rh, rh, 1);
    setBones(o.poseBones, POSE_CONNECTIONS, frame?.pose, pose, 0);
    o.head.visible = Boolean(pose && !isZero(frame.pose[NOSE]));
    if (o.head.visible) {
      o.head.position.copy(toScene(frame.pose[NOSE], fit, 0));
      o.head.position.z = -0.3; // behind the hands, so a hand at the face stays visible
      o.head.scale.setScalar(fit.shoulders ? (HEAD_SIZE * SHOULDERS_WIDE) / 0.14 : 1);
    }
    o.renderer.render(o.scene, o.camera);
  }, [frame]);

  if (webglFailed) {
    return (
      <div className="tm-tr-stage-placeholder" role="status">
        This browser can&apos;t draw the 3D avatar. Switch to Video to see the signs.
      </div>
    );
  }
  return <div ref={mountRef} className="tm-tr-avatar-canvas" aria-hidden="true" />;
}

AvatarStage.propTypes = {
  frame: PropTypes.object,
};
