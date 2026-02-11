import { TableStatus } from "./enums";

export type TableLike = {
  capacity: number;
  status: string;
  lastSeatedAt: Date | null;
  expectedFreeAt: Date | null;
};

// Saturday night: typical sit 1h45–2h. Used for wait estimates and table expectedFreeAt.
export function getEstimatedMealDurationMin(size: number): number {
  if (size <= 2) return 105;
  if (size <= 4) return 110;
  if (size <= 6) return 115;
  return 120;
}

/** @deprecated Use getEstimatedMealDurationMin. Kept for compatibility. */
export function getBaseTurnoverMin(size: number): number {
  return getEstimatedMealDurationMin(size);
}

/** Meal duration by table capacity (for display when party size unknown). */
export function getEstimatedMealDurationByCapacity(capacity: number): number {
  if (capacity <= 2) return 105;
  if (capacity <= 4) return 110;
  if (capacity <= 6) return 115;
  return 120;
}

export function minutesUntil(date: Date): number {
  const now = new Date();
  return Math.round((date.getTime() - now.getTime()) / 60000);
}

/** Minutes elapsed since a past date (e.g. lastSeatedAt). */
export function minutesSince(date: Date): number {
  const now = new Date();
  return Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
}

/** Human-readable sitting duration, e.g. "23 min" or "1h 15m". */
export function formatSittingDuration(lastSeatedAt: Date | null): string {
  if (!lastSeatedAt) return "";
  const min = minutesSince(lastSeatedAt);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Color phase for OCCUPIED tables: early=green, mid=yellow, late=red. */
export function getOccupiedColorPhase(elapsedMin: number): "early" | "mid" | "late" {
  if (elapsedMin < 35) return "early";
  if (elapsedMin < 70) return "mid";
  return "late";
}

/** Display table identity: "1", "2", … "20" (restaurant table number only). Works with number, tableNumber, or label. */
export function getTableDisplayNumber(table: { number?: number; label?: string; tableNumber?: number }): string {
  const n = table.number ?? table.tableNumber ?? (table.label != null ? parseInt(table.label, 10) : NaN);
  return Number.isFinite(n) ? String(n) : (table.label ?? "");
}

/** Sort tables by restaurant table number (1, 2, … 20). Use after findMany when client has no orderBy number. */
export function sortTablesByNumber<T extends { number?: number; label?: string; tableNumber?: number }>(tables: T[]): T[] {
  return [...tables].sort((a, b) => {
    const na = a.number ?? a.tableNumber ?? (a.label != null ? parseInt(a.label, 10) : NaN);
    const nb = b.number ?? b.tableNumber ?? (b.label != null ? parseInt(b.label, 10) : NaN);
    return (Number.isFinite(na) ? na : 0) - (Number.isFinite(nb) ? nb : 0);
  });
}

/** "Seated at: HH:MM" for lastSeatedAt. */
export function formatSeatedAtTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Clock time in 24-hour format with padded minutes, e.g. "20:05". */
export function formatTime24(date: Date | null): string {
  if (!date) return "";
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Estimated finish time: expectedFreeAt if set, else lastSeatedAt + estimated duration by capacity. */
export function getEstimatedFinishTime(table: {
  expectedFreeAt: Date | null;
  lastSeatedAt: Date | null;
  capacity: number;
}): Date | null {
  if (table.expectedFreeAt) return table.expectedFreeAt;
  if (!table.lastSeatedAt) return null;
  const duration = getEstimatedMealDurationByCapacity(table.capacity);
  return new Date(table.lastSeatedAt.getTime() + duration * 60000);
}

/** Minutes remaining until table is free (for "Estimated free in: Xm"). */
export function estimatedFreeInMinutes(table: {
  expectedFreeAt: Date | null;
  lastSeatedAt: Date | null;
  capacity: number;
}): number | null {
  const now = new Date();
  if (table.expectedFreeAt) {
    return Math.max(0, Math.round((table.expectedFreeAt.getTime() - now.getTime()) / 60000));
  }
  if (table.lastSeatedAt) {
    const duration = getEstimatedMealDurationByCapacity(table.capacity);
    const freeAt = new Date(table.lastSeatedAt.getTime() + duration * 60000);
    return Math.max(0, Math.round((freeAt.getTime() - now.getTime()) / 60000));
  }
  return null;
}

// Wait time: any table that fits; no zone/preference.
export function computeQuotedWaitMin(size: number, tables: TableLike[]): number {
  const earliest = getEarliestAvailableTimeForParty(size, tables);
  if (!earliest) return 0;
  return Math.max(0, minutesUntil(earliest));
}

// Earliest time any eligible table (capacity >= size) is available.
export function getEarliestAvailableTimeForParty(
  size: number,
  tables: TableLike[]
): Date | null {
  const now = new Date();
  const baseTurnover = getEstimatedMealDurationMin(size);
  const eligible = tables.filter((t) => t.capacity >= size);
  if (eligible.length === 0) return null;

  let earliest: Date | null = null;

  for (const table of eligible) {
    let availableAt: Date;

    if (table.status === TableStatus.FREE) {
      availableAt = now;
    } else if (table.expectedFreeAt) {
      availableAt = table.expectedFreeAt;
    } else if (table.lastSeatedAt) {
      availableAt = new Date(
        table.lastSeatedAt.getTime() + baseTurnover * 60000
      );
    } else {
      availableAt = new Date(now.getTime() + baseTurnover * 60000);
    }

    if (!earliest || availableAt < earliest) {
      earliest = availableAt;
    }
  }

  return earliest;
}

/** Workspace table-like: capacity, status, lastSeatedAt, expectedFreeAt. */
type WorkspaceTableLike = {
  capacity: number;
  status: string;
  lastSeatedAt: Date | null;
  expectedFreeAt: Date | null;
};

export function getEarliestAvailableTimeForWorkspaceTables(
  size: number,
  tables: WorkspaceTableLike[]
): Date | null {
  const now = new Date();
  const baseTurnover = getEstimatedMealDurationMin(size);
  const eligible = tables.filter((t) => t.capacity >= size);
  if (eligible.length === 0) return null;

  let earliest: Date | null = null;

  for (const table of eligible) {
    let availableAt: Date;

    if (table.status === TableStatus.FREE) {
      availableAt = now;
    } else if (table.expectedFreeAt) {
      availableAt = table.expectedFreeAt;
    } else if (table.lastSeatedAt) {
      availableAt = new Date(
        table.lastSeatedAt.getTime() + baseTurnover * 60000
      );
    } else {
      availableAt = new Date(now.getTime() + baseTurnover * 60000);
    }

    if (!earliest || availableAt < earliest) {
      earliest = availableAt;
    }
  }

  return earliest;
}

