/* ─── Demo Core Types ───────────────────────────────────────────── */

export interface CameraState {
  scale: number;
  x: number; // percentage offset from center (-50 to 50)
  y: number; // percentage offset from center (-50 to 50)
}

export interface CursorState {
  x: number; // percentage of viewport (0-100)
  y: number; // percentage of viewport (0-100)
  visible: boolean;
  state: "idle" | "hover" | "click";
}

export interface CursorKeyframe {
  at: number; // progress 0-1 within the local scene
  x: number;
  y: number;
  visible?: boolean;
  state?: CursorState["state"];
}

export interface SceneOutput {
  element: React.ReactNode;
  camera: CameraState;
  cursor: CursorState;
}

export interface SceneConfig {
  id: string;
  label: string;
  start: number; // progress start (0-1)
  end: number;   // progress end (0-1)
}

export const SCENES: SceneConfig[] = [
  { id: "act1-brand",        label: "Brand Reveal",          start: 0.000, end: 0.040 },
  { id: "act1-hero",         label: "Hero Statement",        start: 0.040, end: 0.080 },
  { id: "act2-register",     label: "Registration",          start: 0.080, end: 0.130 },
  { id: "act2-transition",   label: "Approval Transition",   start: 0.130, end: 0.180 },
  { id: "act3-navigate",     label: "Navigate to New Lot",   start: 0.180, end: 0.210 },
  { id: "act3-fill",         label: "Fill Lot Form",         start: 0.210, end: 0.320 },
  { id: "act3-submit",       label: "Submit for Review",     start: 0.320, end: 0.380 },
  { id: "act4-dashboard",    label: "Admin Dashboard",       start: 0.380, end: 0.440 },
  { id: "act4-approve",      label: "Review & Approve",      start: 0.440, end: 0.530 },
  { id: "act5-candidates",   label: "Smart Matching",        start: 0.530, end: 0.600 },
  { id: "act5-assign",       label: "Assign Candidates",     start: 0.600, end: 0.700 },
  { id: "act6-buyer",        label: "Buyer Responds",        start: 0.700, end: 0.850 },
  { id: "act7-metrics",      label: "Metrics Montage",       start: 0.850, end: 0.930 },
  { id: "act7-cta",          label: "Brand Sign-Off",        start: 0.930, end: 1.000 },
];
