"use client";

import { cn } from "@/lib/utils";
import {
  BRAND_TODAY_LEFT,
  BRAND_TODAY_ROWS,
  BRAND_WEEK,
  BRAND_WEEK_DONE,
  BRAND_WEEK_PLANNED,
} from "@/features/ux-brand/catalog";
import {
  MixShell,
  MixSpec,
  RidgeSilhouette,
  StackMark,
  useBrandCompletions,
} from "@/features/ux-brand/mix-kit";
import { NestMark } from "@/features/ux-brand/completion-marks";

export function FieldNotesConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="field-notes"
      pageClassName="bg-[#eef1e8] text-[#1f241c]"
      kicker="Mix 6 · Folio × Contour"
      kickerClassName="text-[#4a6740]"
      title="Field Notes"
      titleClassName="font-[family-name:var(--font-brand-display)]"
      thesis="A trail log, not a dashboard. Folio’s numbered page and Contour’s gain column, on sage paper. Forest green stays in the margin so the journal still feels like paper."
      type="Newsreader titles · IBM Plex Sans · IBM Plex Mono metres"
      color="Sage paper #EEF1E8 · walnut ink · margin green #4A6740"
      feeling="Idle is one ink tick. Completing stacks a second tick — a mark you add, not a circle you fill."
      phoneLabel="Thursday home · Field Notes"
      specimens={
        <>
          <MixSpec title="Gain">
            <p className="font-[family-name:var(--font-brand-mono)] text-xl">+360 m</p>
          </MixSpec>
          <MixSpec title="Stack">
            <div className="flex gap-4 text-[#4a6740]">
              <StackMark done={false} variant="ticks" />
              <StackMark done variant="ticks" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="min-h-[640px] bg-[#f4f6ef] pb-8">
        <div className="border-b border-[#c5ccb8] px-5 py-3 font-[family-name:var(--font-brand-sans)] text-[10px] uppercase tracking-[0.16em] text-[#5c6654]">
          Field notes · Week 36
        </div>
        <div className="px-5 pt-4">
          <p className="font-[family-name:var(--font-brand-mono)] text-[11px] text-[#4a6740]">
            {BRAND_TODAY_LEFT} open · +m still to log
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.4rem] leading-none">
            Thursday
          </h2>
          <ul className="mt-5">
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = isDone(row.id);
              return (
                <li key={row.id} className="border-t border-[#c5ccb8]">
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="grid w-full grid-cols-[1.6rem_minmax(0,1fr)_auto] items-center gap-2 py-3 text-left"
                  >
                    <span className="font-[family-name:var(--font-brand-display)] text-sm italic text-[#4a6740]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span
                        className={cn(
                          "block font-[family-name:var(--font-brand-display)] text-xl leading-none",
                          done && "text-[#5c6654]"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-[#5c6654]">
                        {row.meta}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-[#4a6740]">
                      <span className="font-[family-name:var(--font-brand-mono)] text-xs">
                        {row.effort}
                      </span>
                      <StackMark done={done} variant="ticks" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </MixShell>
  );
}

export function GazetteerConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="gazetteer"
      pageClassName="bg-[#f3ead8] text-[#241c14]"
      kicker="Mix 9 · Folio × Contour"
      kickerClassName="text-[#9a4f2c]"
      title="Gazetteer"
      titleClassName="font-[family-name:var(--font-brand-display)]"
      thesis="A surveyor’s place-name book. Every session is an index, a name, and a rise. Folio’s ledger with Contour’s legend sitting in the gutter."
      type="Newsreader names · Source Sans 3 labels · IBM Plex Mono rise"
      color="Cream #F3EAD8 · walnut · stamp rust #9A4F2C"
      feeling="Idle is an empty frame. Completing nests an inner square. The rectangular blaze stack is the runner-up."
      phoneLabel="Thursday home · Gazetteer"
      specimens={
        <>
          <MixSpec title="Stamp">
            <span className="inline-block -rotate-6 rounded-[4px] border-2 border-[#9a4f2c] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a4f2c]">
              Thu 3 Sep
            </span>
          </MixSpec>
          <MixSpec title="Nest · stack runner-up">
            <div className="flex gap-4 text-[#9a4f2c]">
              <NestMark done={false} variant="nest" />
              <NestMark done variant="nest" />
              <StackMark done={false} variant="blaze" />
              <StackMark done variant="blaze" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="min-h-[640px] bg-[#f8f1e3] pb-8">
        <div className="flex items-baseline justify-between border-b border-[#d4c4a4] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-[#7a6a56]">
          <span>Gazetteer</span>
          <span>Week 36</span>
        </div>
        <div className="px-5 pt-4">
          <h2 className="font-[family-name:var(--font-brand-display)] text-[2.5rem] leading-none">
            Thursday
          </h2>
          <p className="mt-2 font-[family-name:var(--font-brand-display)] text-base italic text-[#5c4e3f]">
            {BRAND_TODAY_LEFT} names still unlogged.
          </p>
          <div className="mt-4 grid grid-cols-[2rem_minmax(0,1fr)_3.2rem] gap-2 border-b border-[#d4c4a4] pb-1 text-[10px] uppercase tracking-[0.14em] text-[#7a6a56]">
            <span>No.</span>
            <span>Place</span>
            <span className="text-right">Rise</span>
          </div>
          <ul>
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = isDone(row.id);
              return (
                <li key={row.id} className="border-b border-[#d4c4a4]">
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="grid w-full grid-cols-[2rem_minmax(0,1fr)_3.2rem_1.75rem] items-center gap-2 py-3 text-left"
                  >
                    <span className="font-[family-name:var(--font-brand-display)] text-sm italic text-[#9a4f2c]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-[family-name:var(--font-brand-display)] text-lg leading-none">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#7a6a56]">
                        {row.meta}
                      </span>
                    </span>
                    <span className="text-right font-[family-name:var(--font-brand-mono)] text-xs text-[#4a6740]">
                      {row.effort}
                    </span>
                    <NestMark done={done} variant="nest" className="text-[#9a4f2c]" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </MixShell>
  );
}

export function VellumConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="vellum"
      pageClassName="bg-[#f6f0e4] text-[#2c261e]"
      kicker="Mix 10 · Folio × Contour × Dawn"
      kickerClassName="text-[#8a6a3a]"
      title="Vellum"
      titleClassName="font-[family-name:var(--font-brand-display)]"
      thesis="A topographic plate bound into a journal. Contour lines are printed, not a map app. Dawn’s sun sits in the corner like a printer’s ornament."
      type="Newsreader · Source Sans 3"
      color="Vellum #F6F0E4 · sage contours · peach sun · walnut ink"
      feeling="Idle is one paper chip. Completing stacks a second chip, slightly rotated."
      phoneLabel="Thursday home · Vellum"
      specimens={
        <>
          <MixSpec title="Plate">
            <p className="text-sm italic opacity-70">Contour as a book illustration.</p>
          </MixSpec>
          <MixSpec title="Stack">
            <div className="flex gap-4 text-[#8a6a3a]">
              <StackMark done={false} variant="chips" />
              <StackMark done variant="chips" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="relative min-h-[640px] overflow-hidden bg-[#fbf6ea] pb-8">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-35">
          {Array.from({ length: 12 }, (_, index) => (
            <ellipse
              key={index}
              cx="52%"
              cy="62%"
              rx={36 + index * 16}
              ry={16 + index * 9}
              fill="none"
              stroke="#8a9a7a"
              strokeWidth="0.8"
            />
          ))}
        </svg>
        <div
          aria-hidden="true"
          className="absolute right-6 top-8 size-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(247,236,214,0.95) 0%, rgba(247,236,214,0) 70%)",
          }}
        />
        <div className="relative px-5 pt-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a6a3a]">
            Plate 36 · Sep 3
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.5rem] leading-none">
            Thursday
          </h2>
          <p className="mt-2 font-[family-name:var(--font-brand-display)] text-lg italic opacity-70">
            {BRAND_TODAY_LEFT} still on the plate.
          </p>
          <ul className="mt-5 space-y-2">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = isDone(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="flex w-full items-center gap-3 border-t border-[#d8cdb6] py-3 text-left"
                  >
                    <StackMark done={done} variant="chips" className="text-[#8a6a3a]" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-[family-name:var(--font-brand-display)] text-xl leading-none">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] opacity-60">
                        {row.meta}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </MixShell>
  );
}

