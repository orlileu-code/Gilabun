"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/firebase/auth-server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  templatesCol,
  templateDoc,
  templateTablesCol,
  templateLabelsCol,
  workspacesCol,
  workspaceDoc,
  tableStatesCol,
  workspaceCombosCol,
  partiesCol,
  timestampToDate
} from "@/lib/firebase/db";

export type WorkspaceWithMeta = {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  createdAt: Date;
  isActive: boolean;
};

export async function listWorkspaces(userId: string): Promise<WorkspaceWithMeta[]> {
  const snapshot = await workspacesCol(userId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
  const list: WorkspaceWithMeta[] = [];
  for (const doc of snapshot.docs) {
    const d = doc.data() as {
      name: string;
      templateId: string;
      templateName?: string;
      createdAt: { seconds: number; nanoseconds: number };
      isActive?: boolean;
    };
    list.push({
      id: doc.id,
      name: d.name,
      templateId: d.templateId,
      templateName: d.templateName ?? "",
      createdAt: timestampToDate(d.createdAt) ?? new Date(0),
      isActive: !!d.isActive
    });
  }
  return list;
}

export async function createWorkspaceFromTemplate(
  templateId: string,
  name?: string
): Promise<{ workspaceId?: string; error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const templateSnap = await templateDoc(userId, templateId).get();
  if (!templateSnap.exists) return { error: "Template not found." };
  const templateData = templateSnap.data() as { name: string; logoUrl?: string | null };
  const tablesSnap = await templateTablesCol(userId, templateId)
    .orderBy("tableNumber", "asc")
    .get();
  if (tablesSnap.empty) return { error: "Template has no tables." };

  const workspaceName =
    name?.trim() ||
    new Date().toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const now = new Date();
  const workspaceRef = await workspacesCol(userId).add({
    name: workspaceName,
    templateId,
    templateName: templateData.name,
    templateLogoUrl: templateData.logoUrl ?? null,
    createdAt: now,
    updatedAt: now,
    status: "ACTIVE",
    isActive: false
  });

  const db = getAdminFirestore();
  const batch = db.batch();
  for (const doc of tablesSnap.docs) {
    const t = doc.data() as { tableNumber: number; seats: number };
    const tableStateRef = tableStatesCol(userId, workspaceRef.id).doc(String(t.tableNumber));
    batch.set(tableStateRef, {
      tableNumber: t.tableNumber,
      capacity: t.seats,
      capacityOverride: 0,
      status: "FREE",
      updatedAt: now
    });
  }
  await batch.commit();

  revalidatePath("/");
  revalidatePath("/choose-template");
  return { workspaceId: workspaceRef.id };
}

export async function setActiveWorkspace(workspaceId: string) {
  const userId = await getUserId();
  if (!userId) return;
  const snapshot = await workspacesCol(userId).get();
  const db = getAdminFirestore();
  const batch = db.batch();
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, {
      isActive: d.id === workspaceId,
      updatedAt: new Date()
    });
  });
  await batch.commit();
  revalidatePath("/");
  revalidatePath("/workspace/[workspaceId]");
}

