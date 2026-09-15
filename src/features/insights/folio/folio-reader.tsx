"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { buildMilestoneNames } from "@/lib/goals/milestones";
import { folioDate, type GoalFolio } from "./folio-model";
import styles from "./folio.module.css";

export function FolioReader({ folio }: { folio: GoalFolio }) {
  const [page, setPage] = useState({ index: 0, direction: 1 });
  const reduceMotion = useReducedMotion();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const entry = folio.entries[page.index];
  const previous = folio.entries[page.index - 1];
  const next = folio.entries[page.index + 1];
  const go = (index: number) => {
    if (index < 0 || index >= folio.entries.length || index === page.index) return;
    setPage({ index, direction: index > page.index ? 1 : -1 });
  };
  const milestones = entry.goal.frequency_type === "fixed_milestones"
    ? buildMilestoneNames(entry.goal.target_count ?? 1, entry.goal.milestone_names)
    : [];

  return (
    <section
      className={styles.reader}
      aria-label="Goal card reader"
      onKeyDown={event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          go(page.index + (event.key === "ArrowRight" ? 1 : -1));
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          go(event.key === "Home" ? 0 : folio.entries.length - 1);
        }
      }}
    >
      <header className={styles.readerHeader}>
        <span>PAST GOALS <span className={styles.readerYear}>{folio.year}</span></span>
        <span className={styles.pageNumber}>GOAL {String(page.index + 1).padStart(2, "0")} / {String(folio.entries.length).padStart(2, "0")}</span>
      </header>
      <div className={styles.spread}>
        <div className={styles.notes}>
          <span className={styles.eyebrow}>A little further than before</span>
          <h2 className={styles.notesTitle}>{entry.goal.title}</h2>
          <span className={styles.status} data-achieved={entry.status === "Completed"}>
            {entry.status === "Completed" ? <Check size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />}
            {entry.status} · {folioDate(entry.closedOn)}
          </span>
          {entry.goal.description && <p className={styles.description}>{entry.goal.description}</p>}
          <dl className={styles.stats}>
            <div><dt>Completions</dt><dd>{entry.progress.admissibleCompletionCount.toLocaleString()}</dd></div>
            <div><dt>Longest streak</dt><dd>{entry.progress.longestStreak.toLocaleString()} <small>{entry.goal.recurrence_interval === "weekly" ? "weeks" : entry.goal.recurrence_interval === "monthly" ? "months" : "days"}</small></dd></div>
          </dl>
          {milestones.length > 0 && <div className={styles.milestones}>
            <h3 className={styles.eyebrow}>Milestones</h3>
            <ol>{milestones.map((name, index) => <li key={index}>
              <span>{entry.progress.milestoneDates[index] ? <Check size={13} aria-label="Completed" /> : <span aria-hidden="true">○</span>}{name}</span>
              {entry.progress.milestoneDates[index] && <time dateTime={entry.progress.milestoneDates[index]}>{folioDate(entry.progress.milestoneDates[index])}</time>}
            </li>)}</ol>
          </div>}
          <p className={styles.began}>Started {folioDate(entry.goal.start_date)}</p>
        </div>
        <div className={styles.cardStage}
          onPointerDown={event => {
            if (event.pointerType === "mouse") return;
            pointerStart.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerCancel={() => { pointerStart.current = null; }}
          onPointerUp={event => {
            const start = pointerStart.current;
            pointerStart.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.3) go(page.index + (dx < 0 ? 1 : -1));
          }}
        >
          <div className={styles.cardStack} aria-hidden="true" />
          <AnimatePresence initial={false} mode="popLayout" custom={page.direction}>
            <motion.div
              key={entry.goal.id}
              className={styles.cardLeaf}
              custom={page.direction}
              variants={{
                enter: (direction: number) => ({ x: reduceMotion ? 0 : direction * 72, rotateY: reduceMotion ? 0 : direction * 24, opacity: reduceMotion ? 1 : 0 }),
                center: { x: 0, rotateY: 0, opacity: 1 },
                exit: (direction: number) => ({ x: reduceMotion ? 0 : direction * -90, rotateY: reduceMotion ? 0 : direction * -35, opacity: reduceMotion ? 1 : 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <TempoGoalCard fields={entry.fields} context="history" achieved={entry.status === "Completed"} />
            </motion.div>
          </AnimatePresence>
          <div className={styles.openingCover} aria-hidden="true"><span>{folio.year}</span><small>YEAR IN GOALS</small></div>
        </div>
      </div>
      <footer className={styles.readerFooter}>
        <Button variant="ghost" className={styles.turnButton} disabled={!previous} onClick={() => go(page.index - 1)} aria-label="Previous goal"><ArrowLeft size={18} /><span>Previous<small>{previous?.goal.title ?? "First goal"}</small></span></Button>
        <p aria-live="polite" aria-atomic="true" className={styles.position}>{page.index + 1} <span>of {folio.entries.length}</span><span className="sr-only"> · {entry.goal.title}</span></p>
        <Button variant="ghost" className={styles.turnButton} disabled={!next} onClick={() => go(page.index + 1)} aria-label="Next goal"><span>Next<small>{next?.goal.title ?? "Last goal"}</small></span><ArrowRight size={18} /></Button>
      </footer>
      <p className={styles.readerHint}>Swipe or use ← → to move between goals</p>
    </section>
  );
}
