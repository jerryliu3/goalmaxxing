import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { digestPayloadSchema, type DigestPayload } from "@cadence/shared/coach/check-in";
import { useCoachCheckIn } from "@cadence/shared/coach/use-check-in";
import { api } from "../../lib/api";

export function useNativeCheckIn(enabled: boolean) {
  const [offered, setOffered] = useState<DigestPayload | null>(null);
  const briefing = useCoachCheckIn(api);
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let loading = false;
    const load = async () => {
      if (loading || AppState.currentState !== "active") return;
      loading = true;
      try {
        const next = digestPayloadSchema.parse(await api.getJson("/api/digest"));
        if (disposed || !next.shouldAutoShow) return;
        const result = await api.postJson<{ claimed: boolean }>("/api/digest/ack", { referenceId: next.id, localDate: next.localDate });
        if (!disposed && result.claimed) setOffered(next);
      } catch { /* A failed offer can retry on the next foreground open. */ }
      finally { loading = false; }
    };
    void load();
    const timer = setInterval(() => void load(), 60000);
    const subscription = AppState.addEventListener("change", state => { if (state === "active") void load(); });
    return () => { disposed = true; clearInterval(timer); subscription.remove(); };
  }, [enabled]);
  return {
    ...briefing, enabled, offered, skip: () => setOffered(null),
    open: async () => { const next = offered; setOffered(null); await briefing.open(next ?? undefined); },
  };
}
