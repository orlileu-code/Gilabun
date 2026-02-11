"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { FloorMap } from "./FloorMap";
import { AddPartyModal } from "./AddPartyModal";
import {
  setPartyStatusWorkspaceAction,
  markWorkspaceTableTurningFormAction,
  clearWorkspaceTableFormAction,
  bumpWorkspaceExpectedFreeAtFormAction,
  markTableTurningAction,
  addMinutesToTableAction,
  seatPartyAtTable,
  seatPartyAtCombo,
  clearTableAction,
  type TableStatePayload,
  type PartyPayload
} from "../actions";
import { addChair, removeChair, createCombo, deleteCombo } from "../workspaceActions";
import { PartyStatus } from "@/lib/enums";
import { TimeTickProvider } from "../contexts/TimeTickContext";
import { getEstimatedMealDurationMin } from "@/lib/waitEstimate";
import { Panel, Header, Badge } from "@/ui";

export type TableState = {
  id: string;
  tableNumber: number;
  capacity: number;
  baseCapacity?: number;
  capacityOverride?: number;
  inComboId?: string | null;
  status: string;
  lastSeatedAt: Date | null;
  expectedFreeAt: Date | null;
  currentPartyId: string | null;
  currentPartyName: string | null;
};

export type WorkspaceCombo = {
  id: string;
  tableNumbers: number[];
  mergedCapacity: number;
  status: string;
  currentPartyId: string | null;
  expectedFreeAt: Date | null;
  lastSeatedAt: Date | null;
};

export type LayoutItem = {
  tableNumber: number;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

export type WorkspaceParty = {
  id: string;
  name: string;
  size: number;
  phone: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  seatedAt: Date | null;
};

type WaitingParty = {
  id: string;
  name: string;
  size: number;
  phone: string | null;
  notes: string | null;
  waitingMin: number;
  liveWaitMin: number | null;
  createdAt?: Date | string;
};

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function MenuDotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );
}

function formatPartyTime(createdAt: Date | string | undefined): string {
  if (!createdAt) return "";
  const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Renders time + date only after mount to avoid server/client format mismatch (hydration error). */
function WorkspaceHeaderTime() {
  const [str, setStr] = useState<string>("");
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    setStr(`${timeStr} ${dateStr}`);
  }, []);
  return <>{str || "\u00A0"}</>;
}

