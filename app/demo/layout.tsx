import type { Metadata } from "next";
import { DemoStoreProvider } from "./_mock/store";
import { StoryProvider } from "./_story/store";
import { StoryDock } from "./_story/story-dock";

export const metadata: Metadata = {
  title: "CIRKA: Revised MVP Demo",
  description:
    "An interactive walkthrough of the revised CIRKA operating model: five roles, an enforced quantity ledger and the brand proof view: running entirely on mock data in the browser.",
};

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DemoStoreProvider>
      <StoryProvider>
        {children}
        <StoryDock />
      </StoryProvider>
    </DemoStoreProvider>
  );
}
