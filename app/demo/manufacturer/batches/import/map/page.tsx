"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, UploadCloud } from "lucide-react";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import {
  IMPORT_COLUMNS,
  parseDelimitedSheet,
  validateRows,
  type DelimitedSheet,
  type ValidatedRow,
} from "../../../../_mock/operations/imports";
import { MATERIAL_CATEGORIES, type MaterialCategory, type Unit } from "../../../../_mock/domain";
import { categoryLabel, formatQuantity } from "../../../../_mock/selectors-shared";
import { useDemoStore } from "../../../../_mock/store";
import type { MockDatabase } from "../../../../_mock/types";
import { CirkaBadge, GapNote, NoticeBanner, SectionHeading } from "../../../../_components/cirka-ui";
import { useAction } from "../../../../_components/use-action";

type ImportColumn = (typeof IMPORT_COLUMNS)[number];
type Stage = 1 | 2 | 3;
type RowClassification = "new" | "update" | "invalid";

const COLUMN_LABELS: Record<ImportColumn, string> = {
  name: "Name",
  description: "Description",
  materialCategory: "Material category",
  quantity: "Quantity",
  unit: "Unit",
  composition: "Composition",
  locationText: "Location",
  externalRecordId: "External record ID",
};

const AUTO_GUESS: Array<{ test: RegExp; field: ImportColumn }> = [
  { test: /namn|artikel|^name$/i, field: "name" },
  { test: /beskriv|description/i, field: "description" },
  { test: /material|typ/i, field: "materialCategory" },
  { test: /mängd|quantity|qty|amount/i, field: "quantity" },
  { test: /enhet|unit/i, field: "unit" },
  { test: /sammansättning|composition/i, field: "composition" },
  { test: /lagerplats|location|plats/i, field: "locationText" },
  { test: /erp|reference|ref.?id/i, field: "externalRecordId" },
];

function guessField(header: string): ImportColumn | "" {
  return AUTO_GUESS.find((rule) => rule.test.test(header))?.field ?? "";
}

const SAMPLE_FILE_NAME = "nordvast-erp-export.csv";
const SAMPLE_SYSTEM_NAME = "Nordväst ERP";
const SAMPLE_SHEET = [
  "Artikelnamn;Beskrivning;Materialtyp;Mängd;Enhet;Sammansättning;Lagerplats;ERP-ID",
  "Vävrester bomull;Kvarvarande vävstycken från produktionslinje 3;cotton_offcuts;420;kg;100% bomull;Lager B, hylla 12;NVT-WASTE-2026-0198",
  "Vävband och kantband, omvägt;Uppdaterad vikt efter andra vägningen vid lastkajen;trims;205;kg;100% bomull;Industrigatan 14;NVT-WASTE-2026-0221",
  "Blandat spill;Kasserat material med blandad sammansättning;okänd;;kg;;Lager B, hylla 7;NVT-WASTE-2026-0233",
].join("\n");

function classifyRow(
  row: ValidatedRow,
  db: MockDatabase,
  externalSystemName: string,
): RowClassification {
  if (!row.valid) {
    return "invalid";
  }

  const recordId = row.values.externalRecordId;

  if (externalSystemName && recordId) {
    const matches = db.resourceBatches.some(
      (batch) => batch.externalSystemName === externalSystemName && batch.externalRecordId === recordId,
    );

    if (matches) {
      return "update";
    }
  }

  return "new";
}

