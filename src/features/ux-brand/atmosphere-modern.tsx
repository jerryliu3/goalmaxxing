"use client";

import {
  BRAND_TODAY_LEFT,
  BRAND_TODAY_ROWS,
  BRAND_WEEK,
  BRAND_WEEK_DONE,
  BRAND_WEEK_PLANNED,
} from "@/features/ux-brand/catalog";
import {
  AtmosphereFrame,
  useTempoCompletion,
} from "@/features/ux-brand/atmosphere-frame";
import { cn } from "@/lib/utils";

export function GlasslineConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="glassline"
      className="min-h-dvh bg-[#f4f4f1] font-[family-name:var(--font-brand-sans)] text-[#111]"
      kicker="Atmosphere A1 · modern / minimal"
      kickerClassName="text-[#111]"
      title="Glassline"
      titleClassName="mt-3 text-5xl font-medium leading-none tracking-[-0.065em] sm:text-6xl"
      intro={
        <>
          One typeface, no accent color, no decorative metaphor. Swiss posters
          and Braun prove that restraint can feel authored when every baseline,
          rule, and proportion agrees. Freedom here is the space that remains
          unoccupied.
        </>
      }
      type="Inter alone. Hierarchy comes from optical scale, weight, and spacing — not a second personality."
      color="Paper #F4F4F1 · white #FFFFFF · ink #111111 · rule #D7D7D2. No accent color."
      feeling="A strict eight-pixel grid, flush-left type, square controls, and almost no elevation. Completion is a registration square snapping into alignment."
      detailClassName="text-[#666661]"
      signature={
        <div className="flex items-center gap-4">
          <span className="inline-block size-6 border border-[#111]" />
          <span className="relative inline-block size-6 border border-[#111]">
            <span className="absolute inset-[4px] bg-[#111]" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em]">
            registered
          </span>
        </div>
      }
      material={
        <div className="border-t border-[#111] pt-2 text-[10px] uppercase tracking-[0.2em]">
          1 px rule · 8 px rhythm
        </div>
      }
      phoneLabel="Thursday home · Glassline"
    >
      <div
        className="min-h-[640px] bg-white pb-8"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(17,17,17,.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,.035) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="px-6 pt-6">
          <div className="flex items-baseline justify-between text-[10px] font-medium uppercase tracking-[0.22em]">
            <span>Thu · 03</span>
            <span>
              {BRAND_WEEK_DONE}/{BRAND_WEEK_PLANNED}
            </span>
          </div>
          <p className="mt-10 text-[5.5rem] font-medium leading-[0.8] tracking-[-0.09em]">
            {BRAND_TODAY_LEFT}
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-[#666661]">
            open · still to climb
          </p>
          <div className="mt-9 flex gap-1">
            {BRAND_WEEK.map((day, index) => (
              <div
                key={`${day.label}-${day.date}-${index}`}
                className="flex min-w-0 flex-1 flex-col"
              >
                <span className="text-[9px] uppercase text-[#74746f]">
                  {day.label}
                </span>
                <span className="mt-1 text-sm">{day.date}</span>
                <span
                  className={cn(
                    "mt-2 h-px w-full",
                    day.kind === "today" ? "bg-[#111]" : "bg-[#d7d7d2]"
                  )}
                />
              </div>
            ))}
          </div>
          <ul className="mt-8 border-t border-[#111]">
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id} className="border-b border-[#d7d7d2]">
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="flex w-full items-center gap-4 py-3.5 text-left"
                  >
                    <span
                      className="relative size-3.5 shrink-0 border border-[#111]"
                      aria-hidden="true"
                    >
                      {done ? (
                        <span className="absolute inset-[2px] bg-[#111]" />
                      ) : null}
                    </span>
                    <span className="w-5 text-[10px] text-[#74746f]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[15px]",
                        done && "line-through opacity-35"
                      )}
                    >
                      {row.title}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.12em] text-[#74746f]">
                      {row.effort}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AtmosphereFrame>
  );
}

