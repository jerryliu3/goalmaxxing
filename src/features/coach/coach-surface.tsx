"use client";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Maximize2, Minimize2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "./coach-mark";
import { CoachContext } from "./coach-context";
import { CoachConversation } from "./coach-conversation";
import { CoachRooms, CoachRoomNavigation } from "./coach-rooms";
import { CoachUnderstanding } from "./coach-understanding";
import { CoachCheckInContent } from "./coach-check-in";
import { CoachChanges } from "./coach-changes";
import { useCoach } from "./coach-provider";
import type { CoachView } from "./presentation";
import s from "./coach.module.css";

const views: { id: CoachView; label: string }[] = [
  { id: "conversation", label: "Conversation" }, { id: "rooms", label: "Rooms" },
  { id: "check-in", label: "Check-in" }, { id: "understanding", label: "Understanding" }, { id: "changes", label: "Changes" },
];
export function CoachSurface() {
  const coach = useCoach();
  const panel = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const mode = coach?.mode ?? "closed";
  const view = coach?.view;
  const dispatch = coach?.dispatch;
  const launcher = coach?.launcher;
  const threadId = coach?.conversation?.thread.id;
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!dispatch) return;
    const keys = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault(); dispatch({ type: "mode", mode: mode === "closed" ? "companion" : "closed" });
      } else if (event.key === "Escape" && mode !== "closed" && !event.defaultPrevented) {
        event.preventDefault(); dispatch({ type: "mode", mode: mode === "expanded" ? "companion" : "closed" });
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [mode, dispatch]);
  useEffect(() => {
    if (mode === "closed") return;
    const element = panel.current;
    const header = document.querySelector<HTMLElement>("[data-coach-anchor]");
    const measure = () => element?.style.setProperty("--coach-top", `${Math.max(12, (header?.getBoundingClientRect().bottom ?? 84) + 12)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    window.addEventListener("resize", measure); window.addEventListener("scroll", measure, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure); };
  }, [mode]);
  useEffect(() => {
    if (mode === "closed") {
      if (wasOpen.current) launcher?.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const input = panel.current?.querySelector<HTMLTextAreaElement>("#coach-message");
    if (view === "conversation" && input && !input.disabled) input.focus({ preventScroll: true });
    else panel.current?.focus({ preventScroll: true });
  }, [mode, view, launcher, threadId]);
  if (!coach) return null;
  const topic = coach.activeTopic;
  return <motion.section id="coach-surface" ref={panel} layout transition={{ layout: { duration: reduced ? 0 : .3 } }} hidden={mode === "closed"} data-mode={mode} className={s.surface} tabIndex={-1} aria-label="Coach companion">
    <header className={s.surfaceHeader}><div className={s.identity}><CoachMark small /><strong>Coach</strong></div><div className={s.buttons}>
      <Button size="icon-sm" variant="ghost" aria-label={mode === "expanded" ? "Return to companion" : "Expand into rooms"} onClick={() => mode === "expanded" ? coach.returnToApp() : coach.expand()}>{mode === "expanded" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</Button>
      <Button size="icon-sm" variant="ghost" aria-label="Minimize coach" onClick={coach.close}><Minus size={17} /></Button>
    </div></header>
    <CoachContext />
    <nav className={s.tabs} aria-label="Coach views">{views.filter(tab => tab.id !== "check-in" || coach.digestEnabled).map(tab => <button key={tab.id} aria-current={view === tab.id ? "page" : undefined} onClick={() => tab.id === "check-in" ? void coach.openCheckIn() : coach.showView(tab.id)}>{tab.label}</button>)}</nav>
    <div className={s.surfaceBody}>
      {mode === "expanded" && <CoachRoomNavigation />}
      <div className={s.surfaceMain}>
        {coach.error && <div className={s.error} role="alert"><p>{coach.error}</p><Button variant="ghost" size="sm" onClick={() => void coach.reload().then(() => coach.setError(null)).catch(error => coach.setError(error.message))}>Reload</Button><Button variant="ghost" size="sm" onClick={() => coach.setError(null)}>Dismiss</Button></div>}
        <div className={s.view} hidden={view !== "conversation"}><CoachConversation /></div>
        <div className={s.view} hidden={view !== "rooms"}>{view === "rooms" && <CoachRooms />}</div>
        <div className={s.view} hidden={view !== "understanding"}>{view === "understanding" && <CoachUnderstanding key={topic?.id} />}</div>
        <div className={s.view} hidden={view !== "check-in"}>{view === "check-in" && <CoachCheckInContent />}</div>
        <div className={s.view} hidden={view !== "changes"}>{view === "changes" && <CoachChanges />}</div>
      </div>
      {mode === "expanded" && view === "conversation" && <aside className={s.understandingPane}><CoachUnderstanding key={topic?.id} compact /></aside>}
    </div>
  </motion.section>;
}
