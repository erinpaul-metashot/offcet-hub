/**
 * Bridge between GSAP ScrollTrigger (DOM) and the R3F render loop.
 *
 * ScrollTrigger callbacks write *target* values into this module-level singleton;
 * the R3F <Rig> reads them every frame and critically-damps the camera / objects
 * toward them. This is the robust pattern for tying scroll to Three.js — we never
 * tween Three props across the React boundary, we scrub plain numbers and apply
 * them in useFrame, so pin-length changes never desync the camera.
 */

export type CamKey = { p: [number, number, number]; l: [number, number, number] };

/** Named camera keyframes (world units). p = position, l = lookAt target. */
export const CAM: Record<string, CamKey> = {
  establish: { p: [-9, 15, 30], l: [0, 3, -2] },
  dolly: { p: [-1, 9, 18], l: [0, 3, -4] },
  workstation: { p: [12, 6, 14], l: [15, 3.2, 5] },
  laptopZoom: { p: [14.8, 3.0, 5.4], l: [15.15, 2.75, 4.7] },
  uiHold: { p: [3, 9, 22], l: [0, 4, -1] },
  uiHoldAlt: { p: [-4, 8.5, 22], l: [0, 4, -1] },
  fulfill: { p: [-2, 7, 13], l: [2, 3, 3] },
  cleared: { p: [0, 11, 24], l: [0, 3, -3] },
};

export const scrollState = {
  /** Canvas opacity target (0 hidden behind hero / footer, 1 in the 3D act). */
  visible: 0,
  /** Target camera position. */
  camX: CAM.establish.p[0],
  camY: CAM.establish.p[1],
  camZ: CAM.establish.p[2],
  /** Target lookAt point. */
  lookX: CAM.establish.l[0],
  lookY: CAM.establish.l[1],
  lookZ: CAM.establish.l[2],
  /** 0→1 the hero box uproots from the pile and flies to the buyer (Scene 9). */
  boxFlight: 0,
  /** 0→1 the warehouse empties out (Scene 10). */
  cleared: 0,
  /** 0→1 the laptop / workstation screen glow intensity (Scene 3). */
  glow: 0,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Blend two camera keyframes by t and write the result as the current target. */
export function mixCam(a: CamKey, b: CamKey, t: number): void {
  const tc = Math.min(1, Math.max(0, t));
  scrollState.camX = lerp(a.p[0], b.p[0], tc);
  scrollState.camY = lerp(a.p[1], b.p[1], tc);
  scrollState.camZ = lerp(a.p[2], b.p[2], tc);
  scrollState.lookX = lerp(a.l[0], b.l[0], tc);
  scrollState.lookY = lerp(a.l[1], b.l[1], tc);
  scrollState.lookZ = lerp(a.l[2], b.l[2], tc);
}

/** Snap the target to a single keyframe (used for scenes that hold a framing). */
export function setCam(k: CamKey): void {
  mixCam(k, k, 0);
}
