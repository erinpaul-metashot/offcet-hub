"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudDownload, FileSpreadsheet, Keyboard, PlugZap, Database, Import, X } from "lucide-react";
import { useDemoStore } from "../../../_mock/store";
import { useAction } from "../../../_components/use-action";
import { Button } from "@/components/ui";

const OUTER_RADIUS = 120;
const INNER_RADIUS = 40;

function getSegmentPath(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) {
  // Convert angle to radians, subtract 90 so 0 is at 12 o'clock
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);

  const x1 = innerRadius * Math.cos(startRad);
  const y1 = innerRadius * Math.sin(startRad);
  const x2 = outerRadius * Math.cos(startRad);
  const y2 = outerRadius * Math.sin(startRad);
  const x3 = outerRadius * Math.cos(endRad);
  const y3 = outerRadius * Math.sin(endRad);
  const x4 = innerRadius * Math.cos(endRad);
  const y4 = innerRadius * Math.sin(endRad);

  // For 90 degree segments, large-arc-flag is always 0
  return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`;
}

function getCenterPoint(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) {
  const midRad = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
  const r = (innerRadius + outerRadius) / 2;
  return {
    x: r * Math.cos(midRad),
    y: r * Math.sin(midRad),
  };
}

const SEGMENTS = [
  {
    id: "manual",
    label: "Manual Entry",
    description: "Type one batch",
    start: -45,
    end: 45,
    icon: Keyboard,
    actionType: "route",
    target: "/demo/manufacturer/batches/new",
  },
  {
    id: "retexcir",
    label: "Retexcir",
    description: "Pull sorted batch",
    start: 45,
    end: 135,
    icon: PlugZap,
    actionType: "action",
  },
  {
    id: "csv",
    label: "Spreadsheet",
    description: "Upload CSV",
    start: 135,
    end: 225,
    icon: FileSpreadsheet,
    actionType: "route",
    target: "/demo/manufacturer/batches/import/map",
  },
  {
    id: "erp",
    label: "ERP",
    description: "Nordväst Sync",
    start: 225,
    end: 315,
    icon: Database,
    actionType: "action",
  },
];

export function ImportWheel({
  isConnectedToRetexcir,
  onOpenSettings,
}: {
  isConnectedToRetexcir: boolean;
  onOpenSettings: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const router = useRouter();
  const store = useDemoStore();
  const pullRetexcir = useAction();
  const pullErp = useAction();

  const hoveredSegment = SEGMENTS.find((s) => s.id === hoveredId);

  const handleSegmentClick = async (segment: typeof SEGMENTS[0]) => {
    if (segment.actionType === "route" && segment.target) {
      router.push(segment.target);
    } else if (segment.id === "retexcir") {
      if (!isConnectedToRetexcir) {
        onOpenSettings();
      } else {
        await pullRetexcir.run(() => store.pullRetexcirRecords("manufacturer"));
      }
    } else if (segment.id === "erp") {
      // ERP is mocked as always connected in this demo, just run the pull
      await pullErp.run(() =>
        store.receiveArrival("manufacturer", {
          channel: "erp_import",
          externalSystemName: "Nordväst ERP",
        })
      );
    }
  };

  const isPending = pullRetexcir.pending || pullErp.pending;

  if (!isOpen && !isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF5C00]/10 text-[#FF5C00]">
          <Import size={32} />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-[var(--ink)]">Import New Material</h3>
        <p className="mb-6 max-w-sm text-sm text-[var(--ink-muted)]">
          Pull records from integrated systems, upload a spreadsheet, or log a batch manually.
        </p>
        <Button onClick={() => setIsOpen(true)} className="bg-[#FF5C00] text-white hover:bg-[#E55300]">
          Start Import
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      <div className="relative h-[280px] w-[280px] animate-in zoom-in-95 duration-200">
        <svg
          viewBox="-130 -130 260 260"
          className="absolute inset-0 h-full w-full drop-shadow-xl"
        >
          {/* Wheel Segments */}
          {SEGMENTS.map((segment) => {
            const isHovered = hoveredId === segment.id;
            const path = getSegmentPath(segment.start, segment.end, INNER_RADIUS, OUTER_RADIUS);
            const center = getCenterPoint(segment.start, segment.end, INNER_RADIUS, OUTER_RADIUS);

            return (
              <g
                key={segment.id}
                onMouseEnter={() => setHoveredId(segment.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => !isPending && handleSegmentClick(segment)}
                className={`cursor-pointer transition-all duration-200 ease-out ${
                  isPending ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  transformOrigin: "0 0",
                  transform: isHovered ? "scale(1.03)" : "scale(1)",
                }}
              >
                <path
                  d={path}
                  fill={isHovered ? "#FF5C00" : "var(--surface)"}
                  stroke="var(--line)"
                  strokeWidth="2"
                  className="transition-colors duration-200"
                />
                <foreignObject
                  x={center.x - 24}
                  y={center.y - 24}
                  width="48"
                  height="48"
                  className="pointer-events-none flex items-center justify-center"
                >
                  <div
                    className={`flex h-full w-full flex-col items-center justify-center transition-colors duration-200 ${
                      isHovered ? "text-white" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    <segment.icon size={24} />
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Center Hole */}
          <circle
            cx="0"
            cy="0"
            r={INNER_RADIUS - 4}
            fill="var(--background)"
            stroke="var(--line)"
            strokeWidth="1"
            className="shadow-inner"
          />
        </svg>

        {/* Center Content (Absolute positioned over SVG center) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {isPending ? (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-md">
              <CloudDownload size={24} className="animate-bounce text-[#FF5C00]" />
            </div>
          ) : (
            <button
              onClick={() => setIsOpen(false)}
              className="pointer-events-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-[var(--surface)]"
            >
              {hoveredSegment ? (
                <div className="animate-in fade-in zoom-in duration-200">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#FF5C00]">
                    {hoveredSegment.label}
                  </span>
                </div>
              ) : (
                <X size={24} className="text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 h-12 text-center">
        {hoveredSegment && !isPending && (
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-200">
            <h3 className="text-lg font-semibold text-[var(--ink)]">{hoveredSegment.label}</h3>
            <p className="text-sm text-[var(--ink-muted)]">{hoveredSegment.description}</p>
          </div>
        )}
        {isPending && (
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-200">
            <h3 className="text-lg font-semibold text-[var(--ink)]">Pulling records...</h3>
            <p className="text-sm text-[var(--ink-muted)]">Checking integrations</p>
          </div>
        )}
        {!hoveredSegment && !isPending && (
          <div className="animate-in fade-in duration-500">
            <h3 className="text-lg font-semibold text-[var(--ink)]">Select a channel</h3>
            <p className="text-sm text-[var(--ink-muted)]">Click the center to cancel</p>
          </div>
        )}
      </div>

      {(pullRetexcir.error || pullErp.error) && (
        <div className="mt-4 text-center text-sm font-medium text-[#8A3D11]">
          {pullRetexcir.error || pullErp.error}
        </div>
      )}
    </div>
  );
}

