"use client";

import { useState, memo } from "react";
import { TableStatus } from "@/lib/enums";
import { TableControls } from "./TableControls";
import { Tile, Badge } from "@/ui";
import type { TileVariant } from "@/ui";
import type { WorkspaceParty } from "./WorkspaceServiceView";

type Table = {
  id: string;
  status: string;
  capacity: number;
  baseCapacity?: number;
  capacityOverride?: number;
  lastSeatedAt: Date | null;
  expectedFreeAt: Date | null;
  currentPartyId?: string | null;
  currentPartyName?: string | null;
  number?: number;
  tableNumber?: number;
  label?: string;
};

type TableTileProps = {
  table: Table | null;
  tableNumber: number;
  seats: number;
  workspaceId?: string;
  parties?: WorkspaceParty[];
  /** Valid drop target during drag (capacity >= party size, FREE or TURNING) */
  isDropTargetValid?: boolean;
  /** Invalid drop target (too small or OCCUPIED) */
  isDropTargetInvalid?: boolean;
  /** In-flight action for this table: 'seat' | 'turn' | 'clear' | 'bump' */
  inFlightTableNumber?: string;
  markTableTurningFormAction: (formData: FormData) => Promise<void>;
  clearTableFormAction: (formData: FormData) => Promise<void>;
  bumpExpectedFreeAtFormAction: (formData: FormData) => Promise<void>;
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
  showToast?: (message: string) => void;
  onClearSuccess?: () => void;
  /** Current time snapshot (ms) for consistent “overdue” calculations. */
  nowMs: number;
  /** When true, use minimal layout (number + capacity + status only) for small tiles to avoid truncation. */
  compact?: boolean;
};

function isOccupiedOverdue(table: Table, nowMs: number): boolean {
  const expectedFreeAt = table.expectedFreeAt;
  if (expectedFreeAt == null) return false;
  const expectedMs = expectedFreeAt instanceof Date ? expectedFreeAt.getTime() : new Date(expectedFreeAt).getTime();
  return nowMs >= expectedMs;
}

/** Map table state to Tile variant (design system). */
function getTileVariant(table: Table | null, nowMs: number): TileVariant {
  if (!table) return "table-placeholder";
  if (table.status === TableStatus.FREE) return "table-free";
  if (table.status === TableStatus.TURNING) return "table-turning";
  if (table.status === TableStatus.OCCUPIED && isOccupiedOverdue(table, nowMs)) return "table-turning";
  return "table-occupied";
}

function tableInputs(table: Table | null, workspaceId?: string) {
  if (!table) return null;
  if (workspaceId) {
    return (
      <>
        <input type="hidden" name="workspaceTableStateId" value={table.id} />
        <input type="hidden" name="workspaceId" value={workspaceId} />
      </>
    );
  }
  return <input type="hidden" name="tableId" value={table.id} />;
}

