"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderPanel } from "./BuilderPanel";
import { deleteTemplateTable, deleteTemplateLabel } from "../templateActions";

type Item = {
  id: string;
  tableNumber: number;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

type LabelItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

type BuilderViewProps = {
  templateId: string;
  templateName: string;
  logoUrl?: string | null;
  items: Item[];
  labels: LabelItem[];
  setActiveTemplateFormAction: (formData: FormData) => Promise<void>;
};

export function BuilderView({
  templateId,
  templateName,
  logoUrl = null,
  items,
  labels,
  setActiveTemplateFormAction
}: BuilderViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

  // Delete selected table or label on Delete / Backspace (laptop or phone keyboard)
  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      const key = e.key === "Delete" || e.key === "Backspace";
      if (!key) return;
      // Don't delete when user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      if (selectedId) {
        e.preventDefault();
        await deleteTemplateTable(templateId, selectedId);
        setSelectedId(null);
        router.refresh();
      } else if (selectedLabelId) {
        e.preventDefault();
        await deleteTemplateLabel(templateId, selectedLabelId);
        setSelectedLabelId(null);
        router.refresh();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      void handleKeyDown(e);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [templateId, selectedId, selectedLabelId, router]);

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="card-header shrink-0">
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
              <h1 className="card-title">{templateName}</h1>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Drag tables and labels to move; drag corners/edges to resize.
              Press Delete or Backspace to remove the selected item.
            </p>
          </div>
          <div className="card-body min-h-0 flex-1 overflow-auto p-2">
            <BuilderCanvas
              templateId={templateId}
              items={items}
              labels={labels}
              selectedId={selectedId}
              selectedLabelId={selectedLabelId}
              onSelect={setSelectedId}
              onSelectLabel={setSelectedLabelId}
            />
          </div>
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-80">
        <BuilderPanel
          templateId={templateId}
          templateName={templateName}
          logoUrl={logoUrl}
          itemCount={items.length}
          items={items}
          labels={labels}
          selectedId={selectedId}
          selectedLabelId={selectedLabelId}
          onClearSelection={() => setSelectedId(null)}
          onClearLabelSelection={() => setSelectedLabelId(null)}
          setActiveTemplateFormAction={setActiveTemplateFormAction}
        />
      </aside>
    </>
  );
}
