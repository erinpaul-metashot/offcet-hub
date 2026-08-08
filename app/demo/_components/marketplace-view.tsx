"use client";

/**
 * Marketplace — the listing surface shared by makers, brands and CIRKA.
 *
 * It browses like a catalogue: category first, then a card per lot carrying one
 * number, the quantity still open to enquiry. The rest of the ledger and the
 * supplier's identity are deliberately absent — a listing is a window, and what
 * you can see through it is CIRKA's to decide. Nothing here takes quantity.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Search } from "lucide-react";
import { Button, EmptyState, Input, Panel, Select } from "@/components/ui";
import { classNames } from "@/lib/utils";
import {
  FORMAT_LABELS,
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_FORMATS,
  QUALITY_CLASSES,
  QUALITY_CLASS_LABELS,
  type CirkaRole,
} from "../_mock/domain";
import {
  MARKETPLACE_SORTS,
  MARKETPLACE_SORT_LABELS,
  listMarketplaceLots,
  marketplaceCategoryCounts,
  marketplaceCountries,
  type MarketplaceFilters,
  type MarketplaceLot,
} from "../_mock/selectors-marketplace";
import { categoryLabel, formatQuantity } from "../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../_mock/store";
import {
  SectionHeading,
  ViewModeToggle,
  formatDate,
} from "./cirka-ui";
import { MaterialSwatch } from "./material-swatch";

const EMPTY_FILTERS: MarketplaceFilters = {
  category: "",
  format: "",
  qualityClass: "",
  country: "",
  search: "",
  sort: "newest",
};

/** Sort is a view preference, not a narrowing — it never lights up "clear". */
function isNarrowed(filters: MarketplaceFilters): boolean {
  return Boolean(
    filters.category || filters.format || filters.qualityClass || filters.country || filters.search,
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
      {children}
    </span>
  );
}

/**
 * A listing answers one quantity question: how much can I still ask for. The
 * rest of the ledger — reserved, allocated, dispatched — is internal supplier
 * business and is withheld on marketplace views.
 */
function LotQuantity({ lot, dense }: { lot: MarketplaceLot; dense?: boolean }) {
  const { batch } = lot;

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={classNames(
          "font-semibold leading-none tabular-nums tracking-[-0.03em] text-[var(--ink)]",
          dense ? "text-[17px]" : "text-[26px]",
        )}
      >
        {formatQuantity(batch.pots.available, batch.unit)}
      </span>
      <MicroLabel>available</MicroLabel>
    </div>
  );
}

/** Only shown when there is something to say — silence beats "no enquiries yet". */
function EnquiryNote({ lot }: { lot: MarketplaceLot }) {
  if (lot.viewerHasEnquired) {
    return (
      <span className="text-[11px] font-semibold text-[var(--brand-primary)]">
        Your enquiry is with CIRKA
      </span>
    );
  }

  if (lot.enquiryCount === 0) return null;

  return (
    <span className="text-[11px] text-[var(--ink-muted)]">
      {lot.enquiryCount} open enquir{lot.enquiryCount === 1 ? "y" : "ies"}
    </span>
  );
}

/**
 * The catalogue unit. Three beats, in order of what a buyer asks: what is it,
 * how much is left, can I trust it. Reference numbers, category names and the
 * full composition live on the detail page — the swatch already draws them.
 */
function LotCard({ lot, href }: { lot: MarketplaceLot; href: string }) {
  const { batch } = lot;

  return (
    <Panel interactive className="group overflow-hidden p-0">
      <Link href={href} className="flex h-full flex-col">
        <MaterialSwatch
          category={batch.materialCategory}
          format={batch.format}
          colour={batch.colour}
          imageUrl={batch.imageUrls?.[0]}
          className="h-44 shrink-0 border-b border-[var(--line)]"
        >
          {batch.qualityClass && (
            <span className="absolute right-3 top-3 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
              {QUALITY_CLASS_LABELS[batch.qualityClass]}
            </span>
          )}
          {/* Enquiry state is a condition of the lot, so it sits on the lot. */}
          <span className="absolute left-3 top-3 empty:hidden rounded-full bg-[var(--paper)]/90 px-2.5 py-1">
            <EnquiryNote lot={lot} />
          </span>
        </MaterialSwatch>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <div className="space-y-1">
            <h3 className="truncate text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
              {batch.name}
            </h3>
            <p className="truncate text-xs text-[var(--ink-muted)]">
              {/* What it is made of and roughly where it sits. Who holds it is
                  CIRKA's to disclose, so the listing never names them. */}
              {[batch.composition, lot.region].filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* The number and the way in, on one baseline. Provenance is a reason
              to trust a lot, not to open one — it waits on the detail page. */}
          <div className="mt-auto flex items-end justify-between gap-3">
            <LotQuantity lot={lot} />
            <ArrowRight
              size={16}
              className="shrink-0 text-[var(--ink-muted)] transition-[transform,color] duration-200 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]"
            />
          </div>
        </div>
      </Link>
    </Panel>
  );
}