export async function resetWorkspace(workspaceId: string): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const workspaceRef = workspaceDoc(userId, workspaceId);
  const workspaceSnap = await workspaceRef.get();
  if (!workspaceSnap.exists) return { error: "Workspace not found." };

  const partiesSnap = await partiesCol(userId, workspaceId).get();
  const db = getAdminFirestore();
  const batch = db.batch();
  partiesSnap.docs.forEach((d) => batch.delete(d.ref));
  const tableStatesSnap = await tableStatesCol(userId, workspaceId).get();
  tableStatesSnap.docs.forEach((d) => {
    batch.update(d.ref, {
      status: "FREE",
      lastSeatedAt: null,
      expectedFreeAt: null,
      updatedAt: new Date()
    });
  });
  await batch.commit();
  revalidatePath("/");
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function duplicateWorkspace(workspaceId: string): Promise<{
  workspaceId?: string;
  error?: string;
}> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const workspaceSnap = await workspaceDoc(userId, workspaceId).get();
  if (!workspaceSnap.exists) return { error: "Workspace not found." };
  const wData = workspaceSnap.data() as {
    name: string;
    templateId: string;
    templateName?: string;
  };
  const tableStatesSnap = await tableStatesCol(userId, workspaceId).get();

  const newName = `${wData.name} (copy)`;
  const now = new Date();
  const newWorkspaceRef = await workspacesCol(userId).add({
    name: newName,
    templateId: wData.templateId,
    templateName: wData.templateName ?? "",
    createdAt: now,
    updatedAt: now,
    status: "ACTIVE",
    isActive: false
  });

  const db = getAdminFirestore();
  const batch = db.batch();
  for (const doc of tableStatesSnap.docs) {
    const t = doc.data() as { tableNumber: number; capacity: number };
    const ref = tableStatesCol(userId, newWorkspaceRef.id).doc(String(t.tableNumber));
    const data = doc.data() as { tableNumber: number; capacity: number; capacityOverride?: number };
    batch.set(ref, {
      tableNumber: data.tableNumber,
      capacity: data.capacity,
      capacityOverride: data.capacityOverride ?? 0,
      status: "FREE",
      updatedAt: now
    });
  }
  await batch.commit();
  revalidatePath("/");
  return { workspaceId: newWorkspaceRef.id };
}

export async function deleteWorkspace(workspaceId: string): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  await workspaceDoc(userId, workspaceId).delete();
  revalidatePath("/");
  return {};
}

export async function duplicateWorkspaceFormAction(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!workspaceId) return;
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
    return;
  }
  const result = await duplicateWorkspace(workspaceId);
  if (result.workspaceId) redirect(`/workspace/${result.workspaceId}`);
}

export async function deleteWorkspaceFormAction(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!workspaceId) return;
  await deleteWorkspace(workspaceId);
  revalidatePath("/");
}

