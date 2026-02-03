"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "../../components/TopBar";
import { createTemplate } from "../../templateActions";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_BYTES) {
      setError("Logo must be 2MB or smaller.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image (PNG, JPG, WebP, or SVG).");
      return;
    }
    setError(null);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Template name is required.");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.set("name", trimmed);
    if (logoFile) formData.set("logo", logoFile);
    const result = await createTemplate(formData);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    // Success: server already wrote doc and revalidated; navigate so list shows new template
    router.push(`/choose-template?created=${result.templateId}`);
    router.refresh();
  };

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">
            New seating template
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create a template, then open the builder to add and arrange tables.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card max-w-md">
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Restaurant name
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Saturday Floor"
                className="input mt-1"
              />
            </div>

            <div>
              <label className="label">Restaurant logo (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleLogoChange}
                className="mt-1 block w-full text-sm text-[var(--muted)] file:mr-2 file:rounded file:border-0 file:bg-[var(--panel-2)] file:px-3 file:py-1.5 file:text-[var(--text)]"
              />
              {logoPreview && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-14 w-14 rounded border border-[var(--border)] object-contain bg-[var(--panel-2)]"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="btn-ghost text-sm text-[var(--muted)] hover:text-[var(--red)]"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-[var(--muted)]">
                PNG, JPG, WebP or SVG. Max 2MB.
              </p>
            </div>

            {error && (
              <p className="text-sm text-[var(--red)]" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-70"
              >
                {submitting ? "Creating…" : "Create"}
              </button>
              <Link href="/choose-template" className="btn-ghost">
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
