"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";

const DEFAULT_INTERVAL_MS = 30000;

const TimeTickContextInner = createContext<number>(0);

export function TimeTickProvider({
  intervalMs = DEFAULT_INTERVAL_MS,
  children
}: {
  intervalMs?: number;
  children: React.ReactNode;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  const value = useMemo(() => tick, [tick]);
  return (
    <TimeTickContextInner.Provider value={value}>
      {children}
    </TimeTickContextInner.Provider>
  );
}

export function useTimeTickContext(): number {
  return useContext(TimeTickContextInner);
}
