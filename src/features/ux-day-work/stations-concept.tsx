"use client";

import type { CSSProperties, ReactNode } from "react";
import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { FolioCard } from "@/features/ux-day-work/primitives";
import {
  type DayWorkBand,
  timeLabel,
  type DayWorkItem,
} from "@/features/ux-day-work/seed";
import { useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("stations");

const BANDS: Array<{ id: DayWorkBand; label: string; time: string }> = [
  { id: "morning", label: "Morning", time: "Before noon" },
  { id: "midday", label: "Midday", time: "The working stretch" },
  { id: "evening", label: "Evening", time: "After hours" },
  { id: "anytime", label: "Anytime", time: "Unplaced or untimed" },
];

export function StationsConcept() {
  const session = useDayWorkSession("tempo-run");

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
            Replace · walk the day
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Stations on a path, not rows in a queue.
          </h1>
          <p className="mt-4 max-w-xl text-[color:var(--dw-deep)]">
            Timed work sits on the rail. Anytime work is an island, not a
            second-class row. Opening a station unfolds its folio; completing
            fills the mark on the path.
          </p>
          <p className="mt-6 font-mono text-sm text-[color:var(--dw-deep)]">
            {session.remaining} stations still open
          </p>
          <div className="dw-stations mt-8">
            {BANDS.map((band) => {
              const items = session.items.filter((item) => item.band === band.id);
              if (items.length === 0) return null;
              return (
                <section key={band.id} className="mb-2">
                  <p className="mb-3 pl-9 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
                    {band.label}
                    <span className="ml-2 font-normal tracking-normal text-[color:var(--dw-deep)]">
                      {band.time}
                    </span>
                  </p>
                  {items.map((item) => (
                    <Station
                      key={item.id}
                      item={item}
                      open={session.selectedId === item.id}
                      onOpen={() => session.toggleOpen(item.id)}
                      onComplete={() => session.toggleComplete(item.id)}
                    >
                      {session.selectedId === item.id ? (
                        <FolioCard item={item} session={session} />
                      ) : null}
                    </Station>
                  ))}
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}

function Station({
  item,
  open,
  onOpen,
  onComplete,
  children,
}: {
  item: DayWorkItem;
  open: boolean;
  onOpen: () => void;
  onComplete: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="dw-station" style={{ "--goal-color": item.color } as CSSProperties}>
      <button
        type="button"
        className="dw-station-dot"
        data-done={item.completed}
        aria-label={
          item.completed ? `${item.title} complete` : `Mark ${item.title} complete`
        }
        onClick={onComplete}
      />
      <div>
        <button type="button" className="block w-full text-left" onClick={onOpen}>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--dw-muted)]">
            {item.unplaced ? "Needs a day" : timeLabel(item)}
          </p>
          <h2
            className="font-display text-2xl font-semibold tracking-tight"
            style={{ opacity: item.completed ? 0.5 : 1 }}
          >
            {item.title}
          </h2>
        </button>
        {open ? children : null}
      </div>
    </div>
  );
}
