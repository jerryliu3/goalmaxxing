import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";
import {
  DAY_WORK_CONCEPTS,
  INSPECT_CONCEPTS,
  REPLACE_CONCEPTS,
} from "@/features/ux-day-work/model";

export function DayWorkIndex() {
  return (
    <main className="min-h-dvh" style={{ background: GAZETTEER.page, color: GAZETTEER.ink }}>
      <section className="px-5 pb-12 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
            style={{ borderColor: GAZETTEER.rule }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Goalmaxxing / Day work study
            </p>
            <div className="flex gap-4">
              <Link
                href="/ux/concepts"
                className="text-xs font-semibold"
                style={{ color: GAZETTEER.mutedDeep }}
              >
                Spatial Plan
              </Link>
              <Link href="/ux" className="text-xs font-semibold" style={{ color: GAZETTEER.mutedDeep }}>
                UX labs
              </Link>
            </div>
          </div>
          <p className="mt-10 text-sm font-medium" style={{ color: GAZETTEER.mutedDeep }}>
            Exploratory · not a lock · production checklist is unchanged
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.6rem,8vw,6.2rem)] font-semibold leading-[0.88] tracking-tight">
            What should a goal feel like when you open it?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
            Live Checklist unfolds a small form: title, date, time, lock. It hides
            the goal’s rhythm and deadline, and it looks like settings. These
            shells keep the same day of work — Tempo run, Launch notes, Weekly
            reset, Review offer, Strength, Deep work — and try a read-first
            inspect, then five other ways to hold the day besides a list.
          </p>
        </div>
      </section>

      <section className="border-t px-5 py-12 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
        <div className="mx-auto max-w-6xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: GAZETTEER.muted }}
          >
            Family 1 · Keep the checklist
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight">
            Open a row. See the goal. Edit by touching the words.
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {INSPECT_CONCEPTS.map((item) => (
              <IndexCard key={item.slug} concept={item} />
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t px-5 py-12 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
        <div className="mx-auto max-w-6xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: GAZETTEER.muted }}
          >
            Family 2 · Replace the checklist
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight">
            Same work. A deck, a gazette, an album, a quest collection, or a
            path through the day.
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {REPLACE_CONCEPTS.map((item) => (
              <IndexCard key={item.slug} concept={item} />
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t px-5 py-12 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
        <div className="mx-auto max-w-6xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: GAZETTEER.muted }}
          >
            How to look
          </p>
          <ol className="mt-6 grid gap-6 text-sm leading-relaxed md:grid-cols-3" style={{ color: GAZETTEER.mutedDeep }}>
            <li>
              <span className="font-semibold text-[color:var(--foreground,#241c14)]">
                1. Open Tempo run.
              </span>{" "}
              You should see 3 days a week, until Dec 31, 7:30, and 1 of 3 this
              week — not only a date input.
            </li>
            <li>
              <span className="font-semibold">2. Tap a fact.</span> The base view
              stays prose. Editing is a choice row, then it settles back into
              language.
            </li>
            <li>
              <span className="font-semibold">3. Complete from the mark.</span>{" "}
              Opening and completing stay separate, including on Deck, Gazette,
              and Stations.
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}

function IndexCard({
  concept,
}: {
  concept: (typeof DAY_WORK_CONCEPTS)[number];
}) {
  return (
    <li>
      <Link
        href={`/ux/day-work/${concept.slug}`}
        aria-label={`Open ${concept.name}`}
        className="group flex h-full flex-col rounded-[14px] border p-5 transition hover:border-[#9a4f2c]/60"
        style={{ borderColor: GAZETTEER.rule, background: GAZETTEER.paper }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: GAZETTEER.muted }}>
          {concept.number} · {concept.family === "inspect" ? "Inspect" : "Replace"}
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {concept.name}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
          {concept.thesis}
        </p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
          Open
          <ArrowUpRight aria-hidden className="size-4" />
        </span>
      </Link>
    </li>
  );
}