/** Get workspace with template tables and table states and parties (for workspace page). */
export async function getWorkspaceWithData(
  userId: string,
  workspaceId: string
): Promise<{
  id: string;
  name: string;
  templateId: string;
  layout: Array<{
    tableNumber: number;
    seats: number;
    x: number;
    y: number;
    w: number;
    h: number;
    rotDeg: number;
  }>;
  tableStates: Array<{
    id: string;
    tableNumber: number;
    capacity: number;
    baseCapacity: number;
    capacityOverride: number;
    inComboId: string | null;
    status: string;
    lastSeatedAt: Date | null;
    expectedFreeAt: Date | null;
    currentPartyId: string | null;
    currentPartyName: string | null;
  }>;
  combos: Array<{
    id: string;
    tableNumbers: number[];
    mergedCapacity: number;
    status: string;
    currentPartyId: string | null;
    expectedFreeAt: Date | null;
    lastSeatedAt: Date | null;
  }>;
  labels: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotDeg: number;
  }>;
  templateName: string;
  templateLogoUrl: string | null;
  parties: Array<{
    id: string;
    name: string;
    size: number;
    phone: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
    seatedAt: Date | null;
  }>;
} | null> {
  const workspaceSnap = await workspaceDoc(userId, workspaceId).get();
  if (!workspaceSnap.exists) return null;
  const wData = workspaceSnap.data() as {
    name: string;
    templateId: string;
    templateName?: string;
    templateLogoUrl?: string | null;
  };

  const templateSnap = await templateDoc(userId, wData.templateId).get();
  if (!templateSnap.exists) return null;
  const tablesSnap = await templateTablesCol(userId, wData.templateId)
    .orderBy("tableNumber", "asc")
    .get();
  const layout = tablesSnap.docs.map((d) => {
    const t = d.data() as {
      tableNumber: number;
      seats: number;
      x: number;
      y: number;
      w: number;
      h: number;
      rotDeg: number;
    };
    return {
      tableNumber: t.tableNumber,
      seats: t.seats,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      rotDeg: t.rotDeg ?? 0
    };
  });

  const labelsSnap = await templateLabelsCol(userId, wData.templateId)
    .orderBy("createdAt", "asc")
    .get();
  const labels = labelsSnap.docs.map((d) => {
    const l = d.data() as {
      text: string;
      x: number;
      y: number;
      w: number;
      h: number;
      rotDeg: number;
    };
    return {
      id: d.id,
      text: l.text ?? "",
      x: l.x ?? 40,
      y: l.y ?? 40,
      w: l.w ?? 80,
      h: l.h ?? 44,
      rotDeg: l.rotDeg ?? 0
    };
  });

  const tableStatesSnap = await tableStatesCol(userId, workspaceId)
    .orderBy("tableNumber", "asc")
    .get();
  const CAPACITY_OVERRIDE_MAX = 2;
  const tableStates = tableStatesSnap.docs.map((d) => {
    const t = d.data() as {
      tableNumber: number;
      capacity: number;
      capacityOverride?: number;
      inComboId?: string;
      status: string;
      lastSeatedAt?: { seconds: number; nanoseconds: number };
      expectedFreeAt?: { seconds: number; nanoseconds: number };
      currentPartyId?: string;
      currentPartyName?: string;
    };
    const baseCapacity = t.capacity ?? 0;
    const capacityOverride = Math.min(CAPACITY_OVERRIDE_MAX, Math.max(0, t.capacityOverride ?? 0));
    const effectiveCapacity = baseCapacity + capacityOverride;
    return {
      id: d.id,
      tableNumber: t.tableNumber,
      capacity: effectiveCapacity,
      baseCapacity,
      capacityOverride,
      inComboId: t.inComboId ?? null,
      status: t.status ?? "FREE",
      lastSeatedAt: timestampToDate(t.lastSeatedAt),
      expectedFreeAt: timestampToDate(t.expectedFreeAt),
      currentPartyId: t.currentPartyId ?? null,
      currentPartyName: t.currentPartyName ?? null
    };
  });

  const combosSnap = await workspaceCombosCol(userId, workspaceId).get();
  const combos = combosSnap.docs.map((d) => {
    const c = d.data() as {
      tableNumbers: number[];
      mergedCapacity: number;
      status: string;
      currentPartyId?: string;
      expectedFreeAt?: { seconds: number; nanoseconds: number };
      lastSeatedAt?: { seconds: number; nanoseconds: number };
    };
    return {
      id: d.id,
      tableNumbers: c.tableNumbers ?? [],
      mergedCapacity: c.mergedCapacity ?? 0,
      status: c.status ?? "FREE",
      currentPartyId: c.currentPartyId ?? null,
      expectedFreeAt: timestampToDate(c.expectedFreeAt),
      lastSeatedAt: timestampToDate(c.lastSeatedAt)
    };
  });

  const partiesSnap = await partiesCol(userId, workspaceId)
    .orderBy("createdAt", "asc")
    .get();
  const parties = partiesSnap.docs.map((d) => {
    const p = d.data() as {
      name: string;
      size: number;
      phone?: string;
      notes?: string;
      status: string;
      createdAt: { seconds: number; nanoseconds: number };
      seatedAt?: { seconds: number; nanoseconds: number };
    };
    return {
      id: d.id,
      name: p.name,
      size: p.size,
      phone: p.phone ?? null,
      notes: p.notes ?? null,
      status: p.status ?? "WAITING",
      createdAt: timestampToDate(p.createdAt) ?? new Date(0),
      seatedAt: timestampToDate(p.seatedAt)
    };
  });

  const templateData = templateSnap.exists ? (templateSnap.data() as { name?: string; logoUrl?: string | null }) : null;
  return {
    id: workspaceSnap.id,
    name: wData.name,
    templateId: wData.templateId,
    layout,
    tableStates,
    combos,
    labels,
    templateName: wData.templateName ?? templateData?.name ?? "",
    templateLogoUrl: wData.templateLogoUrl ?? templateData?.logoUrl ?? null,
    parties
  };
}

