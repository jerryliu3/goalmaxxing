"use client";
import { useCallback, useEffect, useState } from "react";
import { digestPayloadSchema, type DigestPayload } from "@cadence/shared/coach/check-in";
import { canAutoShowDigestAfterOnboarding } from "@/features/digest/digest-eligibility";
import { getJson, postJson } from "@/lib/api/client";

/** Both check-in surfaces claim presentation once; opening owns generation. */
export function useCheckInOffer(enabled: boolean) {
  const [payload, setPayload] = useState<DigestPayload | null>(null);
  const dismiss = useCallback(() => setPayload(null), []);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let loading = false;
    const read = async () => {
      if (loading || document.hidden) return;
      loading = true;
      try {
        const next = digestPayloadSchema.parse(await getJson("/api/digest"));
        if (stopped || !next.shouldAutoShow || !canAutoShowDigestAfterOnboarding(window.localStorage, next.localDate)) return;
        const result = await postJson<{ claimed: boolean }>("/api/digest/ack", { referenceId: next.id, localDate: next.localDate });
        if (!stopped && result.claimed) setPayload(next);
      } catch { /* Opening Check-in exposes actionable errors; the invitation is optional. */ }
      finally { loading = false; }
    };
    void read();
    window.addEventListener("focus", read);
    window.addEventListener("online", read);
    const timer = window.setInterval(read, 60000);
    return () => { stopped = true; window.clearInterval(timer); window.removeEventListener("focus", read); window.removeEventListener("online", read); };
  }, [enabled]);
  return { payload, dismiss };
}
