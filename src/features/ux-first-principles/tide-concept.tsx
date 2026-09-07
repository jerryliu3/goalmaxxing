"use client";

import { ArrowRight, CalendarRange, RotateCcw, Waves } from "lucide-react";
import { useState } from "react";
import {
  ConceptBrief,
  ExplorationChrome,
} from "@/features/ux-first-principles/exploration-chrome";
import {
  CONCEPT_ITEMS,
  CONCEPT_TODAY,
  getFirstPrinciplesConcept,
} from "@/features/ux-first-principles/model";

const concept = getFirstPrinciplesConcept("tide");
type TideScale = "day" | "week" | "month";

const BLOCK_STYLE = {
  tempo: "bg-[#ff846b] text-[#3d130c]",
  launch: "bg-[#85a9ff] text-[#0a1c3d]",
  review: "bg-[#f4cb70] text-[#332304]",
  strength: "bg-[#75cdb1] text-[#08281f]",
} as const;

const SCALE = {
  day: {
    kicker: `Live current / ${CONCEPT_TODAY.shortDate}`,
    headline: "Let the day move.",
    axis: "Hours",
    ticks: [
      { label: "06:00", top: 5 },
      { label: "08:00", top: 20 },
      { label: "10:00", top: 35 },
      { label: "12:00", top: 50 },
      { label: "14:00", top: 65 },
      { label: "16:00", top: 80 },
      { label: "18:00", top: 92 },
    ],
    now: { top: 36, label: "now 10:42" },
    recover: "Place Strength at 18:00",
  },
  week: {
    kicker: "Live current / Aug 31–Sep 6",
    headline: "Let the week move.",
    axis: "Days",
    ticks: [
      { label: "Mon 31", top: 6 },
      { label: "Tue 1", top: 20 },
      { label: "Wed 2", top: 34 },
      { label: "Thu 3", top: 48 },
      { label: "Fri 4", top: 62 },
      { label: "Sat 5", top: 76 },
      { label: "Sun 6", top: 90 },
    ],
    now: { top: 48, label: "now Thu" },
    recover: "Place Strength on Friday",
  },
  month: {
    kicker: "Live current / September",
    headline: "Let the month move.",
    axis: "Dates",
    ticks: [
      { label: "Sep 1", top: 6 },
      { label: "Sep 8", top: 24 },
      { label: "Sep 15", top: 42 },
      { label: "Sep 22", top: 60 },
      { label: "Sep 29", top: 78 },
    ],
    now: { top: 12, label: "now 3" },
    recover: "Place Strength on Sep 4",
  },
} as const;

function itemTop(
  id: string,
  scale: TideScale,
  strengthPlaced: boolean
): { top: number; eddy: boolean } {
  if (id === "review") {
    if (scale === "day") return { top: 67, eddy: true };
    if (scale === "week") return { top: 54, eddy: true };
    return { top: 18, eddy: true };
  }
  if (id === "strength") {
    if (strengthPlaced) {
      if (scale === "day") return { top: 81, eddy: false };
      if (scale === "week") return { top: 62, eddy: false };
      return { top: 15, eddy: false };
    }
    if (scale === "day") return { top: 88, eddy: true };
    if (scale === "week") return { top: 20, eddy: true };
    return { top: 6, eddy: true };
  }
  if (id === "tempo") {
    if (scale === "day") return { top: 10, eddy: false };
    if (scale === "week") return { top: 44, eddy: false };
    return { top: 10, eddy: false };
  }
  if (scale === "day") return { top: 40, eddy: false };
  if (scale === "week") return { top: 50, eddy: false };
  return { top: 14, eddy: false };
}

