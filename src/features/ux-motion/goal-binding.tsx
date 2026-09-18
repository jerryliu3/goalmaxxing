"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { FolioBook } from "@/features/insights/folio/folio-book";
import { FolioShelf } from "@/features/insights/folio/folio-shelf";
import type { GoalFolio } from "@/features/insights/folio/folio-model";
import { PORTFOLIO_GOAL } from "./milestone-model";

export type BindingPhase = "idle" | "gather" | "bind" | "shelved";

export function GoalBinding({ folios, phase, onSkip }: {
  folios: GoalFolio[];
  phase: BindingPhase;
  onSkip: () => void;
}) {
  const active = phase === "gather" || phase === "bind";
  const year = folios[0];
  return <section className="motion-study-library" aria-labelledby="motion-library-heading">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id="motion-library-heading" className="font-display text-3xl">Your goal library</h2>
      <span className="text-xs text-muted-foreground">A volume for each year</span>
    </div>
    <p className="mt-2 text-sm text-muted-foreground" role="status">
      {phase === "gather" ? "Goal achieved. Gathering this chapter…" : phase === "bind" ? `Binding the finished goal into ${year.year}…`
        : phase === "shelved" ? `Added to ${year.year}. Open the volume to revisit your portfolio.` : "Finish the portfolio to add its chapter to the existing volume."}
    </p>
    <div className="motion-study-library-stage">
      {active ? <>
        <div className="motion-study-binding-volume" aria-hidden="true" style={{ "--folio-cloth": "#344f45" } as CSSProperties}>
          {[2, 1, 0].map(index => <motion.div key={index} className="motion-study-binding-page"
            initial={{ x: -70 - index * 12, y: 10 + index * 9, rotate: -8 + index * 6 }}
            animate={{ x: index * 2, y: index * 2, rotate: 0 }} transition={{ duration: 0.6, delay: index * 0.06 }}>
            {index === 0 && <><span className="font-mono text-xs uppercase tracking-wider">A completed chapter</span><h3 className="mt-6 font-display text-3xl">{PORTFOLIO_GOAL.title}</h3><p className="mt-5 text-sm">3 milestones · September 18</p><hr className="my-5 border-border" /><p className="text-sm text-muted-foreground">Outline<br />First draft<br />Publish</p></>}
          </motion.div>)}
          {phase === "bind" && <motion.div className="motion-study-binding-cover"
            initial={{ rotateY: -100, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 0.8, 0.2, 1] }}><FolioBook folio={year} /></motion.div>}
        </div>
        <button type="button" onClick={onSkip} className="mx-auto block min-h-11 text-sm underline">Skip to library</button>
      </> : <FolioShelf folios={folios} />}
    </div>
  </section>;
}
