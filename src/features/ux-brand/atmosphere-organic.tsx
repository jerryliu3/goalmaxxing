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

const TIDE_HEIGHTS = [18, 28, 12, 36, 46, 30, 22] as const;

export function HarborConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="harbor"
      className="min-h-dvh bg-[#0d3344] font-[family-name:var(--font-brand-sans)] text-[#eaf6f3]"
      kicker="Atmosphere A2 · water / freedom"
      kickerClassName="text-[#7ec8c3]"
      title="Harbor"
      titleClassName="mt-3 font-[family-name:var(--font-brand-display)] text-6xl font-semibold italic leading-[0.9] tracking-[-0.045em] sm:text-7xl"
      intro={
        <>
          A complete ocean-passage world: deep navy, seafoam, brass, a low
          horizon, and a manifest rather than a task card. Freedom is casting
          off toward open water. Nothing here borrows Dawn&apos;s mountain
          layers or Contour&apos;s forest map.
        </>
      }
      type="Fraunces italic for the horizon voice · Outfit for navigation, dates, and manifests."
      color="Harbor #0D3344 · deep water #071F2B · seafoam #7EC8C3 · foam #EAF6F3 · brass #D5A95B."
      feeling="Tide height replaces elevation. The week stands like pier posts. Completion raises a striped buoy inside its mooring ring."
      detailClassName="text-[#7ec8c3]"
      signature={
        <span className="relative inline-flex size-12 items-center justify-center rounded-full border border-[#7ec8c3]">
          <span className="h-8 w-4 rounded-full border border-[#eaf6f3] bg-[linear-gradient(#d5a95b_0_35%,#eaf6f3_35%_55%,#7ec8c3_55%)]" />
        </span>
      }
      material={
        <div className="border-b border-[#7ec8c3]/50 pb-2 text-[10px] uppercase tracking-[0.2em]">
          04.7 kn · tide rising
        </div>
      }
      phoneLabel="Thursday home · Harbor"
    >
      <div className="relative min-h-[640px] overflow-hidden bg-[#0a2a39] pb-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-72"
          style={{
            background:
              "radial-gradient(circle at 82% 14%, rgba(213,169,91,.28), transparent 23%), linear-gradient(#16465b, #0c3445)",
          }}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 390 150"
          className="absolute inset-x-0 top-44 w-full"
        >
          <path
            d="M0 64c45-22 79 18 124 0s81 18 127 0 92 16 139-4v90H0Z"
            fill="#0f4051"
          />
          <path
            d="M0 92c47-20 82 15 128-2s80 16 126 0 91 13 136-5v65H0Z"
            fill="#0b3444"
          />
          <path
            d="M0 54c45-22 79 18 124 0s81 18 127 0 92 16 139-4"
            fill="none"
            stroke="#7ec8c3"
            strokeOpacity=".45"
          />
        </svg>
        <div className="relative px-5 pt-4">
          <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.2em] text-[#9cddd5]">
            <span>Passage 36</span>
            <span className="text-[#d5a95b]">Thu · Sep 3</span>
          </div>
          <p className="mt-8 font-[family-name:var(--font-brand-display)] text-4xl font-semibold italic leading-none">
            Open water
            <br />
            starts here.
          </p>
          <p className="mt-3 text-xs text-[#b7d6d3]">
            {BRAND_TODAY_LEFT} lines left on today&apos;s manifest.
          </p>
          <div className="mt-7 flex h-16 items-end justify-between border-b border-[#7ec8c3]/40 px-1">
            {BRAND_WEEK.map((day, index) => (
              <div
                key={`${day.label}-${day.date}-${index}`}
                className="flex w-8 flex-col items-center justify-end"
              >
                <span
                  className={cn(
                    "w-1.5 rounded-t-full",
                    day.kind === "today" ? "bg-[#d5a95b]" : "bg-[#7ec8c3]/60"
                  )}
                  style={{ height: TIDE_HEIGHTS[index] }}
                />
                <span className="mt-1 text-[8px] text-[#b7d6d3]">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-[8px] uppercase tracking-[0.16em] text-[#7ec8c3]">
            <span>Manifest</span>
            <span>
              {BRAND_WEEK_DONE}/{BRAND_WEEK_PLANNED} cleared
            </span>
          </div>
          <ul className="mt-2 space-y-2">
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="flex w-full items-center gap-3 rounded-[1.1rem_0.35rem_0.35rem_1.1rem] border border-[#356073] bg-[#10394a]/95 px-3 py-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "relative flex size-8 shrink-0 items-center justify-center rounded-full border",
                        done
                          ? "border-[#7ec8c3] bg-[#092a38]"
                          : "border-[#496f7e]"
                      )}
                      aria-hidden="true"
                    >
                      {done ? (
                        <span className="h-5 w-2.5 rounded-full bg-[linear-gradient(#d5a95b_0_35%,#eaf6f3_35%_55%,#7ec8c3_55%)]" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[13px] font-medium",
                          done && "text-[#7f9da2]"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="block text-[8px] uppercase tracking-[0.12em] text-[#7ec8c3]">
                        Berth {String(index + 1).padStart(2, "0")} · {row.meta}
                      </span>
                    </span>
                    <span className="text-[9px] text-[#d5a95b]">
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

export function AtelierConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="atelier"
      className="min-h-dvh bg-[#d8c39d] font-[family-name:var(--font-brand-sans)] text-[#2a2218]"
      kicker="Atmosphere A5 · old-school workshop"
      kickerClassName="text-[#8a4e37]"
      title="Atelier"
      titleClassName="mt-3 font-[family-name:var(--font-brand-display)] text-6xl font-semibold italic leading-[0.9] tracking-[-0.035em] sm:text-7xl"
      intro={
        <>
          Old-school without becoming Folio again. This is a working studio:
          plaster, oxidized copper, letterpress job tickets, pencil notes, and
          vermilion wax. The day feels made by hand, but the apparatus remains
          clear enough to use every morning.
        </>
      }
      type="Cormorant Garamond for the maker's voice · Karla for job numbers and work orders."
      color="Plaster #E4D5B8 · ochre #C6A46A · charcoal #2A2218 · copper #6F8175 · wax #B73D25."
      feeling="Perforation and impression replace newspaper rules. Every task is a work order; completion presses the atelier seal."
      detailClassName="text-[#8a4e37]"
      signature={
        <span className="inline-flex size-12 rotate-[-7deg] items-center justify-center rounded-full border-2 border-[#b73d25] bg-[#b73d25] font-[family-name:var(--font-brand-display)] text-lg italic text-[#f5e8cf] shadow-[inset_0_0_0_3px_#d56b51]">
          A
        </span>
      }
      material={
        <div className="border border-dashed border-[#6d5b43] bg-[#eadcc2] px-3 py-2 text-[9px] uppercase tracking-[0.16em]">
          Job 036 · bench 03
        </div>
      }
      phoneLabel="Thursday home · Atelier"
    >
      <div
        className="min-h-[640px] bg-[#e7d8bc] pb-8"
        style={{
          backgroundImage:
            "radial-gradient(rgba(42,34,24,.08) .7px, transparent .7px), linear-gradient(105deg, rgba(198,164,106,.18), transparent 45%)",
          backgroundSize: "5px 5px, auto",
        }}
      >
        <div className="border-b border-[#7e684c] px-5 py-3">
          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.18em]">
            <span>Atelier Goalmaxxing</span>
            <span className="text-[#6f8175]">Work order 36</span>
          </div>
        </div>
        <div className="px-5 pt-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a4e37]">
            On the bench · 3 September
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[3rem] font-semibold italic leading-none">
            Thursday&apos;s work
          </h2>
          <div className="mt-4 flex items-end justify-between">
            <p className="font-[family-name:var(--font-brand-display)] text-lg italic text-[#66543e]">
              {BRAND_TODAY_LEFT} pieces await your hand.
            </p>
            <span className="rotate-[-6deg] border border-[#b73d25] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#b73d25]">
              In progress
            </span>
          </div>
          <div className="mt-5 flex gap-1.5">
            {BRAND_WEEK.map((day, index) => (
              <div
                key={`${day.label}-${day.date}-${index}`}
                className={cn(
                  "flex flex-1 flex-col items-center border border-dashed px-1 py-2",
                  day.kind === "today"
                    ? "border-[#b73d25] bg-[#f0e2c7]"
                    : "border-[#9f8968]"
                )}
              >
                <span className="text-[8px] uppercase">{day.label}</span>
                <span className="font-[family-name:var(--font-brand-display)] text-base">
                  {day.date}
                </span>
              </div>
            ))}
          </div>
          <ul className="mt-5 space-y-3">
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="relative flex w-full items-center gap-3 border border-[#8f7655] bg-[#f1e4ca] px-3 py-3 text-left shadow-[3px_4px_0_rgba(111,129,117,.22)]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-1.5 border-r border-dashed border-[#a58b66] bg-[#d8c39d]"
                    />
                    <span className="ml-1 w-5 shrink-0 text-[9px] font-semibold text-[#8a4e37]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-[family-name:var(--font-brand-display)] text-xl font-semibold leading-none",
                          done && "text-[#82715c] line-through decoration-[#b73d25]"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.11em] text-[#6f8175]">
                        {row.meta}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex size-8 shrink-0 rotate-[-7deg] items-center justify-center rounded-full border text-[10px] font-bold",
                        done
                          ? "border-[#b73d25] bg-[#b73d25] text-[#f5e8cf] shadow-[inset_0_0_0_2px_#d56b51]"
                          : "border-dashed border-[#9f8968] text-transparent"
                      )}
                      aria-hidden="true"
                    >
                      A
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

export function RiverstoneConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="riverstone"
      className="min-h-dvh bg-[#d5e0db] font-[family-name:var(--font-brand-sans)] text-[#24302e]"
      kicker="Atmosphere A7 · water / nature"
      kickerClassName="text-[#426b64]"
      title="Riverstone"
      titleClassName="mt-3 font-[family-name:var(--font-brand-display)] text-6xl font-medium leading-[0.9] tracking-[-0.045em] sm:text-7xl"
      intro={
        <>
          Water without nautical equipment, nature without a topo map. The
          whole interface is mist, wet slate, lichen, and mineral stone. The
          emotional rhythm is patient rather than athletic: the current keeps
          moving while each completed action settles.
        </>
      }
      type="Source Serif 4 for names and reflection · Nunito Sans for soft-spoken controls."
      color="Mist #D5E0DB · mineral #EEF1EC · wet slate #24302E · current #4F7D74 · lichen #78906B."
      feeling="Irregular stone geometry replaces cards. The week is a shallow stream of pebbles. Completion settles a center stone and sends out a ripple."
      detailClassName="text-[#426b64]"
      signature={
        <span className="relative inline-flex size-14 items-center justify-center rounded-full border border-[#4f7d74]/45">
          <span className="absolute inset-2 rounded-full border border-[#4f7d74]/65" />
          <span
            className="size-5 bg-[#4f7d74]"
            style={{ borderRadius: "52% 48% 58% 42% / 45% 60% 40% 55%" }}
          />
        </span>
      }
      material={
        <div
          className="bg-[#eef1ec]/80 px-4 py-3 text-xs text-[#426b64] shadow-[0_8px_24px_rgba(36,48,46,.08)]"
          style={{ borderRadius: "46% 54% 48% 52% / 58% 42% 58% 42%" }}
        >
          current · steady
        </div>
      }
      phoneLabel="Thursday home · Riverstone"
    >
      <div
        className="relative min-h-[640px] overflow-hidden bg-[#dce6e1] pb-8"
        style={{
          background:
            "radial-gradient(ellipse at 14% 22%, rgba(255,255,255,.72), transparent 28%), radial-gradient(ellipse at 91% 38%, rgba(79,125,116,.16), transparent 35%), linear-gradient(145deg, #e8eeea, #c3d3cd)",
        }}
      >
        <div className="absolute -left-16 top-24 size-44 rounded-full border border-[#4f7d74]/15" />
        <div className="absolute -left-8 top-32 size-28 rounded-full border border-[#4f7d74]/15" />
        <div className="relative px-5 pt-5">
          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.18em] text-[#426b64]">
            <span>Riverstone</span>
            <span>Thu · 03</span>
          </div>
          <h2 className="mt-8 font-[family-name:var(--font-brand-display)] text-[2.8rem] font-medium leading-[0.94]">
            Let the day
            <br />
            find its course.
          </h2>
          <p className="mt-3 font-[family-name:var(--font-brand-display)] text-base italic text-[#526963]">
            {BRAND_TODAY_LEFT} stones yet to settle.
          </p>
          <div className="mt-6 flex items-center justify-between px-2">
            {BRAND_WEEK.map((day, index) => (
              <div key={`${day.label}-${day.date}-${index}`} className="text-center">
                <span
                  className={cn(
                    "mx-auto block size-7 border",
                    day.kind === "today"
                      ? "border-[#4f7d74] bg-[#78906b]"
                      : day.kind === "past"
                        ? "border-[#78906b]/50 bg-[#b7c8c1]"
                        : "border-[#8fa69d]/40 bg-[#e8eeea]"
                  )}
                  style={{
                    borderRadius:
                      index % 2 === 0
                        ? "55% 45% 60% 40% / 45% 58% 42% 55%"
                        : "44% 56% 42% 58% / 60% 43% 57% 40%",
                  }}
                />
                <span className="mt-1 block text-[8px] text-[#526963]">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
          <ul className="mt-6 space-y-2.5">
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="flex w-full items-center gap-3 border border-white/50 bg-[#edf2ef]/75 px-3 py-3 text-left shadow-[0_8px_24px_rgba(36,48,46,.07)] backdrop-blur-sm"
                    style={{
                      borderRadius:
                        index % 2 === 0
                          ? "24px 34px 28px 20px"
                          : "32px 22px 34px 24px",
                    }}
                  >
                    <span
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-full border",
                        done
                          ? "border-[#4f7d74]/35"
                          : "border-[#8fa69d]/45"
                      )}
                      aria-hidden="true"
                    >
                      {done ? (
                        <>
                          <span className="absolute inset-1 rounded-full border border-[#4f7d74]/55" />
                          <span
                            className="size-3.5 bg-[#4f7d74]"
                            style={{
                              borderRadius:
                                "55% 45% 60% 40% / 45% 58% 42% 55%",
                            }}
                          />
                        </>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-[family-name:var(--font-brand-display)] text-lg leading-tight",
                          done && "text-[#71827d]"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="block text-[9px] text-[#61756f]">
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
    </AtmosphereFrame>
  );
}

export function HeliosConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="helios"
      className="min-h-dvh bg-[#fff3dc] font-[family-name:var(--font-brand-sans)] text-[#3b1d0a]"
      kicker="Atmosphere A8 · warm futurism"
      kickerClassName="text-[#c2410c]"
      title="Helios"
      titleClassName="mt-3 font-[family-name:var(--font-brand-display)] text-6xl leading-[0.88] tracking-[-0.045em] sm:text-7xl"
      intro={
        <>
          A journey pulled toward light. Mediterranean travel posters,
          golden-hour film, and monumental editorial type become one optimistic
          product world. Unlike Dawn Ridge, Helios is heat and long shadow —
          not cool sky, distant mountain, or soft blue chrome.
        </>
      }
      type="DM Serif Display for the sun-sized day · DM Sans for clean, contemporary chrome."
      color="Warm white #FFF6E8 · solar #E6A21A · earth #C2410C · noon trace #7DD3FC."
      feeling="A radial sun orients the page; day markers are rays. Completion reveals a warm core and opens a soft corona."
      detailClassName="text-[#c2410c]"
      signature={
        <span className="relative inline-flex size-14 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#e6a21a]/20" />
          <span className="absolute inset-2 rounded-full bg-[#e6a21a]/35" />
          <span className="size-6 rounded-full bg-[#e6a21a]" />
        </span>
      }
      material={
        <span className="inline-block rounded-full bg-[#c2410c] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fff6e8]">
          Golden hour
        </span>
      }
      phoneLabel="Thursday home · Helios"
    >
      <div className="relative min-h-[640px] overflow-hidden bg-[#fff8ee] pb-8">
        <div
          aria-hidden="true"
          className="absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fff3b0 0%, #e6a21a 40%, rgba(125,211,252,.28) 58%, transparent 72%)",
          }}
        />
        <div className="relative px-5 pt-5">
          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a84416]">
            <span>Helios · week 36</span>
            <span>03 Sep</span>
          </div>
          <h2
            className="mt-20 text-center font-[family-name:var(--font-brand-display)] text-[3.2rem] leading-none"
            style={{ textShadow: "10px 12px 0 rgba(194,65,12,.08)" }}
          >
            Thursday
          </h2>
          <p className="mt-2 text-center text-xs text-[#8a4b1c]">
            {BRAND_TODAY_LEFT} steps still between you and noon.
          </p>
          <div className="mt-6 flex items-end justify-center gap-3">
            {BRAND_WEEK.map((day, index) => (
              <div
                key={`${day.label}-${day.date}-${index}`}
                className="flex flex-col items-center"
              >
                <span
                  className={cn(
                    "w-1.5 rounded-full",
                    day.kind === "today"
                      ? "h-11 bg-[#e6a21a]"
                      : day.kind === "past"
                        ? "h-7 bg-[#d9aa56]"
                        : "h-5 bg-[#edd8b5]"
                  )}
                />
                <span className="mt-1 text-[8px] font-semibold uppercase text-[#a55a26]">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
          <ul className="mt-6 space-y-2">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-[#f0d5a8] bg-white/80 px-3 py-3 text-left shadow-[0_12px_30px_rgba(194,65,12,.08)]"
                  >
                    <span
                      className="relative flex size-8 shrink-0 items-center justify-center"
                      aria-hidden="true"
                    >
                      {done ? (
                        <>
                          <span className="absolute inset-0 rounded-full bg-[#e6a21a]/25" />
                          <span className="absolute inset-1.5 rounded-full bg-[#e6a21a]/40" />
                          <span className="size-3.5 rounded-full bg-[#e6a21a]" />
                        </>
                      ) : (
                        <span className="size-4 rounded-full border border-[#d9aa56]" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-[family-name:var(--font-brand-display)] text-xl leading-tight",
                          done && "text-[#9f6c43] line-through"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-[#a55a26]">
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
    </AtmosphereFrame>
  );
}
