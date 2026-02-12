"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Panel, Header, Badge } from "@/ui";

/** Renders time + date only after mount to avoid server/client format mismatch (hydration error). */
function TopBarTime() {
  const [str, setStr] = useState<string>("");
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    setStr(`${timeStr} ${dateStr}`);
  }, []);
  return <span className="meta-text font-mono text-[var(--muted)]">{str || "\u00A0"}</span>;
}

type TopBarProps = {
  waitingCount?: number;
};

export function TopBar({ waitingCount }: TopBarProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Panel variant="page" as="header" className="mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:mb-4 sm:px-6 border-b border-[var(--floor-border)]">
      <div className="flex items-baseline gap-3">
        <TopBarTime />
        {typeof waitingCount === "number" && waitingCount > 0 && (
          <Badge variant="muted" className="rounded border border-[var(--border)] px-2 py-0.5">
            {waitingCount}p waiting
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Header variant="page" as="h1" className="tracking-tight">
          TableFlow
        </Header>
        <a
          href="/app/dashboard"
          className="btn-ghost text-sm"
        >
          Dashboard
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-ghost text-sm"
        >
          Sign out
        </button>
      </div>
    </Panel>
  );
}

