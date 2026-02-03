"use client";

import { useEffect } from "react";

/**
 * Initializes Firebase (Analytics) on the client when the app loads.
 * Dynamic import avoids bundling firebase/auth (and undici) into the client bundle.
 */
export function FirebaseInit() {
  useEffect(() => {
    import("@/lib/firebase/client")
      .then(({ getFirebaseAnalytics }) => {
        getFirebaseAnalytics();
      })
      .catch(() => {
        // Firebase client optional; app works without it
      });
  }, []);
  return null;
}
