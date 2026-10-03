"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { BookOpen, CheckSquare, Compass, Leaf, Monitor, RotateCcw, Smartphone, TrendingUp, UserRound, Users, Wifi, WifiOff } from "lucide-react";
import { AppSurface } from "./app-surface";
import { CoachPanel } from "./coach-panel";
import { CoachMark, IconButton } from "./primitives";
import { contextFor, type Surface } from "./model";
import { usePrototype } from "./use-prototype";
import s from "./prototype.module.css";

const destinations = [
  { name: "Plan", icon: Compass }, { name: "Checklist", icon: CheckSquare },
  { name: "Progress", icon: TrendingUp }, { name: "Community", icon: Users }, { name: "You", icon: UserRound },
] satisfies { name: Surface; icon: typeof Compass }[];

export function CoachExperiencePrototype() {
  const prototype = usePrototype();
  const { state, dispatch, offline, setOffline, reset } = prototype;
  const [phone, setPhone] = useState(false);
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const facts = contextFor(state);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault(); dispatch({ type: "mode", value: state.mode === "minimized" ? "companion" : "minimized" });
      } else if (event.key === "Escape" && state.mode !== "minimized") {
        event.preventDefault(); dispatch({ type: "mode", value: state.mode === "expanded" ? "companion" : "minimized" });
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [state.mode, dispatch]);
  useEffect(() => {
    if (state.mode === "minimized") launcher.current?.focus();
    else if (state.view === "conversation") root.current?.querySelector<HTMLTextAreaElement>("#coach-prototype-message")?.focus({ preventScroll: true });
  }, [state.mode, state.view]);
  useEffect(() => {
    if (!state.notice) return;
    const timer = setTimeout(() => dispatch({ type: "notice", value: "" }), 6000);
    return () => clearTimeout(timer);
  }, [state.notice, dispatch]);
  return <div className={s.prototype} ref={root}>
    <div className={s.prototypeBar}><span><strong>Companion</strong><span>Interaction study · sample data</span></span><div>
      <IconButton label={phone ? "Use desktop layout" : "Preview phone layout"} aria-pressed={phone} onClick={() => setPhone(!phone)}>{phone ? <Monitor size={16} /> : <Smartphone size={16} />}</IconButton>
      <IconButton label={offline ? "Reconnect sample coach" : "Simulate offline"} aria-pressed={offline} onClick={() => setOffline(!offline)}>{offline ? <WifiOff size={16} /> : <Wifi size={16} />}</IconButton>
      <IconButton label="Reset sample experience" onClick={reset}><RotateCcw size={15} /></IconButton>
      <details className={s.exploreGuide}><summary aria-label="How to explore the prototype" title="How to explore"><BookOpen size={15} /></summary><div><strong>Try a continuous conversation.</strong><ol><li>Ask “Make today lighter.” Review and apply the change, then minimize to see your plan.</li><li>Expand, open the Writing room, and switch conversations. Drafts stay with each conversation.</li><li>Open Check-in, record yesterday’s reading, then talk it through.</li><li>Change app destinations or select a session. Open the context bar to see what the coach sees.</li><li>Try phone layout, offline, or Stop. Reset returns to the original sample.</li></ol><p>This is a scripted frontend study. It uses no live coach or planner APIs. Refresh clears sample changes.</p></div></details>
    </div></div>
    <LayoutGroup id="coach-prototype"><div className={s.stage}><div className={s.canvas} data-phone={phone}>
      <header className={s.appHeader}><Link className={s.wordmark} href="/prototype/coach"><Leaf size={19} /><span>goalmaxxing</span></Link><nav aria-label="Sample app destinations">{destinations.map(({ name, icon: Icon }) => <button key={name} aria-current={state.surface === name ? "page" : undefined} onClick={() => dispatch({ type: "surface", value: name })}><Icon size={16} /><span>{name}</span></button>)}</nav><span className={s.avatar}>JL</span></header>
      <AppSurface prototype={prototype} />
      {state.mode === "minimized" ? <motion.button layout layoutId="coach-surface" transition={{ layout: { duration: reduced ? 0 : 0.35 } }} className={s.dock} ref={launcher} onClick={() => dispatch({ type: "mode", value: "companion" })}><CoachMark /><span><strong>Your coach is here.</strong><small>{facts.page} · {facts.today.length - facts.todayDone} left today{Object.keys(prototype.pending).length ? " · thinking" : ""}</small></span><span className={s.dockArrow}>↗</span></motion.button> : <CoachPanel prototype={prototype} />}
      <div className={s.notice} role="status" aria-live="polite" data-visible={Boolean(state.notice)}>{state.notice}</div>
    </div></div></LayoutGroup>
  </div>;
}
