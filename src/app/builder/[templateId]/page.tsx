import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserId } from "@/lib/firebase/admin";
import { getTemplateWithTables } from "../../templateActions";
import { TopBar } from "../../components/TopBar";
import { BuilderView } from "../../components/BuilderView";
import { setActiveTemplateFormAction } from "../../templateActions";

type Props = { params: Promise<{ templateId: string }> };

export default async function BuilderPage({ params }: Props) {
  const { templateId } = await params;
  const userId = getUserId();
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
      <main className="flex flex-1 flex-col gap-4 lg:flex-row">
        <BuilderView
          templateId={template.id}
          templateName={template.name}
          logoUrl={template.logoUrl}
          items={items}
          labels={labels}
          setActiveTemplateFormAction={setActiveTemplateFormAction}
        />
      </main>
      <div className="mt-4 flex gap-2">
        <Link href="/choose-template" className="btn-ghost text-sm">
          ← Back to templates
        </Link>
      </div>
    </>
  );
}
