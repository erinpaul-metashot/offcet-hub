"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Rig } from "./Rig";
import { Warehouse } from "./Warehouse";
import { scrollState } from "./scrollState";

/**
 * Persistent full-screen 3D canvas behind the DOM, live for Scenes 2–10.
 * A rAF loop damps the wrapper opacity toward scrollState.visible so the world
 * fades in after the hero and out under the footer.
 */
export function LandingCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const opacity = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      opacity.current = THREE.MathUtils.damp(opacity.current, scrollState.visible, 4, dt);
      if (wrap.current) wrap.current.style.opacity = opacity.current.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0, background: "var(--sand)" }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [-9, 15, 30], fov: 42, near: 0.1, far: 200 }}
        onCreated={({ scene, gl }) => {
          scene.fog = new THREE.Fog("#efe9db", 34, 92);
          gl.setClearColor("#efe9db", 0);
        }}
      >
        <Suspense fallback={null}>
          <Rig />
          <Warehouse />
        </Suspense>
      </Canvas>
    </div>
  );
}
