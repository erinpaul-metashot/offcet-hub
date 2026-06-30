/**
 * remotion/utils/animations.ts
 * Reusable animation helpers for the 3D immersive SaaS demo video.
 * Everything is frame-driven — no CSS animations.
 */

/** Clamp 0-1 */
export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

/** Ease-out cubic */
export function easeOut(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

/** Ease-in cubic */
export function easeIn(t: number): number {
  const c = clamp01(t);
  return c * c * c;
}

/** Ease-in-out cubic */
export function easeInOut(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/** Spring-like overshoot (easeOutBack) */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const c = clamp01(t);
  return 1 + c3 * Math.pow(c - 1, 3) + c1 * Math.pow(c - 1, 2);
}

/** Elastic ease out */
export function easeOutElastic(t: number): number {
  const c = clamp01(t);
  if (c === 0 || c === 1) return c;
  const p = 0.3;
  return Math.pow(2, -10 * c) * Math.sin((c - p / 4) * (2 * Math.PI) / p) + 1;
}

/** Map progress into a sub-range [start, end] → 0–1 */
export function rangeP(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= start ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

/**
 * Generate a floating card transform string.
 * Applies perspective rotation that settles to a rest position.
 */
export function floatingCardTransform(
  progress: number,
  opts: {
    startRotateX?: number;
    startRotateY?: number;
    endRotateX?: number;
    endRotateY?: number;
    startScale?: number;
    endScale?: number;
    startTranslateY?: number;
    endTranslateY?: number;
  } = {},
): string {
  const {
    startRotateX = 15,
    startRotateY = -20,
    endRotateX = 0,
    endRotateY = 0,
    startScale = 0.85,
    endScale = 1,
    startTranslateY = 40,
    endTranslateY = 0,
  } = opts;

  const p = easeOut(progress);
  const rx = lerp(startRotateX, endRotateX, p);
  const ry = lerp(startRotateY, endRotateY, p);
  const s = lerp(startScale, endScale, p);
  const ty = lerp(startTranslateY, endTranslateY, p);

  return `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s}) translateY(${ty}px)`;
}

/**
 * Generate a particle field — pre-computed random positions.
 * Deterministic based on count (no Math.random at render time).
 */
export function generateParticles(
  count: number,
  seed: number = 42,
): Array<{
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  speed: number;
}> {
  // Simple seeded PRNG
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: next() * 100,
    y: next() * 100,
    size: next() * 3 + 1,
    delay: next() * 0.6,
    speed: next() * 0.5 + 0.5,
  }));
}

/**
 * Glow pulse box-shadow value.
 * Returns a CSS box-shadow string.
 */
export function glowPulse(
  progress: number,
  color: string = "rgba(26,86,50,0.6)",
  maxSpread: number = 30,
): string {
  // Sine-based pulse
  const intensity = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
  const spread = intensity * maxSpread;
  return `0 0 ${spread}px ${spread / 3}px ${color}`;
}

/**
 * Stagger entrance: for item i of total, returns local progress 0-1.
 */
export function staggerEntrance(
  progress: number,
  index: number,
  total: number,
  overlap: number = 0.4,
): number {
  const segDur = 1 / (total - (total - 1) * overlap);
  const start = index * segDur * (1 - overlap);
  const end = start + segDur;
  return rangeP(progress, start, Math.min(end, 1));
}

/**
 * Typewriter character count from progress.
 */
export function typewriterCount(progress: number, totalChars: number): number {
  return Math.floor(clamp01(progress) * totalChars);
}
