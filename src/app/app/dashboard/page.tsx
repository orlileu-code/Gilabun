import { redirect } from "next/navigation";
import { getUserId } from "@/lib/firebase/auth-server";
import { getDashboardStats } from "@/app/dashboardActions";
import { TopBar } from "@/app/components/TopBar";
import { DashboardView } from "@/app/components/DashboardView";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ range?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const range = params.range || "last7";

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      break;
    case "thisweek":
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysFromMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last7":
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  const stats = await getDashboardStats(userId, startDate, endDate);

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View wait times, table turn times, and performance metrics over time.
          </p>
        </div>
        <DashboardView stats={stats} currentRange={range} />
      </main>
    </>
  );
}
