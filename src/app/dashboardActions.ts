"use server";

import { getUserId } from "@/lib/firebase/auth-server";
import {
  workspacesCol,
  partiesCol,
  seatingsCol,
  timestampToDate,
} from "@/lib/firebase/db";
import { PartyStatus } from "@/lib/enums";

export type WorkspaceStats = {
  workspaceId: string;
  name: string;
  createdAt: Date;
  avgWaitMin: number | null;
  minWaitMin: number | null;
  maxWaitMin: number | null;
  avgTableMin: number | null;
  minTableMin: number | null;
  maxTableMin: number | null;
  partiesWaited: number;
  partiesSeated: number;
  tablesTurned: number;
};

export type DailyAggregate = {
  date: string; // YYYY-MM-DD
  avgWaitMin: number | null;
  avgTableMin: number | null;
  partiesWaited: number;
  partiesSeated: number;
  tablesTurned: number;
};

export type DashboardStats = {
  workspaces: WorkspaceStats[];
  dailyAggregates: DailyAggregate[];
  summary: {
    avgWaitMin: number | null;
    minWaitMin: number | null;
    maxWaitMin: number | null;
    avgTableMin: number | null;
    minTableMin: number | null;
    maxTableMin: number | null;
    totalPartiesWaited: number;
    totalPartiesSeated: number;
    totalTablesTurned: number;
  };
};

/**
 * Get workspaces within a date range.
 * Fetches recent workspaces and filters in memory (Firestore doesn't support
 * two-range filters on one field without composite index).
 */
