"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { AutoAssignState } from "@/lib/assignTypes";
import { AUTO_ASSIGN_THRESHOLD_MIN } from "@/lib/assignTypes";
import { autoAssignNextPartyAction, forceSeatAction } from "../actions";

const initialState: AutoAssignState = {
  status: "idle"
};

function PrimaryButton({
  children
}: {
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary h-8 rounded-full px-3 text-xs"
      disabled={pending}
    >
      {pending ? "Working..." : children}
    </button>
  );
}

function GhostButton({
  children
}: {
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-ghost h-7 rounded-full px-3 text-[0.7rem]"
      disabled={pending}
    >
      {pending ? "Seating..." : children}
    </button>
  );
}

export function AutoSeatCard() {
  const [state, formAction] = useFormState(
    autoAssignNextPartyAction,
    initialState
  );

  const modeLabel =
    state.mode === "SIZE_PRIORITY" && state.targetSize
      ? `Size-priority mode (${state.targetSize}-top)`
      : "FCFS mode";

  const showRecommendation =
    state.status === "RECOMMENDATION" &&
    state.partyName &&
    state.tableLabel &&
    typeof state.minutesUntilAvailable === "number";

  const showAutoSeated = state.status === "SEATED" && state.partyName;

  return (
    <section className="mb-3 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="card border-dashed border-[var(--border)] bg-[var(--panel-2)]">
        <div className="card-header">
          <div>
            <div className="card-title">Auto Seat</div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Let the system pick the next party and best table based on wait
              order and table availability.
            </p>
          </div>
          <span className="badge-muted text-[0.65rem]">{modeLabel}</span>
        </div>
        <div className="card-body space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <form action={formAction}>
              <PrimaryButton>Auto Seat Next (Any)</PrimaryButton>
            </form>
            <form action={formAction}>
              <input type="hidden" name="size" value="2" />
              <PrimaryButton>Auto Seat Next (2)</PrimaryButton>
            </form>
            <form action={formAction}>
              <input type="hidden" name="size" value="4" />
              <PrimaryButton>Auto Seat Next (4)</PrimaryButton>
            </form>
            <form action={formAction}>
              <input type="hidden" name="size" value="6" />
              <PrimaryButton>Auto Seat Next (6)</PrimaryButton>
            </form>
          </div>

          {state.status === "NO_PARTY" && (
            <p className="text-xs text-[var(--muted)]">
              No parties are currently waiting.
            </p>
          )}
          {state.status === "NO_TABLE" && (
            <p className="text-xs text-[var(--muted)]">
              {state.message ??
                "No eligible tables are available for the next party."}
            </p>
          )}
          {state.status === "ERROR" && (
            <p className="text-xs text-[var(--red)]">
              {state.message ?? "Something went wrong while auto-assigning."}
            </p>
          )}

          {showAutoSeated && (
            <div className="rounded-lg border border-[var(--table-free-border)]/60 bg-[var(--table-free-fill)] px-3 py-2 text-xs text-[var(--text)]">
              <div className="font-semibold">
                Seated {state.partyName} at Table {state.tableLabel}.
              </div>
              {typeof state.minutesUntilAvailable === "number" && (
                <div className="mt-0.5 text-[0.7rem] text-[var(--muted)]">
                  Effective wait: ~{state.minutesUntilAvailable} min.
                </div>
              )}
            </div>
          )}

          {showRecommendation && (
            <div className="space-y-2 rounded-lg border border-[var(--table-occupied-border)]/60 bg-[var(--table-occupied-fill)] px-3 py-2 text-xs text-[var(--text)]">
              <div>
                Next match:{" "}
                <span className="font-semibold text-[var(--text)]">
                  {state.partyName}
                </span>{" "}
                ({state.partySize}) → Table{" "}
                <span className="font-semibold text-[var(--text)]">
                  {state.tableLabel}
                </span>{" "}
                in ~{state.minutesUntilAvailable} min
              </div>
              {state.minutesUntilAvailable &&
                state.minutesUntilAvailable > AUTO_ASSIGN_THRESHOLD_MIN &&
                state.partyId &&
                state.tableId && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.7rem] text-[var(--muted)]">
                      Table isn&apos;t quite ready. You can still force-seat
                      them now:
                    </span>
                    <form action={forceSeatAction}>
                      <input
                        type="hidden"
                        name="partyId"
                        value={state.partyId}
                      />
                      <input
                        type="hidden"
                        name="tableId"
                        value={state.tableId}
                      />
                      <GhostButton>Seat anyway</GhostButton>
                    </form>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      <div className="card border-[var(--border)] bg-[var(--panel-2)]">
        <div className="card-header">
          <div>
            <div className="card-title">How it decides</div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              First-come-first-served by default. Size-specific buttons give a
              gentle bias toward 2 / 4 / 6 tops.
            </p>
          </div>
        </div>
        <div className="card-body space-y-2 text-xs text-[var(--text)]">
          <p>
            For the chosen party, we look for tables that can fit them and pick
            the one that&apos;s likely to free up first. If it&apos;s available
            now or within ~{AUTO_ASSIGN_THRESHOLD_MIN} minutes, they&apos;ll be
            seated automatically.
          </p>
          <p>
            Otherwise you&apos;ll see a recommendation, along with an option to
            seat them anyway.
          </p>
        </div>
      </div>
    </section>
  );
}