export function IonConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="ion"
      className="min-h-dvh bg-[#eef2f8] font-[family-name:var(--font-brand-display)] text-[#12151c]"
      kicker="Atmosphere A3 · optimistic future"
      kickerClassName="text-[#0b6fff]"
      title="Ion"
      titleClassName="mt-3 font-[family-name:var(--font-brand-display)] text-5xl font-medium leading-none tracking-[-0.055em] sm:text-6xl"
      intro={
        <>
          A bright mission-control world rather than the expected black sci-fi
          shell. NASA status boards, Nothing, and Teenage Engineering make
          technology tactile through grids, IDs, and one charged blue. Ascent
          is telemetry, not scenery.
        </>
      }
      type="Space Grotesk for commands and headings · IBM Plex Mono for clocks, IDs, and elevation."
      color="Lab #F3F6FB · graphite #12151C · grid #D5DDE8 · electric #0B6FFF."
      feeling="White instrument modules sit on a blueprint grid. Remaining work is T-minus. Completion closes an orbital ring around a charged core."
      detailClassName="text-[#0b6fff]"
      signature={
        <span className="relative inline-flex size-12 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-[#d5dde8]" />
          <span className="absolute inset-0 rotate-45 rounded-full border-2 border-[#0b6fff] border-l-transparent" />
          <span className="size-2 rounded-full bg-[#0b6fff]" />
        </span>
      }
      material={
        <p className="font-[family-name:var(--font-brand-mono)] text-xs tracking-tight text-[#0b6fff]">
          ION/36 · CHG 0.72
        </p>
      }
      phoneLabel="Thursday home · Ion"
    >
      <div
        className="min-h-[640px] bg-[#f7f9fc] pb-8"
        style={{
          backgroundImage:
            "linear-gradient(#d5dde8 1px, transparent 1px), linear-gradient(90deg, #d5dde8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between font-[family-name:var(--font-brand-mono)] text-[9px] text-[#0b6fff]">
            <span>ION / WK36</span>
            <span>09:41:00</span>
          </div>
          <div className="mt-5 border border-[#d5dde8] bg-white/90 p-4">
            <p className="font-[family-name:var(--font-brand-mono)] text-[9px] tracking-[0.18em] text-[#0b6fff]">
              T-MINUS
            </p>
            <div className="mt-1 flex items-end justify-between">
              <p className="font-[family-name:var(--font-brand-display)] text-[4.25rem] font-medium leading-none tracking-[-0.075em]">
                {BRAND_TODAY_LEFT}
              </p>
              <p className="pb-1 font-[family-name:var(--font-brand-mono)] text-[9px] text-[#5b6573]">
                ACTIONS
                <br />
                REMAIN
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {BRAND_WEEK.map((day, index) => (
              <div
                key={`${day.label}-${day.date}-${index}`}
                className={cn(
                  "border px-1 py-2 text-center font-[family-name:var(--font-brand-mono)] text-[8px]",
                  day.kind === "today"
                    ? "border-[#0b6fff] bg-[#0b6fff] text-white"
                    : "border-[#d5dde8] bg-white/90 text-[#5b6573]"
                )}
              >
                <div>{day.label}</div>
                <div className="mt-1 text-[10px]">{day.date}</div>
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-2">
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="flex w-full items-center gap-3 border border-[#d5dde8] bg-white/95 px-3 py-2.5 text-left"
                  >
                    <span
                      className="relative size-7 shrink-0 rounded-full border-2 border-[#d5dde8]"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "absolute -inset-0.5 rounded-full border-2 border-[#0b6fff] border-b-transparent",
                          done
                            ? "rotate-45 border-l-[#0b6fff]"
                            : "border-l-transparent"
                        )}
                      />
                      {done ? (
                        <span className="absolute inset-[7px] rounded-full bg-[#0b6fff]" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "font-[family-name:var(--font-brand-display)] text-[15px] font-medium",
                            done && "opacity-40"
                          )}
                        >
                          {row.title}
                        </span>
                        <span className="font-[family-name:var(--font-brand-mono)] text-[9px] text-[#0b6fff]">
                          {row.effort.replace(" ", "")}
                        </span>
                      </span>
                      <span className="mt-0.5 block font-[family-name:var(--font-brand-mono)] text-[9px] text-[#5b6573]">
                        ID.{String(index + 1).padStart(2, "0")} · {row.meta}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AtmosphereFrame>
  );
}

export function AeroConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="aero"
      className="min-h-dvh bg-[#d9e1ea] font-[family-name:var(--font-brand-sans)] text-[#152033]"
      kicker="Atmosphere A9 · industrial freedom"
      kickerClassName="text-[#d94c17]"
      title="Aero"
      titleClassName="mt-2 font-[family-name:var(--font-brand-display)] text-6xl font-semibold uppercase leading-[0.82] tracking-[-0.045em] sm:text-7xl"
      intro={
        <>
          Freedom as lift, rendered through real aviation language: aluminum,
          navy, safety orange, condensed altitude figures. It is technical but
          warmer and more physical than Ion. No landscape is needed; the
          instrument itself carries the feeling of climbing.
        </>
      }
      type="Barlow Condensed for altitude and commands · Barlow for controls and manifests."
      color="Aluminum #D9E1EA · flight navy #152033 · cloud #F8FAFC · aviation orange #F05A22."
      feeling="Altimeter tape, riveted panels, and a thin contrail week. Completion locks two orange chevrons on target."
      detailClassName="text-[#d94c17]"
      signature={
        <div className="flex items-center gap-1 text-[#f05a22]">
          <span className="block size-4 rotate-45 border-r-4 border-t-4 border-current" />
          <span className="block size-4 rotate-45 border-r-4 border-t-4 border-current" />
        </div>
      }
      material={
        <div className="border border-[#8995a5] bg-[#e9eef3] px-3 py-2 shadow-[inset_0_1px_white]">
          <span className="font-[family-name:var(--font-brand-display)] text-2xl font-semibold">
            1,480
          </span>
          <span className="ml-1 text-[9px] uppercase tracking-[0.18em]">ft</span>
        </div>
      }
      phoneLabel="Thursday home · Aero"
    >
      <div
        className="min-h-[640px] bg-[#dfe6ed] pb-7"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,.7), transparent 36%), repeating-linear-gradient(90deg, rgba(21,32,51,.025) 0 1px, transparent 1px 4px), #dfe6ed",
        }}
      >
        <div className="border-b border-[#8995a5] bg-[#152033] px-5 py-3 text-[#f8fafc]">
          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.2em]">
            <span>GMX · Flight 36</span>
            <span className="text-[#f05a22]">Climb</span>
          </div>
        </div>
        <div className="grid grid-cols-[74px_1fr]">
          <div className="relative border-r border-[#8995a5] bg-[#c8d1db] px-2 py-4">
            <p className="text-center text-[8px] font-semibold uppercase tracking-[0.14em]">
              Alt ft
            </p>
            <div className="mt-3 space-y-8 text-right font-[family-name:var(--font-brand-display)] text-xl font-semibold">
              <p>1600</p>
              <p className="relative text-[#f05a22]">
                <span className="absolute -right-2 top-1/2 h-px w-4 bg-[#f05a22]" />
                1480
              </p>
              <p>1200</p>
              <p>0800</p>
            </div>
          </div>
          <div className="min-w-0 px-4 pt-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#566276]">
              Thursday · remaining
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="font-[family-name:var(--font-brand-display)] text-[4.75rem] font-semibold leading-none tracking-[-0.05em]">
                {BRAND_TODAY_LEFT}
              </p>
              <p className="pb-2 text-[9px] uppercase tracking-[0.14em] text-[#566276]">
                checks
                <br />
                to cruise
              </p>
            </div>
            <div className="relative mt-4 flex justify-between">
              <span className="absolute left-1 right-1 top-1/2 h-px bg-[#8995a5]" />
              {BRAND_WEEK.map((day, index) => (
                <span
                  key={`${day.label}-${day.date}-${index}`}
                  className={cn(
                    "relative z-10 flex size-5 items-center justify-center rounded-full border text-[8px] font-semibold",
                    day.kind === "today"
                      ? "border-[#f05a22] bg-[#f05a22] text-white"
                      : "border-[#8995a5] bg-[#dfe6ed]"
                  )}
                >
                  {day.label}
                </span>
              ))}
            </div>
            <ul className="mt-5 space-y-2">
              {BRAND_TODAY_ROWS.map((row) => {
                const done = completion.isDone(row);
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => completion.toggle(row.id)}
                      className="flex w-full items-center gap-2 border border-[#8995a5] bg-[#eef2f6] px-2.5 py-2 text-left shadow-[inset_0_1px_white]"
                    >
                      <span
                        className="flex w-6 shrink-0 items-center gap-0.5 text-[#f05a22]"
                        aria-hidden="true"
                      >
                        {done ? (
                          <>
                            <span className="size-2 rotate-45 border-r-2 border-t-2 border-current" />
                            <span className="size-2 rotate-45 border-r-2 border-t-2 border-current" />
                          </>
                        ) : (
                          <span className="mx-auto block size-2 border border-[#8995a5]" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-[13px] font-semibold",
                            done && "opacity-40"
                          )}
                        >
                          {row.title}
                        </span>
                        <span className="block text-[8px] uppercase tracking-[0.1em] text-[#566276]">
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
      </div>
    </AtmosphereFrame>
  );
}
