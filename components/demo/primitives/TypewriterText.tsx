"use client";

/**
 * TypewriterText â€” reveals text character by character based on progress.
 * progress: 0 = no characters, 1 = all characters.
 */
export function TypewriterText({
  text,
  progress,
  className,
  showCursor = true,
}: {
  text: string;
  progress: number;
  className?: string;
  showCursor?: boolean;
}) {
  const visibleCount = Math.floor(Math.max(0, Math.min(1, progress)) * text.length);
  const visibleText = text.substring(0, visibleCount);
  const isComplete = visibleCount >= text.length;

  return (
    <span className={className}>
      {visibleText}
      {showCursor && !isComplete && progress > 0 && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            marginLeft: 1,
            verticalAlign: "middle",
            backgroundColor: "var(--ink)",
            animation: "demo-blink 0.8s step-end infinite",
          }}
        />
      )}
    </span>
  );
}
