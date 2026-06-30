/**
 * remotion/Root.tsx
 * Entry point for Remotion Studio and the @remotion/cli bundler.
 *
 * Two compositions:
 * 1. SurplusLinkDemo  — Original flat demo (1440×900, 60s)
 * 2. SurplusLink3D    — Modern cinematic 3D demo (1920×1080, ~45s)
 */

import React from "react";
import { Composition } from "remotion";
import { SurplusLinkDemo } from "./SurplusLinkDemo";
import { SurplusLink3D } from "./SurplusLink3D";

/*
 * SurplusLink3D duration calculation:
 * Scene durations: 120+120+180+240+180+180+150+180 = 1350 frames
 * Transition overlaps: 20+20+18+20+18+20+20 = 136 frames
 * Net duration: 1350 - 136 = 1214 frames (~40.5s at 30fps)
 */
const DURATION_3D = 1214;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SurplusLink3D"
        component={SurplusLink3D}
        durationInFrames={DURATION_3D}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="SurplusLinkDemo"
        component={SurplusLinkDemo}
        durationInFrames={1800}
        fps={30}
        width={1440}
        height={900}
        defaultProps={{}}
      />
    </>
  );
};
