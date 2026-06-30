/**
 * Scene 6 - Smart Matching Visualization
 * Deterministic R3F/ThreeCanvas node field with frame-driven beams.
 */

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { COLORS, FONT, networkNodeStyle } from "../utils/styles";
import {
  CinematicBackdrop,
  LightSweep,
  ScanBand,
  SectionKicker,
  frameProgress,
  softFloat,
} from "../components/Premium";
import {
  AGENT,
  BUYER_1,
  BUYER_2,
  DEMO_LOT,
  NON_MATCH_USERS,
} from "../../components/demo/core/mock-data";

const MATCHED_USERS = [
  { name: BUYER_1.name, biz: BUYER_1.business, role: "Buyer", cats: BUYER_1.categories, match: true },
  { name: BUYER_2.name, biz: BUYER_2.business, role: "Buyer", cats: BUYER_2.categories, match: true },
  { name: AGENT.name, biz: AGENT.business, role: "Agent", cats: AGENT.categories, match: true },
];

const DIMMED_USERS = NON_MATCH_USERS.slice(0, 4).map((u) => ({
  name: u.name,
  biz: u.business,
  role: u.role,
  cats: u.categories,
  match: false,
}));

const matched3D = [
  { x: -3.9, y: 1.85, z: -0.35, screenX: 360, screenY: 270 },
  { x: 4.05, y: 1.55, z: -0.15, screenX: 1510, screenY: 292 },
  { x: -3.45, y: -2.05, z: 0.15, screenX: 410, screenY: 775 },
];

const dimmed3D = [
  { x: 3.65, y: -2.1, z: -0.6, screenX: 1450, screenY: 760 },
  { x: -5.35, y: -0.35, z: -1.15, screenX: 170, screenY: 560 },
  { x: 5.25, y: -0.15, z: -1.25, screenX: 1715, screenY: 535 },
  { x: 0.2, y: -3.15, z: -1.0, screenX: 990, screenY: 890 },
];

