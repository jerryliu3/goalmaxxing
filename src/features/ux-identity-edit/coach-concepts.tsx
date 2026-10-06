"use client";

import { CornerDownLeft } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { tabChromeClasses, tabGridClass } from "@/components/navigation/tab-chrome";
import { APP_TABS } from "@/components/navigation/tabs";
import { CoachMark } from "@/features/coach/coach-mark";
import { cn } from "@/lib/utils";

export type CoachOption = "pill" | "joined" | "ask" | "tab" | "nest";

export const COACH_OPTIONS: { id: CoachOption; name: string; pitch: string }[] = [
  { id: "pill", name: "Baseline · Coach pill", pitch: "Today’s separate button, sized to the identity. The extra control we’re trying to remove." },
  { id: "joined", name: "1 · Joined", pitch: "Coach becomes the leading segment of the identity: one pill for you and your companion. Each half keeps its own action." },
  { id: "ask", name: "2 · Ask field", pitch: "A quiet “Ask your coach…” field. Enter opens the pane with the question already sent. It announces a ready check-in in place of its placeholder. On phone it shrinks to the mark." },
  { id: "tab", name: "3 · Coach tab", pitch: "Coach sits at the end of the destinations, set apart by a rule. It opens the pane instead of navigating, and stays selected while the pane is open. On phone it is the fifth bottom-bar item." },
  { id: "nest", name: "4 · Nest mark", pitch: "The three-circle mark becomes the logo beside the wordmark and the way to your coach. It breathes when a check-in is ready." },
];

/** Shared coach state for one frame: open toggles the (unshown) pane; ready shows the invitation. */
export interface CoachState {
  open: boolean;
  toggle: () => void;
  ready: boolean;
  dismiss: () => void;
  asked: string | null;
  ask: (question: string) => void;
}

export function useCoachState(ready: boolean): CoachState {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);
  return {
    open,
    toggle: () => setOpen((value) => !value),
    ready: ready && !dismissed && !open,
    dismiss: () => setDismissed(true),
    asked,
    ask: (question) => {
      setAsked(question);
      setOpen(true);
    },
  };
}

/** The check-in invitation, anchored under whichever coach entry the option uses. */
export function Invitation({ coach, align = "right" }: { coach: CoachState; align?: "left" | "right" | "center" }) {
  if (!coach.ready) return null;
  return (
    <aside className="ie-invitation" data-align={align} aria-label="Check-in invitation">
      <p>Your weekly check-in is ready.</p>
      <div>
        <button type="button" onClick={coach.toggle}>Open</button>
        <button type="button" onClick={coach.dismiss}>Skip</button>
      </div>
    </aside>
  );
}

function OpenNote({ coach }: { coach: CoachState }) {
  if (!coach.open) return null;
  return (
    <span className="ie-open-note" role="status">
      Pane open{coach.asked ? ` · “${coach.asked}”` : ""}
    </span>
  );
}

export function CoachPill({ coach }: { coach: CoachState }) {
  return (
    <span className="ie-anchor">
      <button type="button" className="ie-coach" aria-expanded={coach.open} onClick={coach.toggle}>
        <CoachMark small />
        <span className="ie-coach-label">Coach</span>
        {coach.ready && <i className="ie-coach-dot" aria-label="Check-in ready" />}
      </button>
      <Invitation coach={coach} />
      <OpenNote coach={coach} />
    </span>
  );
}

/** Joined: the coach segment leads, the identity (account menu) follows, one shared outline. */
export function JoinedCoach({ coach, identity }: { coach: CoachState; identity: ReactNode }) {
  return (
    <span className="ie-anchor">
      <span className="ie-joined">
        <button type="button" className="ie-joined-coach" aria-label="Open your coach" aria-expanded={coach.open} onClick={coach.toggle}>
          <CoachMark small />
          {coach.ready && <i className="ie-coach-dot" aria-label="Check-in ready" />}
        </button>
        {identity}
      </span>
      <Invitation coach={coach} />
      <OpenNote coach={coach} />
    </span>
  );
}

/** `compact` starts as the mark and expands over the tabs while in use (no room beside Capsule). */
export function AskField({ coach, compact = false }: { coach: CoachState; compact?: boolean }) {
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(!compact);
  const input = useRef<HTMLInputElement>(null);
  return (
    <span className="ie-anchor ie-ask-anchor" data-compact={compact}>
      <form
        className="ie-ask"
        data-ready={coach.ready}
        data-expanded={expanded}
        onBlur={(event) => {
          if (compact && !event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) coach.ask(value.trim());
          else coach.toggle();
          setValue("");
          if (compact) setExpanded(false);
        }}
      >
        <button
          type="button"
          className="ie-ask-mark"
          aria-label="Open your coach"
          aria-expanded={coach.open}
          onClick={() => {
            if (!expanded) {
              setExpanded(true);
              requestAnimationFrame(() => input.current?.focus());
            } else coach.toggle();
          }}
        >
          <CoachMark small />
          {coach.ready && <i className="ie-coach-dot" aria-label="Check-in ready" />}
        </button>
        {expanded && (
          <>
            <input
              ref={input}
              aria-label="Ask your coach"
              placeholder={coach.ready ? "Check-in ready · press Enter" : "Ask your coach…"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && compact && setExpanded(false)}
            />
            <kbd>{value ? <CornerDownLeft size={12} /> : "⌘K"}</kbd>
          </>
        )}
      </form>
      <OpenNote coach={coach} />
    </span>
  );
}

export function NestMark({ coach }: { coach: CoachState }) {
  return (
    <span className="ie-anchor">
      <button type="button" className="ie-nest" data-ready={coach.ready} aria-label="Open your coach" aria-expanded={coach.open} onClick={coach.toggle}>
        <CoachMark />
      </button>
      <Invitation coach={coach} align="left" />
      <OpenNote coach={coach} />
    </span>
  );
}

/**
 * Production tab chrome (desktop row or phone bar) built from the same recipe as
 * `TabNav`, so a Coach item can sit at the end. Agenda stands in as the current page.
 */
export function LabTabs({ mobile = false, coach }: { mobile?: boolean; coach?: CoachState }) {
  const { style } = useUiStyle();
  const count = APP_TABS.length + (coach ? 1 : 0);
  const chrome = tabChromeClasses(style.tabChrome, mobile, tabGridClass(count, { fitLabels: mobile }));
  return (
    <nav className={chrome.nav} aria-label="Main navigation">
      <ul className={chrome.list}>
        {APP_TABS.map((tab, index) => {
          const Icon = tab.icon;
          const active = index === 0 && !coach?.open;
          return (
            <li key={tab.key} className="relative">
              <button type="button" className={cn(chrome.link, active ? chrome.linkActive : chrome.linkIdle)} aria-current={active ? "page" : undefined}>
                {active && <span aria-hidden="true" className={chrome.highlight} />}
                <Icon className="size-5" />
                <span>{tab.label}</span>
              </button>
            </li>
          );
        })}
        {coach && (
          <li className={cn("relative", !mobile && "ie-tab-coach")}>
            <button type="button" className={cn(chrome.link, coach.open ? chrome.linkActive : chrome.linkIdle)} aria-expanded={coach.open} onClick={coach.toggle}>
              {coach.open && <span aria-hidden="true" className={chrome.highlight} />}
              <span className="ie-tab-mark"><CoachMark small />{coach.ready && <i className="ie-coach-dot" aria-label="Check-in ready" />}</span>
              <span>Coach</span>
            </button>
            {!mobile && <Invitation coach={coach} align="center" />}
          </li>
        )}
      </ul>
    </nav>
  );
}
