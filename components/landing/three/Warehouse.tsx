"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "./scrollState";

/* Palette — clay/matte materials, warm neutrals + lime + near-black frames. */
const COL = {
  floor: "#efe9db",
  wall: "#f7f3ea",
  frame: "#14110d",
  boxes: ["#caa878", "#b8946a", "#a67c52", "#d8bd94"],
  desk: "#2a2320",
  lime: "#d1f53b",
};

const clayMat = (color: string) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });

/** A single shelving rack: black frame uprights + shelves, with a few boxes. */
function Rack({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const frame = useMemo(() => clayMat(COL.frame), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* uprights */}
      {[-2.4, 2.4].map((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 3, z]} material={frame} castShadow>
            <boxGeometry args={[0.14, 6, 0.14]} />
          </mesh>
        )),
      )}
      {/* shelves */}
      {[1.2, 3.2, 5.2].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={frame} receiveShadow>
          <boxGeometry args={[5, 0.1, 1.4]} />
        </mesh>
      ))}
      {/* boxes on shelves */}
      {[1.55, 3.55].map((y, r) =>
        [-1.5, 0, 1.5].map((x, c) => (
          <mesh key={`${y}-${x}`} position={[x, y, 0]} material={clayMat(COL.boxes[(r + c) % COL.boxes.length])} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.7, 1]} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** The overflowing central pile — instanced boxes that empty out on `cleared`. */
function BoxPile() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 96;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Deterministic pile layout via a pure hash of the instance index (no mutable
  // state, so it's stable across mounts and satisfies the compiler lint).
  const boxes = useMemo(() => {
    const h = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: COUNT }, (_, i) => {
      const layer = Math.floor(h(i * 4) * 5);
      const spread = 9 - layer * 1.4;
      const x = (h(i * 4 + 1) - 0.5) * spread + 1.5;
      const z = (h(i * 4 + 2) - 0.5) * spread * 0.7 - 2;
      const s = 0.9 + h(i * 4 + 3) * 0.7;
      const y = s / 2 + layer * 0.95 + h(i * 4 + 5) * 0.15;
      return { x, y, z, s, ry: (h(i * 4 + 6) - 0.5) * 0.8, removable: layer > 0 || h(i * 4 + 7) > 0.4 };
    });
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const c = new THREE.Color();
    boxes.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(0, b.ry, 0);
      dummy.scale.setScalar(b.s);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      c.set(COL.boxes[i % COL.boxes.length]);
      ref.current!.setColorAt(i, c);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [boxes, dummy]);

  useFrame(() => {
    if (!ref.current) return;
    const cleared = scrollState.cleared;
    if (cleared < 0.001) return;
    boxes.forEach((b, i) => {
      const t = b.removable ? cleared : 0;
      const rise = t * (6 + b.x * 0.4);
      const s = b.s * (1 - t);
      dummy.position.set(b.x + t * b.x * 0.6, b.y + rise, b.z - t * 4);
      dummy.rotation.set(t * b.ry * 3, b.ry + t * 2, t * 0.6);
      dummy.scale.setScalar(Math.max(0.0001, s));
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined as never, undefined as never, COUNT]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.92} metalness={0} />
    </instancedMesh>
  );
}

/** The single taped hero box that uproots and flies to the buyer in Scene 9. */
function HeroBox() {
  const ref = useRef<THREE.Group>(null);
  const start = useMemo(() => new THREE.Vector3(-1.5, 1.2, 1.5), []);

  useFrame(() => {
    if (!ref.current) return;
    const f = scrollState.boxFlight;
    // Arc: rise up and fly to +x, out toward the buyer side.
    const x = start.x + f * 26;
    const y = start.y + Math.sin(f * Math.PI) * 9 + f * 2;
    const z = start.z + f * 6;
    ref.current.position.set(x, y, z);
    ref.current.rotation.set(f * 2.2, f * 3, f * 1.1);
    const s = 1 - Math.max(0, f - 0.85) * 6.6; // shrink as it leaves
    ref.current.scale.setScalar(Math.max(0.0001, s));
    ref.current.visible = f > 0.001 && s > 0.01;
  });

  return (
    <group ref={ref} position={start.toArray()} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[1.7, 1.4, 1.7]} />
        <meshStandardMaterial color="#d8bd94" roughness={0.85} metalness={0} />
      </mesh>
      {/* tape line */}
      <mesh position={[0, 0.71, 0]}>
        <boxGeometry args={[1.72, 0.02, 0.28]} />
        <meshStandardMaterial color="#c2a373" roughness={0.8} />
      </mesh>
      {/* lime glow chip */}
      <mesh position={[0, 0, 0.87]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial color={COL.lime} emissive={COL.lime} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Supplier workstation — desk + laptop whose screen glows lime (Scene 3). */
function Workstation() {
  const screen = useRef<THREE.MeshStandardMaterial>(null);
  const glowLight = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const g = scrollState.glow;
    if (screen.current) screen.current.emissiveIntensity = 0.4 + g * 2.4;
    if (glowLight.current) glowLight.current.intensity = g * 6;
  });
  return (
    <group position={[15, 0, 5]} rotation={[0, -0.5, 0]}>
      {/* desk top + legs */}
      <mesh position={[0, 2, 0]} material={clayMat("#efe6d4")} castShadow receiveShadow>
        <boxGeometry args={[4.5, 0.18, 2.4]} />
      </mesh>
      {[-2, 2].map((x) => (
        <mesh key={x} position={[x, 1, 0]} material={clayMat(COL.desk)}>
          <boxGeometry args={[0.16, 2, 2.2]} />
        </mesh>
      ))}
      {/* laptop base */}
      <mesh position={[0, 2.2, 0.2]} rotation={[0, 0, 0]} material={clayMat("#3a3a3c")} castShadow>
        <boxGeometry args={[1.6, 0.08, 1.1]} />
      </mesh>
      {/* laptop screen */}
      <mesh position={[0, 2.75, -0.32]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[1.6, 1.05, 0.06]} />
        <meshStandardMaterial color="#222" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.78, -0.28]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[1.42, 0.9]} />
        <meshStandardMaterial ref={screen} color={COL.lime} emissive={COL.lime} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      <pointLight ref={glowLight} position={[0, 3, 1]} color={COL.lime} intensity={0} distance={12} />
    </group>
  );
}

export function Warehouse() {
  const floorMat = useMemo(() => clayMat(COL.floor), []);
  const wallMat = useMemo(() => clayMat(COL.wall), []);
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMat} receiveShadow>
        <planeGeometry args={[60, 46]} />
      </mesh>
      {/* back + side walls forming an L, matching the isometric plate */}
      <mesh position={[0, 8, -16]} material={wallMat} receiveShadow>
        <boxGeometry args={[60, 16, 0.4]} />
      </mesh>
      <mesh position={[-22, 8, 0]} material={wallMat} receiveShadow>
        <boxGeometry args={[0.4, 16, 46]} />
      </mesh>

      {/* racks along the back and right */}
      <Rack position={[-12, 0, -13]} />
      <Rack position={[-4, 0, -13]} />
      <Rack position={[6, 0, -13]} />
      <Rack position={[16, 0, -13]} />
      <Rack position={[20, 0, -2]} rotation={Math.PI / 2} />
      <Rack position={[20, 0, 8]} rotation={Math.PI / 2} />

      <BoxPile />
      <HeroBox />
      <Workstation />
    </group>
  );
}
