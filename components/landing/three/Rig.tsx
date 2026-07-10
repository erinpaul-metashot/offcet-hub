"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "./scrollState";

/**
 * Camera rig + soft clay lighting. Every frame it critically-damps the camera
 * position and lookAt toward the targets written by ScrollTrigger, plus a small
 * pointer parallax for life. Nothing here re-renders React — it's all refs and
 * the frame-loop camera, never a render-scope variable.
 */
export function Rig() {
  const look = useRef(new THREE.Vector3(scrollState.lookX, scrollState.lookY, scrollState.lookZ));

  useFrame((state, delta) => {
    const cam = state.camera;
    const d = Math.min(delta, 0.05);
    const px = state.pointer.x * 0.6;
    const py = state.pointer.y * 0.4;

    cam.position.x = THREE.MathUtils.damp(cam.position.x, scrollState.camX + px, 3, d);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, scrollState.camY + py, 3, d);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, scrollState.camZ, 3, d);

    look.current.x = THREE.MathUtils.damp(look.current.x, scrollState.lookX, 3, d);
    look.current.y = THREE.MathUtils.damp(look.current.y, scrollState.lookY, 3, d);
    look.current.z = THREE.MathUtils.damp(look.current.z, scrollState.lookZ, 3, d);
    cam.lookAt(look.current);
  });

  return (
    <>
      {/* soft, high ambient for the matte clay look */}
      <ambientLight intensity={0.85} color="#fff6e6" />
      <hemisphereLight args={["#fbf6ea", "#d8c7ad", 0.7]} />
      {/* warm key light with soft shadows */}
      <directionalLight
        position={[18, 26, 16]}
        intensity={2.1}
        color="#fff2d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
      />
      {/* cool fill from the open side */}
      <directionalLight position={[-16, 12, 18]} intensity={0.5} color="#e8eef7" />
      {/* lime rim accent */}
      <pointLight position={[-6, 6, -8]} intensity={0.6} color="#d1f53b" distance={40} />
    </>
  );
}
