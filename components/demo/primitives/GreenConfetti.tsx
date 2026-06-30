"use client";

import { useMemo } from "react";

interface Particle {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  delay: number;
}

/**
 * GreenConfetti — small green squares that burst outward from center.
 * progress: 0 = particles at center, 1 = particles fully dispersed.
 */
export function GreenConfetti({
  progress,
  count = 12,
  spread = 80,
  className,
}: {
  progress: number;
  count?: number;
  spread?: number;
  className?: string;
}) {
  const p = Math.max(0, Math.min(1, progress));

  const particles = useMemo<Particle[]>(() => {
    // Deterministic pseudo-random using index
    return Array.from({ length: count }, (_, i) => ({
      x: 0,
      y: 0,
      angle: (i / count) * 360 + (i * 37) % 30 - 15,
      speed: 0.6 + (i * 13 % 10) / 10 * 0.4,
      size: 4 + (i * 7 % 5),
      delay: (i * 3 % 10) / 10 * 0.3,
    }));
  }, [count]);

  if (p <= 0) return null;

  return (
    <div className={className} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {particles.map((particle, i) => {
        const localP = Math.max(0, Math.min(1, (p - particle.delay) / (1 - particle.delay)));
        const rad = (particle.angle * Math.PI) / 180;
        const distance = spread * particle.speed * localP;
        const tx = Math.cos(rad) * distance;
        const ty = Math.sin(rad) * distance - localP * 20; // slight upward arc
        const opacity = 1 - localP * 0.8;
        const rotation = localP * 180 * (i % 2 === 0 ? 1 : -1);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: particle.size,
              height: particle.size,
              backgroundColor: i % 3 === 0 ? "var(--brand-green)" : i % 3 === 1 ? "var(--brand-green-light)" : "var(--brand-green-muted)",
              transform: `translate(${tx}px, ${ty}px) rotate(${rotation}deg)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