function Beam({
  from,
  to,
  progress,
  dimmed = false,
}: {
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
  progress: number;
  dimmed?: boolean;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const mid = {
    x: from.x + dx * 0.5,
    y: from.y + dy * 0.5,
    z: from.z + dz * 0.5,
  };
  const angleZ = -Math.atan2(dx, dy);
  const angleX = Math.atan2(dz, Math.sqrt(dx * dx + dy * dy));
  const opacity = dimmed ? 0.12 * progress : 0.78 * progress;

  return (
    <mesh position={[mid.x, mid.y, mid.z]} rotation={[angleX, 0, angleZ]} scale={[1, progress, 1]}>
      <cylinderGeometry args={[dimmed ? 0.006 : 0.014, dimmed ? 0.006 : 0.014, length, 16]} />
      <meshStandardMaterial
        color={dimmed ? "#8a8f8a" : COLORS.brandGreen}
        emissive={dimmed ? "#1c231e" : COLORS.brandGreen}
        emissiveIntensity={dimmed ? 0.15 : 1.35}
        opacity={opacity}
        transparent
      />
    </mesh>
  );
}

function NodeOrb({
  position,
  progress,
  matched,
  size = 0.22,
}: {
  position: { x: number; y: number; z: number };
  progress: number;
  matched: boolean;
  size?: number;
}) {
  const scale = interpolate(progress, [0, 1], [0.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const opacity = matched ? progress : progress * 0.36;

  return (
    <group position={[position.x, position.y, position.z]} scale={scale}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={matched ? COLORS.brandGreen : "#1d231f"}
          emissive={matched ? COLORS.brandGreen : "#0f1411"}
          emissiveIntensity={matched ? 0.9 : 0.18}
          roughness={0.28}
          metalness={0.22}
          opacity={opacity}
          transparent
        />
      </mesh>
      {matched && (
        <mesh scale={1.8}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshBasicMaterial color={COLORS.brandGreen} opacity={0.08 * progress} transparent />
        </mesh>
      )}
    </group>
  );
}

function MatchingWorld({ frame }: { frame: number }) {
  const scan = frameProgress(frame, 24, 60);
  const score = frameProgress(frame, 65, 104);
  const centralScale = interpolate(frame, [5, 28], [0.45, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const rotateY = interpolate(frame, [0, 180], [-0.22, 0.26], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <group rotation={[0.08, rotateY, 0]}>
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 3.8, 3.4]} intensity={22} color="#ffffff" />
      <pointLight position={[-4, -2, 4]} intensity={18} color={COLORS.brandGreen} />
      <directionalLight position={[5, 5, 6]} intensity={2.4} />

      <mesh position={[0, 0, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.2, 96]} />
        <meshBasicMaterial color={COLORS.brandGreen} opacity={0.045} transparent />
      </mesh>

      {[1.4, 2.5, 3.65].map((radius, i) => {
        const pulse = interpolate(scan, [0, 1], [0.2, 1]);
        return (
          <mesh key={radius} position={[0, 0, -0.03]} scale={pulse + i * 0.08}>
            <torusGeometry args={[radius, 0.008, 10, 160]} />
            <meshBasicMaterial color={COLORS.brandGreen} opacity={(0.22 - i * 0.045) * scan} transparent />
          </mesh>
        );
      })}

      <group scale={centralScale} position={[0, softFloat(frame, 0.05, 0.05), 0.25]}>
        <mesh>
          <boxGeometry args={[1.8, 0.92, 0.18]} />
          <meshStandardMaterial
            color="#f7f8f6"
            emissive="#dce9df"
            emissiveIntensity={0.15}
            roughness={0.2}
            metalness={0.08}
          />
        </mesh>
        <mesh position={[0, 0, 0.12]} scale={[1.06, 1.16, 1]}>
          <boxGeometry args={[1.8, 0.92, 0.035]} />
          <meshBasicMaterial color={COLORS.brandGreen} opacity={0.12 + scan * 0.18} transparent />
        </mesh>
      </group>

      {matched3D.map((pos, i) => {
        const nodeProgress = frameProgress(frame, 62 + i * 12, 80 + i * 12);
        const lineProgress = frameProgress(frame, 56 + i * 10, 78 + i * 10);
        return (
          <React.Fragment key={`matched-${i}`}>
            <Beam from={{ x: 0, y: 0, z: 0.2 }} to={pos} progress={lineProgress} />
            <NodeOrb position={pos} progress={nodeProgress} matched size={0.24} />
          </React.Fragment>
        );
      })}

      {dimmed3D.map((pos, i) => {
        const nodeProgress = frameProgress(frame, 92 + i * 5, 106 + i * 5);
        return (
          <React.Fragment key={`dimmed-${i}`}>
            <Beam from={{ x: 0, y: 0, z: -0.05 }} to={pos} progress={nodeProgress} dimmed />
            <NodeOrb position={pos} progress={nodeProgress} matched={false} size={0.18} />
          </React.Fragment>
        );
      })}

      <mesh position={[0, 0, -2.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.9, 4.94, 160]} />
        <meshBasicMaterial color="#ffffff" opacity={0.05 * score} transparent />
      </mesh>
    </group>
  );
}

function NodeLabel({
  user,
  position,
  frame,
  delay,
  matched,
}: {
  user: { name: string; biz: string; cats?: string[] };
  position: { screenX: number; screenY: number };
  frame: number;
  delay: number;
  matched: boolean;
}) {
  const p = frameProgress(frame, delay, delay + 14);
  const y = interpolate(p, [0, 1], [22, 0]);
  const scale = interpolate(p, [0, 1], [0.96, 1]);

  return (
    <div
      style={{
        ...networkNodeStyle(matched),
        position: "absolute",
        left: position.screenX,
        top: position.screenY,
        transform: `translate(-50%, -50%) translateY(${y}px) scale(${scale})`,
        opacity: matched ? p : p * 0.45,
        minWidth: matched ? 184 : 154,
        boxShadow: matched ? "0 18px 60px rgba(0,0,0,0.38), 0 0 34px rgba(26,86,50,0.22)" : "none",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div style={{ fontSize: matched ? 13 : 11, fontWeight: 750, color: matched ? COLORS.white : "rgba(255,255,255,0.44)" }}>
        {user.name}
      </div>
      <div style={{ fontSize: 10, color: matched ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)" }}>
        {user.biz}
      </div>
      {matched && (
        <div style={{ marginTop: 7, fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: COLORS.brandGreen }}>
          SMART MATCH
        </div>
      )}
    </div>
  );
}

export const Scene6_SmartMatching: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scoreProgress = frameProgress(frame, 65, 104);
  const scanOpacity = interpolate(frame, [24, 32, 56, 64], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans, overflow: "hidden" }}>
      <CinematicBackdrop frame={frame} glow={0.92} />
      <LightSweep frame={frame} start={16} end={78} opacity={0.22} />
      <ScanBand frame={frame} start={18} end={68} top="44%" height={150} opacity={0.44} />
      <SectionKicker frame={frame} delay={0}>Intelligent Matching Engine</SectionKicker>

      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }) }}>
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 8.2], fov: 42 }}>
          <MatchingWorld frame={frame} />
        </ThreeCanvas>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 310,
          padding: "18px 22px",
          borderRadius: 18,
          textAlign: "center",
          backgroundColor: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(255,255,255,0.78)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.36), 0 0 44px rgba(26,86,50,0.2)",
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.24em", color: COLORS.brandGreen, marginBottom: 6 }}>
          {DEMO_LOT.id}
        </div>
        <div style={{ fontSize: 15, fontWeight: 750, color: COLORS.ink, lineHeight: 1.25 }}>
          {DEMO_LOT.title}
        </div>
        <div style={{ marginTop: 5, fontSize: 11, color: COLORS.inkMuted }}>
          {DEMO_LOT.category} - {DEMO_LOT.quantity} kg
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "58%",
          transform: "translateX(-50%)",
          opacity: scanOpacity,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.26em",
          color: COLORS.brandGreen,
          textTransform: "uppercase",
        }}
      >
        Scanning {Math.round(147 * frameProgress(frame, 25, 55))} verified users...
      </div>

      {MATCHED_USERS.map((user, i) => (
        <NodeLabel key={user.name} user={user} position={matched3D[i]} frame={frame} delay={66 + i * 12} matched />
      ))}
      {DIMMED_USERS.map((user, i) => (
        <NodeLabel key={user.name} user={user} position={dimmed3D[i]} frame={frame} delay={96 + i * 5} matched={false} />
      ))}

      <div
        style={{
          position: "absolute",
          top: 96,
          right: 88,
          textAlign: "right",
          opacity: frameProgress(frame, 60, 75),
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.3em", color: COLORS.brandGreen, textTransform: "uppercase", marginBottom: 8 }}>
          Smart Match Score
        </div>
        <div
          style={{
            fontSize: 74,
            fontWeight: 850,
            color: COLORS.white,
            fontFamily: FONT.display,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            textShadow: "0 0 48px rgba(26,86,50,0.48)",
          }}
        >
          {Math.round(96 * scoreProgress)}%
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.48)", marginTop: 6 }}>
          {Math.round(3 * scoreProgress)} qualified matches
        </div>
      </div>
    </AbsoluteFill>
  );
};