/** The dense alternative: same facts, one line each, for comparing many lots. */
function LotRow({ lot, href }: { lot: MarketplaceLot; href: string }) {
  const { batch } = lot;
  const facts = [
    categoryLabel(batch.materialCategory),
    batch.format && FORMAT_LABELS[batch.format],
    batch.qualityClass && QUALITY_CLASS_LABELS[batch.qualityClass],
    batch.colour,
  ].filter(Boolean);

  return (
    <Link
      href={href}
      className="group grid items-center gap-x-6 gap-y-4 border-b border-[var(--line)] px-5 py-4 transition-colors duration-200 ease-[var(--ease-out)] last:border-b-0 hover:bg-[var(--surface)] lg:grid-cols-[3.5rem_minmax(0,1fr)_18rem_11rem]"
    >
      <MaterialSwatch
        category={batch.materialCategory}
        format={batch.format}
        imageUrl={batch.imageUrls?.[0]}
        className="hidden h-14 w-14 rounded-lg border border-[var(--line)] lg:block"
      />

      <div className="min-w-0 space-y-1.5">
        <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[var(--ink)]">
          {batch.name}
        </p>
        <p className="truncate text-xs text-[var(--ink-muted)]">
          {batch.reference} · {facts.join(" · ")}
        </p>
      </div>

      <LotQuantity lot={lot} dense />

      <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end lg:gap-1.5">
        <div className="space-y-1 lg:text-right">
          {lot.region && <p className="text-xs font-medium text-[var(--ink)]">{lot.region}</p>}
          <EnquiryNote lot={lot} />
        </div>
        <ArrowRight
          size={15}
          className="shrink-0 text-[var(--ink-muted)] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-[var(--brand-primary)]"
        />
      </div>
    </Link>
  );
}

