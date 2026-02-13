import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUserId } from "@/lib/firebase/auth-server";
import { getTemplateWithTables } from "../../templateActions";
import { TopBar } from "../../components/TopBar";
import { BuilderView } from "../../components/BuilderView";
import { startWorkspaceFromTemplateFormAction } from "../../workspaceActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ templateId: string }> };

export default async function BuilderPage({ params }: Props) {
  const { templateId } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const template = await getTemplateWithTables(userId, templateId);
  if (!template) notFound();

  const items = (template.items ?? []).map((i) => ({
    id: i.id,
    tableNumber: i.tableNumber ?? 0,
    seats: i.seats ?? 0,
    x: i.x ?? 0,
    y: i.y ?? 0,
    w: i.w ?? 100,
    h: i.h ?? 100,
    rotDeg: i.rotDeg ?? 0
  }));

  const labels = (template.labels ?? []).map((l) => ({
    id: l.id,
    text: l.text ?? "",
    x: l.x,
    y: l.y,
    w: l.w,
    h: l.h,
    rotDeg: l.rotDeg ?? 0
  }));

  return (
    <>
      <TopBar />
      <div className="mb-2 flex shrink-0 items-center justify-between px-4">
        <Link href="/choose-template" className="btn-ghost text-sm">
          ← Back to templates
        </Link>
      </div>
      <main className="flex flex-1 flex-col gap-4 lg:flex-row">
        <BuilderView
          templateId={template.id}
          templateName={template.name}
          logoUrl={template.logoUrl}
          items={items}
          labels={labels}
          startWorkspaceFormAction={startWorkspaceFromTemplateFormAction}
        />
      </main>
    </>
  );
}
