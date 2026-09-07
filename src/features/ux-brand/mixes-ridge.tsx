"use client";

import { cn } from "@/lib/utils";
import {
  BRAND_TODAY_LEFT,
  BRAND_TODAY_ROWS,
  BRAND_WEEK,
  BRAND_WEEK_DONE,
  BRAND_WEEK_PLANNED,
  ELEVATION_PROFILE,
} from "@/features/ux-brand/catalog";
import {
  MixShell,
  MixSpec,
  RidgeSilhouette,
  StackMark,
  useBrandCompletions,
} from "@/features/ux-brand/mix-kit";

export function AlpenglowConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="alpenglow"
      pageClassName="bg-[#f4ece3] text-[#2a2420]"
      kicker="Mix 7 · Folio × Dawn Ridge"
      kickerClassName="text-[#c47a5a]"
      title="Alpenglow"
      titleClassName="font-[family-name:var(--font-brand-display)]"
      thesis="Dawn Ridge’s sky and peach sun, with Folio’s literary Thursday. The mountain light is the brand. The journal voice is the type."
      type="Newsreader display · Instrument Sans labels"
      color="Peach sun · parchment sky · cool ridge · walnut titles"
      feeling="Idle is one blue stone. Completing stacks a peach stone on top of it."
      phoneLabel="Thursday home · Alpenglow"
      specimens={
        <>
          <MixSpec title="Light">
            <p className="font-[family-name:var(--font-brand-display)] text-2xl italic">
              Before the climb
            </p>
          </MixSpec>
          <MixSpec title="Stack">
            <div className="flex gap-4 text-[#c47a5a]">
              <StackMark done={false} variant="cairn" />
              <StackMark done variant="cairn" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="relative min-h-[640px] overflow-hidden pb-8">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 80% 8%, rgba(247,210,180,0.95), transparent 32%), linear-gradient(180deg, #f0d9c6 0%, #f4f1ea 42%, #d9cfc4 100%)",
          }}
        />
        <RidgeSilhouette className="text-[#9aaeb8]" />
        <div className="relative px-5 pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#c47a5a]">
            This week · {BRAND_WEEK_DONE}/{BRAND_WEEK_PLANNED}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.7rem] leading-[0.9]">
            Thursday
          </h2>
          <p className="mt-2 font-[family-name:var(--font-brand-display)] text-lg italic opacity-70">
            {BRAND_TODAY_LEFT} left in the light.
          </p>
          <ul className="mt-6 space-y-2">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = isDone(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/55 px-3 py-3 text-left backdrop-blur-sm"
                  >
                    <StackMark
                      done={done}
                      variant="cairn"
                      className={done ? "text-[#c47a5a]" : "text-[#6a8aa0]"}
                    />
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

export function SwitchbackConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="switchback"
      pageClassName="bg-[#e8eef3] text-[#243038]"
      kicker="Mix 8 · Contour × Dawn Ridge"
      kickerClassName="text-[#3b6ea8]"
      title="Switchback"
      thesis="Contour’s week-as-elevation, recast in Dawn Ridge air. No forest green. The hairpin you are on is Thursday."
      type="Instrument Sans · IBM Plex Mono gain"
      color="Sky #E7EEF2 · slate trail · peach miss · landing-blue you-are-here"
      feeling="Idle is a single-peak sparkline. Completing adds a second peak — stacking as topography."
      phoneLabel="Thursday home · Switchback"
      specimens={
        <>
          <MixSpec title="Hairpin">
            <p className="font-[family-name:var(--font-brand-mono)] text-sm">Today = marker 5</p>
          </MixSpec>
          <MixSpec title="Stack">
            <div className="flex gap-4 text-[#3b6ea8]">
              <StackMark done={false} variant="notch" />
              <StackMark done variant="notch" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="relative min-h-[640px] bg-[#eef3f6] pb-8">
        <div className="px-4 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#3b6ea8]">
            Ridge 36
          </p>
          <h2 className="mt-1 text-[1.85rem] font-semibold tracking-tight">
            Thursday switchback
          </h2>
          <p className="mt-1 text-sm opacity-70">
            {BRAND_TODAY_LEFT} hairpins left · {BRAND_WEEK_DONE}/{BRAND_WEEK_PLANNED}
          </p>
          <svg viewBox="0 0 140 54" className="mt-4 w-full">
            <polyline
              fill="none"
              stroke="#c5d3dc"
              strokeWidth="2"
              points={ELEVATION_PROFILE.map((y, x) => `${x * 22},${52 - y * 0.5}`).join(" ")}
            />
            <polyline
              fill="none"
              stroke="#3b6ea8"
              strokeWidth="3"
              strokeLinejoin="round"
              points={ELEVATION_PROFILE.slice(0, 5)
                .map((y, x) => `${x * 22},${52 - y * 0.5}`)
                .join(" ")}
            />
            <circle cx="88" cy={52 - 58 * 0.5} r="4" fill="#1d4ed8" />
          </svg>
          <div className="mt-1 flex justify-between font-[family-name:var(--font-brand-mono)] text-[10px] opacity-60">
            {BRAND_WEEK.map((day, index) => (
              <span
                key={`${day.label}-${day.date}-${index}`}
                className={cn(day.kind === "today" && "font-semibold text-[#1d4ed8]")}
              >
                {day.label}
                {day.date}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = isDone(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/80 px-3 py-3 text-left"
                  >
                    <StackMark done={done} variant="notch" className="text-[#3b6ea8]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{row.title}</span>
                      <span className="text-xs opacity-60">{row.meta}</span>
                    </span>
                    <span className="font-[family-name:var(--font-brand-mono)] text-xs text-[#3b6ea8]">
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

export function LookoutConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="lookout"
      pageClassName="bg-[#e6eef4] text-[#243038]"
      kicker="Mix 11 · Dawn Ridge × Contour"
      kickerClassName="text-[#1d4ed8]"
      title="Lookout"
      thesis="Dawn’s architectural remaining count, Contour’s you-are-here on the ridge, and one Folio italic caption. Glance first. List second."
      type="Instrument Sans. Italic caption only."
      color="Open sky · ridge blue-gray · peach sun · walnut caption"
      feeling="Idle is one disc. Completing stacks a second disc offset on top — not a fill."
      phoneLabel="Thursday home · Lookout"
      specimens={
        <>
          <MixSpec title="Glance">
            <p className="text-5xl font-semibold tracking-[-0.07em]">{BRAND_TODAY_LEFT}</p>
          </MixSpec>
          <MixSpec title="Stack">
            <div className="flex gap-4 text-[#1d4ed8]">
              <StackMark done={false} variant="coins" />
              <StackMark done variant="coins" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="relative min-h-[640px] overflow-hidden pb-8">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 78% 12%, rgba(247,236,214,0.95), transparent 36%), linear-gradient(180deg, #dfe8ee 0%, #f4f1ea 48%, #e8dfd2 100%)",
          }}
        />
        <RidgeSilhouette className="text-[#b7c4b8]" />
        <div className="relative px-5 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#1d4ed8]">
            Lookout
          </p>
          <p className="mt-1 text-[4.1rem] font-semibold leading-none tracking-[-0.07em]">
            {BRAND_TODAY_LEFT}
          </p>
          <p className="mt-1 font-[family-name:var(--font-brand-display)] text-sm italic opacity-70">
            left on the ridge · {BRAND_WEEK_DONE} of {BRAND_WEEK_PLANNED} this week
          </p>
          <ul className="mt-6 space-y-2">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = isDone(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/75 px-3 py-3 text-left"
                  >
                    <StackMark done={done} variant="coins" className="text-[#1d4ed8]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold tracking-tight">
                        {row.title}
                      </span>
                      <span className="text-xs opacity-60">{row.meta}</span>
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

export function MeridianConcept() {
  const { isDone, toggle } = useBrandCompletions();
  return (
    <MixShell
      current="meridian"
      pageClassName="bg-[#e4eaee] text-[#1e2a32]"
      kicker="Mix 12 · Contour × Dawn Ridge"
      kickerClassName="text-[#4d6d82]"
      title="Meridian"
      thesis="The elevation plot is the product. Dawn’s packing and Contour’s trace, without trail-card chrome. A meridian you can read."
      type="Instrument Sans · IBM Plex Mono on the axis"
      color="Cool blue-gray · parchment plot · peach today-mark"
      feeling="Idle is one rise segment. Completing stacks a second segment onto the bar."
      phoneLabel="Thursday home · Meridian"
      specimens={
        <>
          <MixSpec title="Axis">
            <p className="font-[family-name:var(--font-brand-mono)] text-sm">0 — 88 m</p>
          </MixSpec>
          <MixSpec title="Stack">
            <div className="flex gap-4 text-[#4d6d82]">
              <StackMark done={false} variant="segments" />
              <StackMark done variant="segments" />
            </div>
          </MixSpec>
        </>
      }
    >
      <div className="min-h-[640px] bg-[#eef2f4] pb-8">
        <div className="px-4 pt-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#4d6d82]">
            Meridian · Week 36
          </p>
          <p className="mt-2 text-[3.4rem] font-semibold leading-none tracking-[-0.06em]">
            {BRAND_TODAY_LEFT}
            <span className="ml-2 text-base font-medium opacity-60">left</span>
          </p>
          <svg viewBox="0 0 140 64" className="mt-3 w-full">
            <polyline
              fill="rgba(77,109,130,0.12)"
              stroke="#4d6d82"
              strokeWidth="2.5"
              points={`0,64 ${ELEVATION_PROFILE.map((y, x) => `${x * 22},${60 - y * 0.55}`).join(" ")} 132,64`}
            />
            <circle cx="88" cy={60 - 58 * 0.55} r="4" fill="#c47a5a" />
          </svg>
          <div className="mt-1 flex justify-between font-[family-name:var(--font-brand-mono)] text-[10px] opacity-60">
            {BRAND_WEEK.map((day, index) => (
              <span key={`${day.label}-${day.date}-${index}`}>
                {day.label}
                {day.date}
              </span>
            ))}
          </div>
          <ul className="mt-4 divide-y divide-[#c5d0d6]">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = isDone(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <StackMark done={done} variant="segments" className="text-[#4d6d82]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{row.title}</span>
                      <span className="text-xs opacity-60">{row.meta}</span>
                    </span>
                    <span className="font-[family-name:var(--font-brand-mono)] text-xs">
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
