"use client";

import { Check, Minus, Plus, RotateCcw, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ConceptBrief,
  ExplorationChrome,
} from "@/features/ux-first-principles/exploration-chrome";
import {
  CONCEPT_ITEMS,
  CONCEPT_TODAY,
  getFirstPrinciplesConcept,
} from "@/features/ux-first-principles/model";

const concept = getFirstPrinciplesConcept("orbit");
const ORBIT_ITEMS = CONCEPT_ITEMS.filter(
  (item) => item.state !== "complete" && item.id !== "review"
);

const POSITIONS = [
  "left-[7%] top-[20%]",
  "right-[4%] top-[17%]",
  "bottom-[4%] left-[19%]",
] as const;

const TONE: Record<(typeof ORBIT_ITEMS)[number]["tone"], string> = {
  coral: "bg-[#ff7556] text-[#2c0e08]",
  cobalt: "bg-[#80a9ff] text-[#081a3b]",
  gold: "bg-[#f2c45b] text-[#2b2004]",
  mint: "bg-[#7ed7b2] text-[#08281c]",
};

export function OrbitConcept() {
  const [selectedId, setSelectedId] = useState("tempo");
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(["deep-work"])
  );
  const [scale, setScale] = useState<"now" | "week" | "month">("week");
  const [recovered, setRecovered] = useState(false);
  const selected =
    ORBIT_ITEMS.find((item) => item.id === selectedId) ?? ORBIT_ITEMS[0];
  const selectedComplete = completed.has(selected.id);
  const orbitLabel = useMemo(() => {
    if (scale === "now") return "Now · Thursday";
    if (scale === "week") return "Week · Aug 31–Sep 6";
    return "Month · September";
  }, [scale]);

  function changeScale(direction: -1 | 1) {
    const scales = ["now", "week", "month"] as const;
    const next = Math.max(0, Math.min(2, scales.indexOf(scale) + direction));
    setScale(scales[next]);
  }

  function toggleSelectedCompletion() {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(selected.id)) next.delete(selected.id);
      else next.add(selected.id);
      return next;
    });
  }

  return (
    <ExplorationChrome concept={concept}>
      <main className="bg-[#11151c] text-[#f7f1e5]">
        <section className="relative min-h-[calc(100dvh-69px)] overflow-hidden px-4 py-6 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[94rem] items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Goal gravity / {orbitLabel}
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                What has your pull?
              </h1>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/15 p-1">
              <button
                type="button"
                onClick={() => changeScale(-1)}
                disabled={scale === "now"}
                className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-25"
                aria-label="Move closer in time"
              >
                <Plus aria-hidden className="size-4" />
              </button>
              <span className="min-w-14 text-center text-xs font-semibold uppercase tracking-[0.12em]">
                {scale}
              </span>
              <button
                type="button"
                onClick={() => changeScale(1)}
                disabled={scale === "month"}
                className="grid size-11 place-items-center rounded-full hover:bg-white/10 disabled:opacity-25"
                aria-label="Pull back in time"
              >
                <Minus aria-hidden className="size-4" />
              </button>
            </div>
          </div>

          <div className="mx-auto grid max-w-[94rem] gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
            <div className="relative mx-auto aspect-square w-full max-w-[44rem]">
              <div
                className={`absolute rounded-full border border-white/10 transition-all duration-500 ${
                  scale === "now"
                    ? "inset-[22%]"
                    : scale === "week"
                      ? "inset-[10%]"
                      : "inset-[1%]"
                }`}
              />
              <div
                className={`absolute rounded-full border border-dashed border-white/15 transition-all duration-500 ${
                  scale === "now"
                    ? "inset-[34%]"
                    : scale === "week"
                      ? "inset-[23%]"
                      : "inset-[13%]"
                }`}
              />

              <div className="absolute inset-[33%] z-10 grid place-items-center rounded-full border border-white/15 bg-[#171d27] p-3 text-center shadow-[0_0_80px_rgba(255,117,86,0.08)]">
                <button
                  type="button"
                  onClick={toggleSelectedCompletion}
                  className={`grid size-full place-items-center rounded-full border-2 transition ${
                    selectedComplete
                      ? "border-[#7ed7b2] bg-[#7ed7b2] text-[#08281c]"
                      : "border-white/40 hover:border-white"
                  }`}
                  aria-label={
                    selectedComplete
                      ? `Remove completion for ${selected.title}`
                      : `Mark ${selected.title} complete`
                  }
                >
                  <span>
                    {selectedComplete ? (
                      <Check aria-hidden className="mx-auto size-7" />
                    ) : (
                      <span className="block text-[10px] uppercase tracking-[0.18em] opacity-55">
                        Tap to settle
                      </span>
                    )}
                    <span className="mt-1 block text-sm font-semibold sm:text-base">
                      {selected.title}
                    </span>
                  </span>
                </button>
              </div>

              {ORBIT_ITEMS.map((item, index) => {
                const itemComplete = completed.has(item.id);
                const active = selected.id === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    aria-pressed={active}
                    className={`absolute z-20 grid size-[24%] min-h-24 min-w-24 place-items-center rounded-full p-3 text-center transition duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${POSITIONS[index]} ${
                      itemComplete
                        ? "border-2 border-[#7ed7b2] bg-[#15251f] text-[#b7f4d5]"
                        : TONE[item.tone]
                    } ${active ? "scale-105 ring-4 ring-white/25" : ""}`}
                  >
                    <span>
                      <span className="block text-[10px] uppercase tracking-[0.14em] opacity-60">
                        {item.time ?? (recovered && item.id === "strength" ? "Fri 18:00" : "unplaced")}
                      </span>
                      <span className="mt-1 block text-xs font-semibold sm:text-sm">
                        {item.title}
                      </span>
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                className="absolute bottom-[17%] right-[8%] z-20 grid size-[14%] min-h-16 min-w-16 place-items-center rounded-full border border-violet-200/50 bg-violet-300/10 text-violet-100 hover:bg-violet-300/20"
                aria-label="Open Maya’s orbit"
              >
                <span>
                  <Users aria-hidden className="mx-auto size-4" />
                  <span className="mt-1 block text-[10px] font-semibold">Maya</span>
                </span>
              </button>

              <div className="absolute left-1/2 top-1/2 h-px w-[78%] -translate-x-1/2 -rotate-[18deg] bg-white/10" />
              <div className="absolute left-1/2 top-1/2 h-px w-[70%] -translate-x-1/2 rotate-[61deg] bg-white/10" />
            </div>

            <aside className="border-t border-white/15 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                Selected body
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                {selected.title}
              </h2>
              <p className="mt-2 text-sm text-white/55">{selected.detail}</p>
              <p className="mt-7 text-sm leading-relaxed text-white/70">
                The circumference is both state and action. It fills when the
                work settles into history; no checkbox is attached to the item.
              </p>
              {selected.id === "strength" && !recovered ? (
                <button
                  type="button"
                  onClick={() => setRecovered(true)}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-[#f2c45b] text-sm font-semibold text-[#f2c45b]"
                >
                  <RotateCcw aria-hidden className="size-4" />
                  Swing into Friday
                </button>
              ) : null}
              <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-4 text-xs text-white/50">
                <span>{CONCEPT_TODAY.weekProgress} settled</span>
                <span>{CONCEPT_TODAY.partner} nearby</span>
              </div>
            </aside>
          </div>
        </section>
        <ConceptBrief concept={concept}>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/60">
            Orbit tests whether direct spatial manipulation can replace lists
            and destination switching. Exact-date fallback remains mandatory:
            every body would also expose a conventional move menu.
          </p>
        </ConceptBrief>
      </main>
    </ExplorationChrome>
  );
}
