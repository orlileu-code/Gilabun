"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addPartyAction, addPartyToWorkspaceAction } from "../actions";

type ActionState = {
  ok: boolean;
  error?: string;
};

const initialState: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary w-full sm:w-auto"
      disabled={pending}
    >
      {pending ? "Adding..." : "Add Party"}
    </button>
  );
}

export function AddPartyForm({ workspaceId }: { workspaceId?: string }) {
  const boundAction =
    workspaceId != null
      ? (prevState: ActionState, formData: FormData) =>
          addPartyToWorkspaceAction(workspaceId, prevState, formData)
      : addPartyAction;
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <form
      action={formAction}
      className="card border-dashed border-[var(--border)] bg-[var(--panel-2)]"
    >
      <div className="card-header">
        <div>
          <div className="card-title">Add Party</div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Name, phone, size, notes — like your paper list.
          </p>
        </div>
      </div>
      <div className="card-body space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input
              required
              name="name"
              placeholder="e.g. Johnson"
              className="input"
            />
          </div>
          <div>
            <label className="label">Size</label>
            <input
              required
              type="number"
              min={1}
              name="size"
              defaultValue={2}
              className="input"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Phone (optional)</label>
            <input
              name="phone"
              placeholder="(555) 123-4567"
              className="input"
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input
              name="notes"
              placeholder="Birthday, allergies..."
              className="input"
            />
          </div>
        </div>
        {state?.error && (
          <p className="text-xs font-medium text-red-400">{state.error}</p>
        )}
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}