async function getWorkspacesInDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ id: string; name: string; createdAt: Date }>> {
  const snapshot = await workspacesCol(userId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const workspaces: Array<{ id: string; name: string; createdAt: Date }> = [];
  for (const doc of snapshot.docs) {
    const data = doc.data() as {
      name: string;
      createdAt: { seconds: number; nanoseconds: number };
    };
    const createdAt = timestampToDate(data.createdAt);
    if (!createdAt) continue;
    if (createdAt >= startDate && createdAt <= endDate) {
      workspaces.push({
        id: doc.id,
        name: data.name,
        createdAt,
      });
    }
  }
  return workspaces;
}

/**
 * Get stats for a single workspace.
 */
async function getWorkspaceStats(
  userId: string,
  workspaceId: string
): Promise<WorkspaceStats | null> {
  const workspaceSnap = await workspacesCol(userId).doc(workspaceId).get();
  if (!workspaceSnap.exists) return null;

  const workspaceData = workspaceSnap.data() as {
    name: string;
    createdAt: { seconds: number; nanoseconds: number };
  };
  const createdAt = timestampToDate(workspaceData.createdAt) ?? new Date(0);

  // Fetch parties and seatings
  const [partiesSnap, seatingsSnap] = await Promise.all([
    partiesCol(userId, workspaceId).orderBy("createdAt", "asc").get(),
    seatingsCol(userId, workspaceId).get(),
  ]);

  // Compute wait times from parties with seatedAt
  const waitTimes: number[] = [];
  let partiesWaited = 0;
  let partiesSeated = 0;

  for (const doc of partiesSnap.docs) {
    const p = doc.data() as {
      status: string;
      createdAt: { seconds: number; nanoseconds: number };
      seatedAt?: { seconds: number; nanoseconds: number };
    };
    partiesWaited++;
    if (p.status === PartyStatus.SEATED && p.seatedAt) {
      partiesSeated++;
      const createdAtDate = timestampToDate(p.createdAt);
      const seatedAtDate = timestampToDate(p.seatedAt);
      if (createdAtDate && seatedAtDate) {
        const waitMin = Math.round(
          (seatedAtDate.getTime() - createdAtDate.getTime()) / 60000
        );
        if (waitMin >= 0) {
          waitTimes.push(waitMin);
        }
      }
    }
  }

  // Compute table turn times from seatings with clearedAt and durationMin
  const tableTimes: number[] = [];
  let tablesTurned = 0;

  for (const doc of seatingsSnap.docs) {
    const s = doc.data() as {
      clearedAt?: { seconds: number; nanoseconds: number };
      durationMin?: number;
      seatedAt?: { seconds: number; nanoseconds: number };
    };
    if (s.clearedAt) {
      tablesTurned++;
      if (s.durationMin != null && s.durationMin >= 0) {
        tableTimes.push(s.durationMin);
      } else if (s.seatedAt) {
        // Fallback: compute from seatedAt and clearedAt
        const seatedAtDate = timestampToDate(s.seatedAt);
        const clearedAtDate = timestampToDate(s.clearedAt);
        if (seatedAtDate && clearedAtDate) {
          const durationMin = Math.round(
            (clearedAtDate.getTime() - seatedAtDate.getTime()) / 60000
          );
          if (durationMin >= 0) {
            tableTimes.push(durationMin);
          }
        }
      }
    }
  }

  // Calculate averages, min, max
  const avgWaitMin =
    waitTimes.length > 0
      ? Math.round(
          waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length
        )
      : null;
  const minWaitMin = waitTimes.length > 0 ? Math.min(...waitTimes) : null;
  const maxWaitMin = waitTimes.length > 0 ? Math.max(...waitTimes) : null;

  const avgTableMin =
    tableTimes.length > 0
      ? Math.round(
          tableTimes.reduce((sum, t) => sum + t, 0) / tableTimes.length
        )
      : null;
  const minTableMin = tableTimes.length > 0 ? Math.min(...tableTimes) : null;
  const maxTableMin = tableTimes.length > 0 ? Math.max(...tableTimes) : null;

  return {
    workspaceId,
    name: workspaceData.name,
    createdAt,
    avgWaitMin,
    minWaitMin,
    maxWaitMin,
    avgTableMin,
    minTableMin,
    maxTableMin,
    partiesWaited,
    partiesSeated,
    tablesTurned,
  };
}

/**
 * Get dashboard stats for a date range.
 */
export async function getDashboardStats(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DashboardStats> {
  const workspaces = await getWorkspacesInDateRange(userId, startDate, endDate);

  // Limit to 20 workspaces to avoid timeouts
  const workspacesToProcess = workspaces.slice(0, 20);
  const workspaceStatsPromises = workspacesToProcess.map((w) =>
    getWorkspaceStats(userId, w.id)
  );
  const workspaceStatsResults = await Promise.all(workspaceStatsPromises);
  const workspaceStats = workspaceStatsResults.filter(
    (s): s is WorkspaceStats => s !== null
  );

  // Group by day for daily aggregates (use local date, not UTC)
  const dailyMap = new Map<string, DailyAggregate>();

  for (const ws of workspaceStats) {
    const year = ws.createdAt.getFullYear();
    const month = String(ws.createdAt.getMonth() + 1).padStart(2, "0");
    const day = String(ws.createdAt.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD (local time)
    const existing = dailyMap.get(dateKey) || {
      date: dateKey,
      avgWaitMin: null,
      avgTableMin: null,
      partiesWaited: 0,
      partiesSeated: 0,
      tablesTurned: 0,
    };

    existing.partiesWaited += ws.partiesWaited;
    existing.partiesSeated += ws.partiesSeated;
    existing.tablesTurned += ws.tablesTurned;

    // For averages, we'll compute from all wait/table times per day
    // For now, store workspace-level averages and we'll aggregate later
    dailyMap.set(dateKey, existing);
  }

  // Compute daily averages from workspace stats
  const dailyAggregates: DailyAggregate[] = [];
  for (const [dateKey, daily] of dailyMap.entries()) {
    const dayWorkspaces = workspaceStats.filter((ws) => {
      const year = ws.createdAt.getFullYear();
      const month = String(ws.createdAt.getMonth() + 1).padStart(2, "0");
      const day = String(ws.createdAt.getDate()).padStart(2, "0");
      const wsDateKey = `${year}-${month}-${day}`;
      return wsDateKey === dateKey;
    });
    const waitTimes: number[] = [];
    const tableTimes: number[] = [];

    for (const ws of dayWorkspaces) {
      if (ws.avgWaitMin != null) {
        // Approximate: use avg * count (not perfect but reasonable)
        for (let i = 0; i < ws.partiesSeated; i++) {
          waitTimes.push(ws.avgWaitMin);
        }
      }
      if (ws.avgTableMin != null) {
        for (let i = 0; i < ws.tablesTurned; i++) {
          tableTimes.push(ws.avgTableMin);
        }
      }
    }

    daily.avgWaitMin =
      waitTimes.length > 0
        ? Math.round(waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length)
        : null;
    daily.avgTableMin =
      tableTimes.length > 0
        ? Math.round(
            tableTimes.reduce((sum, t) => sum + t, 0) / tableTimes.length
          )
        : null;

    dailyAggregates.push(daily);
  }

  // Sort daily aggregates by date
  dailyAggregates.sort((a, b) => a.date.localeCompare(b.date));

  // Compute summary across all workspaces
  const allWaitTimes: number[] = [];
  const allTableTimes: number[] = [];
  let totalPartiesWaited = 0;
  let totalPartiesSeated = 0;
  let totalTablesTurned = 0;

  for (const ws of workspaceStats) {
    totalPartiesWaited += ws.partiesWaited;
    totalPartiesSeated += ws.partiesSeated;
    totalTablesTurned += ws.tablesTurned;

    if (ws.avgWaitMin != null && ws.partiesSeated > 0) {
      for (let i = 0; i < ws.partiesSeated; i++) {
        allWaitTimes.push(ws.avgWaitMin);
      }
    }
    if (ws.avgTableMin != null && ws.tablesTurned > 0) {
      for (let i = 0; i < ws.tablesTurned; i++) {
        allTableTimes.push(ws.avgTableMin);
      }
    }
  }

  const summary = {
    avgWaitMin:
      allWaitTimes.length > 0
        ? Math.round(
            allWaitTimes.reduce((sum, t) => sum + t, 0) / allWaitTimes.length
          )
        : null,
    minWaitMin: allWaitTimes.length > 0 ? Math.min(...allWaitTimes) : null,
    maxWaitMin: allWaitTimes.length > 0 ? Math.max(...allWaitTimes) : null,
    avgTableMin:
      allTableTimes.length > 0
        ? Math.round(
            allTableTimes.reduce((sum, t) => sum + t, 0) / allTableTimes.length
          )
        : null,
    minTableMin: allTableTimes.length > 0 ? Math.min(...allTableTimes) : null,
    maxTableMin: allTableTimes.length > 0 ? Math.max(...allTableTimes) : null,
    totalPartiesWaited,
    totalPartiesSeated,
    totalTablesTurned,
  };

  return {
    workspaces: workspaceStats,
    dailyAggregates,
    summary,
  };
}
