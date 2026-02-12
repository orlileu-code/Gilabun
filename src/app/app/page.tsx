import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "../components/TopBar";
import {
  listWorkspaces,
  duplicateWorkspaceFormAction,
  deleteWorkspaceFormAction
} from "../workspaceActions";
import { getTemplates } from "../templateActions";
import { getUserId } from "@/lib/firebase/auth-server";
import { StartNewWorkspaceForm } from "../components/StartNewWorkspaceForm";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let templates: Awaited<ReturnType<typeof getTemplates>> = [];
  let loadError: string | null = null;

  try {
    [workspaces, templates] = await Promise.all([
      listWorkspaces(userId),
      getTemplates(userId)
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load data.";
  }

  const templatesForForm = (templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    tableCount: t.tableCount
  }));

  if (loadError) {
    return (
      <>
        <TopBar />
        <main className="flex flex-1 flex-col gap-4">
          <h1 className="app-title text-[var(--text)]">TableFlow</h1>
          <div className="rounded-lg border border-[var(--red)]/30 bg-[var(--panel)] p-4 meta-text text-[var(--red)]">
            {loadError}
          </div>
          <p className="meta-text text-[var(--muted)]">
            Check .env.local: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col gap-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Service Sessions</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Start a new TableFlow workspace for tonight&apos;s service, or open an existing one.
            </p>
          </div>
          <Link
            href="/app/dashboard"
            className="btn-primary text-sm"
          >
            Dashboard
          </Link>
        </div>

        {/* Recent Workspaces */}
        <section>
          <h2 className="section-header uppercase tracking-wide text-[var(--muted)]">
            Recent Workspaces
          </h2>
          {(workspaces ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              No workspaces yet. Start one below.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(workspaces ?? []).slice(0, 10).map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--floor-border)] bg-[var(--panel)] px-4 py-3"
                  style={{ boxShadow: "var(--shadow)" }}
                >
                  <div>
                    <span className="party-name text-[var(--text)]">{w.name}</span>
                    <span className="ml-2 meta-text text-[var(--muted)]">
                      {w.templateName} ·{" "}
                      {w.createdAt.toLocaleDateString()}{" "}
                      {w.createdAt.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/workspace/${w.id}`}
                      className="btn-primary text-sm"
                    >
                      Open
                    </Link>
                    <form action={duplicateWorkspaceFormAction} className="contents">
                      <input type="hidden" name="workspaceId" value={w.id} />
                      <button type="submit" className="btn-ghost text-sm">
                        Duplicate
                      </button>
                    </form>
                    <form action={deleteWorkspaceFormAction} className="contents">
                      <input type="hidden" name="workspaceId" value={w.id} />
                      <button
                        type="submit"
                        className="btn-ghost text-sm text-[var(--muted)] hover:text-[var(--red)]"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Start New Workspace */}
        <section>
          <h2 className="section-header uppercase tracking-wide text-[var(--muted)]">
            Start New Workspace
          </h2>
          <p className="mt-1 meta-text text-[var(--muted)]">
            Creates a fresh session: empty waitlist, all tables FREE.
          </p>
          <StartNewWorkspaceForm templates={templatesForForm} />
        </section>

        {/* Templates */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Templates
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {(templates ?? []).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3"
                style={{ boxShadow: "var(--shadow)" }}
              >
                <span className="party-name text-[var(--text)]">{t.name}</span>
                <span className="meta-text text-[var(--muted)]">
                  {t.tableCount} tables
                </span>
                <Link
                  href={`/builder/${t.id}`}
                  className="btn-ghost text-sm"
                >
                  Edit
                </Link>
              </div>
            ))}
            <Link
              href="/choose-template/new"
              className="btn-outline inline-flex text-sm"
            >
              New template
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

