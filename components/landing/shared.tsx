"use client";

import { classNames } from "@/lib/utils";

/** Pre-rendered scene plates copied into /public/landing */
export const ASSETS = {
  heroBox: "/landing/The_Hero_Box.png",
  warehouse: "/landing/Isometric_Warehouse.png",
  supplierWorkstation: "/landing/Supplier_Workstation_Overflowing_Inventory.png",
  buyerEnvironment: "/landing/Buyer_Environment.png",
  supplierStressed: "/landing/3D_Character-The_Supplier-Stressed.png",
  supplierRelieved: "/landing/3D_Character-The_Supplier-Relieved.png",
  admin: "/landing/3D_Character-The_Admin.png",
  buyer: "/landing/3D_Character-The_Buyer.png",
} as const;

/** Offcet Hub wordmark — "Offcet" in ink, "Hub" reversed on a lime chip. */
export function Wordmark({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span
      className={classNames(
        "oh-display inline-flex items-center gap-1.5 text-[1.35rem] leading-none tracking-[-0.04em]",
        className,
      )}
    >
      <span style={{ color: onDark ? "var(--white)" : "var(--black)" }}>Offcet</span>
      <span
        className="oh-border px-1.5 py-0.5"
        style={{ background: "var(--lime)", color: "var(--black)", borderColor: onDark ? "var(--white)" : "var(--black)" }}
      >
        Hub
      </span>
    </span>
  );
}

/** Brutalist narrative pill — e.g. `STEP 1 · SUPPLIER`. */
export function NarrativeLabel({
  children,
  accent = false,
  className,
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={classNames("oh-label", className)}
      style={accent ? { background: "var(--lime)" } : undefined}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5"
        style={{ background: accent ? "var(--black)" : "var(--lime)", borderRadius: 1 }}
      />
      {children}
    </span>
  );
}

/** Reusable pill CTA. */
export function PillButton({
  children,
  href,
  variant = "solid",
  className,
}: {
  children: React.ReactNode;
  href: string;
  variant?: "solid" | "lime" | "outline";
  className?: string;
}) {
  const styles =
    variant === "lime"
      ? { background: "var(--lime)", color: "var(--black)", borderColor: "var(--black)" }
      : variant === "outline"
        ? { background: "transparent", color: "var(--black)", borderColor: "var(--black)" }
        : { background: "var(--black)", color: "var(--white)", borderColor: "var(--black)" };

  return (
    <a
      href={href}
      style={styles}
      className={classNames(
        "group inline-flex items-center gap-2 rounded-full border-2 px-7 py-3.5 text-[0.8rem] font-bold uppercase tracking-[0.14em] transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </a>
  );
}

/** Small mono kicker text. */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={classNames(
        "oh-mono text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-black/50",
        className,
      )}
    >
      {children}
    </span>
  );
}
