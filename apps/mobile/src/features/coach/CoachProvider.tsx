import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { createClientUuid } from "@cadence/shared/ids";
import { fetch as expoFetch } from "expo/fetch";
import { AppState } from "react-native";
import { useFocusEffect, usePathname } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { coachContextSchema, type CoachPage } from "@cadence/shared/coach";
import { sendCoachTurn } from "@cadence/shared/coach/transport";
import { useCoachConversations, type CoachConversationClient } from "@cadence/shared/coach/use-conversations";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/session";
import { useMobileRuntimeConfig } from "../../lib/runtime-config";
import { mobileEnv } from "../../config/env";
import { useCoachActionHistory } from "@cadence/shared/coach/use-action-history";
import { useNativeCheckIn } from "./use-native-check-in";
import { CoachSurface } from "./CoachSurface";
import { NativeCoachContext, useNativeCoach } from "./coach-context";
import { refreshCoachData } from "./refresh-data";
const conversationClient: CoachConversationClient = {
  ...api, createId: createClientUuid,
  sendTurn: async (id, body, signal, onEvent) => {
    const { data: { session } } = await supabase.auth.getSession();
    return sendCoachTurn(id, body, signal, onEvent, {
      baseUrl: mobileEnv.apiBaseUrl,
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      fetcher: expoFetch as typeof fetch,
    });
  },
};
function useController(userId: string) {
  const path = usePathname();
  const config = useMobileRuntimeConfig();
  const briefing = useNativeCheckIn(Boolean(config.data?.flags.digestEnabled));
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [view, setView] = useState<"conversation" | "rooms" | "understanding" | "check-in" | "changes">("conversation");
  const history = useCoachActionHistory(api, open && view === "changes");
  const [selection, setSelection] = useState<{ id: string; path: string; page: Partial<CoachPage> } | null>(null);
  const registerPage = useCallback((id: string, registeredPath: string, value: Partial<CoachPage> | null) => {
    setSelection(old => value ? { id, path: registeredPath, page: value } : old?.id === id ? null : old);
  }, []);
  const controller = useCoachConversations(conversationClient, true);
  const surface: CoachPage["surface"] = path.includes("goals") ? "goal" : path.includes("insights") ? "progress" : path.includes("social") ? "community" : path.includes("settings") ? "you" : path.includes("checklist") || path.includes("tasks") ? "checklist" : "plan";
  const page: CoachPage = { surface, scope: "self", hasDraft: false, ...(selection?.path === path ? selection.page : {}) };
  const facts = useQuery({ queryKey: ["mobile-coach-context", userId, page], refetchInterval: 60000, queryFn: async () => { const result = await api.getJson<{ context: unknown }>("/api/coach/context", { query: { page: JSON.stringify(page) } }); return coachContextSchema.parse(result.context); } });
  useEffect(() => {
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ["mobile-coach-context", userId] });
      if (open) void briefing.refresh().catch(() => undefined);
    };
    const channel = supabase.channel(`native-coach:${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "coach_context_versions", filter: `owner_id=eq.${userId}` }, refresh).subscribe();
    const app = AppState.addEventListener("change", state => {
      if (state === "active") {
        refresh();
        if (open) void controller.reload().catch(error => controller.setError(error.message));
      }
    });
    return () => { void supabase.removeChannel(channel); app.remove(); };
  }, [userId, open, controller.reload, briefing.refresh, client]);
  const running = controller.conversation?.runs.find(run => run.status === "running");
  const operate = async (actionId: string, operation: "apply" | "reject" | "refresh" | "undo", requestId: string, threadId: string) => {
    controller.setError(null);
    try {
      await api.postJson(`/api/coach/actions/${actionId}/${operation}`, operation === "apply" ? { requestId, page } : operation === "reject" ? {} : { page });
      if (operation === "apply") {
        await refreshCoachData(client, userId);
        await briefing.refresh();
      }
    } catch (error) { controller.setError(error instanceof Error ? error.message : "Could not update this proposal."); }
    finally { await controller.loadConversation(threadId).catch(() => undefined); if (view === "changes") await history.reload(); }
  };
  return {
    ...controller, briefing, open, setOpen, full, setFull, view, setView, page, facts, history,
    busy: Boolean(running) || Boolean(controller.threadId && controller.stages[controller.threadId]),
    send: (retry = false) => controller.send(page, retry ? controller.conversation?.runs[0] : undefined),
    operate,
    loadEarlier: () => controller.threadId && controller.conversation?.before != null
      ? controller.loadConversation(controller.threadId, controller.conversation.before) : Promise.resolve(),
    registerPage,
    stop: () => running ? controller.cancel(running) : Promise.resolve(),
  };
}
export type NativeCoachController = ReturnType<typeof useController>;
export function CoachProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession(); const config = useMobileRuntimeConfig(); const path = usePathname();
  return userId && config.data?.flags.coachEnabled && !path.includes("upgrade") && !path.includes("login") && !path.includes("onboarding") ? <Enabled key={userId} userId={userId}>{children}</Enabled> : children;
}
function Enabled({ children, userId }: { children: ReactNode; userId: string }) { const controller = useController(userId); return <NativeCoachContext.Provider value={controller}>{children}<CoachSurface /></NativeCoachContext.Provider>; }
/** Retained native screens may publish context only while focused. */
export function useNativeCoachPage(page: Partial<CoachPage>) {
  const register = useNativeCoach()?.registerPage;
  const path = usePathname();
  const id = useId();
  const key = JSON.stringify(page);
  useFocusEffect(useCallback(() => {
    register?.(id, path, JSON.parse(key));
    return () => register?.(id, path, null);
  }, [id, path, key, register]));
}
