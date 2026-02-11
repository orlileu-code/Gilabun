/**
 * Centralized design tokens. Single source of truth for the UI.
 *
 * VERIFY: Change ONE color here (e.g. pageBg = '#E0E0E0' or accentBlue = '#1565C0'),
 * save, and confirm it updates everywhere (page background, floor panel, + button).
 * If it does not propagate, fix layout/ThemeInjector and component usage of var(--xxx).
 */

export const colors = {
  // Page & panels
  pageBg: "#ECEFF1",
  panelLight: "#F4F6F8",
  panelDark: "#3E4348",
  panelWhite: "#ffffff",
  panelWhiteMuted: "#F8F9FA",

  // Borders
  border: "#D5DADF",
  borderDark: "#35383C",

  // Right panel (waitlist)
  textOnDark: "#EDEDED",
  textOnDarkMuted: "#B8BCC2",
  waitlistRow: "#45494E",
  waitlistRowBorder: "#35383C",
  waitlistFirst: "#E6B450",
  waitlistNewest: "#4A90E2",
  waitlistBadge: "#35383C",

  // Text (light contexts)
  textPrimary: "#1A1D21",
  textSecondary: "#6B7280",

  // Table status – FREE
  tableFreeBg: "#E6F2E8",
  tableFreeBorder: "#8DB79A",
  tableFreeText: "#2F6F44",

  // Table status – OCCUPIED
  tableOccupiedBg: "#F6E7D7",
  tableOccupiedBorder: "#D8A36A",
  tableOccupiedText: "#8A4B16",

  // Table status – TURNING / OVERDUE
  tableTurningBg: "#F2D6D3",
  tableTurningBorder: "#C44A3D",
  tableTurningText: "#7B1E17",

  // Structural labels (Restroom, Bar, Kitchen)
  labelText: "#9CA3AF",
  labelBg: "rgba(0, 0, 0, 0.02)",
  labelBorder: "#E5E7EB",

  // Primary action
  accentBlue: "#2F80ED",
  accentBlueHover: "#1C6ED5",

  // Utils
  red: "#C44A3D",
  /** Focus ring for inputs (matches accentBlue with opacity) */
  focusRing: "rgba(47, 128, 237, 0.2)",
  /** Status pill waiting (matches waitlistFirst) */
  statusPillWaitingBg: "rgba(230, 180, 80, 0.2)",
  statusPillWaitingText: "#B8860B",
  /** Status pill seated (matches accentBlue) */
  statusPillSeatedBg: "rgba(47, 128, 237, 0.15)",
} as const;

export const spacing = {
  0: "0",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const fontSizes = {
  xs: "0.65rem",
  sm: "0.75rem",
  base: "0.875rem",
  md: "14px",
  lg: "16px",
  xl: "18px",
} as const;

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const radii = {
  none: "0",
  sm: "6px",
  md: "8px",
  lg: "10px",
  full: "9999px",
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.06)",
  md: "0 2px 4px rgba(0, 0, 0, 0.08)",
} as const;

export const fontFamily =
  'system-ui, -apple-system, "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif';

/** Map theme to CSS custom property names used in globals.css and components (ThemeInjector sets these on :root) */
export function themeToCssVars(): Record<string, string> {
  return {
    "--bg": colors.pageBg,
    "--floor-bg": colors.panelLight,
    "--floor-border": colors.border,
    "--waitlist-bg": colors.panelDark,
    "--waitlist-text": colors.textOnDark,
    "--waitlist-muted": colors.textOnDarkMuted,
    "--waitlist-row": colors.waitlistRow,
    "--waitlist-row-border": colors.waitlistRowBorder,
    "--waitlist-border": colors.borderDark,
    "--waitlist-badge": colors.waitlistBadge,
    "--waitlist-first": colors.waitlistFirst,
    "--waitlist-newest": colors.waitlistNewest,
    "--primary-action": colors.accentBlue,
    "--primary-action-hover": colors.accentBlueHover,
    "--panel": colors.panelWhite,
    "--panel-2": colors.panelWhiteMuted,
    "--border": colors.border,
    "--text": colors.textPrimary,
    "--muted": colors.textSecondary,
    "--table-free-fill": colors.tableFreeBg,
    "--table-free-border": colors.tableFreeBorder,
    "--table-free-text": colors.tableFreeText,
    "--table-occupied-fill": colors.tableOccupiedBg,
    "--table-occupied-border": colors.tableOccupiedBorder,
    "--table-occupied-text": colors.tableOccupiedText,
    "--table-turning-fill": colors.tableTurningBg,
    "--table-turning-border": colors.tableTurningBorder,
    "--table-turning-text": colors.tableTurningText,
    "--label-text": colors.labelText,
    "--label-bg": colors.labelBg,
    "--label-border": colors.labelBorder,
    "--red": colors.red,
    "--focus-ring": colors.focusRing,
    "--status-pill-waiting-bg": colors.statusPillWaitingBg,
    "--status-pill-waiting-text": colors.statusPillWaitingText,
    "--status-pill-seated-bg": colors.statusPillSeatedBg,
    "--radius": radii.md,
    "--radius-sm": radii.sm,
    "--shadow": shadow.sm,
    "--font": fontFamily,
  };
}
