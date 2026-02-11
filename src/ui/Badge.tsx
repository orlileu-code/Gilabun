"use client";

export type BadgeVariant =
  | "muted"
  | "free"
  | "occupied"
  | "turning"
  | "seats"
  | "waitlist";

const variantStyles: Record<BadgeVariant, string> = {
  muted: "bg-[var(--panel-2)] text-[var(--muted)]",
  free: "bg-[var(--table-free-border)]/30 text-[var(--table-free-text)]",
  occupied: "bg-[var(--table-occupied-border)]/30 text-[var(--table-occupied-text)]",
  turning: "bg-[var(--table-turning-border)]/30 text-[var(--table-turning-text)]",
  seats: "bg-white/60 text-[var(--muted)]",
  waitlist: "bg-[var(--waitlist-badge)] text-[var(--waitlist-text)]",
};

type BadgeProps = {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  rounded?: "sm" | "full";
};

export function Badge({
  variant,
  children,
  className = "",
  rounded = "sm",
}: BadgeProps) {
  const base = "inline-flex items-center justify-center font-medium text-[0.6rem] px-1.5 py-0.5 shrink-0";
  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-sm";
  const combined = `${base} ${roundedClass} ${variantStyles[variant]} ${className}`.trim();
  return <span className={combined}>{children}</span>;
}
