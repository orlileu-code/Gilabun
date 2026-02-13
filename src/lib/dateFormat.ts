/**
 * Shared date formatting utilities for consistent time display across the app.
 * Uses en-GB with 24h format for consistency. Supports optional timezone for workspace-level display.
 */

export const DATE_LOCALE = "en-GB";
export const DATE_FORMAT_24H = { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false };

/** Format date and time (e.g. "Thu 12 Feb 13:38"). Uses browser timezone if no timezone given. */
export function formatDateTime(
  date: Date | string,
  timezone?: string
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!Number.isFinite(d.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  return d.toLocaleString(DATE_LOCALE, timezone ? { ...options, timeZone: timezone } : options);
}

/** Format time only (e.g. "13:38"). Uses browser timezone if no timezone given. */
export function formatTime(date: Date | string, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString(
    DATE_LOCALE,
    timezone ? { ...DATE_FORMAT_24H, timeZone: timezone } : DATE_FORMAT_24H
  );
}

/** Format date only (e.g. "Thu 12 Feb"). Uses browser timezone if no timezone given. */
export function formatDate(date: Date | string, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!Number.isFinite(d.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  };
  return d.toLocaleDateString(DATE_LOCALE, timezone ? { ...options, timeZone: timezone } : options);
}

/** Format date and time for workspace list (e.g. "Thu 12 Feb 13:38"). */
export function formatWorkspaceDateTime(date: Date | string, timezone?: string): string {
  return formatDateTime(date, timezone);
}
