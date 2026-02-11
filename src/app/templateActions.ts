"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/firebase/auth-server";
import {
  templatesCol,
  templateDoc,
  templateTablesCol,
  templateLabelsCol,
  timestampToDate
} from "@/lib/firebase/db";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  uploadTemplateLogo,
  deleteTemplateLogo,
  validateLogoFile
} from "@/lib/cloudinary";

export type CreateTemplateResult =
  | { error: string }
  | { templateId: string; template: { id: string; name: string; isDefault: boolean; logoUrl: string | null; createdAt: Date; updatedAt: Date; tableCount: number } };

export async function createTemplate(formData: FormData): Promise<CreateTemplateResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Template name is required." };
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const col = templatesCol(userId);
  const snapshot = await col.orderBy("updatedAt", "desc").limit(1).get();
  const isDefault = snapshot.empty;
  const now = new Date();
  const docRef = col.doc();
  const templateId = docRef.id;

  // Validate logo up front so we don't create a doc then fail on upload
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const err = validateLogoFile({ size: file.size, type: file.type });
    if (err) return { error: err };
  }

  // STEP 2: Create Firestore doc immediately so template exists before any async logo work
  await docRef.set({
    templateId,
    name,
    logoUrl: null,
    logoStoragePath: null,
    createdAt: now,
    updatedAt: now,
    isDefault
  });

  let logoUrl: string | null = null;
  let logoStoragePath: string | null = null;
  let updatedAt = now;

  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadTemplateLogo(userId, templateId, {
      buffer,
      mimeType: file.type
    });
    if (uploadResult.error) return { error: uploadResult.error };
    logoUrl = uploadResult.downloadUrl ?? null;
    logoStoragePath = uploadResult.storagePath ?? null;
    updatedAt = new Date();
    await docRef.update({
      logoUrl,
      logoStoragePath,
      updatedAt
    });
  }

  revalidatePath("/choose-template");
  revalidatePath("/");

  return {
    templateId,
    template: {
      id: templateId,
      name,
      isDefault,
      logoUrl,
      createdAt: now,
      updatedAt,
      tableCount: 0
    }
  };
}

export async function updateTemplateLogo(
  templateId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const ref = templateDoc(userId, templateId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Template not found." };
  const data = snap.data() as { logoStoragePath?: string | null };
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  const err = validateLogoFile({ size: file.size, type: file.type });
  if (err) return { error: err };
  if (data.logoStoragePath) {
    await deleteTemplateLogo(data.logoStoragePath);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await uploadTemplateLogo(userId, templateId, {
    buffer,
    mimeType: file.type
  });
  if (uploadResult.error) return { error: uploadResult.error };
  await ref.update({
    logoUrl: uploadResult.downloadUrl ?? null,
    logoStoragePath: uploadResult.storagePath ?? null,
    updatedAt: new Date()
  });
  revalidatePath("/builder/[templateId]");
  revalidatePath("/choose-template");
  return {};
}

export async function removeTemplateLogo(templateId: string): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const ref = templateDoc(userId, templateId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Template not found." };
  const data = snap.data() as { logoStoragePath?: string | null };
  if (data.logoStoragePath) {
    const del = await deleteTemplateLogo(data.logoStoragePath);
    if (del.error) return del;
  }
  await ref.update({
    logoUrl: null,
    logoStoragePath: null,
    updatedAt: new Date()
  });
  revalidatePath("/builder/[templateId]");
  revalidatePath("/choose-template");
  return {};
}

export async function renameTemplate(templateId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  await templateDoc(userId, templateId).update({
    name: trimmed,
    updatedAt: new Date()
  });
  revalidatePath("/choose-template");
  revalidatePath("/builder/[templateId]");
}

export async function setActiveTemplate(templateId: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const db = getAdminFirestore();
  const snapshot = await templatesCol(userId).get();
  const batch = db.batch();
  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { isDefault: d.id === templateId, updatedAt: new Date() });
  });
  await batch.commit();
  revalidatePath("/choose-template");
  revalidatePath("/");
  redirect("/");
}

export async function setActiveTemplateFormAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "").trim();
  if (!templateId) return;
  await setActiveTemplate(templateId);
}

