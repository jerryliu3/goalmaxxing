"use client";

import { useState, type ReactNode } from "react";
import { getTheme, THEMES, type ThemeId } from "@cadence/shared/brand";
import { StudyThemeAssets } from "@/components/brand/study-theme-assets";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { BrandExploreBar } from "@/features/ux-brand/brand-stage";
import { cn } from "@/lib/utils";
import { HueBoard, HueBoardCompact } from "./board";
import {
  HUE_JOBS,
  HUE_MIXES,
  HUE_TONES,
  hueReadout,
  LABEL_CONTRAST,
  LINE_CONTRAST,
  matchingMixId,
  resolveSecondHue,
  secondHueCandidates,
  SHIPPED_MIX,
  type HueMix,
  type SecondHue,
} from "./model";

/** Lightness ratio below which identity and second hue differ by hue alone. */
const HUE_ONLY_SEPARATION = 1.5;

function Choice({
  selected,
  onSelect,
  children,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
        selected
          ? "border-zinc-900 bg-white shadow-sm"
          : "border-zinc-200 bg-white/60 hover:border-zinc-400",
        className
      )}
    >
      {children}
    </button>
  );
}

function Fold({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-baseline gap-2 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-zinc-400 transition-transform group-open:rotate-90">
          ▸
        </span>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}

function Ratio({ label, value, floor }: { label: string; value: number; floor?: number }) {
  const fails = floor !== undefined && value < floor;
  return (
    <span className={cn("whitespace-nowrap", fails ? "text-red-700" : "text-zinc-700")}>
      {label} <span className="font-mono">{value.toFixed(1)}</span>
      {fails ? " · fails" : ""}
    </span>
  );
}

function Readout({ themeId, hue }: { themeId: ThemeId; hue: SecondHue }) {
  const readout = hueReadout(themeId, hue);
  const derived = hue.line !== hue.fill;
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      <Ratio label="Identity line" value={readout.identityLine} floor={LINE_CONTRAST} />
      <Ratio label="Second as line" value={readout.fillLine} floor={LINE_CONTRAST} />
      {derived ? <Ratio label="Line form" value={readout.secondLine} floor={LINE_CONTRAST} /> : null}
      <Ratio label="Label on second" value={readout.secondLabel} floor={LABEL_CONTRAST} />
      <span className={cn("whitespace-nowrap", readout.separation < HUE_ONLY_SEPARATION ? "text-amber-700" : "text-zinc-700")}>
        Separation <span className="font-mono">{readout.separation.toFixed(2)}</span>
        {readout.separation < HUE_ONLY_SEPARATION ? " · hue only" : ""}
      </span>
    </p>
  );
}

export function SecondHueStudy() {
  const { styleId } = useUiStyle();
  const [mix, setMix] = useState<HueMix>(SHIPPED_MIX);
  const [themeId, setThemeId] = useState<ThemeId>(styleId);
  const [candidates, setCandidates] = useState<Partial<Record<ThemeId, string>>>({});
  const mixId = matchingMixId(mix);
  const candidateFor = (id: ThemeId) => candidates[id] ?? "registry";
  const hueFor = (id: ThemeId) => resolveSecondHue(id, candidateFor(id));
  const themeCandidates = secondHueCandidates(themeId);
  const candidate = themeCandidates.find((option) => option.id === candidateFor(themeId)) ?? themeCandidates[0];

  return (
    <div className="min-h-dvh bg-[#f6f4f0] text-zinc-900">
      {THEMES.map((theme) => (
        <StudyThemeAssets key={theme.id} theme={theme} />
      ))}
      <BrandExploreBar current="second-hue" />
      <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Study · not a lock · not production
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Second hue</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600">
            Every colored mark does a job. Pick which color does each one, then
            read the result on production components in every theme. Identity
            is the theme&apos;s primary, second is its selection hue, ink is its
            foreground. Notes and findings: docs/ux/goalmaxxing-second-hue-study.md.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Mix</h2>
          <div role="radiogroup" aria-label="Mix" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {HUE_MIXES.map((option) => (
              <Choice key={option.id} selected={option.id === mixId} onSelect={() => setMix(option.mix)}>
                <span className="block font-medium">{option.name}</span>
                <span className="mt-1 block text-xs text-zinc-600">{option.premise}</span>
              </Choice>
            ))}
          </div>
          {mixId === null ? <p className="text-xs text-zinc-600">Custom mix.</p> : null}
        </section>

        <Fold title="Jobs" hint="What the mix changes. Click a tone to build a custom mix.">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white/60">
            {HUE_JOBS.map((job) => (
              <div
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {job.label} <span className="font-normal text-zinc-500">· {job.question}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{job.surfaces}</p>
                </div>
                <div role="radiogroup" aria-label={`${job.label} tone`} className="flex gap-1">
                  {HUE_TONES.map((tone) => (
                    <Choice
                      key={tone.id}
                      selected={mix[job.id] === tone.id}
                      onSelect={() => setMix({ ...mix, [job.id]: tone.id })}
                      className="px-2.5 py-1 text-xs"
                    >
                      {tone.label}
                    </Choice>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Fold>

        <Fold
          title="Every theme, same mix"
          hint="Each theme uses the second hue picked for it under Theme."
          defaultOpen
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {THEMES.map((theme) => (
              <div key={theme.id} className="space-y-2">
                <HueBoardCompact themeId={theme.id} mix={mix} hue={hueFor(theme.id)} />
                <Readout themeId={theme.id} hue={hueFor(theme.id)} />
              </div>
            ))}
          </div>
        </Fold>

        <Fold
          title="Theme"
          hint={`${getTheme(themeId).label} · ${candidate.name} · every component, one theme`}
        >
          <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <Choice key={theme.id} selected={theme.id === themeId} onSelect={() => setThemeId(theme.id)}>
                {theme.label}
              </Choice>
            ))}
          </div>
          {themeCandidates.length > 1 ? (
            <div role="radiogroup" aria-label={`${getTheme(themeId).label} second hue`} className="flex flex-wrap gap-2">
              {themeCandidates.map((option) => {
                const hue = resolveSecondHue(themeId, option.id);
                return (
                  <Choice
                    key={option.id}
                    selected={option.id === candidate.id}
                    onSelect={() => setCandidates({ ...candidates, [themeId]: option.id })}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      aria-hidden
                      className="size-5 rounded-full border border-black/10"
                      style={{ background: hue.fill, boxShadow: `inset 0 0 0 3px ${hue.line}` }}
                    />
                    {option.name}
                  </Choice>
                );
              })}
            </div>
          ) : null}
          <p className="text-xs text-zinc-600">
            {candidate.name}: {candidate.note}
          </p>
          <Readout themeId={themeId} hue={hueFor(themeId)} />
          <HueBoard themeId={themeId} mix={mix} hue={hueFor(themeId)} />
        </Fold>

        <section className="max-w-3xl space-y-2 text-sm text-zinc-700">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">What to look for</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Can you name what each color means after a few seconds, without the labels?</li>
            <li>Does the identity still feel like the theme&apos;s color, or has the second hue taken over?</li>
            <li>Does Save still read as the one thing to press?</li>
            <li>Do today and the selected day stay distinct when they are the same date?</li>
            <li>Do category pills stay the loudest color on the calendar?</li>
            <li>Do light second hues (Court, Opaline) still draw a visible rule or ring?</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