/** Browse by what the material *is* before filtering by anything else. */
function CategoryChips({
  counts,
  active,
  onSelect,
  total,
}: {
  counts: Partial<Record<string, number>>;
  active: MarketplaceFilters["category"];
  onSelect: (category: MarketplaceFilters["category"]) => void;
  total: number;
}) {
  const options: Array<{ value: MarketplaceFilters["category"]; label: string; count: number }> = [
    { value: "", label: "Everything", count: total },
    ...MATERIAL_CATEGORIES.filter((value) => counts[value]).map((value) => ({
      value,
      label: MATERIAL_CATEGORY_LABELS[value],
      count: counts[value] ?? 0,
    })),
  ];

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const selected = (active ?? "") === option.value;

        return (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={selected}
            className={classNames(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out)]",
              selected
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--paper)]"
                : "border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink-muted)]",
            )}
          >
            {option.label}
            <span
              className={classNames(
                "tabular-nums",
                selected ? "text-[var(--paper)] opacity-70" : "text-[var(--ink-muted)]",
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MarketplaceView({
  role,
  hrefPrefix,
}: {
  /** Whose eyes. CIRKA sees supplier names; everyone else sees a region. */
  role: CirkaRole;
  hrefPrefix: string;
}) {
  const { db } = useDemoStore();
  const { scope } = useDemoPersona(role);
  const [filters, setFilters] = useState<MarketplaceFilters>(EMPTY_FILTERS);
  const [mode, setMode] = useState<"grid" | "list">("grid");

  const allLots = listMarketplaceLots(db, scope);
  const lots = listMarketplaceLots(db, scope, filters);
  const countries = marketplaceCountries(db);
  const counts = useMemo(() => marketplaceCategoryCounts(allLots), [allLots]);

  const pool = useMemo(() => {
    const batches = allLots.map((lot) => lot.batch);
    return {
      available: batches.reduce((sum, batch) => sum + batch.pots.available, 0),
      unit: batches[0]?.unit ?? "kg",
      newest: batches.reduce((latest, batch) => Math.max(latest, batch.releasedAt ?? 0), 0),
    };
  }, [allLots]);

  const narrowed = isNarrowed(filters);
  const set = (patch: Partial<MarketplaceFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  if (allLots.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Marketplace" title="Browse listed lots" />
        <EmptyState
          title="Nothing is listed yet"
          body="Lots appear once released for matching and reviewed."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Marketplace" title="Browse listed lots" />

      {/* The pool in one line: what is open to enquiry, and how fresh it is. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-4">
        <p className="text-sm text-[var(--ink)]">
          <span className="text-lg font-semibold tabular-nums tracking-[-0.03em]">
            {formatQuantity(pool.available, pool.unit)}
          </span>{" "}
          open to enquiry
          <span className="text-[var(--ink-muted)]">
            {" "}
            across {allLots.length} lot{allLots.length === 1 ? "" : "s"}
          </span>
        </p>
        {pool.newest > 0 && (
          <p className="text-[11px] text-[var(--ink-muted)]">
            Last listed {formatDate(pool.newest)}
          </p>
        )}
      </div>

      <CategoryChips
        counts={counts}
        active={filters.category}
        total={allLots.length}
        onSelect={(category) => set({ category })}
      />

      <Panel className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <Input
            placeholder="Search name, reference, composition or colour"
            value={filters.search ?? ""}
            onChange={(event) => set({ search: event.target.value })}
            className="h-10 border-transparent bg-[var(--surface)] pl-10 focus:border-[var(--brand-primary)] focus:bg-[var(--paper)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select
            value={filters.format}
            onChange={(event) => set({ format: event.target.value as MarketplaceFilters["format"] })}
            className="h-10 border-transparent bg-[var(--surface)] px-3 text-xs font-medium"
          >
            <option value="">All formats</option>
            {MATERIAL_FORMATS.map((value) => (
              <option key={value} value={value}>
                {FORMAT_LABELS[value]}
              </option>
            ))}
          </Select>
          <Select
            value={filters.qualityClass}
            onChange={(event) =>
              set({ qualityClass: event.target.value as MarketplaceFilters["qualityClass"] })
            }
            className="h-10 border-transparent bg-[var(--surface)] px-3 text-xs font-medium"
          >
            <option value="">Any grade</option>
            {QUALITY_CLASSES.map((value) => (
              <option key={value} value={value}>
                {QUALITY_CLASS_LABELS[value]}
              </option>
            ))}
          </Select>
          <Select
            value={filters.country}
            onChange={(event) => set({ country: event.target.value })}
            className="h-10 border-transparent bg-[var(--surface)] px-3 text-xs font-medium"
          >
            <option value="">Anywhere</option>
            {countries.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            value={filters.sort}
            onChange={(event) => set({ sort: event.target.value as MarketplaceFilters["sort"] })}
            className="h-10 border-transparent bg-[var(--surface)] px-3 text-xs font-medium"
            aria-label="Sort listed lots"
          >
            {MARKETPLACE_SORTS.map((value) => (
              <option key={value} value={value}>
                {MARKETPLACE_SORT_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        <ViewModeToggle value={mode} onChange={setMode} />
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--ink-muted)]">
          {narrowed
            ? `${lots.length} of ${allLots.length} listed lots`
            : `${lots.length} listed lots`}
        </p>
        {narrowed && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            <RotateCcw size={13} className="mr-2" />
            Clear filters
          </Button>
        )}
      </div>

      {lots.length === 0 ? (
        <EmptyState
          title="No listed lot matches those filters"
          body={`${allLots.length} lots are listed. Widen the search to see them.`}
        />
      ) : mode === "grid" ? (
        <div className="grid animate-stagger-in gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => (
            <LotCard key={lot.batch._id} lot={lot} href={`${hrefPrefix}/${lot.batch._id}`} />
          ))}
        </div>
      ) : (
        <Panel className="overflow-hidden">
          {lots.map((lot) => (
            <LotRow key={lot.batch._id} lot={lot} href={`${hrefPrefix}/${lot.batch._id}`} />
          ))}
        </Panel>
      )}
    </div>
  );
}
