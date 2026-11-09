import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import { HAND_CONNECTIONS, POSE_CONNECTIONS } from "../../utils/landmarkConnections";
import { present } from "./avatarFrames";

// Loaded with React.lazy: three.js is only downloaded when someone switches to the avatar.

const toScene = (p) => new THREE.Vector3((p[0] - 0.5) * 2.2, -(p[1] - 0.5) * 2.2, -p[2] * 1.5);
const NOSE = 0;

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
    const setJoints = (meshes, points, visible) => {
      meshes.forEach((mesh, i) => {
        mesh.visible = Boolean(visible && points?.[i]);
        if (mesh.visible) mesh.position.copy(toScene(points[i]));
      });
    };
    const setBones = (lines, connections, points, visible) => {
      lines.visible = visible;
      if (!visible) return;
      const attr = lines.geometry.getAttribute("position");
      connections.forEach(([a, b], k) => {
        const pa = toScene(points[a] || [0, 0, 0]);
        const pb = toScene(points[b] || [0, 0, 0]);
        attr.setXYZ(k * 2, pa.x, pa.y, pa.z);
        attr.setXYZ(k * 2 + 1, pb.x, pb.y, pb.z);
      });
      attr.needsUpdate = true;
    };
    const lh = present(frame?.lh);
    const rh = present(frame?.rh);
    const pose = present(frame?.pose);
    setJoints(o.leftJoints, frame?.lh, lh);
    setJoints(o.rightJoints, frame?.rh, rh);
    setJoints(o.poseJoints, frame?.pose, pose);
    setBones(o.leftBones, HAND_CONNECTIONS, frame?.lh, lh);
    setBones(o.rightBones, HAND_CONNECTIONS, frame?.rh, rh);
    setBones(o.poseBones, POSE_CONNECTIONS, frame?.pose, pose);
    o.head.visible = Boolean(pose && frame.pose[NOSE]);
    if (o.head.visible) o.head.position.copy(toScene(frame.pose[NOSE]));
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
