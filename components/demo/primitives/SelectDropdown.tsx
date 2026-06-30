"use client";

import { LOT_CATEGORIES } from "@/components/demo/core/mock-data";

/**
 * SelectDropdown — a visual overlay that simulates an open <select> dropdown.
 * Shows a list of options with one highlighted.
 */
export function SelectDropdown({
  options,
  highlightIndex,
  visible,
  className,
}: {
  options: string[];
  highlightIndex: number;
  visible: boolean;
  className?: string;
}) {
  if (!visible) return null;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 50,
        border: "1px solid var(--line)",
        backgroundColor: "var(--paper)",
        maxHeight: 200,
        overflow: "auto",
      }}
    >
      {options.map((option, i) => (
        <div
          key={option}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: i === highlightIndex ? "var(--brand-green-muted)" : "transparent",
            color: i === highlightIndex ? "var(--brand-green)" : "var(--ink)",
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
        >
          {option}
        </div>
      ))}
    </div>
  );
}