export default function ImportMappingWizardPage() {
  const store = useDemoStore();
  const commitAction = useAction();

  const [stage, setStage] = useState<Stage>(1);
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [externalSystemName, setExternalSystemName] = useState("");
  const [sheet, setSheet] = useState<DelimitedSheet | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ created: number; updated: number; failed: number } | null>(
    null,
  );

  const validatedRows = useMemo<ValidatedRow[]>(() => {
    if (!sheet) {
      return [];
    }

    const parsedRows = sheet.rows.map((row, index) => ({
      rowNumber: index + 1,
      values: sheet.headers.reduce<Record<string, string>>((values, header) => {
        const field = columnMap[header];
        return field ? { ...values, [field]: row[header] ?? "" } : values;
      }, {}),
    }));

    return validateRows(parsedRows);
  }, [sheet, columnMap]);

  const classifiedRows = useMemo(
    () =>
      validatedRows.map((row) => ({
        row,
        classification: classifyRow(row, store.db, externalSystemName),
      })),
    [validatedRows, store.db, externalSystemName],
  );

  const totals = classifiedRows.reduce(
    (acc, entry) => ({ ...acc, [entry.classification]: acc[entry.classification] + 1 }),
    { new: 0, update: 0, invalid: 0 } as Record<RowClassification, number>,
  );

  const loadSample = () => {
    setRawText(SAMPLE_SHEET);
    setFileName(SAMPLE_FILE_NAME);
    setExternalSystemName(SAMPLE_SYSTEM_NAME);
  };

  const goToMapping = () => {
    const parsed = parseDelimitedSheet(rawText);
    setSheet(parsed);
    setColumnMap(
      parsed.headers.reduce<Record<string, string>>(
        (map, header) => ({ ...map, [header]: guessField(header) }),
        {},
      ),
    );
    setStage(2);
  };

  const startOver = () => {
    setStage(1);
    setRawText("");
    setFileName(undefined);
    setExternalSystemName("");
    setSheet(null);
    setColumnMap({});
    setResult(null);
    commitAction.clearError();
  };

  const handleCommit = () =>
    commitAction.run(async () => {
      const outcome = await store.commitImport("manufacturer", {
        fileName,
        source: "csv_import",
        rows: validatedRows,
        externalSystemName: externalSystemName || undefined,
      });
      setResult(outcome);
    });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Intake · CSV mapping"
        title="Bring in a spreadsheet"
        description="Paste a sheet, tell CIRKA which column is which, then confirm before anything is created."
        action={
          <Button as={Link} href="/demo/manufacturer/batches/import" variant="secondary" size="sm">
            <ArrowLeft size={15} />
            Back to intake
          </Button>
        }
      />

      <StepIndicator stage={stage} />

      {stage === 1 && (
        <Panel className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ink-muted)]">
              Paste rows copied from a spreadsheet, or load a sample export whose columns don&apos;t
              already match CIRKA&apos;s field names.
            </p>
            <Button variant="secondary" size="sm" onClick={loadSample}>
              <UploadCloud size={15} />
              Use the Nordväst ERP export
            </Button>
          </div>

          <Field
            label="External system"
            hint="Only needed if this sheet came from a connected system — used to detect updates to batches CIRKA already has."
          >
            <Input
              value={externalSystemName}
              onChange={(event) => setExternalSystemName(event.target.value)}
              placeholder="e.g. Nordväst ERP"
            />
          </Field>

          <Field label="Sheet contents" required>
            <Textarea
              rows={10}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste comma- or semicolon-separated rows here, header row first…"
            />
          </Field>

          <div className="flex justify-end border-t border-[var(--line)] pt-4">
            <Button disabled={!rawText.trim()} onClick={goToMapping}>
              Continue to column mapping
              <ArrowRight size={15} />
            </Button>
          </div>
        </Panel>
      )}

      {stage === 2 && sheet && (
        <StageMap
          sheet={sheet}
          columnMap={columnMap}
          onChangeMap={(header, field) => setColumnMap((current) => ({ ...current, [header]: field }))}
          onBack={() => setStage(1)}
          onContinue={() => setStage(3)}
        />
      )}

      {stage === 3 && (
        <StageResolve
          classifiedRows={classifiedRows}
          totals={totals}
          error={commitAction.error}
          pending={commitAction.pending}
          result={result}
          onBack={() => setStage(2)}
          onCommit={handleCommit}
          onStartOver={startOver}
        />
      )}
    </div>
  );
}

