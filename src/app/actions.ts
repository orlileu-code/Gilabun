"use server";

import { revalidatePath } from "next/cache";
import { getUserId, getAdminFirestore } from "@/lib/firebase/admin";
import {
  partiesCol,
  tableStatesCol,
  tableStateDoc,
  seatingsCol,
  workspaceCombosCol,
  timestampToDate
} from "@/lib/firebase/db";
import { getEstimatedMealDurationMin } from "@/lib/waitEstimate";
import { PartyStatus, TableStatus } from "@/lib/enums";
import type { AutoAssignState, SuggestState } from "@/lib/assignTypes";
import { AUTO_ASSIGN_THRESHOLD_MIN } from "@/lib/assignTypes";

type ActionState = {
  ok: boolean;
  error?: string;
};

function asPartyStatus(
  value: string
): "WAITING" | "SEATED" | "CANCELED" | "NO_SHOW" | null {
  return value === PartyStatus.WAITING ||
    value === PartyStatus.SEATED ||
    value === PartyStatus.CANCELED ||
    value === PartyStatus.NO_SHOW
    ? value
    : null;
}

type WorkspaceTableLike = {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
  lastSeatedAt: Date | null;
  expectedFreeAt: Date | null;
};

function computeWorkspaceTableAvailability(
  table: WorkspaceTableLike,
  partySize: number,
  now: Date
): Date {
  if (table.status === TableStatus.FREE) return now;
  if (table.expectedFreeAt) return table.expectedFreeAt;
  if (table.lastSeatedAt) {
    const duration = getEstimatedMealDurationMin(partySize);
    return new Date(table.lastSeatedAt.getTime() + duration * 60000);
  }
  return new Date(now.getTime() + getEstimatedMealDurationMin(partySize) * 60000);
}

function getEarliestAvailableTimeForWorkspaceTables(
  size: number,
  tables: WorkspaceTableLike[]
): Date | null {
  const now = new Date();
  const eligible = tables.filter((t) => t.capacity >= size);
  if (eligible.length === 0) return null;
  let earliest: Date | null = null;
  for (const t of eligible) {
    const at = computeWorkspaceTableAvailability(t, size, now);
    if (!earliest || at < earliest) earliest = at;
  }
  return earliest;
}

export async function addPartyToWorkspaceAction(
  workspaceId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const sizeRaw = String(formData.get("size") ?? "0");
  const size = Number(sizeRaw);
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !Number.isFinite(size) || size < 1) {
    return { ok: false, error: "Name is required and size must be at least 1." };
  }

  const userId = getUserId();
  const tableStatesSnap = await tableStatesCol(userId, workspaceId).get();
  const tableStatesList: WorkspaceTableLike[] = tableStatesSnap.docs.map((d) => {
    const t = d.data() as {
      tableNumber: number;
      capacity: number;
      status: string;
      lastSeatedAt?: { seconds: number; nanoseconds: number };
      expectedFreeAt?: { seconds: number; nanoseconds: number };
    };
    return {
      id: d.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      status: t.status ?? "FREE",
      lastSeatedAt: timestampToDate(t.lastSeatedAt),
      expectedFreeAt: timestampToDate(t.expectedFreeAt)
    };
  });
  const earliest = getEarliestAvailableTimeForWorkspaceTables(size, tableStatesList);
  const quotedWaitMin =
    earliest == null
      ? 0
      : Math.max(0, Math.round((earliest.getTime() - Date.now()) / 60000));

  const now = new Date();
  await partiesCol(userId, workspaceId).add({
    name,
    size,
    phone: phone ?? null,
    notes: notes ?? null,
    status: PartyStatus.WAITING,
    createdAt: now,
    quotedWaitMin
  });

  revalidatePath("/");
  revalidatePath(`/workspace/${workspaceId}`);
  return { ok: true };
}

/** Created party payload for optimistic UI. */
export type CreatedPartyPayload = {
  id: string;
  name: string;
  size: number;
  phone: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  seatedAt: null;
};