export function ColConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="col"
      pageClassName="bg-[#efe8dc] text-[#2a241c]"
      kicker="Mix 13 · Folio × Dawn × Contour"
      kickerClassName="text-[#b5522a]"
      title="Col"
      titleClassName="font-[family-name:var(--font-brand-display)]"
      thesis="The pass between two peaks. A Folio chapter written on Dawn’s parchment sky, with Contour’s gain as a quiet figure. The next ridge is already in the page."
      type="Newsreader chapter · Instrument Sans chrome"
      color="Parchment sky · ridge taupe · stamp rust · lichen only on the stacked stones"
      feeling="Idle is one stone. Completing stacks a second stone — the Waypath idea, without the winding cartoon path."
      phoneLabel="Thursday home · Col"
      specimens={
        <>
          <MixSpec title="Pass">
            <p className="font-[family-name:var(--font-brand-display)] text-3xl italic">Col 36</p>
          </MixSpec>
          <MixSpec title="Stack">
            <div className="flex gap-4 text-[#6e8b74]">
              <StackMark done={false} variant="cairn" />
              <StackMark done variant="cairn" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="relative min-h-[640px] overflow-hidden pb-8 text-[#2a241c]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 78% 10%, rgba(247,236,214,0.9), transparent 34%), linear-gradient(180deg, #e7eef2 0%, #f4f1ea 46%, #e8dfd2 100%)",
          }}
        />
        <RidgeSilhouette className="text-[#b7c4b8]" />
        <div className="relative px-5 pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#b5522a]">
            Col {BRAND_WEEK_DONE} of {BRAND_WEEK_PLANNED}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.6rem] leading-[0.9]">
            Thursday
          </h2>
          <p className="mt-2 text-sm opacity-70">
            {BRAND_TODAY_LEFT} still between peaks.
          </p>
          <div className="mt-4 flex gap-1">
            {BRAND_WEEK.map((day, index) => (
              <div
                key={`${day.label}-${day.date}-${index}`}
                className={cn(
                  "flex h-11 flex-1 flex-col items-center justify-center text-[10px]",
                  day.kind === "today" && "text-[#b5522a]"
                )}
              >
                <span className="opacity-60">{day.label}</span>
                <span className="font-[family-name:var(--font-brand-display)] text-sm">
                  {day.date}
                </span>
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-1">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = isDone(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <StackMark
                      done={done}
                      variant="cairn"
                      className={done ? "text-[#6e8b74]" : "text-[#c4a992]"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-[family-name:var(--font-brand-display)] text-xl leading-none">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] opacity-60">
                        {row.meta}
                      </span>
                    </span>
                    <span className="font-[family-name:var(--font-brand-mono)] text-xs opacity-70">
                      {row.effort}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </MixShell>
  );
}
