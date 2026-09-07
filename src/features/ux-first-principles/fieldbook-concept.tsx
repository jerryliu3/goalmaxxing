"use client";

import { ArrowRight, RotateCcw, Stamp } from "lucide-react";
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

const concept = getFirstPrinciplesConcept("fieldbook");
type Page = "now" | "plan" | "people" | "log";

export function FieldbookConcept() {
  const [page, setPage] = useState<Page>("now");
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(["deep-work"])
  );
  const [strengthDate, setStrengthDate] = useState<"unplaced" | "Friday">(
    "unplaced"
  );

  function toggleComplete(id: string) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ExplorationChrome concept={concept}>
      <main className="bg-[#d7cdb6] px-3 py-5 text-[#302a21] sm:px-6 lg:px-10">
        <section className="mx-auto min-h-[calc(100dvh-109px)] max-w-[94rem]">
          <div className="mb-4 flex items-end justify-between gap-4 px-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#302a21]/50">
                Fieldbook 26 / September
              </p>
              <h1 className="mt-1 font-serif text-3xl italic sm:text-4xl">
                The week, as lived.
              </h1>
            </div>
            <p className="hidden max-w-sm text-right text-xs leading-relaxed text-[#302a21]/55 sm:block">
              Nothing is inside a card. Dates, work, people, and evidence share
              one durable page.
            </p>
          </div>

          <div className="relative lg:pr-8">
            <nav
              aria-label="Fieldbook page index"
              className="mb-2 flex gap-1 overflow-x-auto lg:absolute lg:right-0 lg:top-8 lg:mb-0 lg:translate-x-[calc(100%-2rem)] lg:flex-col lg:overflow-visible"
            >
              {(["now", "plan", "people", "log"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setPage(item)}
                  aria-pressed={page === item}
                  className={`min-h-12 min-w-20 shrink-0 border border-[#302a21]/30 px-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] transition lg:min-h-16 lg:w-24 ${
                    page === item
                      ? "bg-[#b8322a] text-[#fff9ec] lg:translate-x-2"
                      : "bg-[#e5dac2] hover:bg-[#ddd1b4] lg:hover:translate-x-1"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
            <div className="grid min-h-[43rem] overflow-hidden border border-[#302a21]/25 bg-[#eee5d0] shadow-[0_12px_40px_rgba(48,42,33,0.12)] lg:grid-cols-2">
              <section className="relative border-b border-[#302a21]/25 p-5 sm:p-8 lg:border-b-0 lg:border-r">
                <header className="flex items-start justify-between border-b-2 border-[#302a21] pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
                      September 2026
                    </p>
                    <p className="mt-1 font-serif text-2xl italic">Plan</p>
                  </div>
                  <span className="font-mono text-xs">36 / 52</span>
                </header>
                <MonthFolio />
                <div className="mt-7 border-t border-[#302a21]/30 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
                    Loose in the margin
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="border-l-2 border-[#b8322a] pl-3">
                      <p className="font-serif text-lg italic">Review offer</p>
                      <p className="text-xs text-[#302a21]/55">Flexible · no date</p>
                    </div>
                    <div className="border-l-2 border-[#b67b28] pl-3">
                      <p className="font-serif text-lg italic">Strength</p>
                      <p className="text-xs text-[#302a21]/55">
                        {strengthDate === "unplaced"
                          ? "Missed Tuesday"
                          : "Rewritten · Friday"}
                      </p>
                    </div>
                  </div>
                  {strengthDate === "unplaced" ? (
                    <button
                      type="button"
                      onClick={() => setStrengthDate("Friday")}
                      className="mt-5 inline-flex min-h-11 items-center gap-2 border-b border-[#302a21] text-sm font-semibold"
                    >
                      <RotateCcw aria-hidden className="size-4" />
                      Rewrite Strength on Friday
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="relative p-5 sm:p-8">
                {page === "now" ? (
                  <NowPage completed={completed} onToggle={toggleComplete} />
                ) : page === "plan" ? (
                  <PlanPage strengthDate={strengthDate} />
                ) : page === "people" ? (
                  <PeoplePage />
                ) : (
                  <LogPage completed={completed} />
                )}
                <p className="absolute bottom-3 right-5 font-mono text-[10px] text-[#302a21]/40">
                  03 SEP
                </p>
              </section>
            </div>
          </div>
        </section>
        <ConceptBrief concept={concept}>
          <p className="mt-4 max-w-2xl leading-relaxed text-[#302a21]/65">
            Fieldbook asks whether a single readable artifact can replace app
            chrome. Completion leaves a conspicuous historical mark; social
            context lives in margins beside the relevant work rather than in a
            destination feed.
          </p>
        </ConceptBrief>
      </main>
    </ExplorationChrome>
  );
}

function MonthFolio() {
  return (
    <div className="mt-5">
      <div className="grid grid-cols-7 border-b border-[#302a21]/35 pb-2 text-center font-mono text-[9px]">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }, (_, index) => {
          const date = index - 1;
          const visible = date > 0 && date <= 30;
          const isToday = date === 3;
          const hasMark = [1, 2, 3, 5, 8, 10, 12, 15, 17].includes(date);
          if (!visible) {
            return (
              <span
                key={index}
                aria-hidden
                className="aspect-square border-b border-r border-[#302a21]/15"
              />
            );
          }
          return (
            <button
              type="button"
              key={index}
              aria-label={`September ${date}`}
              aria-current={isToday ? "date" : undefined}
              className={`relative aspect-square border-b border-r border-[#302a21]/15 p-1 text-left font-mono text-[10px] ${
                isToday ? "bg-[#f4c960]/45 font-bold" : ""
              }`}
            >
              {date}
              {hasMark ? (
                <span className="absolute bottom-[20%] left-[22%] h-px w-[58%] -rotate-6 bg-[#b8322a]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NowPage({
  completed,
  onToggle,
}: {
  completed: Set<string>;
  onToggle: (id: string) => void;
}) {
  const rows = CONCEPT_ITEMS.filter(
    (item) => item.id === "deep-work" || item.id === "tempo" || item.id === "launch"
  );
  const openCount = rows.filter((item) => !completed.has(item.id)).length;
  return (
    <>
      <header className="flex items-end justify-between border-b-2 border-[#302a21] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
            {CONCEPT_TODAY.day}
          </p>
          <h2 className="mt-1 font-serif text-4xl italic">Today’s page</h2>
        </div>
        <p className="font-serif text-xl italic">{openCount} open</p>
      </header>
      <ol className="mt-5">
        {rows.map((item) => {
          const isComplete = completed.has(item.id);
          return (
            <li
              key={item.id}
              className="grid min-h-28 grid-cols-[4rem_minmax(0,1fr)_4.5rem] items-center border-b border-[#302a21]/25"
            >
              <span className="font-mono text-xs text-[#302a21]/50">
                {item.time}
              </span>
              <div>
                <p
                  className={`font-serif text-2xl italic ${
                    isComplete ? "text-[#302a21]/40 line-through" : ""
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[#302a21]/50">{item.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-label={
                  isComplete
                    ? `Remove completion stamp from ${item.title}`
                    : `Stamp ${item.title} complete`
                }
                className={`grid size-16 rotate-[-7deg] place-items-center rounded-full border-2 text-[9px] font-bold uppercase tracking-[0.12em] transition ${
                  isComplete
                    ? "border-[#b8322a] text-[#b8322a]"
                    : "border-[#302a21]/25 text-[#302a21]/45 hover:border-[#b8322a] hover:text-[#b8322a]"
                }`}
              >
                {isComplete ? "Done" : <Stamp aria-hidden className="size-5" />}
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="mt-6 flex min-h-11 items-center gap-2 text-sm font-semibold"
      >
        Show 1 loose item
        <ArrowRight aria-hidden className="size-4" />
      </button>
    </>
  );
}

function PlanPage({ strengthDate }: { strengthDate: "unplaced" | "Friday" }) {
  return (
    <>
      <header className="border-b-2 border-[#302a21] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Plan notes</p>
        <h2 className="mt-1 font-serif text-4xl italic">What can move</h2>
      </header>
      <div className="mt-6 space-y-8">
        <p className="border-b border-[#302a21]/25 pb-5 font-serif text-2xl italic">
          “Keep Thursday light after the run.”
        </p>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
            Recovery note
          </p>
          <p className="mt-2 text-lg">
            Strength is {strengthDate === "Friday" ? "written on Friday" : "still loose"}.
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
            Draft state
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#302a21]/65">
            Pencil marks remain draft until the page is signed. Undo stays
            available beside the signature.
          </p>
        </div>
      </div>
    </>
  );
}

function PeoplePage() {
  return (
    <>
      <header className="border-b-2 border-[#302a21] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
          Margin company
        </p>
        <h2 className="mt-1 font-serif text-4xl italic">Maya</h2>
      </header>
      <div className="mt-7 border-l-2 border-[#6555ad] pl-5">
        <p className="font-serif text-2xl italic">Yoga, 08:12</p>
        <p className="mt-2 text-sm text-[#302a21]/60">
          A factual annotation, not a feed event.
        </p>
      </div>
      <div className="mt-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
          Half marathon club
        </p>
        <p className="mt-2 text-lg">12 of 20 September sessions</p>
        <button
          type="button"
          className="mt-6 min-h-11 border-b border-[#302a21] text-sm font-semibold"
        >
          Leave a margin nudge
        </button>
      </div>
    </>
  );
}

function LogPage({ completed }: { completed: Set<string> }) {
  return (
    <>
      <header className="border-b-2 border-[#302a21] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
          Evidence, not score
        </p>
        <h2 className="mt-1 font-serif text-4xl italic">September log</h2>
      </header>
      <div className="mt-7 grid grid-cols-5 gap-3" aria-label="Completion stamps">
        {Array.from({ length: 20 }, (_, index) => (
          <span
            key={index}
            className={`grid aspect-square rotate-[-5deg] place-items-center rounded-full border text-[9px] font-bold ${
              index < completed.size + 5
                ? "border-[#b8322a] text-[#b8322a]"
                : "border-[#302a21]/15 text-transparent"
            }`}
          >
            {index < completed.size + 5 ? "DONE" : "—"}
          </span>
        ))}
      </div>
      <p className="mt-8 font-serif text-xl italic">
        “Seven marks. One recovery. No broken chain.”
      </p>
    </>
  );
}
