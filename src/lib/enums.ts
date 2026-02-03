// Enum-like string constants and types used across the app.
// Backed by plain string columns in SQLite via Prisma.

export const PartyPreference = {
  ANY: "ANY",
  WINDOW: "WINDOW",
  QUIET: "QUIET",
  BAR: "BAR",
  OUTSIDE: "OUTSIDE"
} as const;
export type PartyPreference =
  (typeof PartyPreference)[keyof typeof PartyPreference];

export const PartyStatus = {
  WAITING: "WAITING",
  SEATED: "SEATED",
  CANCELED: "CANCELED",
  NO_SHOW: "NO_SHOW"
} as const;
export type PartyStatus = (typeof PartyStatus)[keyof typeof PartyStatus];

export const TableZone = {
  MAIN: "MAIN",
  WINDOW: "WINDOW",
  BAR: "BAR",
  OUTSIDE: "OUTSIDE",
  QUIET: "QUIET"
} as const;
export type TableZone = (typeof TableZone)[keyof typeof TableZone];

export const TableStatus = {
  FREE: "FREE",
  OCCUPIED: "OCCUPIED",
  TURNING: "TURNING"
} as const;
export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

