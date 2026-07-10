import type { Metadata } from "next";
import { Switcher } from "./_components/Switcher";

export const metadata: Metadata = {
  title: "SurplusLink · Concept Gallery",
  description: "Five experimental landing-page concepts for SurplusLink, each built around a different interaction.",
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-x-hidden">
      {children}
      <Switcher />
    </div>
  );
}
