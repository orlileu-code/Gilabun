import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "./admin";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function isBucketMissingError(message: string): boolean {
  return (
    message.includes("bucket does not exist") ||
    message.includes("BucketNotFound") ||
    message.includes("bucket name not specified or invalid")
  );
}

function getBucketName(): string {
  const app = getAdminApp();
  const fromApp = (app.options?.storageBucket as string) || "";
  if (fromApp) return fromApp;
  const fromEnv = process.env.FIREBASE_STORAGE_BUCKET || "";
  if (fromEnv) return fromEnv;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "";
  if (projectId) return `${projectId}.appspot.com`;
  throw new Error("Storage bucket not configured. Set FIREBASE_STORAGE_BUCKET or FIREBASE_ADMIN_PROJECT_ID in .env.local");
}

function getBucket() {
  return getStorage(getAdminApp()).bucket(getBucketName());
}

function logoStoragePath(userId: string, templateId: string, ext: string): string {
  return `users/${userId}/templates/${templateId}/logo.${ext}`;
}

function extFromMime(mime: string): string {
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "png";
}

export function validateLogoFile(file: { size: number; type: string }): string | null {
  if (file.size > MAX_LOGO_BYTES) {
    return "Logo must be 2MB or smaller.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Logo must be PNG, JPG, WebP, or SVG.";
  }
  return null;
}

/**
 * Upload template logo to Firebase Storage.
 * Returns { downloadUrl, storagePath } or { error }.
 */
export async function uploadTemplateLogo(
  userId: string,
  templateId: string,
  file: { buffer: Buffer; mimeType: string }
): Promise<{ downloadUrl?: string; storagePath?: string; error?: string }> {
  const ext = extFromMime(file.mimeType);
  const path = logoStoragePath(userId, templateId, ext);
  const bucket = getBucket();
  const blob = bucket.file(path);

  try {
    await blob.save(file.buffer, {
      metadata: { contentType: file.mimeType },
      resumable: false
    });
    // Long-lived signed URL (1 year). Firebase Admin has no getDownloadURL; client could refresh via action if needed.
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const [url] = await blob.getSignedUrl({
      action: "read",
      expires
    });
    return { downloadUrl: url, storagePath: path };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    const friendly = isBucketMissingError(message)
      ? "Firebase Storage is not set up. In Firebase Console → your project → Storage, click “Get started” to create the default bucket, then try again."
      : message;
    return { error: friendly };
  }
}

/**
 * Delete a file from Storage by path (from template.logoStoragePath).
 */
export async function deleteTemplateLogoFile(storagePath: string): Promise<{ error?: string }> {
  if (!storagePath || !storagePath.includes("/templates/")) {
    return { error: "Invalid path." };
  }
  try {
    const bucket = getBucket();
    await bucket.file(storagePath).delete();
    return {};
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 404) return {}; // already deleted
    const message = err instanceof Error ? err.message : "Delete failed.";
    const friendly = isBucketMissingError(message)
      ? "Firebase Storage is not set up. In Firebase Console → your project → Storage, click “Get started” to create the default bucket."
      : message;
    return { error: friendly };
  }
}
