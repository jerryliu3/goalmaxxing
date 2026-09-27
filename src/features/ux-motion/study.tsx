"use client";

import Link from "next/link";
import { useState } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { DailyWork } from "./daily-work";
import { SCENARIOS, type Scenario } from "./seed";
import { TaskCapture } from "./task-capture";
import { MilestoneJourney } from "./milestone-journey";
import "./study.css";

export function MotionProductStudy() {
  const systemStill = useReducedMotion();
  const [forceStill, setForceStill] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("cascade");
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<"daily" | "milestones">("daily");
  const still = forceStill || Boolean(systemStill);

  return <UiStyleProvider initialStyleId="gazetteer"><MotionConfig reducedMotion={still ? "always" : "user"}>
    <main className="motion-study gm-gazetteer min-h-dvh bg-background font-sans text-foreground" data-still={still}>
      <header className="border-b border-border px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link href="/ux" className="inline-flex min-h-11 items-center text-sm">← UX labs</Link>
        <p className="text-xs text-muted-foreground">Motion in context · local sample data · no account writes</p>
      </div></header>
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <h1 className="font-display text-4xl">Make progress tangible.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Try the accepted ideas in a sample day plan and a milestone journey, using the current quest cards and yearly goal library.</p>
        <div className="my-6 flex flex-wrap items-center gap-4 rounded-xl border border-border p-3">
          {view === "daily" && <label className="flex flex-wrap items-center gap-2 text-sm">Sample outcome
            <select aria-label="Sample completion outcome" className="min-h-10 rounded-md border border-input bg-background px-2"
              value={scenario} onChange={event => { const next = SCENARIOS.find(item => item.id === event.target.value); if (next) setScenario(next.id); }}>
              {SCENARIOS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>}
          <label className="inline-flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={forceStill} onChange={event => setForceStill(event.target.checked)} />Still motion</label>
          {systemStill && <span className="text-xs text-muted-foreground">System reduced motion is active.</span>}
          <Button variant="outline" onClick={() => setRevision(value => value + 1)}>Reset sample</Button>
        </div>
        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Motion study journeys">
          <Button variant={view === "daily" ? "default" : "outline"} aria-pressed={view === "daily"} onClick={() => setView("daily")}>Daily work</Button>
          <Button variant={view === "milestones" ? "default" : "outline"} aria-pressed={view === "milestones"} onClick={() => setView("milestones")}>Milestones & library</Button>
        </nav>
        <div hidden={view !== "daily"}>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div key={`${scenario}-${revision}`}><DailyWork scenario={scenario} still={still} /><TaskCapture still={still} /></div>
          <aside className="space-y-5 text-sm text-muted-foreground" aria-label="Prototype placement notes">
            <div><h2 className="mb-1 font-medium text-foreground">Linked parents float into view</h2><p>The source stays in the day plan. Each credited parent appears in turn, including parents that are still unfinished.</p></div>
            <div><h2 className="mb-1 font-medium text-foreground">The clasp belongs in the quest</h2><p>Open the run to see the weekly band beside the existing Tempo card. Meeting a period target never labels the recurring goal achieved.</p></div>
            <div><h2 className="mb-1 font-medium text-foreground">Completion earns a visible reward</h2><p>The source goal gets a deep stamp from above, sparks lift away, and the XP count eases into the bar at the top of the plan.</p></div>
            <div><h2 className="mb-1 font-medium text-foreground">A fresh task slip</h2><p>Enter a task and press Add. The input remains ready while the new row settles into today&apos;s list.</p></div>
          </aside>
        </div>
        </div>
        <div hidden={view !== "milestones"} key={`milestones-${revision}`}><MilestoneJourney still={still} /></div>
      </div>
    </main>
  </MotionConfig></UiStyleProvider>;
}
