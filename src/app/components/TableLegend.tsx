export function TableLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
      <span className="label text-[0.65rem]">Legend</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--table-free-fill)] px-2 py-0.5 text-[var(--table-free-text)]">
        <span className="h-2 w-2 rounded-full bg-[var(--table-free-border)]" />
        Free
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--table-occupied-fill)] px-2 py-0.5 text-[var(--table-occupied-text)]">
        <span className="h-2 w-2 rounded-full bg-[var(--table-occupied-border)]" />
        Occupied
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--table-turning-fill)] px-2 py-0.5 text-[var(--table-turning-text)]">
        <span className="h-2 w-2 rounded-full bg-[var(--table-turning-border)]" />
        Turning
      </span>
    </div>
  );
}