/** Create a party in workspace (for modal/sheet). Returns created party for optimistic add. */
export async function createPartyInWorkspace(
  workspaceId: string,
  name: string,
  size: number,
  phone?: string | null,
  notes?: string | null
): Promise<{ error?: string; party?: CreatedPartyPayload }> {
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Name is required." };
  if (!Number.isFinite(size) || size < 1) return { error: "Size must be at least 1." };

  const userId = getUserId();
  const tableStatesSnap = await tableStatesCol(userId, workspaceId).get();
  const tableStatesList: WorkspaceTableLike[] = tableStatesSnap.docs.map((d) => {
    const t = d.data() as {
      tableNumber: number;
      capacity: number;
      status: string;
      lastSeatedAt?: { seconds: number; nanoseconds: number };
      expectedFreeAt?: { seconds: number; nanoseconds: number };
    };
    return {
      id: d.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      status: t.status ?? "FREE",
      lastSeatedAt: timestampToDate(t.lastSeatedAt),
      expectedFreeAt: timestampToDate(t.expectedFreeAt)
    };
  });
  const earliest = getEarliestAvailableTimeForWorkspaceTables(size, tableStatesList);
  const quotedWaitMin =
    earliest == null
      ? 0
      : Math.max(0, Math.round((earliest.getTime() - Date.now()) / 60000));

  const now = new Date();
  const ref = await partiesCol(userId, workspaceId).add({
    name: trimmedName,
    size,
    phone: phone ?? null,
    notes: notes ?? null,
    status: PartyStatus.WAITING,
    createdAt: now,
    quotedWaitMin
  });

  revalidatePath("/");
  revalidatePath(`/workspace/${workspaceId}`);
  const party: CreatedPartyPayload = {
    id: ref.id,
    name: trimmedName,
    size,
    phone: phone ?? null,
    notes: notes ?? null,
    status: PartyStatus.WAITING,
    createdAt: now.toISOString(),
    seatedAt: null
  };
  return { party };
}

/** Used when no workspace is open; form should always have workspaceId in practice. */
export async function addPartyAction(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  return { ok: false, error: "Please open a workspace to add a party." };
}

export async function getNextSeatingForWorkspace(workspaceId: string): Promise<{
  partyId: string;
  partyName: string;
  partySize: number;
  workspaceTableStateId: string;
  tableLabel: string;
  minutesUntil: number;
} | null> {
  const userId = getUserId();
  const now = new Date();

  const waitingSnap = await partiesCol(userId, workspaceId)
    .where("status", "==", PartyStatus.WAITING)
    .orderBy("createdAt", "asc")
    .limit(1)
    .get();
  if (waitingSnap.empty) return null;
  const partyDoc = waitingSnap.docs[0];
  const partyData = partyDoc.data() as {
    name: string;
    size: number;
  };

  const tableStatesSnap = await tableStatesCol(userId, workspaceId).get();
  const tables: WorkspaceTableLike[] = tableStatesSnap.docs.map((d) => {
    const t = d.data() as {
      tableNumber: number;
      capacity: number;
      status: string;
      lastSeatedAt?: { seconds: number; nanoseconds: number };
      expectedFreeAt?: { seconds: number; nanoseconds: number };
    };
    return {
      id: d.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      status: t.status ?? "FREE",
      lastSeatedAt: timestampToDate(t.lastSeatedAt),
      expectedFreeAt: timestampToDate(t.expectedFreeAt)
    };
  });
  const eligible = tables.filter((t) => t.capacity >= partyData.size);
  if (eligible.length === 0) return null;

  let best: WorkspaceTableLike | null = null;
  let bestAt: Date | null = null;
  for (const t of eligible) {
    const at = computeWorkspaceTableAvailability(t, partyData.size, now);
    if (!bestAt || at < bestAt) {
      bestAt = at;
      best = t;
    }
  }
  if (!best || !bestAt) return null;

  const minutesUntil = Math.max(
    0,
    Math.round((bestAt.getTime() - now.getTime()) / 60000)
  );

  return {
    partyId: partyDoc.id,
    partyName: partyData.name,
    partySize: partyData.size,
    workspaceTableStateId: best.id,
    tableLabel: String(best.tableNumber),
    minutesUntil
  };
}

