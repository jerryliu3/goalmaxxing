"use client";
import { useEffect } from "react";
import { useCoachConversations as useSharedConversations } from "@cadence/shared/coach/use-conversations";
import { getJson, postJson, requestJson } from "@/lib/api/client";
import { sendCoachTurn } from "@cadence/shared/coach/transport";

const client = { getJson, postJson, requestJson, sendTurn: sendCoachTurn, createId: () => crypto.randomUUID() };
export function useCoachConversations() {
  const controller = useSharedConversations(client, true);
  const { reload, setError } = controller;
  useEffect(() => {
    const refresh = () => { if (!document.hidden) void reload().catch(error => setError(error.message)); };
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [reload, setError]);
  return controller;
}
