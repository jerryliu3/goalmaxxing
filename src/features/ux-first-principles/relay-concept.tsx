"use client";

import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  RotateCcw,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  ConceptBrief,
  ExplorationChrome,
} from "@/features/ux-first-principles/exploration-chrome";
import {
  CONCEPT_ITEMS,
  CONCEPT_TODAY,
  getFirstPrinciplesConcept,
} from "@/features/ux-first-principles/model";

const concept = getFirstPrinciplesConcept("relay");
const QUEUE = CONCEPT_ITEMS.filter(
  (item) => item.id === "tempo" || item.id === "launch" || item.id === "review"
);

type Door = "route" | "people" | "trace";

export function RelayConcept() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState<string[]>(["deep-work"]);
  const [door, setDoor] = useState<Door>("route");
  const [strengthRecovered, setStrengthRecovered] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClickUntil = useRef(0);
  const active = QUEUE[activeIndex % QUEUE.length];

  function completeActive() {
    setHolding(false);
    setCompleted((current) =>
      current.includes(active.id) ? current : [...current, active.id]
    );
    setActiveIndex((current) => (current + 1) % QUEUE.length);
  }

  function beginHold() {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      ignoreClickUntil.current = performance.now() + 800;
      completeActive();
    }, 650);
  }

  function cancelHold() {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  return (
    <ExplorationChrome concept={concept}>
      <main className="bg-[#f5e4d0] text-[#402619]">
        <section className="min-h-[calc(100dvh-69px)] px-4 py-5 sm:px-8 lg:px-12">
          <div className="mx-auto grid min-h-[calc(100dvh-109px)] max-w-[94rem] gap-6 lg:grid-cols-[5rem_minmax(0,1fr)_20rem]">
            <nav
              aria-label="Relay context doors"
              className="order-2 flex justify-center gap-2 lg:order-1 lg:flex-col"
            >
              <DoorButton
                active={door === "route"}
                label="Open route"
                onClick={() => setDoor("route")}
              >
                <CalendarDays aria-hidden className="size-5" />
              </DoorButton>
              <DoorButton
                active={door === "people"}
                label="Open people"
                onClick={() => setDoor("people")}
              >
                <Users aria-hidden className="size-5" />
              </DoorButton>
              <DoorButton
                active={door === "trace"}
                label="Open progress trace"
                onClick={() => setDoor("trace")}
              >
                <ChartNoAxesColumnIncreasing aria-hidden className="size-5" />
              </DoorButton>
            </nav>

            <section className="order-1 flex min-h-[41rem] flex-col items-center justify-between overflow-hidden border border-[#402619]/15 bg-[#fbf3e8] px-4 py-6 text-center lg:order-2 lg:min-h-0 lg:px-8">
              <div className="w-full">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#402619]/45">
                  <span>{CONCEPT_TODAY.day}</span>
                  <span>Relay {activeIndex + 1} / {QUEUE.length}</span>
                  <span>{active.time ?? "Flexible"}</span>
                </div>
                <div className="mt-5 flex items-center gap-2" aria-label="Today’s route">
                  {QUEUE.map((item, index) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Focus ${item.title}`}
                      aria-current={index === activeIndex ? "step" : undefined}
                      className={`h-2 min-w-0 flex-1 transition ${
                        index < activeIndex || completed.includes(item.id)
                          ? "bg-[#d95034]"
                          : index === activeIndex
                            ? "bg-[#402619]"
                            : "bg-[#402619]/15"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="my-8 w-full">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#402619]/45">
                  In your hands
                </p>
                <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(3.3rem,9vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.075em]">
                  {active.title}
                </h1>
                <p className="mt-4 text-sm text-[#402619]/55">{active.detail}</p>

                <button
                  type="button"
                  onPointerDown={beginHold}
                  onPointerUp={cancelHold}
                  onPointerCancel={cancelHold}
                  onPointerLeave={cancelHold}
                  onClick={(event) => {
                    if (
                      event.detail === 0 &&
                      performance.now() >= ignoreClickUntil.current
                    ) {
                      completeActive();
                    }
                  }}
                  aria-label={`Hold to complete ${active.title}`}
                  className={`relative mx-auto mt-9 grid aspect-square w-[min(62vw,18rem)] select-none place-items-center rounded-full border-[3px] transition duration-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#402619] ${
                    holding
                      ? "scale-95 border-[#d95034] bg-[#d95034] text-white"
                      : "border-[#402619] bg-transparent hover:bg-[#f5e4d0]"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-3 rounded-full border transition duration-700 ${
                      holding ? "scale-90 border-white/70" : "border-[#402619]/20"
                    }`}
                  />
                  <span>
                    {holding ? (
                      <span className="block text-sm font-semibold uppercase tracking-[0.18em]">
                        Keep holding
                      </span>
                    ) : (
                      <>
                        <span className="block text-xs font-semibold uppercase tracking-[0.2em] opacity-50">
                          Hold
                        </span>
                        <span className="mt-1 block text-2xl font-semibold tracking-[-0.03em]">
                          Complete
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              <div className="flex w-full items-center justify-between gap-4 border-t border-[#402619]/15 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((current) => (current + 1) % QUEUE.length)
                  }
                  className="min-h-11 text-sm font-semibold text-[#402619]/65"
                >
                  Pass for now
                </button>
                <p className="text-xs text-[#402619]/45">
                  Keyboard: Enter completes
                </p>
              </div>
            </section>

            <aside className="order-3 border-t border-[#402619]/15 py-6 lg:border-l lg:border-t-0 lg:pl-6">
              {door === "route" ? (
                <RouteDoor
                  strengthRecovered={strengthRecovered}
                  onRecover={() => setStrengthRecovered(true)}
                />
              ) : door === "people" ? (
                <PeopleDoor />
              ) : (
                <TraceDoor completed={completed} />
              )}
            </aside>
          </div>
        </section>
        <ConceptBrief concept={concept}>
          <p className="mt-4 max-w-2xl leading-relaxed text-[#402619]/65">
            Relay treats completion as a deliberate physical commitment, not a
            tiny control repeated down a list. The persistent stage remains
            stable while route, people, and progress arrive through context
            doors.
          </p>
        </ConceptBrief>
      </main>
    </ExplorationChrome>
  );
}

function DoorButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-12 place-items-center border transition lg:size-14 ${
        active
          ? "border-[#402619] bg-[#402619] text-[#f5e4d0]"
          : "border-[#402619]/20 hover:border-[#402619]/60"
      }`}
    >
      {children}
    </button>
  );
}

function RouteDoor({
  strengthRecovered,
  onRecover,
}: {
  strengthRecovered: boolean;
  onRecover: () => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#402619]/45">
        Route
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Three handoffs today
      </h2>
      <ol className="mt-6 space-y-5 border-l border-[#402619]/25 pl-5">
        <li>
          <p className="text-xs text-[#402619]/45">07:30</p>
          <p className="font-semibold">Tempo run</p>
        </li>
        <li>
          <p className="text-xs text-[#402619]/45">11:00</p>
          <p className="font-semibold">Launch notes</p>
        </li>
        <li>
          <p className="text-xs text-[#402619]/45">Flexible</p>
          <p className="font-semibold">Review offer</p>
        </li>
      </ol>
      <button
        type="button"
        onClick={onRecover}
        disabled={strengthRecovered}
        className="mt-8 flex min-h-12 w-full items-center justify-between border border-[#b66b23] bg-[#f1c57c]/35 px-4 text-left text-sm font-semibold disabled:opacity-60"
      >
        {strengthRecovered ? "Strength → Friday 18:00" : "Find Strength a handoff"}
        <RotateCcw aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function PeopleDoor() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#402619]/45">
        People
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Maya is alongside
      </h2>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-full bg-[#6254b5] font-bold text-white">
          M
        </span>
        <div>
          <p className="font-semibold">Yoga complete</p>
          <p className="text-sm text-[#402619]/50">08:12 · no reply required</p>
        </div>
      </div>
      <button
        type="button"
        className="mt-7 min-h-11 border-b border-[#402619] text-sm font-semibold"
      >
        Send a quiet nudge
      </button>
    </div>
  );
}

function TraceDoor({ completed }: { completed: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#402619]/45">
        Trace
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {completed.length + 6} of 10 this week
      </h2>
      <div className="mt-7 grid grid-cols-7 items-end gap-2" aria-label="Week trace">
        {[3, 1, 2, completed.length, 0, 0, 0].map((value, index) => (
          <div key={index} className="space-y-2 text-center">
            <span
              className="mx-auto block w-full bg-[#d95034]"
              style={{ height: `${Math.max(4, value * 16)}px`, opacity: value ? 1 : 0.15 }}
            />
            <span className="text-[10px] text-[#402619]/45">
              {["M", "T", "W", "T", "F", "S", "S"][index]}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-[#402619]/60">
        Rest and recovery are valid route states. The trace reports what
        happened; it does not threaten a streak.
      </p>
    </div>
  );
}
