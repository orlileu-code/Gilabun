/**
 * Gilabun floor layout: fixed positions matching the real restaurant (Tabit reference).
 * Layout controls WHERE tables appear; database controls STATUS and TIMING only.
 * No table 7, no table 14.
 */
export type FloorLayoutEntry = {
  tableNumber: number;
  seats: number;
  x: number;
  y: number;
};

export const GILABUN_FLOOR_LAYOUT: FloorLayoutEntry[] = [
  // Top large tables (8 seats)
  { tableNumber: 1, seats: 8, x: 3, y: 1 },
  { tableNumber: 2, seats: 8, x: 4, y: 1 },
  { tableNumber: 3, seats: 8, x: 5, y: 1 },

  // Upper middle
  { tableNumber: 4, seats: 4, x: 4, y: 2 },
  { tableNumber: 5, seats: 8, x: 5, y: 3 },
  { tableNumber: 6, seats: 4, x: 4, y: 3 },

  // 2-top cluster (main body)
  { tableNumber: 8, seats: 2, x: 3, y: 5 },
  { tableNumber: 9, seats: 2, x: 4, y: 5 },
  { tableNumber: 10, seats: 2, x: 5, y: 5 },
  { tableNumber: 11, seats: 2, x: 6, y: 5 },
  { tableNumber: 12, seats: 2, x: 7, y: 5 },
  { tableNumber: 13, seats: 2, x: 8, y: 5 },

  // Lower middle
  { tableNumber: 15, seats: 4, x: 4, y: 7 },
  { tableNumber: 16, seats: 4, x: 5, y: 7 },
  { tableNumber: 17, seats: 4, x: 6, y: 7 },

  // Bottom right
  { tableNumber: 18, seats: 5, x: 7, y: 7 },
  { tableNumber: 19, seats: 5, x: 8, y: 7 },
  { tableNumber: 20, seats: 4, x: 6, y: 8 }
];

/** Grid dimensions used for CSS grid (columns and rows). */
export const FLOOR_GRID_COLUMNS = 8;
export const FLOOR_GRID_ROWS = 8;
