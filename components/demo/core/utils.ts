/* ─── Demo Animation Utilities ──────────────────────────────────── */

/** Clamp a value to the 0–1 range. */
export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** Linear interpolation between a and b. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

export const DEMO_FRAME_WIDTH = 1440;
export const DEMO_FRAME_HEIGHT = 900;
export const DEMO_CHROME_HEIGHT = 32;
export const DEMO_VIEWPORT_HEIGHT = DEMO_FRAME_HEIGHT - DEMO_CHROME_HEIGHT;

/**
 * Map a global progress value into a local 0–1 range within [start, end].
 * Returns 0 before start and 1 after end.
 */
export function rangeProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= start ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

/** Ease-out cubic for smooth deceleration. */
export function easeOutCubic(t: number): number {
  const t1 = clamp01(t);
  return 1 - Math.pow(1 - t1, 3);
}

/** Ease-in cubic for smooth acceleration. */
export function easeInCubic(t: number): number {
  const t1 = clamp01(t);
  return t1 * t1 * t1;
}

/** Ease-in-out cubic for smooth transitions. */
export function easeInOutCubic(t: number): number {
  const t1 = clamp01(t);
  return t1 < 0.5 ? 4 * t1 * t1 * t1 : 1 - Math.pow(-2 * t1 + 2, 3) / 2;
}

/** Spring-like overshoot easing. */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const t1 = clamp01(t);
  return 1 + c3 * Math.pow(t1 - 1, 3) + c1 * Math.pow(t1 - 1, 2);
}

export function cursorKeyframes(
  progress: number,
  keyframes: Array<{
    at: number;
    x: number;
    y: number;
    visible?: boolean;
    state?: "idle" | "hover" | "click";
  }>,
): {
  x: number;
  y: number;
  visible: boolean;
  state: "idle" | "hover" | "click";
} {
  const p = clamp01(progress);
  if (!keyframes.length) {
    return { x: 0, y: 0, visible: false, state: "idle" };
  }

  const ordered = [...keyframes].sort((a, b) => a.at - b.at);
  const first = ordered[0];
  if (p <= first.at) {
    return {
      x: first.x,
      y: first.y,
      visible: first.visible ?? false,
      state: first.state ?? "idle",
    };
  }

  for (let i = 0; i < ordered.length - 1; i += 1) {
    const current = ordered[i];
    const next = ordered[i + 1];
    if (p <= next.at) {
      const local = easeInOutCubic(rangeProgress(p, current.at, next.at));
      return {
        x: lerp(current.x, next.x, local),
        y: lerp(current.y, next.y, local),
        visible: current.visible ?? true,
        state: current.state ?? "idle",
      };
    }
  }

  const last = ordered[ordered.length - 1];
  return {
    x: last.x,
    y: last.y,
    visible: last.visible ?? true,
    state: last.state ?? "idle",
  };
}

export function cursorPercentToPixels(cursor: { x: number; y: number }) {
  return {
    x: (cursor.x / 100) * DEMO_FRAME_WIDTH,
    y: DEMO_CHROME_HEIGHT + (cursor.y / 100) * DEMO_VIEWPORT_HEIGHT,
  };
}

type CameraLike = { scale: number; x: number; y: number };
type CursorKeyframeLike = {
  at: number;
  x: number;
  y: number;
  visible?: boolean;
  state?: "idle" | "hover" | "click";
};

export function projectContentCursorPoint(camera: CameraLike, point: { x: number; y: number }) {
  const width = DEMO_FRAME_WIDTH;
  const height = DEMO_VIEWPORT_HEIGHT;
  const cx = width / 2;
  const cy = height / 2;
  const dx = (camera.x / 100) * width;
  const dy = (camera.y / 100) * height;

  const px = (point.x / 100) * width;
  const py = (point.y / 100) * height;

  const translatedX = px + dx;
  const translatedY = py + dy;

  const scaledX = cx + camera.scale * (translatedX - cx);
  const scaledY = cy + camera.scale * (translatedY - cy);

  return {
    x: (scaledX / width) * 100,
    y: (scaledY / height) * 100,
  };
}

export function unprojectScreenCursorPoint(camera: CameraLike, point: { x: number; y: number }) {
  const width = DEMO_FRAME_WIDTH;
  const height = DEMO_VIEWPORT_HEIGHT;
  const cx = width / 2;
  const cy = height / 2;
  const dx = (camera.x / 100) * width;
  const dy = (camera.y / 100) * height;

  const sx = (point.x / 100) * width;
  const sy = (point.y / 100) * height;

  const unscaledX = (sx - cx) / camera.scale + cx;
  const unscaledY = (sy - cy) / camera.scale + cy;

  return {
    x: ((unscaledX - dx) / width) * 100,
    y: ((unscaledY - dy) / height) * 100,
  };
}

export function cursorScreenKeyframes(
  progress: number,
  cameraAt: (progress: number) => CameraLike,
  keyframes: CursorKeyframeLike[],
) {
  const contentFrames = keyframes.map((frame) => {
    const contentPoint = unprojectScreenCursorPoint(cameraAt(frame.at), frame);
    return {
      ...frame,
      x: contentPoint.x,
      y: contentPoint.y,
    };
  });

  const contentCursor = cursorKeyframes(progress, contentFrames);
  const screenPoint = projectContentCursorPoint(cameraAt(progress), contentCursor);

  return {
    ...contentCursor,
    x: screenPoint.x,
    y: screenPoint.y,
  };
}

/**
 * Returns the number of characters to show in a typewriter animation.
 * progress: 0–1 local progress through the typing phase.
 * totalChars: total number of characters in the string.
 */
export function typewriterCount(progress: number, totalChars: number): number {
  return Math.floor(clamp01(progress) * totalChars);
}

/**
 * Stagger helper: for item at index `i` out of `total`, returns the
 * local progress (0–1) with staggered start/end within the parent progress.
 */
export function stagger(
  progress: number,
  index: number,
  total: number,
  overlap: number = 0.3,
): number {
  const segmentDuration = 1 / (total + (total - 1) * (1 - overlap));
  const start = index * segmentDuration * (1 - overlap + 1);
  const end = start + segmentDuration;
  return rangeProgress(progress, start, Math.min(end, 1));
}
