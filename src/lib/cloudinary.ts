import { v2 as cloudinary } from "cloudinary";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function ensureConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET in .env.local"
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
}

/** Public ID for template logo (used for upload and delete). */
function logoPublicId(userId: string, templateId: string): string {
  return `users/${userId}/templates/${templateId}/logo`;
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
 * Upload template logo to Cloudinary.
 * Returns { downloadUrl, storagePath } (storagePath = public_id for delete) or { error }.
 */
export async function uploadTemplateLogo(
  userId: string,
  templateId: string,
  file: { buffer: Buffer; mimeType: string }
): Promise<{ downloadUrl?: string; storagePath?: string; error?: string }> {
  try {
    ensureConfig();
    const publicId = logoPublicId(userId, templateId);
    const dataUri = `data:${file.mimeType};base64,${file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      overwrite: true,
      resource_type: "image"
    });

    const url =
      result.secure_url ?? (result as { url?: string }).url ?? null;
    if (!url) return { error: "Upload succeeded but no URL returned." };

    return {
      downloadUrl: url,
      storagePath: result.public_id ?? publicId
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return { error: message };
  }
}

/**
 * Delete a template logo from Cloudinary by public_id (stored as template.logoStoragePath).
 */
export async function deleteTemplateLogo(publicId: string): Promise<{ error?: string }> {
  if (!publicId || !publicId.includes("/templates/")) {
    return { error: "Invalid public_id." };
  }
  try {
    ensureConfig();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    return { error: message };
  }
}
