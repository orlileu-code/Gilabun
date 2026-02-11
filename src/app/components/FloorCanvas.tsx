"use client";

import { useCallback, useRef, useEffect, useState, useMemo, memo } from "react";
import { getCanvasSize, getFitScaleAndOffset } from "@/lib/floorLayout";
import { TableTile } from "./TableTile";
import { Panel, Tile } from "@/ui";
import { TableStatus } from "@/lib/enums";
import type { WorkspaceParty, WorkspaceCombo } from "./WorkspaceServiceView";

const DRAG_TYPE = "application/x-gilabun-party";
/** Visual gap between tables in workspace mode (render pixels) so tables don't touch. */
const TABLE_GAP_RENDER_PX = 4;

export type TemplateTable = {
  tableNumber: number;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg?: number;
};

export type TableState = {
  id: string;
  tableNumber?: number;
  status: string;
  capacity: number;
  baseCapacity?: number;
  capacityOverride?: number;
  inComboId?: string | null;
  lastSeatedAt: Date | null;
  expectedFreeAt: Date | null;
  currentPartyId?: string | null;
  currentPartyName?: string | null;
  number?: number;
  label?: string;
};

export type TemplateLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

type FloorCanvasProps = {
  templateTables: TemplateTable[];
  templateLabels?: TemplateLabel[];
  tableStates: TableState[];
  combos?: WorkspaceCombo[];
  selectedTableNumbers?: Set<number>;
  onToggleTableSelection?: (tableNumber: number) => void;
  onMerge?: () => void;
  mergeLoading?: boolean;
  parties?: WorkspaceParty[];
  mode: "builder" | "workspace";
  workspaceId?: string;
  draggingPartySize?: number | null;
  onSeatParty?: (
    partyId: string,
    partyName: string,
    partySize: number,
    tableNumber: number
  ) => void;
  markTableTurningFormAction?: (formData: FormData) => Promise<void>;
  clearTableFormAction?: (formData: FormData) => Promise<void>;
  bumpExpectedFreeAtFormAction?: (formData: FormData) => Promise<void>;
  markTableTurningAction?: (
    workspaceId: string,
    tableNumber: number,
    turningMinutes?: number
  ) => Promise<{ error?: string }>;
  addMinutesToTableAction?: (
    workspaceId: string,
    tableNumber: number,
    minutesToAdd?: number
  ) => Promise<{ error?: string }>;
  addChairAction?: (workspaceId: string, tableNumber: number) => Promise<{ error?: string }>;
  removeChairAction?: (workspaceId: string, tableNumber: number) => Promise<{ error?: string }>;
  onClearTable?: (tableNumber: number) => Promise<void>;
  onMarkTurning?: (tableNumber: number, turningMinutes?: number) => Promise<void>;
  onAddMinutes?: (tableNumber: number, minutesToAdd?: number) => Promise<void>;
  inFlightTableNumbers?: Record<number, string>;
  onSeatPartyAtCombo?: (
    partyId: string,
    partyName: string,
    partySize: number,
    comboId: string
  ) => void;
  onComboClick?: (combo: WorkspaceCombo) => void;
  showToast?: (message: string) => void;
  onClearSuccess?: () => void;
  /** Current time snapshot (ms) for consistent “overdue” calculations. */
  nowMs: number;
};

/**
 * Shared floor canvas.
 * - Builder mode: true coordinates 1:1, fixed canvas size.
 * - Workspace mode: fit-to-canvas scaling + centering (per-element coords, no parent transform).
 */
