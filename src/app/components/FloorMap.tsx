"use client";

import { memo, useMemo } from "react";
import { FloorCanvas, type TemplateTable, type TableState } from "./FloorCanvas";
import type { WorkspaceParty, WorkspaceCombo } from "./WorkspaceServiceView";
import { Panel } from "@/ui";

type TemplateLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

type FloorMapProps = {
  layout: TemplateTable[];
  tables: TableState[];
  combos?: WorkspaceCombo[];
  selectedTableNumbers?: Set<number>;
  onToggleTableSelection?: (tableNumber: number) => void;
  onMerge?: () => void;
  mergeLoading?: boolean;
  labels: TemplateLabel[];
  parties: WorkspaceParty[];
  workspaceId?: string;
  draggingPartySize?: number | null;
  onSeatParty?: (
    partyId: string,
    partyName: string,
    partySize: number,
    tableNumber: number
  ) => void;
  onSeatPartyAtCombo?: (
    partyId: string,
    partyName: string,
    partySize: number,
    comboId: string
  ) => void;
  onComboClick?: (combo: WorkspaceCombo) => void;
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
  inFlightTableNumbers?: Record<number, string>;
  showToast?: (message: string) => void;
  onClearSuccess?: () => void;
  /** Current time snapshot (ms) for consistent “overdue” calculations. */
  nowMs: number;
  /** Callback to expose fit handler for external use (e.g., Fit button) */
  onFitReady?: (fitHandler: () => void) => void;
};

function FloorMapInner({
  layout,
  tables,
  combos = [],
  selectedTableNumbers = new Set(),
  onToggleTableSelection,
  onMerge,
  mergeLoading = false,
  labels,
  parties,
  workspaceId,
  draggingPartySize = null,
  onSeatParty,
  onSeatPartyAtCombo,
  onComboClick,
  markTableTurningFormAction,
  clearTableFormAction,
  bumpExpectedFreeAtFormAction,
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
  nowMs,
  onFitReady
}: FloorMapProps) {
  const templateTables = useMemo(
    () =>
      layout.map((item) => ({
        tableNumber: item.tableNumber,
        seats: item.seats,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        rotDeg: item.rotDeg ?? 0
      })),
    [layout]
  );
  return (
    <Panel variant="floor" className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none" style={{ boxShadow: "var(--shadow)" }}>
      <FloorCanvas
        templateTables={templateTables}
        templateLabels={labels}
        tableStates={tables}
        combos={combos}
        selectedTableNumbers={selectedTableNumbers}
        onToggleTableSelection={onToggleTableSelection}
        onMerge={onMerge}
        mergeLoading={mergeLoading}
        parties={parties}
        mode="workspace"
        workspaceId={workspaceId}
        draggingPartySize={draggingPartySize}
        onSeatParty={onSeatParty}
        onSeatPartyAtCombo={onSeatPartyAtCombo}
        onComboClick={onComboClick}
        markTableTurningFormAction={markTableTurningFormAction}
        clearTableFormAction={clearTableFormAction}
        bumpExpectedFreeAtFormAction={bumpExpectedFreeAtFormAction}
        markTableTurningAction={markTableTurningAction}
        addMinutesToTableAction={addMinutesToTableAction}
        addChairAction={addChairAction}
        removeChairAction={removeChairAction}
        onClearTable={onClearTable}
        onMarkTurning={onMarkTurning}
        onAddMinutes={onAddMinutes}
        inFlightTableNumbers={inFlightTableNumbers}
        showToast={showToast}
        onClearSuccess={onClearSuccess}
        nowMs={nowMs}
        onFitReady={onFitReady}
      />
    </Panel>
  );
}

export const FloorMap = memo(FloorMapInner);
