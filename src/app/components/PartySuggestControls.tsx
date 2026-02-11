"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { SuggestState } from "@/lib/assignTypes";
import { suggestTableForPartyAction } from "../actions";

const initialState: SuggestState = {
  status: "idle"
};

function SuggestButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-ghost h-7 rounded-full px-3 text-[0.7rem]"
      disabled={pending}
    >
      {pending ? "Suggesting..." : "Suggest"}
    </button>
  );
}

export function PartySuggestControls({ partyId }: { partyId: string }) {
  const [state, formAction] = useFormState(
    suggestTableForPartyAction,
    initialState
  );

  return (
    <div className="flex flex-col items-start gap-1">
      <form action={formAction}>
        <input type="hidden" name="partyId" value={partyId} />
        <SuggestButton />
      </form>
      {state.status === "RECOMMENDATION" &&
        state.tableLabel &&
        typeof state.minutesUntilAvailable === "number" && (
          <p className="text-[0.7rem] text-[var(--text)]">
            → Table{" "}
            <span className="font-semibold text-[var(--text)]">
              {state.tableLabel}
            </span>{" "}
            in ~{state.minutesUntilAvailable} min
          </p>
        )}
      {state.status === "NO_TABLE" && state.message && (
        <p className="text-[0.7rem] text-[var(--muted)]">{state.message}</p>
      )}
      {state.status === "ERROR" && state.message && (
        <p className="text-[0.7rem] text-[var(--red)]">{state.message}</p>
      )}
    </div>
  );
}

