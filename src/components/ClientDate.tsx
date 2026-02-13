"use client";

import { useState, useEffect } from "react";
import { formatDateTime, formatTime, formatDate } from "@/lib/dateFormat";

type Variant = "datetime" | "time" | "date";

type ClientDateProps = {
  /** ISO string or Date. Pass ISO string to avoid hydration mismatch. */
  value: string | Date;
  variant?: Variant;
  /** Optional workspace timezone (e.g. "America/New_York"). */
  timezone?: string;
  className?: string;
};

/** Client-side date display. Renders formatted date only after mount to use browser timezone and avoid hydration mismatch. */
export function ClientDate({ value, variant = "datetime", timezone, className }: ClientDateProps) {
  const [str, setStr] = useState<string>("");

  useEffect(() => {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!Number.isFinite(d.getTime())) {
      setStr("");
      return;
    }
    if (variant === "time") {
      setStr(formatTime(d, timezone));
    } else if (variant === "date") {
      setStr(formatDate(d, timezone));
    } else {
      setStr(formatDateTime(d, timezone));
    }
  }, [value, variant, timezone]);

  return <span className={className}>{str || "\u00A0"}</span>;
}
