"use client";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCoachCheckIn } from "@cadence/shared/coach/use-check-in";
import type { CoachPage } from "@cadence/shared/coach";
import { getJson, postJson } from "@/lib/api/client";
import { useCoachConversations } from "./use-coach-conversations";
import { useCoachFacts } from "./use-coach-facts";
import { useCheckInOffer } from "@/features/digest/use-check-in-offer";
import { coachPresentation, resolveCoachPage, type CoachPageRegistration, type CoachView } from "./presentation";
import { useCoachActionHistory } from "@cadence/shared/coach/use-action-history";

const checkInClient = { getJson, postJson };
export function useCoachController(userId: string, digestEnabled: boolean) {
  const pathname = usePathname();
  const [presentation, dispatch] = useReducer(coachPresentation, { mode: "closed", view: "conversation" });
  const [registrations, setRegistrations] = useState<CoachPageRegistration[]>([]);
  const page = useMemo(() => resolveCoachPage(pathname, registrations), [pathname, registrations]);
  const conversations = useCoachConversations();
  const activeThread = conversations.bootstrap?.threads.find(thread => thread.id === conversations.threadId) ?? conversations.conversation?.thread;
  const activeTopic = conversations.bootstrap?.topics.find(topic => topic.id === activeThread?.topic_id);
  const facts = useCoachFacts(userId, page);
  const briefing = useCoachCheckIn(checkInClient);
  const history = useCoachActionHistory(checkInClient, presentation.mode !== "closed" && presentation.view === "changes");
  const launcher = useRef<HTMLButtonElement>(null);
  const scrollPositions = useRef(new Map<string, { top: number; height: number; first?: string; last?: string; atBottom: boolean }>());
  const showView = useCallback((view: CoachView) => dispatch({ type: "view", view }), []);
  const offer = useCheckInOffer(digestEnabled);
  const openCheckIn = useCallback(async () => {
    dispatch({ type: "view", view: "check-in" });
    offer.dismiss();
    await briefing.open();
  }, [briefing.open, offer.dismiss]);
  const selectThread = (id: string) => { conversations.setThreadId(id); showView("conversation"); };
  const registerPage = useCallback((id: string, path: string, value: Partial<CoachPage> | null, priority: number) => {
    setRegistrations(old => value ? [...old.filter(entry => entry.id !== id), { id, path, page: value, priority }] : old.filter(entry => entry.id !== id));
  }, []);
  return {
    ...conversations, ...facts, page, activeThread, activeTopic, ...presentation, dispatch, showView, selectThread, registerPage,
    launcher, scrollPositions, history, digestEnabled, offer,
    checkIn: briefing.payload, openCheckIn,
    refreshCheckIn: briefing.refresh, checkInGenerating: briefing.generating, checkInError: briefing.error,
    open: () => dispatch({ type: "mode", mode: "companion" }),
    close: () => dispatch({ type: "mode", mode: "closed" }),
    expand: () => dispatch({ type: "mode", mode: "expanded" }),
    returnToApp: () => dispatch({ type: "mode", mode: "companion" }),
  };
}