export function TideConcept() {
  const [scale, setScale] = useState<TideScale>("day");
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(["deep-work"])
  );
  const [strengthPlaced, setStrengthPlaced] = useState(false);
  const view = SCALE[scale];
  const activeItems = CONCEPT_ITEMS.filter(
    (item) => item.id !== "deep-work" && !completed.has(item.id)
  );
  const landedItems = CONCEPT_ITEMS.filter((item) => completed.has(item.id));

  function completeItem(id: string) {
    setCompleted((current) => new Set(current).add(id));
  }

  return (
    <ExplorationChrome concept={concept}>
      <main className="bg-[#d8f2ed] text-[#123a37]">
        <section className="min-h-[calc(100dvh-69px)] px-4 py-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[94rem]">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#123a37]/20 pb-6">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#123a37]/55">
                  <Waves aria-hidden className="size-4" />
                  {view.kicker}
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
                  {view.headline}
                </h1>
              </div>
              <div
                className="flex items-center gap-1 border border-[#123a37]/25 bg-white/25 p-1"
                role="group"
                aria-label="Time scale"
              >
                {(["day", "week", "month"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setScale(item)}
                    aria-pressed={scale === item}
                    className={`min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      scale === item
                        ? "bg-[#123a37] text-[#d8f2ed]"
                        : "hover:bg-white/40"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <section aria-label={`${scale} time current`}>
                <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_5rem] gap-x-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#123a37]/50 sm:grid-cols-[4.5rem_minmax(0,1fr)_9rem]">
                  <span>{view.axis}</span>
                  <span>In motion</span>
                  <span>Shore</span>
                </div>
                <div className="relative mt-3 min-h-[37rem] overflow-hidden border-y border-[#123a37]/25 bg-white/20">
                  <div className="pointer-events-none absolute inset-y-0 right-[5.75rem] border-l-2 border-[#123a37]/30 sm:right-[10rem]" />
                  {view.ticks.map((tick) => (
                    <div
                      key={tick.label}
                      className="absolute inset-x-0 border-t border-[#123a37]/12"
                      style={{ top: `${tick.top}%` }}
                    >
                      <span className="absolute left-2 top-1 text-[10px] text-[#123a37]/45">
                        {tick.label}
                      </span>
                    </div>
                  ))}
                  <div
                    className="absolute inset-x-0 z-10 flex items-center gap-2"
                    style={{ top: `${view.now.top}%` }}
                  >
                    <span className="h-px flex-1 bg-[#d95034]" />
                    <span className="bg-[#d8f2ed] px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a72f1a]">
                      {view.now.label}
                    </span>
                  </div>

                  {activeItems.map((item) => {
                    const placement = itemTop(
                      item.id,
                      scale,
                      strengthPlaced
                    );
                    return (
                      <div
                        key={item.id}
                        className={`absolute left-[4.5rem] right-[6.5rem] z-20 flex min-h-20 items-stretch border border-[#123a37]/25 transition-[top] duration-500 sm:left-[6rem] sm:right-[11rem] ${
                          BLOCK_STYLE[item.id as keyof typeof BLOCK_STYLE]
                        } ${placement.eddy ? "border-dashed opacity-75" : ""}`}
                        style={{ top: `${placement.top}%` }}
                      >
                        <button
                          type="button"
                          onClick={() => completeItem(item.id)}
                          className="flex min-w-0 flex-1 items-center justify-between gap-3 p-3 text-left hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                          aria-label={`Sweep ${item.title} complete`}
                        >
                          <span>
                            <span className="block text-[10px] uppercase tracking-[0.14em] opacity-60">
                              {scaleLabel(item.id, scale, strengthPlaced, item.time)}
                            </span>
                            <span className="mt-1 block text-sm font-semibold">
                              {item.title}
                            </span>
                          </span>
                          <ArrowRight aria-hidden className="size-5 shrink-0" />
                        </button>
                      </div>
                    );
                  })}

                  <div className="absolute inset-y-0 right-2 z-20 flex w-[4.5rem] flex-col justify-start gap-2 py-4 sm:right-4 sm:w-[8rem]">
                    {landedItems.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() =>
                          setCompleted((current) => {
                            const next = new Set(current);
                            next.delete(item.id);
                            return next;
                          })
                        }
                        className="min-h-16 border border-[#123a37]/20 bg-[#123a37] px-2 py-3 text-left text-[#d8f2ed]"
                        aria-label={`Return ${item.title} to current`}
                      >
                        <span className="block text-[9px] uppercase tracking-[0.14em] opacity-55">
                          landed
                        </span>
                        <span className="mt-1 block truncate text-xs font-semibold">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#123a37]/55">
                  Day, week, and month are the same current at different
                  scales. Tap or sweep right to complete.
                </p>
              </section>

              <aside className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#123a37]/50">
                    Weather upstream
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                    {activeItems.length} still moving
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#123a37]/65">
                    The interface predicts no failure. Unplanned work waits in
                    an eddy until you give it a current.
                  </p>
                </div>
                {!strengthPlaced && !completed.has("strength") ? (
                  <button
                    type="button"
                    onClick={() => setStrengthPlaced(true)}
                    className="flex min-h-12 w-full items-center justify-between border border-[#123a37]/30 bg-[#75cdb1] px-4 text-left text-sm font-semibold"
                  >
                    {view.recover}
                    <RotateCcw aria-hidden className="size-4" />
                  </button>
                ) : null}
                <div className="border-t border-[#123a37]/20 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#123a37]/50">
                    Nearby current
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-[#6b5dc6] text-xs font-bold text-white">
                      M
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{CONCEPT_TODAY.partner}</p>
                      <p className="text-xs text-[#123a37]/55">
                        Yoga landed at 08:12
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScale("week")}
                  className="flex min-h-11 items-center gap-2 text-sm font-semibold"
                >
                  <CalendarRange aria-hidden className="size-4" />
                  Scrub to Friday
                </button>
              </aside>
            </div>
          </div>
        </section>
        <ConceptBrief concept={concept}>
          <p className="mt-4 max-w-2xl leading-relaxed text-[#123a37]/65">
            Tide removes the boundary between calendar and checklist. The
            calendar is a scaleable time current; completion is crossing a
            threshold, and social presence is a neighboring current rather
            than a feed.
          </p>
        </ConceptBrief>
      </main>
    </ExplorationChrome>
  );
}

function scaleLabel(
  id: string,
  scale: TideScale,
  strengthPlaced: boolean,
  time: string | null
) {
  if (id === "strength") {
    if (strengthPlaced) {
      if (scale === "day") return "18:00";
      if (scale === "week") return "Fri 4";
      return "Sep 4";
    }
    if (scale === "day") return "unplanned";
    if (scale === "week") return "missed Tue";
    return "missed Sep 1";
  }
  if (id === "review") return "unplanned";
  if (scale === "day") return time ?? "unplanned";
  if (scale === "week") return `Thu 3 · ${time}`;
  return `Sep 3 · ${time}`;
}