const WaitlistRow = memo(function WaitlistRow({
  party,
  isFirst,
  isNewest,
  isDragging,
  workspaceId,
  onDragStart,
  onDragEnd
}: {
  party: WaitingParty;
  isFirst: boolean;
  isNewest: boolean;
  isDragging: boolean;
  workspaceId: string;
  onDragStart: (e: React.DragEvent, party: WaitingParty) => void;
  onDragEnd: () => void;
}) {
  const timeStr = formatPartyTime(party.createdAt);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, party)}
      onDragEnd={onDragEnd}
      className={`flex w-full cursor-grab active:cursor-grabbing items-stretch gap-2 border-0 border-b border-[var(--waitlist-row-border)] border-l-[3px] px-2 py-2 rounded-none ${
        isFirst
          ? "bg-[var(--waitlist-row)] border-l-[var(--waitlist-first)]"
          : isNewest
            ? "bg-[var(--waitlist-row)] border-l-[var(--waitlist-newest)]"
            : "bg-[var(--waitlist-row)] border-l-transparent"
      } ${isDragging ? "opacity-60" : ""}`}
    >
      {/* LEFT: time, menu (muted), phone/notes icons */}
      <div className="flex shrink-0 items-center gap-1.5 meta-text text-[var(--waitlist-muted)]">
        {timeStr && <span className="tabular-nums">{timeStr}</span>}
        <MenuDotsIcon className="opacity-60" />
        {party.phone && <PhoneIcon className="shrink-0 opacity-80" />}
        {party.notes && <NoteIcon className="shrink-0 opacity-80" />}
      </div>
      {/* CENTER: name + secondary line */}
      <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
        <span className="party-name truncate text-[var(--waitlist-text)]">{party.name}</span>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 meta-text text-[var(--waitlist-muted)]">
          <span>Waiting {party.waitingMin}m</span>
          {isFirst && <span style={{ color: "var(--waitlist-first)" }}>First in line</span>}
          {isNewest && <span style={{ color: "var(--waitlist-newest)" }}>Newest</span>}
        </div>
        {party.notes && (
          <p className="mt-0.5 meta-text truncate text-[var(--waitlist-muted)] italic">{party.notes}</p>
        )}
      </div>
      {/* RIGHT: seats badge + actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Badge variant="waitlist" className="h-6 min-w-[1.75rem] text-[0.75rem]">
          {party.size}
        </Badge>
        <form action={setPartyStatusWorkspaceAction} className="inline">
          <input type="hidden" name="partyId" value={party.id} />
          <input type="hidden" name="status" value={PartyStatus.CANCELED} />
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <button type="submit" className="rounded-none border-0 bg-transparent px-0.5 py-0 text-[0.6rem] text-[var(--waitlist-muted)] hover:text-[var(--red)]" onClick={(e) => e.stopPropagation()}>
            Cancel
          </button>
        </form>
        <form action={setPartyStatusWorkspaceAction} className="inline">
          <input type="hidden" name="partyId" value={party.id} />
          <input type="hidden" name="status" value={PartyStatus.NO_SHOW} />
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <button type="submit" className="rounded-none border-0 bg-transparent px-0.5 py-0 text-[0.6rem] text-[var(--waitlist-muted)] hover:text-[var(--waitlist-text)]" onClick={(e) => e.stopPropagation()}>
            No-show
          </button>
        </form>
      </div>
    </div>
  );
});

export type FloorLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

type WorkspaceServiceViewProps = {
  workspaceId: string;
  layout: LayoutItem[];
  tables: TableState[];
  combos: WorkspaceCombo[];
  labels: FloorLabel[];
  parties: WorkspaceParty[];
  waitingParties: WaitingParty[];
  firstPartyId: string | null;
  newestPartyId: string | null;
  restaurantName?: string;
  logoUrl?: string | null;
  /** Snapshot of current time in ms from server; keeps SSR/CSR in sync to avoid hydration mismatches. */
  nowMsSnapshot: number;
};

const DRAG_TYPE = "application/x-gilabun-party";

function payloadToTableState(p: TableStatePayload): TableState {
  return {
    id: p.id,
    tableNumber: p.tableNumber,
    status: p.status,
    lastSeatedAt: p.lastSeatedAt ? new Date(p.lastSeatedAt) : null,
    expectedFreeAt: p.expectedFreeAt ? new Date(p.expectedFreeAt) : null,
    currentPartyId: p.currentPartyId,
    currentPartyName: p.currentPartyName,
    capacity: p.capacity,
    baseCapacity: p.baseCapacity,
    capacityOverride: p.capacityOverride
  };
}