/** Form action: formData must include workspaceId; optional "size" for size-priority. */
export async function autoAssignNextPartyAction(
  _prevState: AutoAssignState,
  formData: FormData
): Promise<AutoAssignState> {
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!workspaceId) {
    return { status: "ERROR", message: "Workspace required." };
  }
  const sizeRaw = formData.get("size");
  const targetSize =
    sizeRaw != null && sizeRaw !== ""
      ? Number(String(sizeRaw))
      : null;
  const mode: AutoAssignState["mode"] =
    targetSize != null && Number.isFinite(targetSize)
      ? "SIZE_PRIORITY"
      : "FCFS";

  const next = await getNextSeatingForWorkspace(workspaceId);
  if (!next) {
    const userId = getUserId();
    const waitingSnap = await partiesCol(userId, workspaceId)
      .where("status", "==", PartyStatus.WAITING)
      .limit(1)
      .get();
    return {
      status: waitingSnap.empty ? "NO_PARTY" : "NO_TABLE",
      message: waitingSnap.empty
        ? undefined
        : "No eligible tables for the next party.",
      mode,
      targetSize: targetSize ?? null
    };
  }

  if (next.minutesUntil <= AUTO_ASSIGN_THRESHOLD_MIN) {
    const fd = new FormData();
    fd.set("partyId", next.partyId);
    fd.set("workspaceTableStateId", next.workspaceTableStateId);
    fd.set("workspaceId", workspaceId);
    await forceSeatWorkspaceAction(fd);
    revalidatePath("/");
    revalidatePath(`/workspace/${workspaceId}`);
    return {
      status: "SEATED",
      partyName: next.partyName,
      tableLabel: next.tableLabel,
      minutesUntilAvailable: next.minutesUntil,
      mode,
      targetSize: targetSize ?? null
    };
  }

  return {
    status: "RECOMMENDATION",
    partyId: next.partyId,
    partyName: next.partyName,
    partySize: next.partySize,
    tableId: next.workspaceTableStateId,
    tableLabel: next.tableLabel,
    minutesUntilAvailable: next.minutesUntil,
    mode,
    targetSize: targetSize ?? null
  };
}

/** Alias for forceSeatWorkspaceAction; accepts partyId, tableId (workspaceTableStateId), workspaceId in formData. */
export async function forceSeatAction(formData: FormData) {
  const partyId = String(formData.get("partyId") ?? "").trim();
  const tableId = String(formData.get("tableId") ?? "").trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!partyId || !tableId || !workspaceId) return;
  const fd = new FormData();
  fd.set("partyId", partyId);
  fd.set("workspaceTableStateId", tableId);
  fd.set("workspaceId", workspaceId);
  await forceSeatWorkspaceAction(fd);
}

/** Form action: formData must include partyId and workspaceId. Returns suggested table for that party. */
export async function suggestTableForPartyAction(
  _prevState: SuggestState,
  formData: FormData
): Promise<SuggestState> {
  const partyId = String(formData.get("partyId") ?? "").trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!partyId || !workspaceId) {
    return { status: "ERROR", message: "Party and workspace required." };
  }
  const userId = getUserId();
  const partySnap = await partiesCol(userId, workspaceId).doc(partyId).get();
  if (!partySnap.exists) {
    return { status: "ERROR", message: "Party not found." };
  }
  const partyData = partySnap.data() as { name: string; size: number };
  const tableStatesSnap = await tableStatesCol(userId, workspaceId).get();
  const tables: WorkspaceTableLike[] = tableStatesSnap.docs.map((d) => {
    const t = d.data() as {
      tableNumber: number;
      capacity: number;
      status: string;
      lastSeatedAt?: { seconds: number; nanoseconds: number };
      expectedFreeAt?: { seconds: number; nanoseconds: number };
    };
    return {
      id: d.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      status: t.status ?? "FREE",
      lastSeatedAt: timestampToDate(t.lastSeatedAt),
      expectedFreeAt: timestampToDate(t.expectedFreeAt)
    };
  });
  const earliest = getEarliestAvailableTimeForWorkspaceTables(
    partyData.size,
    tables
  );
  if (!earliest) {
    return {
      status: "NO_TABLE",
      message: "No table fits this party.",
      partyId,
      partyName: partyData.name,
      partySize: partyData.size
    };
  }
  const now = new Date();
  const minutesUntil = Math.max(
    0,
    Math.round((earliest.getTime() - now.getTime()) / 60000)
  );
  const best = tables.find((t) => t.capacity >= partyData.size);
  return {
    status: "RECOMMENDATION",
    partyId,
    partyName: partyData.name,
    partySize: partyData.size,
    tableId: best?.id,
    tableLabel: best ? String(best.tableNumber) : undefined,
    minutesUntilAvailable: minutesUntil
  };
}

