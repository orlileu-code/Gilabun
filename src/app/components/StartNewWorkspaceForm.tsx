"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspaceFromTemplate } from "../workspaceActions";

type Template = {
  id: string;
  name: string;
  tableCount: number;
};

export function StartNewWorkspaceForm({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const templateId = String(formData.get("templateId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim() || undefined;
    if (!templateId) {
      setError("Choose a template.");
      setPending(false);
      return;
    }
    const result = await createWorkspaceFromTemplate(templateId, name);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    if (result.workspaceId) {
      router.push(`/workspace/${result.workspaceId}`);
      return;
    }
    setPending(false);
  }

  const defaultName = new Date().toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 max-w-md">
      <div>
        <label htmlFor="templateId" className="label text-xs">
          Template
        </label>
        <select
          id="templateId"
          name="templateId"
          required
          className="input py-2 text-sm w-full"
        >
          <option value="">— Select —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.tableCount} tables)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="label text-xs">
          Workspace name (optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder={defaultName}
          className="input py-2 text-sm w-full"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending || templates.length === 0}
        className="btn-primary"
      >
        {pending ? "Starting…" : "Start"}
      </button>
    </form>
  );
}
