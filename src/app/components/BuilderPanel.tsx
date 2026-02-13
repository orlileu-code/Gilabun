"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createTemplateTable,
  updateTemplateTable,
  deleteTemplateTable,
  updateTemplateTableRotation,
  createTemplateLabel,
  updateTemplateLabelText,
  updateTemplateLabelRotation,
  deleteTemplateLabel,
  updateTemplateLogo,
  removeTemplateLogo
} from "../templateActions";

const LABEL_SUGGESTIONS = [
  "RESTROOMS",
  "BAR",
  "ENTRANCE",
  "KITCHEN",
  "PATIO",
  "OUTSIDE",
  "HOST STAND"
] as const;

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

type BuilderPanelProps = {
  templateId: string;
  templateName: string;
  logoUrl?: string | null;
  itemCount: number;
  items: Item[];
  labels: LabelItem[];
  selectedId: string | null;
  selectedLabelId: string | null;
  onClearSelection: () => void;
  onClearLabelSelection: () => void;
  startWorkspaceFormAction: (formData: FormData) => Promise<void>;
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export function BuilderPanel({
  templateId,
  templateName,
  logoUrl = null,
  itemCount,
  items,
  labels,
  selectedId,
  selectedLabelId,
  onClearSelection,
  onClearLabelSelection,
  startWorkspaceFormAction
}: BuilderPanelProps) {
  const router = useRouter();
  const [createError, setCreateError] = useState<string | null>(null);
  const [labelCreateError, setLabelCreateError] = useState<string | null>(null);
  const [labelUpdateError, setLabelUpdateError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((i) => i.id === selectedId);
  const selectedLabel = labels.find((l) => l.id === selectedLabelId);

  async function handleCreateTable(formData: FormData) {
    setCreateError(null);
    const result = await createTemplateTable(templateId, formData);
    if (result.error) setCreateError(result.error);
    else router.refresh();
  }

  async function handleCreateLabel(formData: FormData) {
    setLabelCreateError(null);
    const result = await createTemplateLabel(templateId, formData);
    if (result.error) setLabelCreateError(result.error);
    else router.refresh();
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo must be 2MB or smaller.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image (PNG, JPG, WebP, or SVG).");
      return;
    }
    setLogoUploading(true);
    const formData = new FormData();
    formData.set("logo", file);
    const result = await updateTemplateLogo(templateId, formData);
    setLogoUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (result.error) setLogoError(result.error);
    else router.refresh();
  }

  async function handleRemoveLogo() {
    setLogoError(null);
    setLogoUploading(true);
    const result = await removeTemplateLogo(templateId);
    setLogoUploading(false);
    if (result.error) setLogoError(result.error);
    else router.refresh();
  }

  return (
    <div className="card space-y-6">
      <div className="card-header">
        <h2 className="card-title">Builder</h2>
      </div>
      <div className="card-body space-y-6">
        {/* Template logo */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Restaurant logo
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {logoUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={logoUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded object-contain bg-[var(--panel-2)]"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={logoUploading}
                  className="btn-ghost text-xs text-[var(--muted)] hover:text-[var(--red)] disabled:opacity-50"
                >
                  Remove logo
                </button>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept={LOGO_ACCEPT}
              onChange={handleLogoChange}
              disabled={logoUploading}
              className="block w-full text-sm text-[var(--muted)] file:mr-2 file:rounded file:border-0 file:bg-[var(--panel-2)] file:px-2 file:py-1 file:text-xs file:text-[var(--text)] disabled:opacity-50"
            />
            {logoUploading && <p className="text-xs text-[var(--muted)]">Uploading…</p>}
            {logoError && <p className="text-xs text-[var(--red)]">{logoError}</p>}
            <p className="text-[0.65rem] text-[var(--muted)]">PNG, JPG, WebP or SVG. Max 2MB.</p>
          </div>
        </section>

        {/* Create Table */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Create table
          </h3>
          <form
            action={handleCreateTable}
            className="mt-2 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="tableNumber" className="label text-[0.65rem]">
                  Table #
                </label>
                <input
                  id="tableNumber"
                  name="tableNumber"
                  type="number"
                  min={1}
                  required
                  className="input py-1.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="seats" className="label text-[0.65rem]">
                  Seats
                </label>
                <input
                  id="seats"
                  name="seats"
                  type="number"
                  min={1}
                  required
                  defaultValue={2}
                  className="input py-1.5 text-sm"
                />
              </div>
            </div>
            {createError && (
              <p className="text-xs text-[var(--red)]">{createError}</p>
            )}
            <button type="submit" className="btn-outline w-full text-sm">
              Add table
            </button>
          </form>
        </section>

        {/* Create Label */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Create label
          </h3>
          <form
            action={handleCreateLabel}
            className="mt-2 space-y-2"
          >
            <div>
              <label htmlFor="labelText" className="label text-[0.65rem]">
                Suggestion
              </label>
              <select
                id="labelText"
                name="text"
                className="input w-full py-1.5 text-sm"
                defaultValue="RESTROOMS"
              >
                {LABEL_SUGGESTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="labelCustomText" className="label text-[0.65rem]">
                Custom text (optional, overrides suggestion)
              </label>
              <input
                id="labelCustomText"
                name="customText"
                type="text"
                placeholder="e.g. TERRACE"
                className="input w-full py-1.5 text-sm uppercase"
              />
            </div>
            <div>
              <label htmlFor="labelSize" className="label text-[0.65rem]">
                Size
              </label>
              <select
                id="labelSize"
                name="size"
                className="input w-full py-1.5 text-sm"
                defaultValue="medium"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            {labelCreateError && (
              <p className="text-xs text-[var(--red)]">{labelCreateError}</p>
            )}
            <button type="submit" className="btn-outline w-full text-sm">
              Add label
            </button>
          </form>
        </section>

        {/* Selected Table Editor */}
        {selectedItem && !selectedLabel && (
          <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Selected table
          </h3>
            <SelectedTableEditor
              item={selectedItem}
              onClose={onClearSelection}
              onUpdate={async (data) => {
                setUpdateError(null);
                const result = await updateTemplateTable(templateId, selectedItem.id, data);
                if (result.error) setUpdateError(result.error);
              }}
              onRotationChange={async (rotDeg) => {
                await updateTemplateTableRotation(templateId, selectedItem.id, rotDeg);
                router.refresh();
              }}
              onDelete={async () => {
                await deleteTemplateTable(templateId, selectedItem.id);
                onClearSelection();
                router.refresh();
              }}
              onRefresh={router.refresh}
            />
            {updateError && (
              <p className="mt-2 text-xs text-red-400">{updateError}</p>
            )}
          </section>
        )}

        {/* Selected Label Editor */}
        {selectedLabel && !selectedItem && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Selected label
            </h3>
            <SelectedLabelEditor
              label={selectedLabel}
              onClose={onClearLabelSelection}
              onUpdateText={async (text) => {
                setLabelUpdateError(null);
                const result = await updateTemplateLabelText(templateId, selectedLabel.id, text);
                if (result.error) setLabelUpdateError(result.error);
                else router.refresh();
              }}
              onRotationChange={async (rotDeg) => {
                await updateTemplateLabelRotation(templateId, selectedLabel.id, rotDeg);
                router.refresh();
              }}
              onDelete={async () => {
                await deleteTemplateLabel(templateId, selectedLabel.id);
                onClearLabelSelection();
                router.refresh();
              }}
              onRefresh={router.refresh}
            />
            {labelUpdateError && (
              <p className="mt-2 text-xs text-[var(--red)]">{labelUpdateError}</p>
            )}
          </section>
        )}

        {/* Start Service */}
        <section className="border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--muted)]">
            {itemCount} table{itemCount !== 1 ? "s" : ""}, {labels.length} label{labels.length !== 1 ? "s" : ""} in &quot;{templateName}&quot;
          </p>
          <form action={startWorkspaceFormAction} className="mt-3 space-y-2">
            <input type="hidden" name="templateId" value={templateId} />
            <input
              type="hidden"
              name="timezone"
              value={typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""}
            />
            <button type="submit" className="btn-primary w-full">
              Start service with this template
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function SelectedTableEditor({
  item,
  onClose,
  onUpdate,
  onRotationChange,
  onDelete,
  onRefresh
}: {
  item: Item;
  onClose: () => void;
  onUpdate: (data: { tableNumber?: number; seats?: number }) => Promise<void>;
  onRotationChange: (rotDeg: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onRefresh: () => void;
}) {
  const [tableNumber, setTableNumber] = useState(String(item.tableNumber));
  const [seats, setSeats] = useState(String(item.seats));
  const [rotDeg, setRotDeg] = useState(item.rotDeg);
  useEffect(() => {
    setTableNumber(String(item.tableNumber));
    setSeats(String(item.seats));
    setRotDeg(item.rotDeg);
  }, [item.id, item.tableNumber, item.seats, item.rotDeg]);

  return (
    <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text)]">
          Table {item.tableNumber}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
        >
          Close
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="label text-[0.65rem]">Table #</label>
          <input
            type="number"
            min={1}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            onBlur={() => {
              const n = parseInt(tableNumber, 10);
              if (Number.isInteger(n) && n >= 1) {
                onUpdate({ tableNumber: n });
                onRefresh();
              }
            }}
            className="input py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="label text-[0.65rem]">Seats</label>
          <input
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            onBlur={() => {
              const n = parseInt(seats, 10);
              if (Number.isInteger(n) && n >= 1) {
                onUpdate({ seats: n });
                onRefresh();
              }
            }}
            className="input py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="mt-3">
        <label className="label text-[0.65rem]">Rotation: {rotDeg}°</label>
        <input
          type="range"
          min={0}
          max={360}
          value={rotDeg}
          onChange={(e) => setRotDeg(Number(e.target.value))}
          onMouseUp={() => void onRotationChange(rotDeg).then(() => onRefresh())}
          onTouchEnd={() => void onRotationChange(rotDeg).then(() => onRefresh())}
          className="mt-1 h-2 w-full accent-[var(--primary-action)]"
        />
        <div className="mt-1 flex gap-1">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={async () => {
                setRotDeg(deg);
                await onRotationChange(deg);
                onRefresh();
              }}
              className={`rounded border px-2 py-1 text-xs ${
                rotDeg === deg
                  ? "border-[var(--table-free-border)] bg-[var(--table-free-fill)] text-[var(--table-free-text)]"
                  : "border-[var(--border)] bg-[var(--panel-2)] text-[var(--text)] hover:bg-[var(--border)]"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[0.65rem] text-[var(--muted)]">
        Size: {item.w} × {item.h} (resize on canvas)
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onDelete()}
          className="btn-ghost text-xs text-[var(--red)] hover:opacity-80"
        >
          Delete table
        </button>
      </div>
    </div>
  );
}

function SelectedLabelEditor({
  label,
  onClose,
  onUpdateText,
  onRotationChange,
  onDelete,
  onRefresh
}: {
  label: LabelItem;
  onClose: () => void;
  onUpdateText: (text: string) => Promise<void>;
  onRotationChange: (rotDeg: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onRefresh: () => void;
}) {
  const [text, setText] = useState(label.text);
  const [rotDeg, setRotDeg] = useState(label.rotDeg);
  useEffect(() => {
    setText(label.text);
    setRotDeg(label.rotDeg);
  }, [label.id, label.text, label.rotDeg]);

  return (
    <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text)] uppercase tracking-wide">
          {label.text}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
        >
          Close
        </button>
      </div>
      <div className="mt-3">
        <label className="label text-[0.65rem]">Text</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const t = text.trim().toUpperCase();
            if (t && t !== label.text) {
              onUpdateText(t);
              onRefresh();
            }
          }}
          className="input w-full py-1.5 text-sm uppercase"
          placeholder="e.g. RESTROOMS"
        />
      </div>
      <div className="mt-3">
        <label className="label text-[0.65rem]">Rotation: {rotDeg}°</label>
        <input
          type="range"
          min={0}
          max={360}
          value={rotDeg}
          onChange={(e) => setRotDeg(Number(e.target.value))}
          onMouseUp={() => void onRotationChange(rotDeg).then(() => onRefresh())}
          onTouchEnd={() => void onRotationChange(rotDeg).then(() => onRefresh())}
          className="mt-1 h-2 w-full accent-[var(--primary-action)]"
        />
        <div className="mt-1 flex gap-1">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={async () => {
                setRotDeg(deg);
                await onRotationChange(deg);
                onRefresh();
              }}
              className={`rounded border px-2 py-1 text-xs ${
                rotDeg === deg
                  ? "border-[var(--table-free-border)] bg-[var(--table-free-fill)] text-[var(--table-free-text)]"
                  : "border-[var(--border)] bg-[var(--panel-2)] text-[var(--text)] hover:bg-[var(--border)]"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[0.65rem] text-[var(--muted)]">
        Size: {label.w} × {label.h} (resize on canvas)
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onDelete()}
          className="btn-ghost text-xs text-[var(--red)] hover:opacity-80"
        >
          Delete label
        </button>
      </div>
    </div>
  );
}