const DEFAULT_TURNING_MIN_WS = 15;
const BUMP_MINUTES = 10;
const KITCHEN_SLOW_MIN = 10;

/** Serializable table state for optimistic UI reconciliation. */
export type TableStatePayload = {
  id: string;
  tableNumber: number;
  status: string;
  lastSeatedAt: string | null;
  expectedFreeAt: string | null;
  currentPartyId: string | null;
  currentPartyName: string | null;
  capacity: number;
  baseCapacity: number;
  capacityOverride: number;
};

/** Serializable party update for optimistic UI reconciliation. */
export type PartyPayload = {
  id: string;
  status: string;
  seatedAt: string | null;
  name: string;
  size: number;
};

/** Seat a party at a table by table number. Used for drag-drop. Returns payload for optimistic reconcile or error. */
export async function seatPartyAtTable(
  workspaceId: string,
  partyId: string,
  tableNumber: number
): Promise<{ error?: string; tableState?: TableStatePayload; party?: PartyPayload }> {
  const userId = getUserId();
  const db = getAdminFirestore();
  const tableStateRef = tableStatesCol(userId, workspaceId).doc(String(tableNumber));

  try {
    let resultPayload: { tableState: TableStatePayload; party: PartyPayload } | null = null;
    await db.runTransaction(async (tx) => {
      const partyRef = partiesCol(userId, workspaceId).doc(partyId);
      const [partySnap, tableStateSnap] = await Promise.all([
        tx.get(partyRef),
        tx.get(tableStateRef)
      ]);
      if (!partySnap.exists) throw new Error("Party not found.");
      if (!tableStateSnap.exists) throw new Error("Table not found.");
      const partyData = partySnap.data() as { status: string; size: number; name: string };
      const tableData = tableStateSnap.data() as {
        status: string;
        capacity: number;
        capacityOverride?: number;
      };
      const effectiveCapacity =
        (tableData.capacity ?? 0) + (tableData.capacityOverride ?? 0);
      if (partyData.status !== PartyStatus.WAITING) throw new Error("Party is not waiting.");
      if (effectiveCapacity < partyData.size) throw new Error("Table too small.");
      if (tableData.status !== TableStatus.FREE && tableData.status !== TableStatus.TURNING) {
        throw new Error("Table occupied.");
      }

      const now = new Date();
      const baseTurnover = getEstimatedMealDurationMin(partyData.size);
      const expectedFreeAt = new Date(now.getTime() + baseTurnover * 60000);
      const baseCapacity = tableData.capacity ?? 0;
      const capacityOverride = tableData.capacityOverride ?? 0;

      tx.update(partyRef, {
        status: PartyStatus.SEATED,
        seatedAt: now
      });
      tx.update(tableStateRef, {
        status: TableStatus.OCCUPIED,
        lastSeatedAt: now,
        expectedFreeAt,
        currentPartyId: partyId,
        currentPartyName: partyData.name,
        updatedAt: now
      });
      const seatingRef = seatingsCol(userId, workspaceId).doc();
      tx.set(seatingRef, {
        partyId,
        tableNumber,
        seatedAt: now,
        clearedAt: null
      });

      resultPayload = {
        tableState: {
          id: String(tableNumber),
          tableNumber,
          status: TableStatus.OCCUPIED,
          lastSeatedAt: now.toISOString(),
          expectedFreeAt: expectedFreeAt.toISOString(),
          currentPartyId: partyId,
          currentPartyName: partyData.name,
          capacity: baseCapacity + capacityOverride,
          baseCapacity,
          capacityOverride
        },
        party: {
          id: partyId,
          status: PartyStatus.SEATED,
          seatedAt: now.toISOString(),
          name: partyData.name,
          size: partyData.size
        }
      };
    });
    revalidatePath("/");
    revalidatePath(`/workspace/${workspaceId}`);
    const payload = resultPayload as { tableState: TableStatePayload; party: PartyPayload } | null;
    return payload ? { tableState: payload.tableState, party: payload.party } : {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to seat party.";
    return { error: message };
  }
}

/** Seat a party at a combo (merged tables). Used for drag-drop onto combo tile. */
export async function seatPartyAtCombo(
  workspaceId: string,
  partyId: string,
  comboId: string
): Promise<{ error?: string }> {
  const userId = getUserId();
  const db = getAdminFirestore();
  const partyRef = partiesCol(userId, workspaceId).doc(partyId);
  const comboRef = workspaceCombosCol(userId, workspaceId).doc(comboId);

  try {
    await db.runTransaction(async (tx) => {
      const [partySnap, comboSnap] = await Promise.all([
        tx.get(partyRef),
        tx.get(comboRef)
      ]);
      if (!partySnap.exists) throw new Error("Party not found.");
      if (!comboSnap.exists) throw new Error("Combo not found.");
      const partyData = partySnap.data() as { status: string; size: number; name: string };
      const comboData = comboSnap.data() as {
        mergedCapacity: number;
        status: string;
      };
      if (partyData.status !== PartyStatus.WAITING) throw new Error("Party is not waiting.");
      if (comboData.mergedCapacity < partyData.size) throw new Error("Combo too small.");
      if (comboData.status !== "FREE" && comboData.status !== "TURNING") {
        throw new Error("Combo occupied.");
      }

      const now = new Date();
      const baseTurnover = getEstimatedMealDurationMin(partyData.size);
      const expectedFreeAt = new Date(now.getTime() + baseTurnover * 60000);

      tx.update(partyRef, {
        status: PartyStatus.SEATED,
        seatedAt: now
      });
      tx.update(comboRef, {
        status: "OCCUPIED",
        lastSeatedAt: now,
        expectedFreeAt,
        currentPartyId: partyId,
        currentPartyName: partyData.name,
        updatedAt: now
      });
    });
    revalidatePath("/");
    revalidatePath(`/workspace/${workspaceId}`);
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to seat party at combo.";
    return { error: message };
  }
}

export async function forceSeatWorkspaceAction(formData: FormData) {
  const partyId = String(formData.get("partyId") ?? "").trim();
  const workspaceTableStateId = String(
    formData.get("workspaceTableStateId") ?? ""
  ).trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!partyId || !workspaceTableStateId || !workspaceId) return;

  const tableNumber = Number(workspaceTableStateId);
  if (!Number.isFinite(tableNumber)) return;
  const result = await seatPartyAtTable(workspaceId, partyId, tableNumber);
  if (result.error) return;
}

