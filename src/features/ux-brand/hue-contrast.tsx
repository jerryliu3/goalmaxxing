"use client";

import { useState, type CSSProperties } from "react";
import { NestMark } from "@/features/ux-brand/completion-marks";
import {
  BRAND_TODAY_LEFT,
  BRAND_TODAY_ROWS,
  BRAND_WEEK,
} from "@/features/ux-brand/catalog";
import {
  BrandExploreBar,
  BrandPhone,
} from "@/features/ux-brand/brand-stage";
import { useBrandCompletions } from "@/features/ux-brand/mix-kit";
import { cn } from "@/lib/utils";

const SELECTED_ROW_ID = "launch-notes";

const GAZETTEER_IDENTITY = "#9A4F2C";
const LIVE_IDENTITY = "#0F64BF";

interface HueOption {
  id: string;
  name: string;
  note: string;
  hex: string;
}

const GAZETTEER_HUES: readonly HueOption[] = [
  {
    id: "locked",
    name: "As locked",
    note: "Rust does both jobs",
    hex: GAZETTEER_IDENTITY,
  },
  {
    id: "prussian",
    name: "Prussian",
    note: "Harbor water",
    hex: "#2C6470",
  },
  {
    id: "copper",
    name: "Copper",
    note: "Atelier",
    hex: "#6F8175",
  },
  {
    id: "ice",
    name: "Ice",
    note: "Summit Night",
    hex: "#5A9AA8",
  },
];

const LIVE_HUES: readonly HueOption[] = [
  {
    id: "shipped",
    name: "As shipped",
    note: "Blue does both jobs",
    hex: LIVE_IDENTITY,
  },
  {
    id: "brass",
    name: "Brass",
    note: "Harbor",
    hex: "#C8892A",
  },
  {
    id: "peach",
    name: "Peach",
    note: "Warm second",
    hex: "#C47A5A",
  },
  {
    id: "seafoam",
    name: "Seafoam",
    note: "Harbor water",
    hex: "#3D8A86",
  },
];

