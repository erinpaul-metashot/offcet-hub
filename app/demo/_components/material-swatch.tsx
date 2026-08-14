/**
 * A listing needs a picture. CIRKA has none — surplus material is described, not
 * photographed — so the tile is drawn from the fields that were actually
 * recorded: the format sets the weave, the category is the ghosted wordmark, the
 * stated colour is the caption. Nothing here is decoration; every mark is data.
 */

import {
  MATERIAL_CATEGORY_LABELS,
  type MaterialCategory,
  type MaterialFormat,
} from "../_mock/domain";
import { classNames } from "@/lib/utils";

/** How the material is physically held, read as a surface. */
const WEAVE: Record<MaterialFormat, { image: string; size?: string }> = {
  roll: { image: "repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 13px)" },
  bale: {
    image:
      "repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 20px), repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 20px)",
  },
  cut_pieces: {
    image:
      "repeating-linear-gradient(45deg, var(--line) 0 1px, transparent 1px 11px), repeating-linear-gradient(-45deg, var(--line) 0 1px, transparent 1px 11px)",
  },
  loose: { image: "radial-gradient(var(--line) 1.3px, transparent 1.4px)", size: "13px 13px" },
  garment: { image: "repeating-linear-gradient(135deg, var(--line) 0 1px, transparent 1px 9px)" },
  other: { image: "repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 16px)" },
};

export function MaterialSwatch({
  category,
  format,
  colour,
  imageUrl,
  className,
  children,
}: {
  category: MaterialCategory;
  format?: MaterialFormat;
  /** The manufacturer's own words for the colour, captioned as stated. */
  colour?: string;
  imageUrl?: string;
  className?: string;
  /** Overlays — grade, enquiry markers. Positioned by the caller. */
  children?: React.ReactNode;
}) {
  const weave = WEAVE[format ?? "other"];

  return (
    <div
      className={classNames(
        "relative flex items-end overflow-hidden bg-[var(--surface)]",
        className,
      )}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={MATERIAL_CATEGORY_LABELS[category]}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: weave.image, backgroundSize: weave.size }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-2 -left-1 select-none text-[3.25rem] font-bold uppercase leading-none tracking-[-0.04em] text-[var(--ink)] opacity-[0.07]"
          >
            {MATERIAL_CATEGORY_LABELS[category]}
          </span>
        </>
      )}

      {colour && (
        <span
          className={classNames(
            "relative z-10 m-3 max-w-[70%] truncate rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
            imageUrl
              ? "bg-black/60 text-white backdrop-blur-md border border-white/20"
              : "bg-[var(--paper)]/85 text-[var(--ink-muted)]",
          )}
        >
          {colour}
        </span>
      )}

      {children}
    </div>
  );
}