function FloorCanvasInner({
  templateTables,
  templateLabels,
  tableStates,
  combos = [],
  selectedTableNumbers = new Set(),
  onToggleTableSelection,
  parties = [],
  mode,
  workspaceId,
  draggingPartySize = null,
  onSeatParty,
  onSeatPartyAtCombo,
  onComboClick,
  markTableTurningFormAction = async () => {},
  clearTableFormAction = async () => {},
  bumpExpectedFreeAtFormAction = async () => {},
  markTableTurningAction,
  addMinutesToTableAction,
  addChairAction,
  removeChairAction,
  onClearTable,
  onMarkTurning,
  onAddMinutes,
  inFlightTableNumbers = {},
  showToast,
  onClearSuccess,
  nowMs
}: FloorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.count("FloorCanvas render");
  }

  const tableByNumber = useMemo(() => {
    const m = new Map<number, TableState>();
    for (const t of tableStates) {
      const num = t.tableNumber ?? Number(t.id);
      if (Number.isFinite(num)) m.set(num, t);
    }
    return m;
  }, [tableStates]);

  const safeLabels = useMemo(() => templateLabels ?? [], [templateLabels]);
  const combinedBoundsForFit = useMemo(
    () => [
      ...templateTables.map((t) => ({ x: t.x, y: t.y, w: t.w, h: t.h })),
      ...safeLabels.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h }))
    ],
    [templateTables, safeLabels]
  );

  // Builder: fixed canvas from layout bounds (tables only; builder doesn't use FloorCanvas for labels)
  const { width: canvasWidth, height: canvasHeight } = useMemo(
    () => getCanvasSize(templateTables),
    [templateTables]
  );

  // Workspace: measure container and compute fit scale + offset (per-element, no CSS scale)
  useEffect(() => {
    if (mode !== "workspace" || !containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      setContainerSize({ width: el.clientWidth || 0, height: el.clientHeight || 0 });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const fit = useMemo(
    () =>
      mode === "workspace" && containerSize.width > 0 && containerSize.height > 0
        ? getFitScaleAndOffset(
            combinedBoundsForFit.length > 0
              ? combinedBoundsForFit
              : [{ x: 0, y: 0, w: 400, h: 300 }],
            containerSize.width,
            containerSize.height
          )
        : null,
    [mode, containerSize.width, containerSize.height, combinedBoundsForFit]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, tableNumber: number) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(DRAG_TYPE);
      if (!raw || !onSeatParty) return;
      try {
        const { partyId, partyName, partySize } = JSON.parse(raw);
        if (partyId && partyName != null && Number.isFinite(partySize)) {
          onSeatParty(partyId, partyName, partySize, tableNumber);
        }
      } catch {
        // ignore
      }
    },
    [onSeatParty]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Compute workspace mode values unconditionally (hooks must be called in same order)
  const scale = fit?.scale ?? 1;
  const offsetX = fit?.offsetX ?? 0;
  const offsetY = fit?.offsetY ?? 0;
  const minX = fit?.minX ?? 0;
  const minY = fit?.minY ?? 0;

  // All hooks must be called before any early returns
  const labelsRender = useMemo(
    () =>
      safeLabels.map((label) => {
        const rotDeg = label.rotDeg ?? 0;
        return {
          ...label,
          renderX: (label.x - minX) * scale + offsetX,
          renderY: (label.y - minY) * scale + offsetY,
          renderW: label.w * scale,
          renderH: label.h * scale,
          rotDeg
        };
      }),
    [safeLabels, minX, minY, scale, offsetX, offsetY]
  );

  const tablesRender = useMemo(
    () =>
      templateTables.map((item) => {
        const rotDeg = item.rotDeg ?? 0;
        return {
          ...item,
          renderX: (item.x - minX) * scale + offsetX,
          renderY: (item.y - minY) * scale + offsetY,
          renderW: item.w * scale,
          renderH: item.h * scale,
          rotDeg
        };
      }),
    [templateTables, minX, minY, scale, offsetX, offsetY]
  );

  const validDropTableNumbers = useMemo(() => {
    if (draggingPartySize == null) return null;
    const set = new Set<number>();
    for (const t of tableStates) {
      const num = t.tableNumber ?? Number(t.id);
      if (!Number.isFinite(num) || t.inComboId) continue;
      const effectiveCapacity = (t.baseCapacity ?? t.capacity) + (t.capacityOverride ?? 0);
      if (
        effectiveCapacity >= draggingPartySize &&
        (t.status === TableStatus.FREE || t.status === TableStatus.TURNING)
      ) {
        set.add(num);
      }
    }
    return set;
  }, [draggingPartySize, tableStates]);

  // Builder mode: fixed canvas, raw x/y/w/h
  if (mode === "builder") {
    return (
      <div ref={containerRef} className="h-full min-h-[28rem] w-full overflow-auto bg-[var(--bg)]">
        <Panel
          variant="floor"
          className="relative"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            minWidth: `${canvasWidth}px`,
            minHeight: `${canvasHeight}px`
          }}
        >
          {templateTables.map((item) => {
            const rotDeg = item.rotDeg ?? 0;
            return (
              <div
                key={item.tableNumber}
                className="absolute flex items-center justify-center"
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.w,
                  height: item.h
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    transform: rotDeg ? `rotate(${rotDeg}deg)` : undefined,
                    transformOrigin: "center center"
                  }}
                >
                  <Tile variant="table-placeholder" rounded="none" padding="md" className="h-full flex flex-col items-center justify-center text-center">
                    <span className="table-number text-[16px]">{item.tableNumber}</span>
                    <span className="mt-1 meta-text">{item.seats} seats</span>
                  </Tile>
                </div>
              </div>
            );
          })}
        </Panel>
      </div>
    );
  }

  // Workspace mode: fit-to-canvas, per-element scaled coordinates (no parent transform)

  return (
    <div ref={containerRef} className="flex min-h-0 w-full flex-1 overflow-hidden bg-[var(--bg)]">
      <Panel
        variant="floor"
        className="relative h-full w-full min-h-0 flex-1"
        style={{
          width: containerSize.width || "100%",
          height: containerSize.height || "100%",
          boxShadow: "var(--shadow)"
        }}
      >
        {/* Floor labels: visual-only landmarks – use Tile primitive */}
        {labelsRender.map((label) => (
          <div
            key={label.id}
            className="pointer-events-none absolute flex items-center justify-center"
            style={{
              left: label.renderX,
              top: label.renderY,
              width: label.renderW,
              height: label.renderH
            }}
          >
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                transform: label.rotDeg ? `rotate(${label.rotDeg}deg)` : undefined,
                transformOrigin: "center center"
              }}
            >
              <Tile variant="label" padding="sm" className="h-full w-full text-center text-[0.6rem] font-medium uppercase tracking-wide shadow-none">
                {label.text}
              </Tile>
            </div>
          </div>
        ))}
        {tablesRender.map((item) => {
          const table = tableByNumber.get(item.tableNumber) ?? null;
          const isInCombo = table?.inComboId != null;
          const isSelected = selectedTableNumbers.has(item.tableNumber);
          const isDropTargetValid =
            validDropTableNumbers != null && validDropTableNumbers.has(item.tableNumber);
          const isDropTargetInvalid =
            draggingPartySize != null &&
            table &&
            (isInCombo ||
              (table.baseCapacity ?? table.capacity) + (table.capacityOverride ?? 0) <
                draggingPartySize ||
              table.status === TableStatus.OCCUPIED);

          return (
            <div
              key={item.tableNumber}
              className={`absolute flex items-center justify-center rounded-none ${
                isSelected ? "ring-2 ring-[var(--primary-action)] ring-offset-1 ring-offset-[var(--panel)]" : ""
              }`}
              style={{
                left: item.renderX,
                top: item.renderY,
                width: item.renderW,
                height: item.renderH,
                opacity: isInCombo ? 0.5 : 1
              }}
              onClick={(e) => {
                if (e.shiftKey) {
                  e.stopPropagation();
                  onToggleTableSelection?.(item.tableNumber);
                }
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => !isInCombo && handleDrop(e, item.tableNumber)}
            >
              <div
                className="h-full w-full"
                style={{
                  margin: TABLE_GAP_RENDER_PX,
                  transform: item.rotDeg ? `rotate(${item.rotDeg}deg)` : undefined,
                  transformOrigin: "center center"
                }}
              >
                <TableTile
                  table={table}
                  tableNumber={item.tableNumber}
                  seats={item.seats}
                  workspaceId={workspaceId}
                  parties={parties}
                  isDropTargetValid={!!isDropTargetValid}
                  isDropTargetInvalid={!!isDropTargetInvalid}
                  inFlightTableNumber={inFlightTableNumbers[item.tableNumber]}
                  markTableTurningFormAction={markTableTurningFormAction}
                  clearTableFormAction={clearTableFormAction}
                  bumpExpectedFreeAtFormAction={bumpExpectedFreeAtFormAction}
                  markTableTurningAction={markTableTurningAction}
                  addMinutesToTableAction={addMinutesToTableAction}
                  onClearTable={onClearTable}
                  onMarkTurning={onMarkTurning}
                  onAddMinutes={onAddMinutes}
                  addChairAction={addChairAction}
                  removeChairAction={removeChairAction}
                  showToast={showToast}
                  onClearSuccess={onClearSuccess}
                  nowMs={nowMs}
                />
              </div>
            </div>
          );
        })}
        {combos.map((combo) => {
          const members = combo.tableNumbers
            .map((tn) => templateTables.find((t) => t.tableNumber === tn))
            .filter(Boolean) as Array<{ x: number; y: number; w: number; h: number }>;
          if (members.length === 0) return null;
          const minX = Math.min(...members.map((m) => m.x));
          const minY = Math.min(...members.map((m) => m.y));
          const maxX = Math.max(...members.map((m) => m.x + m.w));
          const maxY = Math.max(...members.map((m) => m.y + m.h));
          const padding = 12;
          const comboW = maxX - minX + padding * 2;
          const comboH = maxY - minY + padding * 2;
          const comboX = minX - padding;
          const comboY = minY - padding;
          const renderX = (comboX - minX) * scale + offsetX;
          const renderY = (comboY - minY) * scale + offsetY;
          const renderW = comboW * scale;
          const renderH = comboH * scale;
          const isComboDropValid =
            draggingPartySize != null &&
            combo.mergedCapacity >= draggingPartySize &&
            (combo.status === "FREE" || combo.status === "TURNING");
          const isComboDropInvalid =
            draggingPartySize != null &&
            (combo.mergedCapacity < draggingPartySize || combo.status === "OCCUPIED");
          const handleDropCombo = (e: React.DragEvent) => {
            e.preventDefault();
            const raw = e.dataTransfer.getData(DRAG_TYPE);
            if (!raw || !onSeatPartyAtCombo) return;
            try {
              const { partyId, partyName, partySize } = JSON.parse(raw);
              if (partyId && partyName != null && Number.isFinite(partySize)) {
                onSeatPartyAtCombo(partyId, partyName, partySize, combo.id);
              }
            } catch {
              // ignore
            }
          };
          const isComboOverdue =
            combo.status === "OCCUPIED" &&
            combo.expectedFreeAt != null &&
            nowMs >= (combo.expectedFreeAt instanceof Date ? combo.expectedFreeAt.getTime() : new Date(combo.expectedFreeAt).getTime());
          const comboColor =
            combo.status === "FREE"
              ? "table-free"
              : combo.status === "TURNING"
                ? "table-turning table-overdue"
                : combo.status === "OCCUPIED" && isComboOverdue
                  ? "table-turning table-overdue"
                  : "table-occupied";
          return (
            <div
              key={combo.id}
              role="button"
              tabIndex={0}
              className={`absolute flex cursor-pointer items-center justify-center rounded-lg border ${isComboDropValid ? "ring-2 ring-[var(--primary-action)] ring-offset-2 ring-offset-[var(--panel)]" : ""} ${isComboDropInvalid ? "opacity-60" : ""} ${comboColor}`}
              style={{ left: renderX, top: renderY, width: renderW, height: renderH }}
              onDragOver={handleDragOver}
              onDrop={handleDropCombo}
              onClick={() => onComboClick?.(combo)}
              onKeyDown={(e) => e.key === "Enter" && onComboClick?.(combo)}
            >
              <div className="flex flex-col items-center justify-center px-2 py-1 text-center">
                <span className="table-number text-[var(--text)]">{combo.tableNumbers.join("+")}</span>
                <span className="mt-0.5 meta-text rounded-sm bg-white/60 px-2 py-0.5 text-[var(--muted)]">
                  {combo.mergedCapacity} seats
                </span>
                <span className="mt-0.5 text-[0.6rem] text-[var(--muted)]">merged</span>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

export const FloorCanvas = memo(FloorCanvasInner);