export async function setPartyStatusWorkspaceAction(formData: FormData) {
  const partyId = String(formData.get("partyId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  const status = asPartyStatus(statusRaw);
  if (!partyId || !status) return;

  const userId = getUserId();
  await partiesCol(userId, workspaceId).doc(partyId).update({ status });
  revalidatePath("/");
  if (workspaceId) revalidatePath(`/workspace/${workspaceId}`);
}

/** Mark table as TURNING with expectedFreeAt. Returns tableState for optimistic reconcile. */
export async function markTableTurningAction(
  workspaceId: string,
  tableNumber: number,
  turningMinutes: number = 15
): Promise<{ error?: string; tableState?: TableStatePayload }> {
  const userId = getUserId();
  const db = getAdminFirestore();
  const now = new Date();
  const docId = String(tableNumber);
  const tableStateRef = tableStatesCol(userId, workspaceId).doc(docId);

  try {
    let payload: TableStatePayload | null = null;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(tableStateRef);
      if (!snap.exists) {
        throw new Error("Table not found");
      }
      const data = snap.data() as {
        status?: string;
        expectedFreeAt?: { seconds: number; nanoseconds: number };
        lastSeatedAt?: unknown;
        capacity?: number;
        capacityOverride?: number;
        currentPartyId?: string | null;
        currentPartyName?: string | null;
      };
      const status = (data.status ?? "FREE") as string;
      const existingExpected = timestampToDate(data.expectedFreeAt);
      const baseTime =
        existingExpected && existingExpected.getTime() > now.getTime()
          ? existingExpected.getTime()
          : now.getTime();
      const expectedFreeAt = new Date(baseTime + turningMinutes * 60000);
      const baseCapacity = data.capacity ?? 0;
      const capacityOverride = data.capacityOverride ?? 0;

      if (status === TableStatus.FREE) {
        tx.set(tableStateRef, {
          status: TableStatus.TURNING,
          expectedFreeAt,
          lastSeatedAt: null,
          currentPartyId: null,
          currentPartyName: null,
          updatedAt: now,
          ...(data.capacity != null && { capacity: data.capacity })
        }, { merge: true });
        payload = {
          id: docId,
          tableNumber,
          status: TableStatus.TURNING,
          lastSeatedAt: null,
          expectedFreeAt: expectedFreeAt.toISOString(),
          currentPartyId: null,
          currentPartyName: null,
          capacity: baseCapacity + capacityOverride,
          baseCapacity,
          capacityOverride
        };
      } else {
        const lastSeatedAt = timestampToDate(data.lastSeatedAt as { seconds: number; nanoseconds: number } | undefined);
        tx.set(tableStateRef, {
          status: TableStatus.TURNING,
          expectedFreeAt,
          updatedAt: now,
          ...(data.lastSeatedAt != null && { lastSeatedAt: data.lastSeatedAt }),
          ...(data.currentPartyId != null && { currentPartyId: data.currentPartyId }),
          ...(data.currentPartyName != null && { currentPartyName: data.currentPartyName }),
          ...(data.capacity != null && { capacity: data.capacity })
        }, { merge: true });
        payload = {
          id: docId,
          tableNumber,
          status: TableStatus.TURNING,
          lastSeatedAt: lastSeatedAt ? lastSeatedAt.toISOString() : null,
          expectedFreeAt: expectedFreeAt.toISOString(),
          currentPartyId: data.currentPartyId ?? null,
          currentPartyName: data.currentPartyName ?? null,
          capacity: baseCapacity + capacityOverride,
          baseCapacity,
          capacityOverride
        };
      }
    });
    revalidatePath("/");
    revalidatePath(`/workspace/${workspaceId}`);
    return payload ? { tableState: payload } : {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark turning.";
    return { error: message };
  }
}

export async function markWorkspaceTableTurningFormAction(formData: FormData) {
  const workspaceTableStateId = String(
    formData.get("workspaceTableStateId") ?? ""
  ).trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!workspaceTableStateId || !workspaceId) return;
  const tableNumber = Number(workspaceTableStateId);
  if (!Number.isFinite(tableNumber)) return;
  await markTableTurningAction(workspaceId, tableNumber, DEFAULT_TURNING_MIN_WS);
}