const CAPACITY_OVERRIDE_MAX = 2;

export async function createCombo(
  workspaceId: string,
  tableNumbers: number[]
): Promise<{ error?: string; comboId?: string }> {
  if (tableNumbers.length < 2) return { error: "Select at least 2 tables to merge." };
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const sorted = [...tableNumbers].sort((a, b) => a - b);
  const db = getAdminFirestore();
  try {
    const comboId = await db.runTransaction(async (tx) => {
      let mergedCapacity = 0;
      for (const tn of sorted) {
        const ref = tableStatesCol(userId, workspaceId).doc(String(tn));
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error(`Table ${tn} not found.`);
        const data = snap.data() as { capacity?: number; capacityOverride?: number; inComboId?: string };
        if (data.inComboId) throw new Error(`Table ${tn} is already in a combo.`);
        const base = data.capacity ?? 0;
        const override = Math.max(0, data.capacityOverride ?? 0);
        mergedCapacity += base + override;
      }
      const comboRef = workspaceCombosCol(userId, workspaceId).doc();
      const now = new Date();
      tx.set(comboRef, {
        tableNumbers: sorted,
        mergedCapacity,
        status: "FREE",
        createdAt: now,
        updatedAt: now
      });
      for (const tn of sorted) {
        tx.update(tableStatesCol(userId, workspaceId).doc(String(tn)), {
          inComboId: comboRef.id,
          updatedAt: now
        });
      }
      return comboRef.id;
    });
    revalidatePath("/");
    revalidatePath(`/workspace/${workspaceId}`);
    return { comboId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to merge tables." };
  }
}

export async function deleteCombo(
  workspaceId: string,
  comboId: string
): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const comboRef = workspaceCombosCol(userId, workspaceId).doc(comboId);
  const comboSnap = await comboRef.get();
  if (!comboSnap.exists) return { error: "Combo not found." };
  const data = comboSnap.data() as { tableNumbers?: number[] };
  const tableNumbers = data.tableNumbers ?? [];
  const db = getAdminFirestore();
  const now = new Date();
  const batch = db.batch();
  for (const tn of tableNumbers) {
    batch.update(tableStatesCol(userId, workspaceId).doc(String(tn)), {
      inComboId: FieldValue.delete(),
      status: "FREE",
      updatedAt: now
    });
  }
  batch.delete(comboRef);
  await batch.commit();
  revalidatePath("/");
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function addChair(
  workspaceId: string,
  tableNumber: number
): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const ref = tableStatesCol(userId, workspaceId).doc(String(tableNumber));
  try {
    await getAdminFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Table not found.");
      const data = snap.data() as { capacityOverride?: number };
      const current = Math.max(0, data.capacityOverride ?? 0);
      const next = Math.min(CAPACITY_OVERRIDE_MAX, current + 1);
      tx.update(ref, { capacityOverride: next, updatedAt: new Date() });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add chair." };
  }
  revalidatePath("/");
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}

export async function removeChair(
  workspaceId: string,
  tableNumber: number
): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const ref = tableStatesCol(userId, workspaceId).doc(String(tableNumber));
  try {
    await getAdminFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Table not found.");
      const data = snap.data() as { capacityOverride?: number };
      const current = Math.max(0, data.capacityOverride ?? 0);
      const next = Math.max(0, current - 1);
      tx.update(ref, { capacityOverride: next, updatedAt: new Date() });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove chair." };
  }
  revalidatePath("/");
  revalidatePath(`/workspace/${workspaceId}`);
  return {};
}
