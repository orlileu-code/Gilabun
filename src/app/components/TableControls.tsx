"use client";

import { useState } from "react";
import {
  formatSittingDuration,
  estimatedFreeInMinutes,
  formatSeatedAtTime,
  formatTime24,
  getEstimatedFinishTime
} from "@/lib/waitEstimate";
import { TableStatus } from "@/lib/enums";
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
};

/** Seated party for display (dates may be serialized as strings from server). */
export type SeatedPartyForDisplay = Pick<
  WorkspaceParty,
  "id" | "name" | "size" | "phone" | "notes" | "status"
> & {
  createdAt: Date | string;
  seatedAt: Date | string | null;
};

type TableControlsProps = {
  table: Table;
  tableNumber: number;
  seats: number;
  workspaceId: string;
  /** Full party record when table is OCCUPIED and currentPartyId is set. */
  seatedParty?: SeatedPartyForDisplay | null;
  onClose: () => void;
  clearTableFormAction: (formData: FormData) => Promise<void>;
  markTableTurningFormAction: (formData: FormData) => Promise<void>;
  bumpExpectedFreeAtFormAction: (formData: FormData) => Promise<void>;
  /** Direct server actions for client-side submit + toast + refresh. */
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
  /** Optimistic clear/turn/+10 (no refresh; parent reconciles). */
  onClearTable?: (tableNumber: number) => Promise<void>;
  onMarkTurning?: (tableNumber: number, turningMinutes?: number) => Promise<void>;
  onAddMinutes?: (tableNumber: number, minutesToAdd?: number) => Promise<void>;
  /** In-flight action: 'seat' | 'turn' | 'clear' | 'bump' for loading state. */
  inFlightTableNumber?: string;
  /** Called after clear/turning/bump succeeds so the parent can refresh. */
  onClearSuccess?: () => void;
  /** Show success or error message (e.g. toast). */
  showToast?: (message: string) => void;
};

const DEFAULT_TURNING_MIN = 15;

function toDate(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  if (d instanceof Date) return d;
  try {
    const t = new Date(d as string);
    return Number.isFinite(t.getTime()) ? t : null;
  } catch {
    return null;
  }
}

function waitedMinutes(createdAt: Date | string | null, seatedAt: Date | string | null): number | null {
  const c = toDate(createdAt);
  const s = toDate(seatedAt);
  if (!c || !s) return null;
  return Math.max(0, Math.round((s.getTime() - c.getTime()) / 60000));
}

