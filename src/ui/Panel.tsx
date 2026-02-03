"use client";

import type { CSSProperties } from "react";

export type PanelVariant =
  | "page"
  | "floor"
  | "waitlist"
  | "modal"
  | "card"
  | "cardHeader"
  | "cardBody";

const variantStyles: Record<PanelVariant, string> = {
  page: "bg-[var(--bg)] border-0",
  floor: "bg-[var(--floor-bg)] border border-[var(--floor-border)]",
  waitlist: "bg-[var(--waitlist-bg)] border-0 border-l border-[var(--waitlist-border)]",
  modal: "bg-[var(--panel)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-xl",
  card: "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)]",
  cardHeader: "border-b border-[var(--border)] px-4 py-3",
  cardBody: "p-4",
};

type PanelProps = {
  variant: PanelVariant;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "main" | "header";
};

export function Panel({
  variant,
  children,
  className = "",
  style,
  as: Tag = "div",
}: PanelProps) {
  const base = "min-w-0";
  const combined = `${base} ${variantStyles[variant]} ${className}`.trim();
  return (
    <Tag className={combined} style={style}>
      {children}
    </Tag>
  );
}
