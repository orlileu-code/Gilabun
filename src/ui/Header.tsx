"use client";

export type HeaderVariant = "page" | "section" | "waitlist" | "modal";

const variantStyles: Record<HeaderVariant, string> = {
  page:
    "text-[var(--text)] font-semibold text-[18px] leading-tight tracking-tight",
  section:
    "text-[var(--muted)] font-semibold text-[14px] uppercase tracking-wide",
  waitlist:
    "text-[var(--waitlist-text)] font-semibold text-[18px]",
  modal:
    "text-[var(--text)] font-semibold text-[14px] border-b border-[var(--border)]",
};

type HeaderProps = {
  variant: HeaderVariant;
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export function Header({
  variant,
  children,
  as: Tag = "h1",
  className = "",
}: HeaderProps) {
  const combined = `${variantStyles[variant]} ${className}`.trim();
  return <Tag className={combined}>{children}</Tag>;
}