export async function createTemplateTable(
  templateId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const tableNumberRaw = formData.get("tableNumber");
  const tableNumber = tableNumberRaw != null ? Number(tableNumberRaw) : NaN;
  const seatsRaw = formData.get("seats");
  const seats = seatsRaw != null ? Number(seatsRaw) : NaN;

  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    return { error: "Table number must be a positive integer." };
  }
  if (!Number.isInteger(seats) || seats < 1) {
    return { error: "Seats must be at least 1." };
  }

  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const tablesSnap = await templateTablesCol(userId, templateId).get();
  const exists = tablesSnap.docs.some(
    (d) => (d.data() as { tableNumber: number }).tableNumber === tableNumber
  );
  if (exists) {
    return { error: `Table ${tableNumber} already exists in this template.` };
  }

  const defaults: Record<number, { w: number; h: number }> = {
    2: { w: 90, h: 90 },
    4: { w: 110, h: 110 },
    5: { w: 130, h: 110 },
    8: { w: 160, h: 130 }
  };
  const { w, h } = defaults[seats] ?? { w: 100, h: 100 };
  const now = new Date();

  await templateTablesCol(userId, templateId).add({
    tableNumber,
    seats,
    x: 40,
    y: 40,
    w,
    h,
    rotDeg: 0,
    createdAt: now,
    updatedAt: now
  });
  revalidatePath("/builder/[templateId]");
  return {};
}

export async function updateTemplateTablePosition(
  templateId: string,
  id: string,
  x: number,
  y: number
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  await templateTablesCol(userId, templateId).doc(id).update({
    x: Math.round(x),
    y: Math.round(y),
    updatedAt: new Date()
  });
  revalidatePath("/builder/[templateId]");
}

export async function updateTemplateTableSize(
  templateId: string,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(w) ||
    !Number.isFinite(h) ||
    w < 40 ||
    h < 40
  )
    return;
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  await templateTablesCol(userId, templateId).doc(id).update({
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h),
    updatedAt: new Date()
  });
  revalidatePath("/builder/[templateId]");
}

export async function updateTemplateTableRotation(
  templateId: string,
  id: string,
  rotDeg: number
) {
  const deg = Math.round(rotDeg) % 360;
  const normalized = deg < 0 ? deg + 360 : deg;
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  await templateTablesCol(userId, templateId).doc(id).update({
    rotDeg: normalized,
    updatedAt: new Date()
  });
  revalidatePath("/builder/[templateId]");
}