export function TableControls({
  table,
  tableNumber,
  seats,
  workspaceId,
  seatedParty = null,
  onClose,
  clearTableFormAction,
  markTableTurningFormAction,
  bumpExpectedFreeAtFormAction,
  markTableTurningAction,
  addMinutesToTableAction,
  addChairAction,
  removeChairAction,
  onClearTable,
  onMarkTurning,
  onAddMinutes,
  inFlightTableNumber,
  onClearSuccess,
  showToast
}: TableControlsProps) {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.count("TableDetailsModal render");
  }
  const [clearing, setClearing] = useState(false);
  const [turningLoading, setTurningLoading] = useState(false);
  const [bumpLoading, setBumpLoading] = useState(false);
  const [chairLoading, setChairLoading] = useState(false);
  const clearingLoading = onClearTable ? inFlightTableNumber === "clear" : clearing;
  const turningLoadingState = onMarkTurning ? inFlightTableNumber === "turn" : turningLoading;
  const bumpLoadingState = onAddMinutes ? inFlightTableNumber === "bump" : bumpLoading;
  const baseCapacity = table.baseCapacity ?? table.capacity;
  const capacityOverride = Math.max(0, table.capacityOverride ?? 0);
  const effectiveCapacity = table.capacity;
  const status = table.status;
  const lastSeatedAt = toDate(table.lastSeatedAt);
  const expectedFreeAt = toDate(table.expectedFreeAt);
  const tableWithDates = {
    ...table,
    lastSeatedAt,
    expectedFreeAt
  };
  const elapsedLabel = formatSittingDuration(lastSeatedAt);
  const freeIn = estimatedFreeInMinutes(tableWithDates);
  const seatedAtTime = formatSeatedAtTime(lastSeatedAt);
  const finishDate = getEstimatedFinishTime(tableWithDates);
  const estimatedFinishTimeLabel = finishDate ? formatTime24(finishDate) : null;
  const isOccupiedOrTurning =
    status === TableStatus.OCCUPIED || status === TableStatus.TURNING;

  const tableInputs = (
    <>
      <input type="hidden" name="workspaceTableStateId" value={table.id} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
    </>
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-label="Table controls"
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-[var(--border)] bg-[var(--panel)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Table {tableNumber}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Capacity: {baseCapacity}{capacityOverride > 0 ? ` (+${capacityOverride})` : ""} = {effectiveCapacity} seats
          </p>
          {addChairAction && removeChairAction && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={chairLoading || capacityOverride >= 2}
                onClick={async () => {
                  setChairLoading(true);
                  const result = await addChairAction(workspaceId, tableNumber);
                  setChairLoading(false);
                  if (result.error) showToast?.(result.error);
                  else onClearSuccess?.();
                }}
                className="btn-outline rounded-lg px-2 py-1 text-xs disabled:opacity-50"
              >
                Add chair (+1)
              </button>
              <button
                type="button"
                disabled={chairLoading || capacityOverride <= 0}
                onClick={async () => {
                  setChairLoading(true);
                  const result = await removeChairAction(workspaceId, tableNumber);
                  setChairLoading(false);
                  if (result.error) showToast?.(result.error);
                  else onClearSuccess?.();
                }}
                className="btn-outline rounded-lg px-2 py-1 text-xs disabled:opacity-50"
              >
                Remove chair (-1)
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div>
            <span
              className={
                status === TableStatus.FREE
                  ? "status-pill-seated rounded-full px-2 py-1 text-xs font-medium"
                  : status === TableStatus.OCCUPIED
                    ? "rounded-full bg-[var(--table-occupied-fill)] px-2 py-1 meta-text font-medium text-[var(--table-occupied-text)]"
                    : "rounded-full bg-[rgba(229,57,53,0.15)] px-2 py-1 text-xs font-medium text-[var(--red)]"
              }
            >
              {status}
            </span>
          </div>

          {(status === TableStatus.OCCUPIED || status === TableStatus.TURNING) && (
            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Party
              </div>
              {seatedParty ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-[var(--text)]">{seatedParty.name}</span>
                    <span className="badge badge-muted rounded-full px-2 py-0.5 text-xs font-medium">
                      {seatedParty.size}
                    </span>
                  </div>
                  {seatedParty.phone != null && seatedParty.phone.trim() !== "" && (
                    <p className="text-sm text-[var(--text)]">
                      <span className="text-[var(--muted)]">Phone:</span>{" "}
                      <a
                        href={`tel:${seatedParty.phone.replace(/\s/g, "")}`}
                        className="text-[var(--primary-action)] underline decoration-[var(--primary-action)] underline-offset-1 hover:no-underline"
                      >
                        {seatedParty.phone}
                      </a>
                    </p>
                  )}
                  {seatedParty.notes != null && seatedParty.notes.trim() !== "" && (
                    <div className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5">
                      <span className="text-xs font-medium text-[var(--muted)]">Notes:</span>
                      <p className="mt-0.5 text-sm text-[var(--text)] break-words">
                        {seatedParty.notes}
                      </p>
                    </div>
                  )}
                  {toDate(seatedParty.createdAt) && (
                    <p className="text-xs text-[var(--muted)]">
                      Added to waitlist: {formatSeatedAtTime(toDate(seatedParty.createdAt))}
                    </p>
                  )}
                  {waitedMinutes(seatedParty.createdAt, seatedParty.seatedAt) != null && (
                    <p className="text-xs text-[var(--muted)]">
                      Waited: {waitedMinutes(seatedParty.createdAt, seatedParty.seatedAt)} min
                    </p>
                  )}
                </>
              ) : table.currentPartyName ? (
                <p className="text-sm text-[var(--text)]">
                  {table.currentPartyName}
                  <span className="ml-2 text-xs text-[var(--muted)]">(details unavailable)</span>
                </p>
              ) : (
                <p className="text-sm text-[var(--muted)]">Party info unavailable</p>
              )}
            </div>
          )}


          {isOccupiedOrTurning && (
            <div className="space-y-1 text-sm text-[var(--muted)]">
              {elapsedLabel && (
                <p>Seated {elapsedLabel} ago</p>
              )}
              {seatedAtTime && (
                <p>Seated at: {seatedAtTime}</p>
              )}
              {freeIn !== null && (
                <p>~{freeIn} min remaining</p>
              )}
              {estimatedFinishTimeLabel && (
                <p>Estimated finish: {estimatedFinishTimeLabel}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {isOccupiedOrTurning && (
              onClearTable ? (
                <button
                  type="button"
                  disabled={clearingLoading}
                  className="btn-primary w-full rounded-lg py-2.5 font-medium disabled:opacity-70"
                  onClick={async () => {
                    await onClearTable(tableNumber);
                    onClose();
                  }}
                >
                  {clearingLoading ? "Clearing…" : "Clear Table"}
                </button>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    setClearing(true);
                    try {
                      await clearTableFormAction(formData);
                      onClose();
                      onClearSuccess?.();
                    } finally {
                      setClearing(false);
                    }
                  }}
                >
                  {tableInputs}
                  <button
                    type="submit"
                    disabled={clearing}
                    className="btn-primary w-full rounded-lg py-2.5 font-medium disabled:opacity-70"
                  >
                    {clearing ? "Clearing…" : "Clear Table"}
                  </button>
                </form>
              )
            )}
            {status === TableStatus.OCCUPIED && (
              (onMarkTurning || markTableTurningAction) ? (
                <button
                  type="button"
                  disabled={turningLoadingState}
                  className="btn-outline w-full rounded-lg py-2 text-sm disabled:opacity-70"
                  onClick={async () => {
                    if (onMarkTurning) {
                      await onMarkTurning(tableNumber, DEFAULT_TURNING_MIN);
                    } else if (markTableTurningAction) {
                      setTurningLoading(true);
                      try {
                        const result = await markTableTurningAction(
                          workspaceId,
                          tableNumber,
                          DEFAULT_TURNING_MIN
                        );
                        if (result.error) {
                          showToast?.(result.error);
                        } else {
                          showToast?.("Marked turning");
                          onClearSuccess?.();
                        }
                      } finally {
                        setTurningLoading(false);
                      }
                    }
                  }}
                >
                  {turningLoadingState ? "Updating…" : `Mark Turning (${DEFAULT_TURNING_MIN} min)`}
                </button>
              ) : (
                <form action={markTableTurningFormAction}>
                  {tableInputs}
                  <button
                    type="submit"
                    className="btn-outline w-full rounded-lg py-2 text-sm"
                    onClick={onClose}
                  >
                    Mark Turning ({DEFAULT_TURNING_MIN} min)
                  </button>
                </form>
              )
            )}
            {isOccupiedOrTurning && (
              (onAddMinutes || addMinutesToTableAction) ? (
                <button
                  type="button"
                  disabled={bumpLoadingState}
                  className="btn-ghost w-full rounded-lg py-2 text-sm disabled:opacity-70"
                  onClick={async () => {
                    if (onAddMinutes) {
                      await onAddMinutes(tableNumber, 10);
                    } else if (addMinutesToTableAction) {
                      setBumpLoading(true);
                      try {
                        const result = await addMinutesToTableAction(
                          workspaceId,
                          tableNumber,
                          10
                        );
                        if (result.error) {
                          showToast?.(result.error);
                        } else {
                          showToast?.("Added 10 minutes");
                          onClearSuccess?.();
                        }
                      } finally {
                        setBumpLoading(false);
                      }
                    }
                  }}
                >
                  {bumpLoadingState ? "Updating…" : "+10 min"}
                </button>
              ) : table.expectedFreeAt ? (
                <form action={bumpExpectedFreeAtFormAction}>
                  {tableInputs}
                  <button
                    type="submit"
                    className="btn-ghost w-full rounded-lg py-2 text-sm"
                    onClick={onClose}
                  >
                    +10 min
                  </button>
                </form>
              ) : null
            )}
            {!isOccupiedOrTurning && (
              <p className="text-center text-sm text-[var(--muted)]">Table is free</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
