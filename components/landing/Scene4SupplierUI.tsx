"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Save, FileText, MapPin, Package, DollarSign } from "lucide-react";
import { Button, Field, Input, Textarea, StatusBadge, Panel } from "@/components/ui";
import { NarrativeLabel } from "./shared";
import { scrollState, setCam, CAM } from "./three/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LIME_BTN = "border-2! border-black! bg-[var(--lime)]! text-black! rounded-none! uppercase";
const DARK_BTN = "border-2! border-black! bg-black! text-white! rounded-none! uppercase";
const FIELD_CLS = "rounded-none! border-2! border-black!";

const FIELDS = [
  { key: "title", label: "Title", value: "Premium Grade Aluminum Offcuts" },
  { key: "category", label: "Category", value: "Metals" },
  { key: "quantity", label: "Quantity", value: "12,500" },
  { key: "unit", label: "Unit", value: "kg" },
  { key: "price", label: "Expected Price", value: "$18,400" },
  { key: "location", label: "Location", value: "Rotterdam Port Warehouse, NL" },
] as const;

const OFFSETS = FIELDS.reduce<number[]>((acc, _f, i) => {
  acc.push((acc[i - 1] ?? 0) + (FIELDS[i - 1]?.value.length ?? 0));
  return acc;
}, []);
const TOTAL = OFFSETS[FIELDS.length - 1] + FIELDS[FIELDS.length - 1].value.length;

const shown = (idx: number, revealed: number) => {
  const start = OFFSETS[idx];
  const full = FIELDS[idx].value;
  if (revealed <= start) return "";
  if (revealed >= start + full.length) return full;
  return full.slice(0, revealed - start);
};

/**
 * Scene 4 — Supplier "Create Lot" form, rebuilt from the REAL app components
 * (Button/Field/Input/Textarea/StatusBadge/Panel from components/ui.tsx). Fields
 * type in as you scroll — driven entirely through DOM refs (NOT React state) so
 * the pinned subtree never re-renders and never fights GSAP's pin-spacer.
 */