export function WorkspaceServiceView({
  workspaceId,
  layout,
  tables: initialTables,
  combos = [],
  labels,
  parties: initialParties,
  waitingParties: initialWaitingParties,
  firstPartyId,
  newestPartyId,
  restaurantName = "Gilabun",
  logoUrl = null,
  nowMsSnapshot
}: WorkspaceServiceViewProps) {
  const router = useRouter();
  const [tables, setTables] = useState<TableState[]>(initialTables);
  const [parties, setParties] = useState<WorkspaceParty[]>(initialParties);
  const [nowMs, setNowMs] = useState<number>(nowMsSnapshot);
  const [inFlightTableNumbers, setInFlightTableNumbers] = useState<Record<number, string>>({});

  useEffect(() => {
    setTables(initialTables);
    setParties(initialParties);
  }, [workspaceId, initialTables, initialParties]);

  // Keep a client-side ticking clock for UI labels; initial snapshot comes from the server
  // so SSR and CSR renders match, avoiding React hydration errors (#418, #423, #425).
  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const [selectedTableNumbers, setSelectedTableNumbers] = useState<Set<number>>(new Set());
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<WorkspaceCombo | null>(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [addPartyModalOpen, setAddPartyModalOpen] = useState(false);
  const onClearSuccess = useCallback(() => router.refresh(), [router]);

  const handlePartyAdded = useCallback((party: WorkspaceParty) => {
    setParties((prev) => [...prev, party].sort(
      (a, b) =>
        (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()) -
        (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime())
    ));
  }, []);
  const toggleTableSelection = useCallback((tableNumber: number) => {
    setSelectedTableNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(tableNumber)) next.delete(tableNumber);
      else next.add(tableNumber);
      return next;
    });
  }, []);
  const handleMerge = useCallback(async () => {
    if (selectedTableNumbers.size < 2) return;
    setMergeLoading(true);
    const result = await createCombo(workspaceId, Array.from(selectedTableNumbers));
    setMergeLoading(false);
    if (result.error) setToast(result.error);
    else {
      setSelectedTableNumbers(new Set());
      router.refresh();
    }
  }, [workspaceId, selectedTableNumbers, router]);
  const [draggingParty, setDraggingParty] = useState<{
    id: string;
    name: string;
    size: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const waitingParties: WaitingParty[] = (() => {
    const waiting = parties.filter((p) => p.status === PartyStatus.WAITING);
    const now = nowMs;
    return waiting.map((p) => ({
      ...p,
      waitingMin: p.createdAt ? Math.max(0, Math.round((now - (p.createdAt instanceof Date ? p.createdAt.getTime() : new Date(p.createdAt).getTime())) / 60000)) : 0,
      liveWaitMin: null
    }));
  })();
  const derivedFirstPartyId = waitingParties[0]?.id ?? null;
  const derivedNewestPartyId = waitingParties.length > 0 ? waitingParties[waitingParties.length - 1]?.id ?? null : null;

  const handleSeatParty = useCallback(
    async (partyId: string, partyName: string, partySize: number, tableNumber: number) => {
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        console.time("seatParty");
      }
      setDraggingParty(null);
      const party = parties.find((p) => p.id === partyId);
      const table = tables.find((t) => t.tableNumber === tableNumber);
      if (!party || !table) return;
      const prevTables = [...tables];
      const prevParties = [...parties];
      const now = new Date();
      const durationMin = getEstimatedMealDurationMin(partySize);
      const expectedFreeAt = new Date(now.getTime() + durationMin * 60000);
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === tableNumber
            ? {
                ...t,
                status: "OCCUPIED" as const,
                lastSeatedAt: now,
                expectedFreeAt,
                currentPartyId: partyId,
                currentPartyName: party.name
              }
            : t
        )
      );
      setParties((prev) =>
        prev.map((p) => (p.id === partyId ? { ...p, status: PartyStatus.SEATED, seatedAt: now } : p))
      );
      setInFlightTableNumbers((prev) => ({ ...prev, [tableNumber]: "seat" }));
      showToast(`Seated ${partyName} (${partySize}) at ${tableNumber}`);
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        console.timeEnd("seatParty");
      }
      const result = await seatPartyAtTable(workspaceId, partyId, tableNumber);
      setInFlightTableNumbers((prev) => {
        const next = { ...prev };
        delete next[tableNumber];
        return next;
      });
      if (result.error) {
        setTables(prevTables);
        setParties(prevParties);
        showToast(result.error ?? "Couldn't update table. Check connection.");
        return;
      }
      if (result.tableState) {
        setTables((prev) =>
          prev.map((t) =>
            t.tableNumber === tableNumber
              ? { ...payloadToTableState(result.tableState!), inComboId: t.inComboId }
              : t
          )
        );
      }
      if (result.party) {
        const p = result.party;
        setParties((prev) =>
          prev.map((x) =>
            x.id === p.id
              ? {
                  ...x,
                  status: p.status,
                  seatedAt: p.seatedAt ? new Date(p.seatedAt) : null
                }
              : x
          )
        );
      }
    },
    [workspaceId, showToast, tables, parties]
  );

  const handleMarkTurning = useCallback(
    async (tableNumber: number, turningMinutes: number = 15) => {
      const table = tables.find((t) => t.tableNumber === tableNumber);
      if (!table) return;
      const prevTables = [...tables];
      const now = new Date();
      const existingExpected = table.expectedFreeAt ? table.expectedFreeAt.getTime() : 0;
      const baseTime = existingExpected > now.getTime() ? existingExpected : now.getTime();
      const expectedFreeAt = new Date(baseTime + turningMinutes * 60000);
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === tableNumber
            ? { ...t, status: "TURNING" as const, expectedFreeAt }
            : t
        )
      );
      setInFlightTableNumbers((prev) => ({ ...prev, [tableNumber]: "turn" }));
      showToast("Marked turning");
      const result = await markTableTurningAction(workspaceId, tableNumber, turningMinutes);
      setInFlightTableNumbers((prev) => {
        const next = { ...prev };
        delete next[tableNumber];
        return next;
      });
      if (result.error) {
        setTables(prevTables);
        showToast(result.error ?? "Couldn't update table. Check connection.");
        return;
      }
      if (result.tableState) {
        setTables((prev) =>
          prev.map((t) =>
            t.tableNumber === tableNumber
              ? { ...payloadToTableState(result.tableState!), inComboId: t.inComboId }
              : t
          )
        );
      }
    },
    [workspaceId, showToast, tables]
  );

  const handleAddMinutes = useCallback(
    async (tableNumber: number, minutesToAdd: number = 10) => {
      const table = tables.find((t) => t.tableNumber === tableNumber);
      if (!table) return;
      const prevTables = [...tables];
      const now = new Date();
      const existingExpected = table.expectedFreeAt ? table.expectedFreeAt.getTime() : now.getTime();
      const baseTime = existingExpected > now.getTime() ? existingExpected : now.getTime();
      const expectedFreeAt = new Date(baseTime + minutesToAdd * 60000);
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === tableNumber ? { ...t, expectedFreeAt } : t
        )
      );
      setInFlightTableNumbers((prev) => ({ ...prev, [tableNumber]: "bump" }));
      showToast("Added 10 minutes");
      const result = await addMinutesToTableAction(workspaceId, tableNumber, minutesToAdd);
      setInFlightTableNumbers((prev) => {
        const next = { ...prev };
        delete next[tableNumber];
        return next;
      });
      if (result.error) {
        setTables(prevTables);
        showToast(result.error ?? "Couldn't update table. Check connection.");
        return;
      }
      if (result.tableState) {
        setTables((prev) =>
          prev.map((t) =>
            t.tableNumber === tableNumber
              ? { ...payloadToTableState(result.tableState!), inComboId: t.inComboId }
              : t
          )
        );
      }
    },
    [workspaceId, showToast, tables]
  );

  const handleClearTable = useCallback(
    async (tableNumber: number) => {
      const table = tables.find((t) => t.tableNumber === tableNumber);
      if (!table) return;
      const prevTables = [...tables];
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === tableNumber
            ? {
                ...t,
                status: "FREE" as const,
                lastSeatedAt: null,
                expectedFreeAt: null,
                currentPartyId: null,
                currentPartyName: null
              }
            : t
        )
      );
      setInFlightTableNumbers((prev) => ({ ...prev, [tableNumber]: "clear" }));
      showToast("Table cleared");
      const result = await clearTableAction(workspaceId, tableNumber);
      setInFlightTableNumbers((prev) => {
        const next = { ...prev };
        delete next[tableNumber];
        return next;
      });
      if (result.error) {
        setTables(prevTables);
        showToast(result.error ?? "Couldn't update table. Check connection.");
        return;
      }
      if (result.tableState) {
        setTables((prev) =>
          prev.map((t) =>
            t.tableNumber === tableNumber
              ? { ...payloadToTableState(result.tableState!), inComboId: t.inComboId }
              : t
          )
        );
      }
    },
    [workspaceId, showToast, tables]
  );

  const handleSeatPartyAtCombo = useCallback(
    async (partyId: string, partyName: string, partySize: number, comboId: string) => {
      const result = await seatPartyAtCombo(workspaceId, partyId, comboId);
      setDraggingParty(null);
      if (result.error) {
        showToast(result.error);
        return;
      }
      showToast(`Seated ${partyName} (${partySize}) at merged table`);
      router.refresh();
    },
    [workspaceId, showToast, router]
  );

  const handleComboClick = useCallback((combo: WorkspaceCombo) => {
    setSelectedCombo(combo);
  }, []);

  const handleSplitCombo = useCallback(async () => {
    if (!selectedCombo) return;
    setSplitLoading(true);
    const result = await deleteCombo(workspaceId, selectedCombo.id);
    setSplitLoading(false);
    if (result.error) showToast(result.error);
    else {
      setSelectedCombo(null);
      router.refresh();
    }
  }, [workspaceId, selectedCombo, showToast, router]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, party: WaitingParty) => {
      e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({
        partyId: party.id,
        partyName: party.name,
        partySize: party.size
      }));
      e.dataTransfer.effectAllowed = "move";
      setDraggingParty({ id: party.id, name: party.name, size: party.size });
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingParty(null);
  }, []);

  return (
    <TimeTickProvider intervalMs={30000}>
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="card flex min-h-0 flex-1 flex-col">
            <div className="card-header flex shrink-0 flex-wrap items-start justify-between gap-2">
              <div>
                <div className="card-title">Floor</div>
                <p className="mt-1 meta-text text-[var(--muted)]">
                  Green = free · orange = occupied · red = turning/overdue · Shift+click tables to merge
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedTableNumbers.size >= 2 && (
                  <button
                    type="button"
                    disabled={mergeLoading}
                    onClick={handleMerge}
                    className="rounded border border-[var(--table-occupied-border)] bg-[var(--panel-2)] px-2 py-1 meta-text font-medium text-[var(--text)] hover:bg-[var(--border)] disabled:opacity-50"
                  >
                    {mergeLoading ? "Merging…" : `Merge (${selectedTableNumbers.size} tables)`}
                  </button>
                )}
                <span
                  className="meta-text rounded border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 font-medium text-[var(--muted)]"
                  title="View is fit to floor area"
                >
                  Fit
                </span>
              </div>
            </div>
            <div className="card-body flex min-h-0 flex-1 flex-col overflow-hidden">
              {layout.length === 0 ? (
                <p className="meta-text text-[var(--muted)]">This template has no tables.</p>
              ) : (
                <FloorMap
                  layout={layout}
                  tables={tables}
                  combos={combos}
                  labels={labels}
                  parties={parties}
                  selectedTableNumbers={selectedTableNumbers}
                  onToggleTableSelection={toggleTableSelection}
                  onMerge={handleMerge}
                  mergeLoading={mergeLoading}
                  workspaceId={workspaceId}
                  draggingPartySize={draggingParty?.size ?? null}
                  onSeatParty={handleSeatParty}
                  onSeatPartyAtCombo={handleSeatPartyAtCombo}
                  onComboClick={handleComboClick}
                  markTableTurningFormAction={markWorkspaceTableTurningFormAction}
                  clearTableFormAction={clearWorkspaceTableFormAction}
                  bumpExpectedFreeAtFormAction={bumpWorkspaceExpectedFreeAtFormAction}
                  markTableTurningAction={markTableTurningAction}
                  addMinutesToTableAction={addMinutesToTableAction}
                  onClearTable={handleClearTable}
                  onMarkTurning={handleMarkTurning}
                  onAddMinutes={handleAddMinutes}
                  inFlightTableNumbers={inFlightTableNumbers}
                  addChairAction={addChair}
                  removeChairAction={removeChair}
                  showToast={showToast}
                  onClearSuccess={onClearSuccess}
                  nowMs={nowMs}
                />
              )}
            </div>
          </div>
        </section>

        <Panel variant="waitlist" as="section" className="flex min-w-0 flex-col min-h-0 lg:min-h-[28rem] rounded-none">
          <div className="flex flex-1 flex-col min-h-0 min-w-0 rounded-none">
            <div className="shrink-0 border-b border-[var(--waitlist-border)] px-2.5 py-2">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <Header variant="waitlist" as="h1">{restaurantName}</Header>
              </div>
              <p className="mt-0.5 meta-text text-[var(--waitlist-muted)] tabular-nums">
                <WorkspaceHeaderTime />
              </p>
            </div>
            <div className="shrink-0 flex flex-row items-center justify-between gap-2 border-b border-[var(--waitlist-border)] px-2.5 py-1.5">
              <Header variant="waitlist" as="h2" className="section-header">
                Waitlist ({waitingParties.length})
              </Header>
              <button
                type="button"
                onClick={() => setAddPartyModalOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-lg leading-none focus:outline-none hover:bg-[var(--primary-action-hover)] bg-[var(--primary-action)]"
                aria-label="Add party"
                title="Add party"
              >
                +
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {typeof process !== "undefined" && process.env.NODE_ENV !== "production" && (() => {
                // eslint-disable-next-line no-console
                console.count("Waitlist render");
                return null;
              })()}
              {waitingParties.length === 0 ? (
                <p className="px-2.5 py-3 text-sm text-[var(--waitlist-muted)]">
                  No one waiting. Tap + to add a party.
                </p>
              ) : (
                <div>
                  {waitingParties.map((party) => (
                    <WaitlistRow
                      key={party.id}
                      party={party}
                      isFirst={party.id === derivedFirstPartyId}
                      isNewest={party.id === derivedNewestPartyId && derivedFirstPartyId !== derivedNewestPartyId}
                      isDragging={draggingParty?.id === party.id}
                      workspaceId={workspaceId}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </main>

      {/* Combo details modal (Split) */}
      {selectedCombo && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setSelectedCombo(null)}
          role="dialog"
          aria-label="Combo controls"
        >
          <div
            className="w-full max-w-sm rounded-t-2xl border border-[var(--border)] bg-[var(--panel)] shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--border)] p-4">
              <div className="flex items-center justify-between">
                <h2 className="section-header text-[var(--text)]">
                  Merged {selectedCombo.tableNumbers.join("+")}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedCombo(null)}
                  className="rounded p-1 text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p className="mt-0.5 meta-text text-[var(--muted)]">
                {selectedCombo.mergedCapacity} seats combined
              </p>
              <span
                className={`mt-2 inline-block rounded px-2 py-1 meta-text font-medium ${
                  selectedCombo.status === "FREE"
                    ? "bg-[var(--table-free-fill)] text-[var(--table-free-text)]"
                    : selectedCombo.status === "TURNING"
                      ? "bg-[var(--table-turning-fill)] text-[var(--table-turning-text)]"
                      : "bg-[var(--table-occupied-fill)] text-[var(--table-occupied-text)]"
                }`}
              >
                {selectedCombo.status}
              </span>
            </div>
            <div className="p-4">
              <button
                type="button"
                disabled={splitLoading}
                onClick={handleSplitCombo}
                className="btn-outline w-full px-3 py-2 font-medium disabled:opacity-50"
              >
                {splitLoading ? "Splitting…" : "Split tables"}
              </button>
              <p className="mt-2 meta-text text-[var(--muted)]">
                Tables {selectedCombo.tableNumbers.join(", ")} will become separate again (FREE).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Party modal */}
      <AddPartyModal
        workspaceId={workspaceId}
        open={addPartyModalOpen}
        onClose={() => setAddPartyModalOpen(false)}
        onAdded={handlePartyAdded}
        showToast={showToast}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-[var(--text)] shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}

      {/* Performance Debug (dev only) */}
      {typeof process !== "undefined" && process.env.NODE_ENV !== "production" && (
        <div
          className="fixed bottom-4 right-4 z-30 max-w-[200px] rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5 meta-text text-[var(--muted)]"
          title="Render counts"
          aria-hidden
        >
          Perf: see console for counts (FloorCanvas, TableTile, Waitlist, TableDetailsModal)
        </div>
      )}
    </TimeTickProvider>
  );
}
