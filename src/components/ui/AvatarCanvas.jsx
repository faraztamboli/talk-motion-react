import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { HAND_CONNECTIONS, POSE_CONNECTIONS } from "../../utils/landmarkConnections";

// MediaPipe normalized coords -> scene coords: center, flip y, scale.
function toScene(p) {
  return new THREE.Vector3((p[0] - 0.5) * 2.2, -(p[1] - 0.5) * 2.2, -p[2] * 1.5);
}

const NOSE = 0;

/**
 * Signing avatar v1: a smooth 3D skeleton figure rendered with Three.js and
 * driven directly by recorded landmark frames (useAvatarPlayback). Joints are
 * spheres, bones are line segments, the head is a sphere at the nose point.
 * Deliberately not a rigged human mesh — pose data drives geometry directly,
 * so whatever was recorded is exactly what plays back.
 */
export const AvatarCanvas = ({ frame, height = 360 }) => {
  const mountRef = useRef(null);
  const sceneObjectsRef = useRef(null);

  // Build the scene once.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const width = mount.clientWidth || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14161a);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(1, 1, 2);
    scene.add(key);

    const makeJoints = (count, color, radius) => {
      const material = new THREE.MeshStandardMaterial({ color });
      const geometry = new THREE.SphereGeometry(radius, 12, 12);
      const meshes = [];
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        scene.add(mesh);
        meshes.push(mesh);
      }
      return meshes;
    };

    const makeBones = (connections, color) => {
      const positions = new Float32Array(connections.length * 2 * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color, linewidth: 2 })
      );
      lines.visible = false;
      scene.add(lines);
      return lines;
    };

    const objects = {
      scene,
      camera,
      renderer,
      leftJoints: makeJoints(21, 0xff8a00, 0.016),
      rightJoints: makeJoints(21, 0x00d9e7, 0.016),
      poseJoints: makeJoints(33, 0x8899aa, 0.02),
      leftBones: makeBones(HAND_CONNECTIONS, 0xff8a00),
      rightBones: makeBones(HAND_CONNECTIONS, 0x00d9e7),
      poseBones: makeBones(POSE_CONNECTIONS, 0x556070),
      head: new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0x8899aa })
      ),
    };
    objects.head.visible = false;
    scene.add(objects.head);

    renderer.render(scene, camera);
    sceneObjectsRef.current = objects;

    const onResize = () => {
      const w = mount.clientWidth || width;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
      renderer.render(scene, camera);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      sceneObjectsRef.current = null;
    };
  }, [height]);

  // Update geometry when the frame changes.
  useEffect(() => {
    const objects = sceneObjectsRef.current;
    if (!objects) return;

    const present = (points) =>
      points && points.some((p) => p[0] !== 0 || p[1] !== 0 || p[2] !== 0);

    const updateJoints = (meshes, points, visible) => {
      for (let i = 0; i < meshes.length; i++) {
        meshes[i].visible = visible;
        if (visible && points[i]) {
          meshes[i].position.copy(toScene(points[i]));
        }
      }
    };

    const updateBones = (lines, connections, points, visible) => {
      lines.visible = visible;
      if (!visible) return;
      const attr = lines.geometry.getAttribute("position");
      connections.forEach(([a, b], k) => {
        const pa = toScene(points[a]);
        const pb = toScene(points[b]);
        attr.setXYZ(k * 2, pa.x, pa.y, pa.z);
        attr.setXYZ(k * 2 + 1, pb.x, pb.y, pb.z);
      });
      attr.needsUpdate = true;
    };

    if (frame) {
      const leftVisible = present(frame.lh);
      const rightVisible = present(frame.rh);
      const poseVisible = present(frame.pose);
      updateJoints(objects.leftJoints, frame.lh, leftVisible);
      updateJoints(objects.rightJoints, frame.rh, rightVisible);
      updateJoints(objects.poseJoints, frame.pose, poseVisible);
      updateBones(objects.leftBones, HAND_CONNECTIONS, frame.lh, leftVisible);
      updateBones(objects.rightBones, HAND_CONNECTIONS, frame.rh, rightVisible);
      updateBones(objects.poseBones, POSE_CONNECTIONS, frame.pose, poseVisible);
      objects.head.visible = poseVisible;
      if (poseVisible && frame.pose[NOSE]) {
        objects.head.position.copy(toScene(frame.pose[NOSE]));
      }
    } else {
      [...objects.leftJoints, ...objects.rightJoints, ...objects.poseJoints].forEach(
        (m) => (m.visible = false)
      );
      objects.leftBones.visible = false;
      objects.rightBones.visible = false;
      objects.poseBones.visible = false;
      objects.head.visible = false;
    }
    objects.renderer.render(objects.scene, objects.camera);
  }, [frame]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: `${height}px`,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        backgroundColor: "#14161a",
      }}
      role="img"
      aria-label="3D signing avatar"
    />
  );
};

export default AvatarCanvas;
