"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button, EmptyState, Input, Panel, Select } from "@/components/ui";
import { statusLabel } from "../../_mock/domain";
import { listMakerRequests } from "../../_mock/selectors-maker";
import { categoryLabel, formatQuantity, isOverdue } from "../../_mock/selectors-shared";
import { useDemoPersona, useDemoStore } from "../../_mock/store";
import { CirkaBadge, GapNote, NoticeBanner, SectionHeading, formatDate } from "../../_components/cirka-ui";
import { NewRequestDrawer, type NewRequestValues } from "../../_components/new-request-drawer";
import { RequestDetailDrawer } from "../../_components/request-detail-drawer";
import { useAction } from "../../_components/use-action";

function toTimestamp(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(`${value}T12:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const EMPTY_FORM: NewRequestValues = {
  title: "",
  materialCategory: "linen",
  materialDescription: "",
  quantityNeeded: "",
  unit: "kg",
  intendedProduct: "",
  neededBy: "",
  productionLocationPreference: "",
};

const CLOSED_STATUSES = ["fulfilled", "closed", "cancelled"];

export default function MakerRequestsPage() {
  const store = useDemoStore();
  const { scope } = useDemoPersona("maker");
  const { run, error, pending } = useAction();

  const rows = listMakerRequests(store.db, scope.orgId);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [form, setForm] = useState<NewRequestValues>(EMPTY_FORM);

  const statuses = useMemo(
    () => Array.from(new Set(rows.map((row) => row.request.status))),
    [rows],
  );

  const filteredRows = rows.filter(({ request }) => {
    const matchesStatus = status ? request.status === status : true;
    const query = search.trim().toLowerCase();
    const matchesSearch = query
      ? `${request.title} ${request.reference}`.toLowerCase().includes(query)
      : true;
    return matchesStatus && matchesSearch;
  });

  const selectedRow = rows.find((row) => row.request._id === selectedRequestId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    await run(async () => {
      await store.createResourceRequest("maker", {
        title: form.title,
        materialCategory: form.materialCategory,
        materialDescription: form.materialDescription || undefined,
        quantityNeeded: Number(form.quantityNeeded),
        unit: form.unit,
        intendedProduct: form.intendedProduct || undefined,
        neededBy: toTimestamp(form.neededBy),
        productionLocationPreference: form.productionLocationPreference || undefined,
        submitImmediately: true,
      });

      setForm(EMPTY_FORM);
      setComposeOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Demand"
        title="Material you have asked for"
        description="Makers can submit demand directly. CIRKA shortlists candidates and records the match with a written reason, exactly as it does for a brand brief."
        action={
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            New request
          </Button>
        }
      />

      {error && !composeOpen && (
        <NoticeBanner tone="blocking" title="The request was not submitted">
          {error}
        </NoticeBanner>
      )}

      <Panel className="p-5">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Input
            placeholder="Search title or reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      {filteredRows.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState title="No requests yet" body="Requests you submit will be listed here." />
        ) : (
          <EmptyState
            title="No requests match this filter"
            body="Clear the search or status filter to see every request."
          />
        )
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  <th className="py-3 pl-5 pr-4">Reference</th>
                  <th className="py-3 pr-4">Request</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4 text-right">Quantity</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Needed by</th>
                  <th className="py-3 pr-5" aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ request }) => {
                  const overdue = isOverdue(request.neededBy) && !CLOSED_STATUSES.includes(request.status);

                  return (
                    <tr
                      key={request._id}
                      onClick={() => setSelectedRequestId(request._id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedRequestId(request._id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="group cursor-pointer border-b border-[var(--line)] align-top transition-colors duration-150 ease-[var(--ease-out)] last:border-b-0 hover:bg-[var(--surface)]"
                    >
                      <td className="py-3.5 pl-5 pr-4 whitespace-nowrap text-[var(--ink-muted)]">
                        {request.reference}
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-[var(--ink)]">{request.title}</p>
                        {request.intendedProduct && (
                          <p className="text-xs text-[var(--ink-muted)]">{request.intendedProduct}</p>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-[var(--ink-muted)]">
                        {categoryLabel(request.materialCategory)}
                      </td>
                      <td className="py-3.5 pr-4 text-right tabular-nums text-[var(--ink)]">
                        {formatQuantity(request.quantityMatched, request.unit)} /{" "}
                        {formatQuantity(request.quantityNeeded, request.unit)}
                      </td>
                      <td className="py-3.5 pr-4">
                        <CirkaBadge status={request.status} />
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-[var(--ink-muted)]">
                        {formatDate(request.neededBy)}
                        {overdue && (
                          <>
                            {" · "}
                            <GapNote>overdue</GapNote>
                          </>
                        )}
                      </td>
                      <td className="py-3.5 pr-5 text-[var(--ink-muted)]">
                        <ChevronRight
                          size={16}
                          className="transition-transform duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {selectedRow && (
        <RequestDetailDrawer
          request={selectedRow.request}
          matches={selectedRow.matches}
          onClose={() => setSelectedRequestId(null)}
        />
      )}

      {composeOpen && (
        <NewRequestDrawer
          values={form}
          onChange={setForm}
          error={error}
          pending={pending}
          onSubmit={submit}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </div>
  );
}
