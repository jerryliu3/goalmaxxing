"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { ConceptBrief, DayWorkChrome } from "@/features/ux-day-work/chrome";
import { getDayWorkConcept } from "@/features/ux-day-work/model";
import { DayShell, WorkRow } from "@/features/ux-day-work/primitives";
import { currentInstance, timeLabel, type DayWorkItem } from "@/features/ux-day-work/seed";
import { type DayWorkSession, useDayWorkSession } from "@/features/ux-day-work/session";
import "@/features/ux-day-work/day-work.css";

const concept = getDayWorkConcept("now");

export function NowConcept() {
  const session = useDayWorkSession("tempo-run");

  return (
    <DayWorkChrome concept={concept}>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
            Live control · not a proposal
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Title, date, time. A form under the row.
          </h1>
          <p className="mt-4 max-w-xl text-[color:var(--dw-deep)]">
            This is the current Checklist unfold, restaged with the study’s day.
            Cadence and deadline are not here. The fields are the view.
          </p>
          <div className="mt-8">
            <DayShell remaining={session.remaining}>
              {session.items.map((item) => (
                <WorkRow
                  key={item.id}
                  item={item}
                  open={session.selectedId === item.id}
                  onOpen={() => session.toggleOpen(item.id)}
                  onComplete={() => session.toggleComplete(item.id)}
                >
                  {session.selectedId === item.id ? <NowEditor item={item} session={session} /> : null}
                </WorkRow>
              ))}
            </DayShell>
          </div>
        </div>
      </main>
      <ConceptBrief concept={concept} />
    </DayWorkChrome>
  );
}

function NowEditor({
  item,
  session,
}: {
  item: DayWorkItem;
  session: DayWorkSession;
}) {
  const instance = currentInstance(item);
  return (
    <section className="dw-now-panel" aria-label="Edit planned session">
      <div className="mb-3 flex items-center justify-center gap-1">
        <NavIcon
          label="First sitting"
          disabled={item.instanceIndex === 0}
          onClick={() => session.jumpInstance(item.id, "first")}
        >
          <ChevronsLeft className="size-4" />
        </NavIcon>
        <NavIcon
          label="Previous sitting"
          disabled={!session.canShift(item, -1)}
          onClick={() => session.shiftInstance(item.id, -1)}
        >
          <ChevronLeft className="size-4" />
        </NavIcon>
        <h3 className="mx-1 min-w-0 text-center text-sm font-medium">
          {item.title}
          {item.time ? ` · ${timeLabel(item)}` : ""}
        </h3>
        <NavIcon
          label="Next sitting"
          disabled={!session.canShift(item, 1)}
          onClick={() => session.shiftInstance(item.id, 1)}
        >
          <ChevronRight className="size-4" />
        </NavIcon>
        <NavIcon
          label="Last sitting"
          disabled={item.instanceIndex === item.instances.length - 1}
          onClick={() => session.jumpInstance(item.id, "last")}
        >
          <ChevronsRight className="size-4" />
        </NavIcon>
      </div>
      <div className="space-y-2">
        <label>
          Title
          <input
            value={item.title}
            onChange={(event) => session.updateItem(item.id, { title: event.target.value })}
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={instance.date}
            onChange={(event) => session.applyFact(item.id, "date", event.target.value)}
          />
        </label>
        <label>
          Time
          <input
            type="time"
            value={item.time ?? ""}
            onChange={(event) =>
              session.applyFact(item.id, "time", event.target.value || null)
            }
          />
        </label>
        <p className="text-[11px] text-[color:var(--dw-muted)]">
          Drag month-cell session pills to move quickly, or use this date/time editor
          as a keyboard-friendly fallback.
        </p>
        <p className="text-[11px] text-[color:var(--dw-muted)]">
          Effective local time: {item.time ?? "date only"}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="rounded-md border border-[color:var(--dw-rule)] px-2 py-1 text-xs">
            Edit goal
          </span>
          <button
            type="button"
            className="rounded-md border border-[color:var(--dw-rule)] px-2 py-1 text-xs"
            onClick={() => session.applyFact(item.id, "lock", "toggle")}
          >
            {item.locked ? "Unlock" : "Lock"}
          </button>
        </div>
      </div>
    </section>
  );
}

function NavIcon({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md border border-[color:var(--dw-rule)] text-[color:var(--dw-muted)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
