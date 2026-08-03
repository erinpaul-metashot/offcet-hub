import type { Metadata } from "next";
import { DemoModePill } from "./_components/demo-mode-pill";
import { DemoStoreProvider } from "./_mock/store";

export const metadata: Metadata = {
  title: "CIRKA — Revised MVP Demo",
  description:
    "An interactive walkthrough of the revised CIRKA operating model — five roles, an enforced quantity ledger and the brand proof view — running entirely on mock data in the browser.",
};

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DemoStoreProvider>
      {children}
      <DemoModePill />
    </DemoStoreProvider>
  );
}
