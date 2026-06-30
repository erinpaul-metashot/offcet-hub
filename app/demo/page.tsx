"use client";

import { ScrollStage } from "@/components/demo/scroll/ScrollStage";
import { Stage } from "@/components/demo/core/Stage";

/**
 * /demo — The Apple-style scroll-driven SaaS demo page.
 * Scrolling scrubs the animation timeline forward and backward.
 */
export default function DemoPage() {
  return (
    <div>
      <ScrollStage totalHeight={28000}>
        {(progress) => <Stage progress={progress} />}
      </ScrollStage>
    </div>
  );
}

