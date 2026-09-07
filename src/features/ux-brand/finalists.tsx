"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_TODAY_LEFT,
  BRAND_TODAY_ROWS,
  BRAND_WEEK,
  BRAND_WEEK_DONE,
  BRAND_WEEK_PLANNED,
} from "@/features/ux-brand/catalog";
import {
  NestMark,
  NestMarkPicker,
  nestMarkMeta,
  type NestMarkId,
} from "@/features/ux-brand/completion-marks";
import {
  MixShell,
  MixSpec,
  RidgeSilhouette,
  useBrandCompletions,
} from "@/features/ux-brand/mix-kit";

function useNestMark(initial: NestMarkId) {
  const [mark, setMark] = useState<NestMarkId>(initial);
  return { mark, setMark, meta: nestMarkMeta(mark) };
}

export function GazetteerSansConcept() {
  const { isDone, toggle } = useBrandCompletions();
  const { mark, setMark, meta } = useNestMark("page");

  return (
    <MixShell
      current="gazetteer-sans"
      pageClassName="bg-[#f3ead8] text-[#241c14]"
      kicker="Finalist · Gazetteer × sans"
      kickerClassName="text-[#9a4f2c]"
      title="Gazetteer Sans"
      titleClassName="font-[family-name:var(--font-brand-display)]"
      thesis="The surveyor’s place-name book, set in a newspaper grotesque. Same cream, stamp, and rise column — the serif chapter voice is gone so the page can feel like a modern index."
      type="Schibsted Grotesk names and labels · IBM Plex Mono rise"
      color="Cream #F3EAD8 · walnut · stamp rust #9A4F2C"
      feeling={`Idle is ${meta.idle}. Completing is ${meta.done}.`}
      phoneLabel="Thursday home · Gazetteer Sans"
      tools={
        <NestMarkPicker value={mark} onChange={setMark} className="text-[#9a4f2c]" />
      }
      specimens={
        <>
          <MixSpec title="Stamp">
            <span className="inline-block -rotate-6 border-2 border-[#9a4f2c] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a4f2c]">
              Thu 3 Sep
            </span>
          </MixSpec>
          <MixSpec title="Inner / outer">
            <div className="flex gap-4 text-[#9a4f2c]">
              <NestMark done={false} variant={mark} />
              <NestMark done variant={mark} />
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
          <h2 className="font-[family-name:var(--font-brand-display)] text-[2.4rem] font-semibold leading-none tracking-tight">
            Thursday
          </h2>
          <p className="mt-2 text-sm text-[#5c4e3f]">
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
                    className="grid w-full grid-cols-[2rem_minmax(0,1fr)_3.2rem_2rem] items-center gap-2 py-3 text-left"
                  >
                    <span className="font-[family-name:var(--font-brand-display)] text-sm font-medium tabular-nums text-[#9a4f2c]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-[family-name:var(--font-brand-display)] text-lg font-medium leading-none tracking-tight">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#7a6a56]">
                        {row.meta}
                      </span>
                    </span>
                    <span className="text-right font-[family-name:var(--font-brand-mono)] text-xs text-[#4a6740]">
                      {row.effort}
                    </span>
                    <NestMark done={done} variant={mark} className="text-[#9a4f2c]" />
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

export function ColSansConcept() {
  const { isDone, toggle } = useBrandCompletions();
  const { mark, setMark, meta } = useNestMark("pass");

  return (
    <MixShell
      current="col-sans"
      pageClassName="bg-[#efe8dc] text-[#2a241c]"
      kicker="Finalist · Col × sans"
      kickerClassName="text-[#b5522a]"
      title="Col Sans"
      titleClassName="font-[family-name:var(--font-brand-display)]"
      thesis="The pass between two peaks, set in a soft modern grotesque. Same parchment sky and ridge furniture — completing is something settling into the pass, not another stone on a pile."
      type="Figtree chapter and chrome · IBM Plex Mono gain"
      color="Parchment sky · ridge taupe · stamp rust · lichen on the done mark"
      feeling={`Idle is ${meta.idle}. Completing is ${meta.done}.`}
      phoneLabel="Thursday home · Col Sans"
      tools={
        <NestMarkPicker value={mark} onChange={setMark} className="text-[#b5522a]" />
      }
      specimens={
        <>
          <MixSpec title="Pass">
            <p className="font-[family-name:var(--font-brand-display)] text-3xl font-semibold tracking-tight">
              Col 36
            </p>
          </MixSpec>
          <MixSpec title="Inner / outer">
            <div className="flex gap-4 text-[#6e8b74]">
              <NestMark done={false} variant={mark} />
              <NestMark done variant={mark} />
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
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#b5522a]">
            Col {BRAND_WEEK_DONE} of {BRAND_WEEK_PLANNED}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.5rem] font-semibold leading-[0.95] tracking-tight">
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
                <span className="font-[family-name:var(--font-brand-display)] text-sm font-medium">
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
                    <NestMark
                      done={done}
                      variant={mark}
                      className={done ? "text-[#6e8b74]" : "text-[#c4a992]"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-[family-name:var(--font-brand-display)] text-xl font-medium leading-none tracking-tight">
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