function HueToggle({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly HueOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.name}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex min-w-[4.75rem] flex-col items-center gap-1.5 rounded-xl border px-2.5 py-2 text-center transition-colors",
              selected
                ? "border-zinc-900 bg-white shadow-sm"
                : "border-zinc-200 bg-white/70 hover:border-zinc-400"
            )}
          >
            <span
              className="size-8 rounded-full border border-black/10"
              style={{ background: option.hex }}
              aria-hidden="true"
            />
            <span className="text-[11px] font-medium leading-none text-zinc-900">
              {option.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GazetteerStudyPhone({ selection }: { selection: string }) {
  const { isDone, toggle } = useBrandCompletions();
  const identity = GAZETTEER_IDENTITY;
  const wash = `color-mix(in srgb, ${selection} 18%, #f8f1e3)`;

  return (
    <BrandPhone label="Gazetteer paper · rust stays the identity">
      <div className="min-h-[640px] bg-[#f8f1e3] pb-8 font-[family-name:var(--font-brand-sans)] text-[#241c14]">
        <div className="flex items-baseline justify-between border-b border-[#d4c4a4] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-[#7a6a56]">
          <span>Gazetteer</span>
          <span>Week 36</span>
        </div>
        <div className="px-5 pt-4">
          <h2 className="font-[family-name:var(--font-brand-display)] text-[2.35rem] leading-none">
            Thursday
          </h2>
          <p className="mt-2 font-[family-name:var(--font-brand-display)] text-base italic text-[#5c4e3f]">
            {BRAND_TODAY_LEFT} names still unlogged.
          </p>
          <div className="mt-4 flex justify-between border-b border-[#d4c4a4] pb-3">
            {BRAND_WEEK.map((day, index) => {
              const today = day.kind === "today";
              return (
                <div
                  key={`${day.label}-${day.date}-${index}`}
                  className="flex w-8 flex-col items-center gap-1 text-center"
                >
                  <span className="text-[9px] uppercase tracking-[0.12em] text-[#7a6a56]">
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "grid size-7 place-items-center font-[family-name:var(--font-brand-display)] text-sm",
                      today && "font-semibold text-white"
                    )}
                    style={
                      today
                        ? { background: selection, borderRadius: 4 }
                        : undefined
                    }
                  >
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-[2rem_minmax(0,1fr)_3.2rem] gap-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-[#7a6a56]">
            <span>No.</span>
            <span>Place</span>
            <span className="text-right">Rise</span>
          </div>
          <ul>
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = isDone(row.id);
              const selected = row.id === SELECTED_ROW_ID;
              return (
                <li key={row.id} className="border-b border-[#d4c4a4]">
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    aria-current={selected ? "true" : undefined}
                    className="grid w-full grid-cols-[2rem_minmax(0,1fr)_3.2rem_1.75rem] items-center gap-2 py-3 pl-2 text-left"
                    style={
                      selected
                        ? {
                            background: wash,
                            boxShadow: `inset 3px 0 0 ${selection}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="font-[family-name:var(--font-brand-display)] text-sm italic"
                      style={{ color: identity }}
                    >
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
                    <span style={{ color: identity }}>
                      <NestMark done={done} variant="nest" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </BrandPhone>
  );
}

function LiveStudyPhone({ selection }: { selection: string }) {
  const { isDone, toggle } = useBrandCompletions();
  const identity = LIVE_IDENTITY;
  const wash = `color-mix(in srgb, ${selection} 14%, #ffffff)`;
  const rowRadius: CSSProperties = { borderRadius: 14 };

  return (
    <BrandPhone
      label="Live app · blue and white, second hue only on today + selected"
      className="font-[family-name:var(--font-live-sans)] text-[#1c1c24]"
    >
      <div className="min-h-[640px] bg-[#fafafc] pb-8">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[13px] font-semibold" style={{ color: identity }}>
            Goalmaxxing
          </span>
          <span className="text-[11px] text-[#6b6b78]">Week 36</span>
        </div>
        <div className="px-5">
          <h2 className="text-[1.85rem] font-semibold tracking-tight">Today</h2>
          <p className="mt-1 text-sm text-[#6b6b78]">
            {BRAND_TODAY_LEFT} left · Thursday 3 Sep
          </p>
          <div className="mt-4 flex justify-between">
            {BRAND_WEEK.map((day, index) => {
              const today = day.kind === "today";
              return (
                <div
                  key={`${day.label}-${day.date}-${index}`}
                  className="flex w-10 flex-col items-center gap-1"
                >
                  <span className="text-[10px] font-medium text-[#6b6b78]">
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full text-[13px] font-medium",
                      today ? "text-white" : "bg-[#eef0f5] text-[#1c1c24]"
                    )}
                    style={today ? { background: selection } : undefined}
                  >
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
          <ul className="mt-5 space-y-2">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = isDone(row.id);
              const selected = row.id === SELECTED_ROW_ID;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    aria-current={selected ? "true" : undefined}
                    className="flex w-full items-center gap-3 border border-[#ececf1] bg-white px-3 py-3 text-left shadow-[0_1px_2px_rgba(28,28,36,0.04)]"
                    style={{
                      ...rowRadius,
                      ...(selected
                        ? {
                            background: wash,
                            borderColor: selection,
                            boxShadow: `inset 3px 0 0 ${selection}`,
                          }
                        : undefined),
                    }}
                  >
                    <span style={{ color: identity }}>
                      <NestMark done={done} variant="nest" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[15px] font-medium leading-none",
                          done && "text-[#8a8a96] line-through"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-[#6b6b78]">
                        {row.meta}
                      </span>
                    </span>
                    <span className="text-[11px] text-[#8a8a96]">{row.effort}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </BrandPhone>
  );
}

export function HueContrastStudy() {
  const [gazetteerHue, setGazetteerHue] = useState("locked");
  const [liveHue, setLiveHue] = useState("shipped");
  const gazetteer = GAZETTEER_HUES.find((hue) => hue.id === gazetteerHue) ?? GAZETTEER_HUES[0];
  const live = LIVE_HUES.find((hue) => hue.id === liveHue) ?? LIVE_HUES[0];

  return (
    <div className="min-h-dvh bg-[#f6f4f0] text-zinc-900">
      <BrandExploreBar current="hue-contrast" />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Study · not a lock · not production
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Hue contrast</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Gazetteer is rust and cream. The live app is blue and white. Flip only
          the second color used for <strong>today</strong> and the{" "}
          <strong>selected row</strong> (Launch notes). Nest fill stays the
          identity color. Tempo run still toggles completion.
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Gazetteer</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Identity stays rust. Selection is {gazetteer.name}.
            </p>
            <div className="mt-4">
              <HueToggle
                legend="Gazetteer selection hue"
                options={GAZETTEER_HUES}
                value={gazetteerHue}
                onChange={setGazetteerHue}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">{gazetteer.note}.</p>
            <div className="mt-6">
              <GazetteerStudyPhone selection={gazetteer.hex} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Live app</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Identity stays blue. Selection is {live.name}.
            </p>
            <div className="mt-4">
              <HueToggle
                legend="Live selection hue"
                options={LIVE_HUES}
                value={liveHue}
                onChange={setLiveHue}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">{live.note}.</p>
            <div className="mt-6">
              <LiveStudyPhone selection={live.hex} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
