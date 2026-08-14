"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
type Stage = 1 | 2;
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
  const router = useRouter();
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
      await store.commitImport("manufacturer", {
        fileName,
        source: "csv_import",
        rows: validatedRows,
        externalSystemName: externalSystemName || undefined,
      });
      router.push("/demo/manufacturer/batches/import/inbox?channel=csv_import");
    });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Intake · CSV mapping"
        title="Bring in a spreadsheet"
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
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={loadSample}>
              <UploadCloud size={15} />
              Use the Nordväst ERP export
            </Button>
          </div>

          <Field label="External system" hint="Optional · detects updates">
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
          onContinue={handleCommit}
          pending={commitAction.pending}
          error={commitAction.error}
        />
      )}
    </div>
  );
}

function StepIndicator({ stage }: { stage: Stage }) {
  const steps: Array<{ step: Stage; label: string }> = [
    { step: 1, label: "Paste sheet" },
    { step: 2, label: "Map & send to inbox" },
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
  pending,
  error,
}: {
  sheet: DelimitedSheet;
  columnMap: Record<string, string>;
  onChangeMap: (header: string, field: string) => void;
  onBack: () => void;
  onContinue: () => void;
  pending?: boolean;
  error?: string | null;
}) {
  if (sheet.headers.length === 0) {
    return (
      <div className="space-y-5">
        <EmptyState
          title="Nothing to map"
          body="No columns found. Check the header row is included."
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
        {sheet.rows.length} row{sheet.rows.length === 1 ? "" : "s"}. Map each one to a CIRKA field:         unmapped columns are ignored.
      </p>

      {error && (
        <NoticeBanner tone="blocking" title="Couldn't queue these imports">
          {error}
        </NoticeBanner>
      )}

      <div className="space-y-4 rounded-xl border border-[var(--line)] bg-[#545454]/5 p-6 relative overflow-hidden">
        
        {/* Column Headers */}
        <div className="hidden sm:flex items-center gap-2 pb-2 border-b border-[var(--line)]/50">
          <div className="w-[42%] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Incoming Spreadsheet
          </div>
          <div className="flex-1" />
          <div className="w-[42%] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Cirka System
          </div>
        </div>

        {sheet.headers.map((header) => {
          const isMapped = !!columnMap[header];
          return (
            <div key={header} className="flex flex-col sm:flex-row items-center gap-2">
              
              {/* Incoming Node (Spreadsheet Field) */}
              <div className="flex w-full sm:w-[42%] flex-col justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm relative z-10">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--ink-muted)] opacity-50" />
                  <p className="truncate text-sm font-semibold tracking-tight text-[var(--ink)]">{header}</p>
                </div>
                {previewRow && (
                  <p className="truncate text-[11px] font-mono text-[var(--ink-muted)] mt-1.5 ml-4">
                    "{previewRow[header] || "-"}"
                  </p>
                )}
              </div>
              
              {/* Connection Wire */}
              <div className="hidden sm:flex flex-1 items-center justify-center relative">
                <div className={`h-[2px] w-full transition-all duration-300 ease-out ${isMapped ? "bg-[#FF5C00]" : "bg-[var(--line-strong)]"}`} />
                <div className={`absolute right-1/2 translate-x-1/2 w-2 h-2 rounded-full transition-all duration-300 ease-out ${isMapped ? "bg-[#FF5C00] shadow-[0_0_8px_#FF5C00]" : "bg-[var(--line-strong)]"}`} />
              </div>
              
              {/* Down Wire for Mobile */}
              <div className="flex sm:hidden py-1">
                <div className={`h-4 w-[2px] ${isMapped ? "bg-[#FF5C00]" : "bg-[var(--line-strong)]"}`} />
              </div>

              {/* Destination Node (CIRKA Field) */}
              <div className={`flex w-full sm:w-[42%] flex-col justify-center rounded-lg border p-3 shadow-sm relative z-10 transition-colors duration-300 ease-out ${isMapped ? "border-[#FF5C00]/40 bg-[#FF5C00]/[0.02]" : "border-[var(--line)] bg-[var(--surface)]"}`}>
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
            </div>
          );
        })}
      </div>

      <div className="flex justify-between border-t border-[var(--line)] pt-4">
        <Button variant="ghost" onClick={onBack} disabled={pending}>
          <ArrowLeft size={15} />
          Back
        </Button>
        <Button onClick={onContinue} disabled={pending}>
          Send to inbox
          <ArrowRight size={15} />
        </Button>
      </div>
    </Panel>
  );
}
