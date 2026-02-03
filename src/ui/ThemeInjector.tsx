"use client";

import { useEffect } from "react";
import { themeToCssVars } from "./theme";

/**
 * Applies theme tokens to :root as CSS custom properties.
 * Change a value in theme.ts to update the entire UI.
 */
export function ThemeInjector() {
  useEffect(() => {
    const vars = themeToCssVars();
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, []);
  return null;
}
