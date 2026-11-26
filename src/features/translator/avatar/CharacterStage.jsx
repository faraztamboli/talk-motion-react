import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AmbientLight, Clock, Color, DirectionalLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { createRigDriver } from "./vrmRig";
import { MODELS, applyLook } from "./characters";

// Loaded with React.lazy: three.js and the VRM loader are only downloaded for the avatar.

const STALE_MS = 800; // no new frame for this long: the character relaxes
const BLINK_EVERY = [2.5, 5.5]; // seconds

/**
 * A skinned character (VRM) signing from pose frames. `character` is an entry of CHARACTERS and
 * `look` its colours. Everything created on the GPU is released on unmount or when the model changes.
 */
export default function CharacterStage({ frame, character, look, onStatus }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ frame: null, frameAt: 0, vrm: null, rig: null });
  const [status, setStatus] = useState("loading"); // loading | ready | error | nowebgl
  const [renderer, setRenderer] = useState(null);
  const stageRef = useRef(null);

  const report = (s) => {
    setStatus(s);
    onStatus?.(s);
  };
  const reportRef = useRef(report);
  reportRef.current = report;

  // New frame from the queue
  stateRef.current.frame = frame;
  if (frame) stateRef.current.frameAt = performance.now();

  // Scene, camera and the render loop: once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let gl;
    try {
      gl = new WebGLRenderer({ antialias: true });
    } catch (err) {
      console.warn("WebGL is unavailable; the character can't be shown", err);
      reportRef.current("nowebgl");
      return undefined;
    }
    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 360;
    const scene = new Scene();
    scene.background = new Color(0x1d2230);
    const camera = new PerspectiveCamera(28, width / height, 0.1, 20);
    camera.position.set(0, 1.25, 2.1);
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    gl.setSize(width, height);
    mount.appendChild(gl.domElement);
    scene.add(new AmbientLight(0xffffff, 0.9));
    const key = new DirectionalLight(0xffffff, 1.6);
    key.position.set(0.8, 1.6, 2);
    scene.add(key);
    const fill = new DirectionalLight(0xaac4ff, 0.5);
    fill.position.set(-1.2, 0.8, 1);
    scene.add(fill);
    stageRef.current = { scene, camera, gl };
    setRenderer(gl);

    const clock = new Clock();
    let raf = 0;
    let blinkIn = 2;
    let blinkT = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.1);
      const s = stateRef.current;
      if (s.vrm) {
        const live = s.frame && performance.now() - s.frameAt < STALE_MS ? s.frame : null;
        s.rig?.apply(live, dt);
        const expr = s.vrm.expressionManager;
        if (expr) {
          blinkIn -= dt;
          if (blinkIn <= 0 && blinkT < 0) blinkT = 0;
          if (blinkT >= 0) {
            blinkT += dt;
            expr.setValue("blink", Math.max(0, Math.sin((blinkT / 0.18) * Math.PI)));
            if (blinkT > 0.18) {
              blinkT = -1;
              expr.setValue("blink", 0);
              blinkIn = BLINK_EVERY[0] + Math.random() * (BLINK_EVERY[1] - BLINK_EVERY[0]);
            }
          }
        }
        s.vrm.update(dt);
      }
      gl.render(scene, camera);
    };
    loop();

    const resize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      gl.setSize(w, h);
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      const s = stateRef.current;
      if (s.vrm) {
        scene.remove(s.vrm.scene);
        VRMUtils.deepDispose(s.vrm.scene);
        s.vrm = null;
        s.rig = null;
      }
      gl.dispose();
      gl.forceContextLoss?.();
      if (gl.domElement.parentNode === mount) mount.removeChild(gl.domElement);
      stageRef.current = null;
      setRenderer(null);
    };
  }, []);

  // The model: load when the character's model changes
  const modelKey = character?.model;
  useEffect(() => {
    const model = MODELS[modelKey];
    if (!renderer || !model) return undefined;
    let cancelled = false;
    reportRef.current("loading");
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load(
      model.url,
      (gltf) => {
        const stage = stageRef.current;
        const vrm = gltf.userData.vrm;
        if (cancelled || !stage || !vrm) {
          if (vrm) VRMUtils.deepDispose(vrm.scene);
          return;
        }
        VRMUtils.rotateVRM0?.(vrm);
        vrm.scene.traverse((o) => {
          o.frustumCulled = false;
        });
        stage.scene.add(vrm.scene);
        const s = stateRef.current;
        if (s.vrm) {
          stage.scene.remove(s.vrm.scene);
          VRMUtils.deepDispose(s.vrm.scene);
        }
        s.vrm = vrm;
        s.rig = createRigDriver((name) => vrm.humanoid.getNormalizedBoneNode(name));
        s.rig.apply(null, 10); // start relaxed, not in a T-pose
        vrm.expressionManager?.setValue("happy", 0.15);
        // Frame the upper body: head to waist, hands in front
        const head = vrm.humanoid.getNormalizedBoneNode("head");
        const headY = head ? head.getWorldPosition(new Vector3()).y : 1.45;
        stage.camera.position.set(0, headY - 0.05, 2.35);
        stage.camera.lookAt(0, headY - 0.32, 0);
        applyLook(vrm.scene, character, look);
        reportRef.current("ready");
      },
      undefined,
      (err) => {
        if (cancelled) return;
        console.warn("Couldn't load the avatar character", err);
        reportRef.current("error");
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, modelKey]);

  // Colours: any time the look changes
  useEffect(() => {
    const vrm = stateRef.current.vrm;
    if (vrm && status === "ready") applyLook(vrm.scene, character, look);
  }, [character, look, status]);

  return (
    <div className="tm-tr-character">
      <div ref={mountRef} className="tm-tr-avatar-canvas" aria-hidden="true" />
      {status === "loading" && (
        <div className="tm-tr-stage-placeholder tm-tr-stage-placeholder-soft" role="status">
          Loading the character…
        </div>
      )}
      {status === "error" && (
        <div className="tm-tr-stage-placeholder" role="status">
          This character couldn&apos;t be loaded. Choose another one, or the skeleton.
        </div>
      )}
      {status === "nowebgl" && (
        <div className="tm-tr-stage-placeholder" role="status">
          This browser can&apos;t draw 3D. Switch to Video to see the signs.
        </div>
      )}
    </div>
  );
}

CharacterStage.propTypes = {
  frame: PropTypes.object,
  character: PropTypes.object.isRequired,
  look: PropTypes.object,
  onStatus: PropTypes.func,
};
