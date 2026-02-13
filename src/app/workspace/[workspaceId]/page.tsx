import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUserId } from "@/lib/firebase/auth-server";
import { getWorkspaceWithData } from "../../workspaceActions";
import { getEarliestAvailableTimeForWorkspaceTables } from "@/lib/waitEstimate";
import { PartyStatus } from "@/lib/enums";
import { TopBar } from "../../components/TopBar";
import {
  getNextSeatingForWorkspace,
  forceSeatWorkspaceAction,
  kitchenSlowAllWorkspaceFormAction
} from "../../actions";
import { WorkspaceServiceView } from "../../components/WorkspaceServiceView";

export const dynamic = "force-dynamic";

function minutesSinceCreated(createdAt: Date): number {
  return Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 60000));
}

export default async function WorkspaceDashboardPage({
  params
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const workspace = await getWorkspaceWithData(userId, workspaceId);
  if (!workspace) notFound();

  const nextSeating = await getNextSeatingForWorkspace(workspaceId);
  const waitingParties = workspace.parties.filter(
    (p) => p.status === PartyStatus.WAITING
  );

  const waitingWithLiveEstimate = waitingParties.map((p) => {
    const earliest = getEarliestAvailableTimeForWorkspaceTables(
      p.size,
      workspace.tableStates
    );
    const liveMin = earliest
      ? Math.max(0, Math.round((earliest.getTime() - Date.now()) / 60000))
      : null;
    return {
      ...p,
      liveWaitMin: liveMin,
      waitingMin: minutesSinceCreated(p.createdAt)
    };
  });

  const firstPartyId = waitingParties[0]?.id ?? null;
  const newestPartyId = waitingParties[waitingParties.length - 1]?.id ?? null;
  const allWaitingCount = waitingParties.length;

  const tables = workspace.tableStates.map((t) => ({
    id: t.id,
    tableNumber: t.tableNumber,
    capacity: t.capacity,
    baseCapacity: t.baseCapacity,
    capacityOverride: t.capacityOverride,
    inComboId: t.inComboId,
    status: t.status,
    lastSeatedAt: t.lastSeatedAt,
    expectedFreeAt: t.expectedFreeAt,
    currentPartyId: t.currentPartyId,
    currentPartyName: t.currentPartyName
  }));

  const combos = workspace.combos ?? [];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <TopBar waitingCount={allWaitingCount} />
      <div className="mb-2 flex shrink-0 items-center justify-between px-4">
        <h1 className="text-lg font-semibold text-[var(--text)]">{workspace.name}</h1>
        <Link href="/app" className="btn-ghost text-sm">
          ← Back
        </Link>
      </div>

      {/* Next to seat */}
      <section className="mb-2 shrink-0 px-4">
        <div className="card border-[var(--primary-action)]/30 bg-[var(--panel)]">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: "var(--primary-action)" }}>Next to seat</div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Oldest in line → table that clears first.
              </p>
            </div>
          </div>
          <div className="card-body">
            {nextSeating ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="party-name font-medium text-[var(--text)]">
                  <span style={{ color: "var(--primary-action)" }}>{nextSeating.partyName}</span> (
                  {nextSeating.partySize}) → Table{" "}
                  <span className="font-semibold text-[var(--text)]">
                    {nextSeating.tableLabel}
                  </span>
                  {nextSeating.minutesUntil > 0 ? (
                    <span className="ml-2 text-[var(--muted)]">
                      (~{nextSeating.minutesUntil} min)
                    </span>
                  ) : (
                    <span className="ml-2" style={{ color: "var(--primary-action)" }}>— free now</span>
                  )}
                </p>
                {nextSeating.minutesUntil === 0 && (
                  <form action={forceSeatWorkspaceAction}>
                    <input type="hidden" name="partyId" value={nextSeating.partyId} />
                    <input type="hidden" name="workspaceTableStateId" value={nextSeating.workspaceTableStateId} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button type="submit" className="btn-primary w-full sm:w-auto">
                      Seat Now
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No one waiting, or no table fits the next party. Drag a party onto a table to seat them.
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <form action={kitchenSlowAllWorkspaceFormAction}>
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <button
              type="submit"
              className="btn-ghost meta-text text-[var(--muted)] hover:text-[var(--table-occupied-text)]"
            >
              Kitchen running slow (+10 min)
            </button>
          </form>
        </div>
      </section>

      <div className="min-w-0 flex-shrink-0">
        <WorkspaceServiceView
          workspaceId={workspaceId}
          layout={workspace.layout}
          tables={tables}
          combos={combos}
          labels={workspace.labels ?? []}
          parties={workspace.parties}
          waitingParties={waitingWithLiveEstimate}
          firstPartyId={firstPartyId}
          newestPartyId={newestPartyId}
          restaurantName={workspace.templateName}
          logoUrl={workspace.templateLogoUrl}
          timezone={workspace.timezone}
          nowMsSnapshot={Date.now()}
        />
      </div>
    </div>
  );
}