export async function clearWorkspaceTableFormAction(formData: FormData) {
  const workspaceTableStateId = String(
    formData.get("workspaceTableStateId") ?? ""
  ).trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!workspaceTableStateId || !workspaceId) return;
  const tableNumber = Number(workspaceTableStateId);
  if (!Number.isFinite(tableNumber)) return;
  await clearTableAction(workspaceId, tableNumber);
}

/** Clear a table (FREE, clear current party, close seating). Returns tableState for optimistic reconcile. */
export async function clearTableAction(
  workspaceId: string,
  tableNumber: number
): Promise<{ error?: string; tableState?: TableStatePayload }> {
  const userId = getUserId();
  const db = getAdminFirestore();
  const now = new Date();
  const docId = String(tableNumber);
  const tableStateRef = tableStatesCol(userId, workspaceId).doc(docId);

  try {
    await db.runTransaction(async (tx) => {
      const seatingsSnap = await tx.get(
        seatingsCol(userId, workspaceId)
          .where("tableNumber", "==", tableNumber)
          .where("clearedAt", "==", null)
          .orderBy("seatedAt", "desc")
          .limit(1)
      );
      if (!seatingsSnap.empty) {
        const seatingDoc = seatingsSnap.docs[0];
        const data = seatingDoc.data() as {
          seatedAt: { seconds: number; nanoseconds: number };
        };
        const seatedAtDate = timestampToDate(data.seatedAt);
        const durationMin =
          seatedAtDate != null
            ? Math.max(0, Math.round((now.getTime() - seatedAtDate.getTime()) / 60000))
            : 0;
      tx.update(seatingDoc.ref, { clearedAt: now, durationMin });
    }
      tx.set(tableStateRef, {
        status: TableStatus.FREE,
        lastSeatedAt: null,
        expectedFreeAt: null,
        currentPartyId: null,
        currentPartyName: null,
        updatedAt: now
      }, { merge: true });
    });
    revalidatePath("/");
    revalidatePath(`/workspace/${workspaceId}`);
    const snap = await tableStateRef.get();
    const data = snap.exists ? (snap.data() as { capacity?: number; capacityOverride?: number }) : {};
    const baseCapacity = data.capacity ?? 0;
    const capacityOverride = data.capacityOverride ?? 0;
    const tableState: TableStatePayload = {
      id: docId,
      tableNumber,
      status: TableStatus.FREE,
      lastSeatedAt: null,
      expectedFreeAt: null,
      currentPartyId: null,
      currentPartyName: null,
      capacity: baseCapacity + capacityOverride,
      baseCapacity,
      capacityOverride
    };
    return { tableState };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't clear table.";
    return { error: message };
  }
}

