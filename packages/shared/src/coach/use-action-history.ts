"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { coachActionHistorySchema, type CoachAction } from "./contracts";
type Cursor = ReturnType<typeof coachActionHistorySchema.parse>["next"];

export function useCoachActionHistory(client: { getJson: (path: string) => Promise<unknown> }, visible: boolean) {
  const [actions, setActions] = useState<CoachAction[]>([]);
  const [next, setNext] = useState<Cursor>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const read = useCallback(async (before?: Cursor) => {
    const request = ++generation.current;
    setLoading(true); setError(null);
    try {
      const page = coachActionHistorySchema.parse(await client.getJson(`/api/coach/actions${before ? `?before=${encodeURIComponent(JSON.stringify(before))}` : ""}`));
      if (request !== generation.current) return;
      setActions(old => before ? [...new Map([...old, ...page.actions].map(action => [action.id, action])).values()] : page.actions);
      setNext(page.next);
    } catch (error) { if (request === generation.current) setError(error instanceof Error ? error.message : "Could not load changes."); }
    finally { if (request === generation.current) setLoading(false); }
  }, [client]);
  useEffect(() => { if (visible) void read(); return () => { generation.current++; }; }, [visible, read]);
  return { actions, next, loading, error, reload: read, more: () => next ? read(next) : Promise.resolve() };
}
