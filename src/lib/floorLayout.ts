/**
 * Shared floor layout constants and helpers.
 * Ensures workspace floor matches template builder geometry exactly.
 */

export const CANVAS_BASE_MIN_WIDTH = 900;
export const CANVAS_BASE_MIN_HEIGHT = 650;

export type TemplateTableGeometry = {
  tableNumber: number;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotDeg: number;
};

/** Compute canvas size from layout bounds; use minimums so layout never reflows. */
export function getCanvasSize(items: Array<{ x: number; y: number; w: number; h: number }>): {
  width: number;
  height: number;
} {
  if (items.length === 0) {
    return { width: CANVAS_BASE_MIN_WIDTH, height: CANVAS_BASE_MIN_HEIGHT };
  }
  const maxX = Math.max(...items.map((i) => i.x + i.w));
  const maxY = Math.max(...items.map((i) => i.y + i.h));
  return {
    width: Math.max(CANVAS_BASE_MIN_WIDTH, maxX + 80),
    height: Math.max(CANVAS_BASE_MIN_HEIGHT, maxY + 80)
  };
}

/** Template bounding box (ignores rotation for v1). Used for fit-to-canvas. */
export function getTemplateBounds(
  items: Array<{ x: number; y: number; w: number; h: number }>
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (items.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 400,
      maxY: 300,
      width: 400,
      height: 300
    };
  }
  const minX = Math.min(...items.map((i) => i.x));
  const minY = Math.min(...items.map((i) => i.y));
  const maxX = Math.max(...items.map((i) => i.x + i.w));
  const maxY = Math.max(...items.map((i) => i.y + i.h));
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/** Allow strong zoom-out so floor always fits in viewport — host never has to scroll. */
export const FIT_SCALE_MIN = 0.1;
export const FIT_SCALE_MAX = 2.5;
export const FIT_PADDING_PX = 12;

/** Smallest table dimension (px) we allow when scaling; below this tables become unreadable. */
export const MIN_TABLE_RENDER_PX = 30;

/**
 * Compute uniform scale and offset to fit template bounds in container (workspace mode).
 * Ensures no table is drawn smaller than MIN_TABLE_RENDER_PX on its shorter side; if the
 * container is too small for that, scale may exceed fit and the floor will scroll.
 */
export function getFitScaleAndOffset(
  items: Array<{ x: number; y: number; w: number; h: number }>,
  containerWidth: number,
  containerHeight: number,
  padding: number = FIT_PADDING_PX
): {
  scale: number;
  offsetX: number;
  offsetY: number;
  minX: number;
  minY: number;
  boundsWidth: number;
  boundsHeight: number;
} {
  const bounds = getTemplateBounds(items);
  const availableW = Math.max(0, containerWidth - 2 * padding);
  const availableH = Math.max(0, containerHeight - 2 * padding);
  let scale = 1;
  if (bounds.width > 0 && bounds.height > 0 && availableW > 0 && availableH > 0) {
    const fitScale = Math.min(availableW / bounds.width, availableH / bounds.height);
    let minReadableScale = FIT_SCALE_MIN;
    if (items.length > 0) {
      const smallestTableDimension = Math.min(
        ...items.map((i) => Math.min(i.w, i.h))
      );
      if (smallestTableDimension > 0) {
        minReadableScale = MIN_TABLE_RENDER_PX / smallestTableDimension;
      }
    }
    // Prioritize fitting all tables - use fitScale if reasonable, but don't let minReadableScale prevent fitting
    if (fitScale < minReadableScale && minReadableScale > FIT_SCALE_MIN * 2) {
      // If minReadableScale is too restrictive, prefer fitScale to show all tables
      scale = Math.max(fitScale, FIT_SCALE_MIN);
    } else {
      scale = Math.max(fitScale, minReadableScale);
    }
    scale = Math.max(FIT_SCALE_MIN, Math.min(FIT_SCALE_MAX, scale));
  }
  const scaledW = bounds.width * scale;
  const scaledH = bounds.height * scale;
  const offsetX = padding + (availableW - scaledW) / 2;
  const offsetY = padding + (availableH - scaledH) / 2;
  return {
    scale,
    offsetX,
    offsetY,
    minX: bounds.minX,
    minY: bounds.minY,
    boundsWidth: bounds.width,
    boundsHeight: bounds.height
  };
}