function TableTileInner({
  table,
  tableNumber,
  seats,
  workspaceId,
  parties = [],
  isDropTargetValid = false,
  isDropTargetInvalid = false,
  inFlightTableNumber,
  markTableTurningFormAction,
  clearTableFormAction,
  bumpExpectedFreeAtFormAction,
  markTableTurningAction,
  addMinutesToTableAction,
  onClearTable,
  onMarkTurning,
  onAddMinutes,
  addChairAction,
  removeChairAction,
  showToast,
  onClearSuccess,
  nowMs,
  compact = false
}: TableTileProps) {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.count(`TableTile render ${tableNumber}`);
  }
  const [showPanel, setShowPanel] = useState(false);
  const isPlaceholder = !table;
  const capacity = table
    ? (table.baseCapacity ?? table.capacity) + (table.capacityOverride ?? 0)
    : seats;
  const seatedParty =
    table?.currentPartyId != null
      ? parties.find((p) => p.id === table.currentPartyId) ?? null
      : null;

  let dropRingClass = "";
  if (isDropTargetValid) dropRingClass = "ring-2 ring-[var(--primary-action)] ring-offset-2 ring-offset-[var(--panel)]";
  if (isDropTargetInvalid) dropRingClass = "opacity-60 ring-1 ring-[var(--border)]";

  const statusBadgeVariant =
    !table
      ? "muted"
      : table.status === TableStatus.FREE
        ? "free"
        : table.status === TableStatus.TURNING || (table && isOccupiedOverdue(table, nowMs))
          ? "turning"
          : "occupied";

  return (
    <>
      <Tile
        variant={getTileVariant(table, nowMs)}
        rounded="sm"
        padding={compact ? "sm" : "md"}
        className={`w-full min-w-0 overflow-hidden text-xs ${dropRingClass}`}
        onClick={() => table && setShowPanel(true)}
        role={table ? "button" : undefined}
        title={
          isDropTargetInvalid
            ? table?.status === TableStatus.OCCUPIED
              ? "Occupied"
              : "Too small"
            : table && (table.status === TableStatus.OCCUPIED || table.status === TableStatus.TURNING)
              ? "Click for details"
              : undefined
        }
      >
        {compact ? (
          <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
            <div className="flex min-w-0 items-center justify-between gap-0.5">
              <span className="truncate text-[12px] font-bold leading-tight" style={{ minWidth: 0 }}>
                {tableNumber}
              </span>
              <Badge variant="seats" className="shrink-0 text-[10px]">
                {capacity}
              </Badge>
            </div>
            <div className="min-w-0 overflow-hidden">
              <span className="block truncate text-[10px] font-medium">
                {!table ? "—" : table.status}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 shrink-0 items-center justify-between gap-1 overflow-hidden">
              <span className="table-number truncate text-[16px]" style={{ minWidth: 0 }}>
                {tableNumber}
              </span>
              <Badge variant="seats" className="shrink-0">{capacity}</Badge>
            </div>
            <div className="mt-1 flex min-w-0 shrink-0 flex-wrap items-center gap-1 overflow-hidden">
              <Badge variant={statusBadgeVariant}>{!table ? "—" : table.status}</Badge>
              {!isPlaceholder && table.status === TableStatus.FREE && (
                <span className="meta-text truncate text-[0.65rem]">Available</span>
              )}
            </div>
          </>
        )}
      </Tile>

      {table && workspaceId && showPanel && (
        <TableControls
          table={table}
          tableNumber={tableNumber}
          seats={seats}
          workspaceId={workspaceId}
          seatedParty={seatedParty}
          onClose={() => setShowPanel(false)}
          clearTableFormAction={clearTableFormAction}
          markTableTurningFormAction={markTableTurningFormAction}
          bumpExpectedFreeAtFormAction={bumpExpectedFreeAtFormAction}
          markTableTurningAction={markTableTurningAction}
          addMinutesToTableAction={addMinutesToTableAction}
          onClearTable={onClearTable}
          onMarkTurning={onMarkTurning}
          onAddMinutes={onAddMinutes}
          inFlightTableNumber={inFlightTableNumber}
          addChairAction={addChairAction}
          removeChairAction={removeChairAction}
          showToast={showToast}
          onClearSuccess={onClearSuccess}
        />
      )}
    </>
  );
}

function tableRefEqual(a: Table | null, b: Table | null): boolean {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  const effA = (a.baseCapacity ?? a.capacity) + (a.capacityOverride ?? 0);
  const effB = (b.baseCapacity ?? b.capacity) + (b.capacityOverride ?? 0);
  const dateMs = (d: Date | null | undefined): number =>
    d instanceof Date ? d.getTime() : d ? new Date(d as string).getTime() : 0;
  return (
    a.status === b.status &&
    a.currentPartyId === b.currentPartyId &&
    effA === effB &&
    dateMs(a.expectedFreeAt) === dateMs(b.expectedFreeAt) &&
    dateMs(a.lastSeatedAt) === dateMs(b.lastSeatedAt)
  );
}

function tableTilePropsEqual(prev: TableTileProps, next: TableTileProps): boolean {
  if (
    prev.tableNumber !== next.tableNumber ||
    prev.seats !== next.seats ||
    prev.workspaceId !== next.workspaceId ||
    prev.compact !== next.compact ||
    prev.isDropTargetValid !== next.isDropTargetValid ||
    prev.isDropTargetInvalid !== next.isDropTargetInvalid ||
    prev.inFlightTableNumber !== next.inFlightTableNumber
  )
    return false;
  if (prev.parties !== next.parties) return false;
  return tableRefEqual(prev.table, next.table);
}

export const TableTile = memo(TableTileInner, tableTilePropsEqual);
