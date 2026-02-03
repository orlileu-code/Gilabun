// Shared types and constants for auto-assign and suggest flows.
// Kept outside "use server" so they can be imported by both server actions and client components.

export type AutoAssignState = {
  status: "idle" | "NO_PARTY" | "NO_TABLE" | "RECOMMENDATION" | "SEATED" | "ERROR";
  message?: string;
  partyId?: string;
  partyName?: string;
  partySize?: number;
  tableId?: string;
  tableLabel?: string;
  minutesUntilAvailable?: number | null;
  mode?: "FCFS" | "SIZE_PRIORITY";
  targetSize?: number | null;
};

export type SuggestState = {
  status: "idle" | "NO_TABLE" | "RECOMMENDATION" | "ERROR";
  message?: string;
  partyId?: string;
  partyName?: string;
  partySize?: number;
  tableId?: string;
  tableLabel?: string;
  minutesUntilAvailable?: number | null;
};

export const AUTO_ASSIGN_THRESHOLD_MIN = 5;