export function Scene4SupplierUI() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.set(".oh-saved", { opacity: 0, scale: 0.6 });
      gsap.set(".oh-packet", { opacity: 0, scale: 0.2 });

      const applyTyping = (revealed: number) => {
        const el = root.current;
        if (!el) return;
        FIELDS.forEach((f, i) => {
          const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(`.oh-fi-${f.key}`);
          if (input) input.value = shown(i, revealed);
        });
        const setText = (sel: string, text: string) => {
          const node = el.querySelector(sel);
          if (node) node.textContent = text;
        };
        setText(".oh-pv-title", shown(0, revealed) || "Draft Title");
        setText(".oh-pv-qty", `${shown(2, revealed) || "0"} ${shown(3, revealed)}`);
        setText(".oh-pv-price", shown(4, revealed) || "—");
        setText(".oh-pv-location", shown(5, revealed) || "TBD");
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=260%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            scrollState.visible = 1;
            scrollState.glow = 1;
            setCam(CAM.laptopZoom);
            applyTyping(Math.min(TOTAL, Math.floor((self.progress / 0.6) * TOTAL)));
          },
        },
      });

      tl.from(".oh-s4-window", { opacity: 0, scale: 0.7, duration: 0.8, ease: "back.out(1.2)" }, 0.15)
        .from(".oh-s4-preview", { opacity: 0, scale: 0.7, duration: 0.8, ease: "back.out(1.2)" }, 0.25)
        .to(".oh-s4-label", { opacity: 1, duration: 0.5 }, 0.35)
        .to(".oh-save-btn", { boxShadow: "0 0 0 4px rgba(209,245,59,0.9)", duration: 0.4 }, 3.4)
        .to(".oh-save-label", { opacity: 0, y: -8, duration: 0.25 }, 3.7)
        .to(".oh-saved", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, 3.75)
        .to(".oh-save-btn", { boxShadow: "0 0 0 0 rgba(209,245,59,0)", duration: 0.4 }, 3.95)
        .to(".oh-submit-btn", { scale: 0.94, duration: 0.2 }, 4.3)
        .to(".oh-submit-btn", { scale: 1, duration: 0.2 }, 4.5)
        .to(".oh-packet", { opacity: 1, scale: 1, duration: 0.3 }, 4.6)
        .to(".oh-packet", { x: () => window.innerWidth * 0.42, y: () => -window.innerHeight * 0.34, rotate: 90, scale: 0.5, opacity: 0.9, duration: 1, ease: "power2.in" }, 4.75)
        .to(".oh-s4-window, .oh-s4-preview", { scale: 0.92, opacity: 0.2, y: -20, duration: 0.9 }, 4.9);
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden -mt-[100vh]"
    >
      <div className="oh-s4-label absolute left-6 top-[9%] z-30 opacity-0 sm:left-12 lg:left-20">
        <NarrativeLabel accent>Step 1 · Supplier</NarrativeLabel>
      </div>

      <div className="relative z-20 mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-8 px-6 lg:grid-cols-12 lg:px-10">
        {/* Create Lot form — real components */}
        <div className="oh-s4-window lg:col-span-7">
          <Panel className="rounded-none! border-2! border-black! bg-[var(--paper)] shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
            <div className="grid gap-5 p-6">
              <div className="border-b-2 border-black pb-4">
                <p className="oh-mono flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--espresso)" }}>
                  <FileText size={13} /> New Lot Draft
                </p>
                <h3 className="oh-display mt-1.5 text-2xl">Supply details</h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Title">
                  <Input readOnly defaultValue="" placeholder="e.g. Aluminum Offcuts" className={`oh-fi-title ${FIELD_CLS}`} />
                </Field>
                <Field label="Category">
                  <Input readOnly defaultValue="" placeholder="e.g. Metals" className={`oh-fi-category ${FIELD_CLS}`} />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Quantity">
                  <Input readOnly defaultValue="" placeholder="0" className={`oh-fi-quantity ${FIELD_CLS}`} />
                </Field>
                <Field label="Unit">
                  <Input readOnly defaultValue="" placeholder="tons" className={`oh-fi-unit ${FIELD_CLS}`} />
                </Field>
                <Field label="Expected Price">
                  <Input readOnly defaultValue="" placeholder="Optional" className={`oh-fi-price ${FIELD_CLS}`} />
                </Field>
              </div>
              <Field label="Location">
                <Textarea readOnly defaultValue="" placeholder="Warehouse address" className={`oh-fi-location min-h-16! ${FIELD_CLS}`} />
              </Field>

              <div className="flex flex-wrap items-center gap-3 border-t-2 border-black pt-5">
                <span className="oh-save-btn relative inline-flex">
                  <Button className={`oh-save-label ${LIME_BTN}`}>
                    <Save size={14} /> Save Draft
                  </Button>
                  <span className="oh-saved absolute inset-0">
                    <Button className={`w-full ${LIME_BTN}`}>✓ Saved</Button>
                  </span>
                </span>
                <Button className={`oh-submit-btn ${DARK_BTN}`}>Submit For Review →</Button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Live preview */}
        <div className="oh-s4-preview lg:col-span-5">
          <div className="oh-border bg-white p-5 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <span className="oh-mono text-[0.6rem] font-bold uppercase tracking-[0.22em] text-black/50">Live Preview</span>
              <StatusBadge status="draft" />
            </div>
            <h4 className="oh-pv-title oh-display mt-3 text-xl leading-tight">Draft Title</h4>
            <div className="mt-4 grid gap-3 text-sm">
              <PreviewRow icon={<Package size={15} />} k="Quantity" valueClass="oh-pv-qty" />
              <PreviewRow icon={<DollarSign size={15} />} k="Price" valueClass="oh-pv-price" highlight />
              <PreviewRow icon={<MapPin size={15} />} k="Location" valueClass="oh-pv-location" />
            </div>
          </div>
        </div>
      </div>

      {/* Data packet */}
      <div
        className="oh-packet absolute left-1/2 top-1/2 z-40 h-16 w-16 -translate-x-1/2 -translate-y-1/2"
        style={{ background: "var(--lime)", border: "2px solid #000", boxShadow: "0 0 30px rgba(209,245,59,0.9)" }}
        aria-hidden
      />
    </section>
  );
}

function PreviewRow({ icon, k, valueClass, highlight }: { icon: React.ReactNode; k: string; valueClass: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 pb-2">
      <span className="oh-mono flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-black/45">
        {icon} {k}
      </span>
      <span className={`${valueClass} font-bold`} style={highlight ? { color: "var(--espresso)" } : undefined}>—</span>
    </div>
  );
}
