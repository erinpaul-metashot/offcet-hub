"use client";

/**
 * SuccessCheckmark — an SVG checkmark that draws itself based on progress.
 * progress: 0 = invisible, 1 = fully drawn.
 */
export function SuccessCheckmark({
  progress,
  size = 48,
  color = "var(--brand-green)",
  className,
}: {
  progress: number;
  size?: number;
  color?: string;
  className?: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  // The checkmark path length is approximately 30 units
  const pathLength = 30;
  const dashOffset = pathLength * (1 - p);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={{ opacity: p > 0 ? 1 : 0 }}
    >
      {/* Circle background */}
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray={88}
        strokeDashoffset={88 * (1 - Math.min(p * 2, 1))}
        style={{ transition: "stroke-dashoffset 0.1s linear" }}
      />
      {/* Checkmark */}
      <path
        d="M10 16.5L14 20.5L22 12.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.1s linear" }}
      />
    </svg>
  );
}
