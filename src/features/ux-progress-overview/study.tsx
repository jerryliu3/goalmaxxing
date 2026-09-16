"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FolioShelf } from "@/features/insights/folio/folio-shelf";
import { ProgressHistory, initialHistory } from "./history";
import { parseOverviewView, viewHref, type OverviewView } from "./model";
import { ProgressOverview } from "./overview";
import { ProgressPatterns } from "./patterns";
import { FOLIOS } from "./seed";

const TITLES: Record<OverviewView, string> = { overview: "Progress", history: "Completion history", patterns: "Patterns & totals", folios: "Your goal library" };

export function ProgressOverviewStudy() {
  const view = parseOverviewView(useSearchParams().get("view"));
  const [weekOpen, setWeekOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [history, setHistory] = useState(initialHistory);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  const returnPoint = useRef<{ id: string; scrollY: number } | null>(null);

  useEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    const frame = requestAnimationFrame(() => {
      if (view === "overview" && returnPoint.current) {
        document.getElementById(returnPoint.current.id)?.focus({ preventScroll: true });
        window.scrollTo({ top: returnPoint.current.scrollY, behavior: "auto" });
      } else {
        heading.current?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [view]);

  function detailLink(target: OverviewView, label: string) {
    const id = `overview-open-${target}`;
    return <Link id={id} href={viewHref(target)} scroll={false}
      onClick={() => { returnPoint.current = { id, scrollY: window.scrollY }; }}
      className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">{label} →</Link>;
  }

  return (
    <main className="min-h-dvh bg-background font-sans text-foreground">
      <header className="border-b border-border px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"><Link href="/ux" className="text-sm font-medium">← UX labs</Link><p className="text-xs text-muted-foreground">Section overview · concept B · sample data</p></div></header>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        {view !== "overview" && <Link href={viewHref("overview")} scroll={false} className="mb-5 inline-flex min-h-11 items-center text-sm text-primary">← Back to Progress</Link>}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Your effort, over time</p><h1 ref={heading} tabIndex={-1} className="font-display text-4xl tracking-tight outline-none">{TITLES[view]}</h1></div><p className="text-xs text-muted-foreground">Sample snapshot · September 16, 2026</p></div>
        {view === "overview" ? <ProgressOverview
          weekOpen={weekOpen} achievementsOpen={achievementsOpen}
          onWeekToggle={() => setWeekOpen(open => !open)} onAchievementsToggle={() => setAchievementsOpen(open => !open)}
          historyLink={detailLink("history", "Open full history")} patternsLink={detailLink("patterns", "Explore patterns")}
          foliosLink={detailLink("folios", "Open goal library")}
        /> : view === "history" ? <ProgressHistory state={history} onChange={setHistory} />
          : view === "patterns" ? <ProgressPatterns />
            : <><p className="text-sm text-muted-foreground">A volume for each year. Open one to revisit its goals.</p><FolioShelf folios={FOLIOS} /></>}
      </div>
    </main>
  );
}
