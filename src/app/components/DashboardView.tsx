"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardStats } from "@/app/dashboardActions";

type DashboardViewProps = {
  stats: DashboardStats;
  currentRange: string;
};

export function DashboardView({ stats, currentRange }: DashboardViewProps) {
  const router = useRouter();

  const handleRangeChange = (range: string) => {
    router.push(`/app/dashboard?range=${range}`);
  };

  const { summary, workspaces, dailyAggregates } = stats;

  // KPI Cards
  const kpiCards = [
    {
      label: "Avg Wait Time",
      value: summary.avgWaitMin != null ? `${summary.avgWaitMin} min` : "—",
      subtext: summary.minWaitMin != null && summary.maxWaitMin != null
        ? `${summary.minWaitMin}–${summary.maxWaitMin} min`
        : null,
    },
    {
      label: "Avg Table Time",
      value: summary.avgTableMin != null ? `${summary.avgTableMin} min` : "—",
      subtext: summary.minTableMin != null && summary.maxTableMin != null
        ? `${summary.minTableMin}–${summary.maxTableMin} min`
        : null,
    },
    {
      label: "Parties Seated",
      value: summary.totalPartiesSeated.toLocaleString(),
      subtext: `${summary.totalPartiesWaited} total waited`,
    },
    {
      label: "Tables Turned",
      value: summary.totalTablesTurned.toLocaleString(),
      subtext: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "today", label: "Today" },
          { value: "yesterday", label: "Yesterday" },
          { value: "last7", label: "Last 7 days" },
          { value: "thisweek", label: "This week" },
        ].map((preset) => (
          <button
            key={preset.value}
            onClick={() => handleRangeChange(preset.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              currentRange === preset.value
                ? "bg-[var(--primary-action)] text-white"
                : "bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
              {card.label}
            </div>
            <div className="text-2xl font-bold text-[var(--text)]">
              {card.value}
            </div>
            {card.subtext && (
              <div className="text-xs text-[var(--muted)] mt-1">
                {card.subtext}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      {dailyAggregates.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          <h2 className="section-header uppercase tracking-wide text-[var(--muted)] mb-4">
            Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyAggregates}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                label={{
                  value: "Minutes",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "var(--muted)", fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString();
                }}
                formatter={(value: any) =>
                  value != null && typeof value === "number" ? `${value} min` : "—"
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgWaitMin"
                stroke="var(--primary-action)"
                strokeWidth={2}
                name="Avg Wait Time"
                dot={{ fill: "var(--primary-action)", r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="avgTableMin"
                stroke="var(--table-occupied-border)"
                strokeWidth={2}
                name="Avg Table Time"
                dot={{ fill: "var(--table-occupied-border)", r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Shifts Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Shifts</h2>
        </div>
        <div className="card-body p-0">
          {workspaces.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted)]">
              <p>No data for this period.</p>
              <p className="text-xs mt-2">
                Try selecting a different date range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--panel-2)] border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Date/Time
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Shift Name
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Avg Wait
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Wait Range
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Avg Table
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Table Range
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Waited
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Seated
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Turned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((ws) => (
                    <tr
                      key={ws.workspaceId}
                      className="border-b border-[var(--border)] hover:bg-[var(--panel-2)]"
                    >
                      <td className="px-4 py-2 text-sm text-[var(--text)]">
                        {ws.createdAt.toLocaleDateString()}{" "}
                        {ws.createdAt.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2 text-sm text-[var(--text)]">
                        <Link
                          href={`/workspace/${ws.workspaceId}`}
                          className="hover:underline"
                        >
                          {ws.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[var(--text)]">
                        {ws.avgWaitMin != null ? `${ws.avgWaitMin} min` : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[var(--muted)]">
                        {ws.minWaitMin != null && ws.maxWaitMin != null
                          ? `${ws.minWaitMin}–${ws.maxWaitMin} min`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[var(--text)]">
                        {ws.avgTableMin != null ? `${ws.avgTableMin} min` : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[var(--muted)]">
                        {ws.minTableMin != null && ws.maxTableMin != null
                          ? `${ws.minTableMin}–${ws.maxTableMin} min`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[var(--text)]">
                        {ws.partiesWaited}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[var(--text)]">
                        {ws.partiesSeated}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[var(--text)]">
                        {ws.tablesTurned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
