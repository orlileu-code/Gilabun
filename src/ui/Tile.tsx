"use client";

export type TileVariant =
  | "table-free"
  | "table-occupied"
  | "table-turning"
  | "table-placeholder"
  | "label"
  | "combo";

const variantStyles: Record<TileVariant, string> = {
  "table-free":
    "bg-[var(--table-free-fill)] border-[var(--table-free-border)] text-[var(--table-free-text)]",
  "table-occupied":
    "bg-[var(--table-occupied-fill)] border-[var(--table-occupied-border)] text-[var(--table-occupied-text)]",
  "table-turning":
    "bg-[var(--table-turning-fill)] border-[var(--table-turning-border)] text-[var(--table-turning-text)]",
  "table-placeholder": "bg-[var(--panel-2)] border-[var(--border)] text-[var(--muted)]",
  label:
    "bg-[var(--label-bg)] border-[var(--label-border)] text-[var(--label-text)] rounded-none",
  combo: "border rounded-lg",
};

type TileProps = {
  variant: TileVariant;
  children: React.ReactNode;
  className?: string;
  rounded?: "none" | "sm" | "md";
  padding?: "none" | "sm" | "md";
  onClick?: () => void;
  role?: string;
  title?: string;
};

const paddingMap = { none: "p-0", sm: "px-2 py-1", md: "px-2 py-2" };
const roundedMap = { none: "rounded-none", sm: "rounded-sm", md: "rounded-[var(--radius)]" };

export function Tile({
  variant,
  children,
  className = "",
  rounded = "none",
  padding = "md",
  onClick,
  role,
  title,
}: TileProps) {
  const base = "border flex min-h-0 min-w-0 flex-col overflow-hidden";
  const combined = `${base} ${variantStyles[variant]} ${roundedMap[rounded]} ${paddingMap[padding]} ${className}`.trim();
  return (
    <div className={combined} onClick={onClick} role={role} title={title}>
      {children}
    </div>
  );
}
