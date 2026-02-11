/**
 * Centralized design tokens. Single source of truth for the UI.
 *
 * VERIFY: Change ONE color here (e.g. pageBg = '#E0E0E0' or accentBlue = '#1565C0'),
 * save, and confirm it updates everywhere (page background, floor panel, + button).
 * If it does not propagate, fix layout/ThemeInjector and component usage of var(--xxx).
 */

export const colors = {
  // Page & panels – light brown tint
  pageBg: "#F7F4F0",
  panelLight: "#EDE7E0",
  panelDark: "#2C2419",
  panelWhite: "#ffffff",
  panelWhiteMuted: "#EDE7E0",

  // Borders (light brown)
  border: "#E0D6CC",
  borderDark: "#3D362D",

  // Right panel (waitlist)
  textOnDark: "#F5F5F0",
  textOnDarkMuted: "#B8B0A0",
  waitlistRow: "#3D362D",
  waitlistRowBorder: "#2C2419",
  waitlistFirst: "#8B7355",
  waitlistNewest: "#6B5344",
  waitlistBadge: "#2C2419",

  // Text (light contexts)
  textPrimary: "#1A1814",
  textSecondary: "#5C5348",

  // Table status – FREE (neutral green tint, fits brown palette)
  tableFreeBg: "#E8EDE6",
  tableFreeBorder: "#7D8B76",
  tableFreeText: "#2D3D28",

  // Table status – OCCUPIED (warm brown/tan – clearly not red)
  tableOccupiedBg: "#E8E6E4",
  tableOccupiedBorder: "#5C4033",
  tableOccupiedText: "#3D2C22",

  // Table status – TURNING / OVERDUE (red – distinct from Occupied)
  tableTurningBg: "#F2D6D3",
  tableTurningBorder: "#C44A3D",
  tableTurningText: "#7B1E17",

  // Structural labels (Restroom, Bar, Kitchen)
  labelText: "#6B6358",
  labelBg: "rgba(0, 0, 0, 0.02)",
  labelBorder: "#E0D6CC",

  // Primary action – chocolate brown (no amber)
  accentBlue: "#4A3528",
  accentBlueHover: "#3D2C22",

  // Utils
  red: "#C44A3D",
  /** Focus ring for inputs (brown with opacity) */
  focusRing: "rgba(74, 53, 40, 0.2)",
  /** Status pill waiting */
  statusPillWaitingBg: "rgba(92, 64, 51, 0.15)",
  statusPillWaitingText: "#5C5348",
  /** Status pill seated (brown) */
  statusPillSeatedBg: "rgba(74, 53, 40, 0.15)",
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
  /** Slight lift for table tiles on the floor so they read as distinct from the background. */
  tableTile: "0 1px 3px rgba(0, 0, 0, 0.07)",
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
    "--table-tile-shadow": shadow.tableTile,
    "--font": fontFamily,
  };
}
