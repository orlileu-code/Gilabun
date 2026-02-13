import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/firebase/auth-server";
import { getTemplates, setActiveTemplateFormAction } from "../templateActions";
import { TopBar } from "../components/TopBar";
import { ClientDate } from "@/components/ClientDate";

export const dynamic = "force-dynamic";

export default async function ChooseTemplatePage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const templates = await getTemplates(userId);

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">
            Choose seating template
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Use an existing template or create a new one. Then open the builder
            to edit, or start service with the selected template.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`card flex flex-col ${t.isDefault ? "border-[var(--primary-action)]/50 ring-1 ring-[var(--primary-action)]/30" : ""}`}
            >
              <div className="card-body flex-1">
                <div className="flex items-center gap-3">
                  {t.logoUrl ? (
                    <img
                      src={t.logoUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded object-contain bg-[var(--panel-2)]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--panel-2)] text-[var(--muted)]" aria-hidden>
                      <span className="text-xs font-medium">{t.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-[var(--text)] truncate">{t.name}</h2>
                  </div>
                  {t.isDefault && (
                    <span className="shrink-0 rounded bg-[var(--table-free-fill)] px-2 py-0.5 meta-text font-medium text-[var(--table-free-text)]">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {t.tableCount} tables · updated{" "}
                  <ClientDate value={t.updatedAt.toISOString()} variant="date" />
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={setActiveTemplateFormAction} className="contents">
                    <input type="hidden" name="templateId" value={t.id} />
                    <button type="submit" className="btn-primary text-sm">
                      Use
                    </button>
                  </form>
                  <Link
                    href={`/builder/${t.id}`}
                    className="btn-ghost text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <Link
            href="/choose-template/new"
            className="btn-primary inline-flex"
          >
            New template
          </Link>
        </div>
      </main>
    </>
  );
}