function StepIndicator({ stage }: { stage: Stage }) {
  const steps: Array<{ step: Stage; label: string }> = [
    { step: 1, label: "Paste sheet" },
    { step: 2, label: "Map columns" },
    { step: 3, label: "Resolve & commit" },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map(({ step, label }, index) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
              step === stage
                ? "text-[var(--brand-primary)]"
                : step < stage
                  ? "text-[var(--ink)]"
                  : "text-[var(--ink-muted)]"
            }`}
          >
            {label}
          </span>
          {index < steps.length - 1 && <ArrowRight size={12} className="text-[var(--line-strong)]" />}
        </div>
      ))}
    </div>
  );
}

function StageMap({
  sheet,
  columnMap,
  onChangeMap,
  onBack,
  onContinue,
}: {
  sheet: DelimitedSheet;
  columnMap: Record<string, string>;
  onChangeMap: (header: string, field: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  if (sheet.headers.length === 0) {
    return (
      <div className="space-y-5">
        <EmptyState
          title="Nothing to map"
          body="That paste didn't produce any columns. Go back and check the header row is included."
        />
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={15} />
          Back
        </Button>
      </div>
    );
  }

  const previewRow = sheet.rows[0];

  return (
    <Panel className="space-y-5 p-6">
      <p className="text-sm text-[var(--ink-muted)]">
        {sheet.headers.length} column{sheet.headers.length === 1 ? "" : "s"} found across{" "}
        {sheet.rows.length} row{sheet.rows.length === 1 ? "" : "s"}. Map each one to a CIRKA field —
        unmapped columns are ignored.
      </p>

      <div className="divide-y divide-[var(--line)]">
        {sheet.headers.map((header) => (
          <div
            key={header}
            className="grid grid-cols-1 items-center gap-3 py-3 sm:grid-cols-[1fr_auto_14rem]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--ink)]">{header}</p>
              {previewRow && (
                <p className="truncate text-xs text-[var(--ink-muted)]">
                  e.g. {previewRow[header] || "—"}
                </p>
              )}
            </div>
            <ArrowRight size={14} className="hidden text-[var(--line-strong)] sm:block" />
            <Select
              value={columnMap[header] ?? ""}
              onChange={(event) => onChangeMap(header, event.target.value)}
            >
              <option value="">Ignore this column</option>
              {IMPORT_COLUMNS.map((field) => (
                <option key={field} value={field}>
                  {COLUMN_LABELS[field]}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>

      <div className="flex justify-between border-t border-[var(--line)] pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={15} />
          Back
        </Button>
        <Button onClick={onContinue}>
          Continue to resolution
          <ArrowRight size={15} />
        </Button>
      </div>
    </Panel>
  );
}

function StageResolve({
  classifiedRows,
  totals,
  error,
  pending,
  result,
  onBack,
  onCommit,
  onStartOver,
}: {
  classifiedRows: Array<{ row: ValidatedRow; classification: RowClassification }>;
  totals: Record<RowClassification, number>;
  error: string | null;
  pending: boolean;
  result: { created: number; updated: number; failed: number } | null;
  onBack: () => void;
  onCommit: () => void;
  onStartOver: () => void;
}) {
  if (result) {
    return (
      <div className="space-y-5">
        <NoticeBanner tone="info" title="Import committed">
          {result.created} batch{result.created === 1 ? "" : "es"} created, {result.updated} updated,{" "}
          {result.failed} row{result.failed === 1 ? "" : "s"} could not be imported.
        </NoticeBanner>
        <div className="flex gap-3">
          <Button as={Link} href="/demo/manufacturer/batches/import" variant="secondary">
            Back to intake
          </Button>
          <Button onClick={onStartOver}>Map another sheet</Button>
        </div>
      </div>
    );
  }

  const committable = totals.new + totals.update;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] px-6 py-4">
        <Total label="New" count={totals.new} />
        <Total label="Update" count={totals.update} />
        <Total label="Cannot import" count={totals.invalid} />
      </div>

      {error && (
        <NoticeBanner tone="blocking" title="Couldn't commit this import">
          {error}
        </NoticeBanner>
      )}

      <Panel className="divide-y divide-[var(--line)] p-0">
        {classifiedRows.map(({ row, classification }) => (
          <div key={row.rowNumber} className="space-y-2 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[var(--ink)]">
                  {row.values.name || `Row ${row.rowNumber}`}
                </p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {row.values.quantity && row.values.unit
                    ? formatQuantity(Number(row.values.quantity), row.values.unit as Unit)
                    : "No quantity mapped"}
                  {row.values.materialCategory &&
                  MATERIAL_CATEGORIES.includes(row.values.materialCategory as MaterialCategory)
                    ? ` · ${categoryLabel(row.values.materialCategory as MaterialCategory)}`
                    : ""}
                </p>
              </div>
              {classification === "new" && <CirkaBadge status="available" label="New" />}
              {classification === "update" && <CirkaBadge status="in_progress" label="Update" />}
              {classification === "invalid" && <CirkaBadge status="failed" label="Cannot import" />}
            </div>
            {row.errors.length > 0 && (
              <ul className="space-y-1">
                {row.errors.map((issue, index) => (
                  <li key={index} className="text-sm">
                    <GapNote>{issue.message}</GapNote>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </Panel>

      <div className="flex justify-between border-t border-[var(--line)] pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={15} />
          Back to mapping
        </Button>
        <Button disabled={pending || committable === 0} onClick={onCommit}>
          Commit {committable} batch{committable === 1 ? "" : "es"}
        </Button>
      </div>
    </div>
  );
}

function Total({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-semibold tabular-nums text-[var(--ink)]">{count}</span>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {label}
      </span>
    </div>
  );
}