/** Add minutes to table expectedFreeAt. Returns tableState for optimistic reconcile. */
export async function addMinutesToTableAction(
  workspaceId: string,
  tableNumber: number,
  minutesToAdd: number = 10
): Promise<{ error?: string; tableState?: TableStatePayload }> {
  const userId = getUserId();
  const db = getAdminFirestore();
  const now = new Date();
  const docId = String(tableNumber);
  const tableStateRef = tableStatesCol(userId, workspaceId).doc(docId);

  try {
    let payload: TableStatePayload | null = null;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(tableStateRef);
      if (!snap.exists) {
        throw new Error("Table not found");
      }
      const data = snap.data() as {
        status?: string;
        expectedFreeAt?: { seconds: number; nanoseconds: number };
        lastSeatedAt?: { seconds: number; nanoseconds: number };
        currentPartyId?: string | null;
        currentPartyName?: string | null;
        capacity?: number;
        capacityOverride?: number;
      };
      const status = (data.status ?? "FREE") as string;
      if (status === TableStatus.FREE) {
        throw new Error("Table is free; no time to extend.");
      }
      const existingExpected = timestampToDate(data.expectedFreeAt);
      const baseTime =
        existingExpected && existingExpected.getTime() > now.getTime()
          ? existingExpected.getTime()
          : now.getTime();
      const expectedFreeAt = new Date(baseTime + minutesToAdd * 60000);
      const baseCapacity = data.capacity ?? 0;
      const capacityOverride = data.capacityOverride ?? 0;
      const lastSeatedAt = timestampToDate(data.lastSeatedAt);

      tx.set(tableStateRef, {
        expectedFreeAt,
        updatedAt: now,
        ...(data.lastSeatedAt != null && { lastSeatedAt: data.lastSeatedAt }),
        ...(data.currentPartyId != null && { currentPartyId: data.currentPartyId }),
        ...(data.currentPartyName != null && { currentPartyName: data.currentPartyName }),
        ...(data.capacity != null && { capacity: data.capacity }),
        status: data.status ?? TableStatus.OCCUPIED
      }, { merge: true });

      payload = {
        id: docId,
        tableNumber,
        status: data.status ?? TableStatus.OCCUPIED,
        lastSeatedAt: lastSeatedAt ? lastSeatedAt.toISOString() : null,
        expectedFreeAt: expectedFreeAt.toISOString(),
        currentPartyId: data.currentPartyId ?? null,
        currentPartyName: data.currentPartyName ?? null,
        capacity: baseCapacity + capacityOverride,
        baseCapacity,
        capacityOverride
      };
    });
    revalidatePath("/");
    revalidatePath(`/workspace/${workspaceId}`);
    return payload ? { tableState: payload } : {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add time.";
    return { error: message };
  }
}

export async function bumpWorkspaceExpectedFreeAtFormAction(formData: FormData) {
  const workspaceTableStateId = String(
    formData.get("workspaceTableStateId") ?? ""
  ).trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!workspaceTableStateId || !workspaceId) return;
  const tableNumber = Number(workspaceTableStateId);
  if (!Number.isFinite(tableNumber)) return;
  await addMinutesToTableAction(workspaceId, tableNumber, BUMP_MINUTES);
}

export async function kitchenSlowAllWorkspaceAction(workspaceId: string) {
  const userId = getUserId();
  const snapshot = await tableStatesCol(userId, workspaceId).get();
  const now = new Date();
  for (const doc of snapshot.docs) {
    const data = doc.data() as {
      expectedFreeAt?: { seconds: number; nanoseconds: number };
    };
    if (data.expectedFreeAt) {
      const current = timestampToDate(data.expectedFreeAt);
      if (current) {
        await doc.ref.update({
          expectedFreeAt: new Date(
            current.getTime() + KITCHEN_SLOW_MIN * 60000
          ),
          updatedAt: now
        });
      }
    }
  }
  revalidatePath("/");
  revalidatePath(`/workspace/${workspaceId}`);
}
