"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPartyInWorkspace } from "../actions";

type AddPartyModalProps = {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onAdded: (party: {
    id: string;
    name: string;
    size: number;
    phone: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
    seatedAt: null;
  }) => void;
  showToast: (message: string) => void;
};

export function AddPartyModal({
  workspaceId,
  open,
  onClose,
  onAdded,
  showToast
}: AddPartyModalProps) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setSize("2");
      setPhone("");
      setNotes("");
      setError(null);
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmedName = name.trim();
      const sizeNum = parseInt(size, 10);
      if (!trimmedName) {
        setError("Name is required.");
        return;
      }
      if (!Number.isFinite(sizeNum) || sizeNum < 1) {
        setError("Size must be at least 1.");
        return;
      }
      setSubmitting(true);
      const result = await createPartyInWorkspace(
        workspaceId,
        trimmedName,
        sizeNum,
        phone.trim() || null,
        notes.trim() || null
      );
      setSubmitting(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.party) {
        onAdded({
          ...result.party,
          createdAt: new Date(result.party.createdAt),
          seatedAt: null
        });
        showToast(`Added ${result.party.name} (${result.party.size})`);
        onClose();
      }
    },
    [workspaceId, name, size, phone, notes, onAdded, showToast, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-party-title"
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-[var(--border)] bg-[var(--panel)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2 id="add-party-title" className="section-header text-[var(--text)]">
            Add party
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label htmlFor="add-party-name" className="label">
              Name
            </label>
            <input
              ref={nameInputRef}
              id="add-party-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Johnson"
              className="input w-full"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="add-party-size" className="label">
              Size
            </label>
            <input
              id="add-party-size"
              type="number"
              min={1}
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="add-party-phone" className="label">
              Phone (optional)
            </label>
            <input
              id="add-party-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="add-party-notes" className="label">
              Notes (optional)
            </label>
            <input
              id="add-party-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Birthday, allergies..."
              className="input w-full"
            />
          </div>
          {error && (
            <p className="text-xs font-medium text-[var(--red)]" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 rounded-lg py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 rounded-lg py-2.5 font-medium disabled:opacity-70"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