export async function updateTemplateTable(
  templateId: string,
  id: string,
  data: { tableNumber?: number; seats?: number }
): Promise<{ error?: string }> {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const ref = templateTablesCol(userId, templateId).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Table not found." };

  if (data.tableNumber != null) {
    if (!Number.isInteger(data.tableNumber) || data.tableNumber < 1) {
      return { error: "Table number must be a positive integer." };
    }
    const tablesSnap = await templateTablesCol(userId, templateId).get();
    const exists = tablesSnap.docs.some(
      (d) =>
        d.id !== id &&
        (d.data() as { tableNumber: number }).tableNumber === data.tableNumber
    );
    if (exists) {
      return { error: `Table ${data.tableNumber} already exists.` };
    }
  }
  if (data.seats != null && (!Number.isInteger(data.seats) || data.seats < 1)) {
    return { error: "Seats must be at least 1." };
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (data.tableNumber != null) update.tableNumber = data.tableNumber;
  if (data.seats != null) update.seats = data.seats;
  await ref.update(update);
  revalidatePath("/builder/[templateId]");
  return {};
}

export async function deleteTemplateTable(templateId: string, id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  try {
    await templateTablesCol(userId, templateId).doc(id).delete();
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
  revalidatePath("/builder/[templateId]");
}

// ---------- Template Labels (floor landmarks) ----------

const LABEL_SUGGESTIONS = [
  "RESTROOMS",
  "BAR",
  "ENTRANCE",
  "KITCHEN",
  "PATIO",
  "OUTSIDE",
  "HOST STAND"
] as const;

const LABEL_SIZES: Record<string, { w: number; h: number }> = {
  small: { w: 60, h: 36 },
  medium: { w: 80, h: 44 },
  large: { w: 100, h: 56 }
};

export async function createTemplateLabel(
  templateId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const customText = String(formData.get("customText") ?? "").trim();
  const suggestion = String(formData.get("text") ?? "").trim();
  const text = (customText || suggestion || "").toUpperCase();
  const sizeKey = String(formData.get("size") ?? "medium").trim().toLowerCase();
  if (!text) return { error: "Label text is required." };

  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  const { w, h } = LABEL_SIZES[sizeKey] ?? LABEL_SIZES.medium;
  const now = new Date();

  await templateLabelsCol(userId, templateId).add({
    text,
    x: 40,
    y: 40,
    w,
    h,
    rotDeg: 0,
    style: "label",
    createdAt: now,
    updatedAt: now
  });
  revalidatePath("/builder/[templateId]");
  return {};
}

function isNotFound(err: unknown): boolean {
  const code = (err as { code?: number | string })?.code;
  return code === 5 || code === "NOT_FOUND";
}

export async function updateTemplateLabelPosition(
  templateId: string,
  id: string,
  x: number,
  y: number
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  try {
    await templateLabelsCol(userId, templateId).doc(id).update({
      x: Math.round(x),
      y: Math.round(y),
      updatedAt: new Date()
    });
  } catch (err) {
    if (isNotFound(err)) return; // label was deleted (e.g. keyboard delete)
    throw err;
  }
  revalidatePath("/builder/[templateId]");
}

export async function updateTemplateLabelSize(
  templateId: string,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(w) ||
    !Number.isFinite(h) ||
    w < 24 ||
    h < 20
  )
    return;
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  try {
    await templateLabelsCol(userId, templateId).doc(id).update({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
      updatedAt: new Date()
    });
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
  revalidatePath("/builder/[templateId]");
}

export async function updateTemplateLabelRotation(
  templateId: string,
  id: string,
  rotDeg: number
) {
  const deg = Math.round(rotDeg) % 360;
  const normalized = deg < 0 ? deg + 360 : deg;
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  try {
    await templateLabelsCol(userId, templateId).doc(id).update({
      rotDeg: normalized,
      updatedAt: new Date()
    });
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
  revalidatePath("/builder/[templateId]");
}

export async function updateTemplateLabelText(
  templateId: string,
  id: string,
  text: string
): Promise<{ error?: string }> {
  const trimmed = text.trim().toUpperCase();
  if (!trimmed) return { error: "Label text is required." };
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  try {
    await templateLabelsCol(userId, templateId).doc(id).update({
      text: trimmed,
      updatedAt: new Date()
    });
  } catch (err) {
    if (isNotFound(err)) return {}; // label was deleted
    throw err;
  }
  revalidatePath("/builder/[templateId]");
  return {};
}

export async function deleteTemplateLabel(templateId: string, id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Please sign in." };
  try {
    await templateLabelsCol(userId, templateId).doc(id).delete();
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
  revalidatePath("/builder/[templateId]");
}

/** List templates for the current user (for Home / choose-template). */
export async function getTemplates(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    isDefault: boolean;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    tableCount: number;
  }>
> {
  const snapshot = await templatesCol(userId)
    .orderBy("updatedAt", "desc")
    .get();
  const out: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    tableCount: number;
  }> = [];
  for (const doc of snapshot.docs) {
    const d = doc.data() as {
      name: string;
      isDefault: boolean;
      logoUrl?: string | null;
      createdAt: { seconds: number; nanoseconds: number };
      updatedAt: { seconds: number; nanoseconds: number };
    };
    const tablesSnap = await templateTablesCol(userId, doc.id).get();
    out.push({
      id: doc.id,
      name: d.name,
      isDefault: !!d.isDefault,
      logoUrl: d.logoUrl ?? null,
      createdAt: timestampToDate(d.createdAt) ?? new Date(0),
      updatedAt: timestampToDate(d.updatedAt) ?? new Date(0),
      tableCount: tablesSnap.size
    });
  }
  return out;
}

/** Get a single template with its tables and labels (for builder page). */
export async function getTemplateWithTables(userId: string, templateId: string): Promise<{
  id: string;
  name: string;
  isDefault: boolean;
  logoUrl: string | null;
  items: Array<{
    id: string;
    tableNumber: number;
    seats: number;
    x: number;
    y: number;
    w: number;
    h: number;
    rotDeg: number;
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
} | null> {
  const ref = templateDoc(userId, templateId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as {
    name: string;
    isDefault: boolean;
    logoUrl?: string | null;
  };
  const tablesSnap = await templateTablesCol(userId, templateId)
    .orderBy("tableNumber", "asc")
    .get();
  const items = tablesSnap.docs.map((d) => {
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
      id: d.id,
      tableNumber: t.tableNumber,
      seats: t.seats,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      rotDeg: t.rotDeg ?? 0
    };
  });
  const labelsSnap = await templateLabelsCol(userId, templateId)
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
  return {
    id: snap.id,
    name: data.name,
    isDefault: !!data.isDefault,
    logoUrl: data.logoUrl ?? null,
    items,
    labels
  };
}
