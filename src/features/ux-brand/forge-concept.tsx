"use client";

import { useState } from "react";
import {
  BRAND_TODAY_LEFT,
  BRAND_TODAY_ROWS,
  BRAND_WEEK,
  BRAND_WEEK_DONE,
  BRAND_WEEK_PLANNED,
} from "@/features/ux-brand/catalog";
import {
  BrandExploreBar,
  BrandPhone,
  BrandSpec,
  BrandSpecGrid,
} from "@/features/ux-brand/brand-stage";
import { cn } from "@/lib/utils";

export function ForgeConcept() {
  const [tempoDone, setTempoDone] = useState(false);

  return (
    <div className="min-h-dvh bg-[#070708] text-[#f6f1ea]">
      <BrandExploreBar current="forge" />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:py-12">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e31c25]">
            Direction 1 · screenshot lineage
          </p>
          <h1
            className="mt-3 font-[family-name:var(--font-brand-display)] text-5xl leading-[0.9] tracking-tight sm:text-6xl"
          >
            Forge
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#b7b0a6]">
            Elite performance. The only direction allowed to take the Kumar
            reel seriously: a dark field, one violent red, and a display serif
            large enough to stand behind the work. Peloton, SNKRS, and Whoop
            all prove that consumer apps can feel cinematic without becoming a
            marketing page.
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#e31c25]">
                Type
              </dt>
              <dd>Playfair Display SC / Playfair Display / DM Sans</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#e31c25]">
                Color
              </dt>
              <dd>Charcoal #070708 · ivory #F6F1EA · red #E31C25</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#e31c25]">
                Feeling in the UI
              </dt>
              <dd>
                The word ASCENT sits behind Thursday. Completing an item cuts a
                red slash. Radius stays tight. Green is banned.
              </dd>
            </div>
          </dl>
          <BrandSpecGrid>
            <BrandSpec title="Buttons">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-sm bg-[#e31c25] px-4 py-2 text-xs font-semibold tracking-wide text-white"
                >
                  Start session
                </button>
                <button
                  type="button"
                  className="rounded-sm border border-[#3a3a3e] px-4 py-2 text-xs tracking-wide"
                >
                  Adapt
                </button>
              </div>
            </BrandSpec>
            <BrandSpec title="Progress">
              <div className="flex h-16 items-end gap-1">
                {Array.from({ length: 10 }, (_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-3",
                      index < BRAND_WEEK_DONE ? "bg-[#e31c25]" : "bg-[#2a2a2e]"
                    )}
                    style={{ height: `${28 + index * 4}px` }}
                  />
                ))}
              </div>
              <p className="mt-2 font-[family-name:var(--font-brand-display)] text-lg">
                {BRAND_WEEK_DONE} / {BRAND_WEEK_PLANNED}
              </p>
            </BrandSpec>
          </BrandSpecGrid>
        </div>

        <BrandPhone label="Thursday home · Forge" className="text-[#f6f1ea]">
          <div className="relative min-h-[640px] overflow-hidden bg-[#070708] pb-8">
            <p
              aria-hidden="true"
              className="pointer-events-none absolute -left-5 top-[17.5rem] z-0 select-none font-[family-name:var(--font-brand-display-sc)] text-[6.6rem] leading-[0.78] tracking-[-0.04em] text-[#e31c25]"
            >
              ASCENT
            </p>
            <div className="relative z-10 px-5 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b7b0a6]">
                Session · 03 Sep
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.35rem] leading-none">
                Thursday
              </h2>
              <p className="mt-2 text-sm text-[#b7b0a6]">
                {BRAND_TODAY_LEFT} still open. Maya finished Yoga.
              </p>
              <div className="mt-5 flex gap-1 bg-[#070708]/80">
                {BRAND_WEEK.map((day, index) => (
                  <div
                    key={`${day.label}-${day.date}-${index}`}
                    className={cn(
                      "flex h-12 flex-1 flex-col items-center justify-center text-[10px]",
                      day.kind === "today" && "bg-[#e31c25] text-white",
                      day.kind === "miss" && "text-[#e31c25]"
                    )}
                  >
                    <span className="opacity-70">{day.label}</span>
                    <span className="font-[family-name:var(--font-brand-display)] text-sm">
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="mt-6 space-y-0">
                {BRAND_TODAY_ROWS.map((row) => {
                  const done = row.id === "tempo-run" ? tempoDone : row.state === "done";
                  return (
                    <li key={row.id} className="border-t border-[#2a2a2e]">
                      <button
                        type="button"
                        onClick={() => {
                          if (row.id === "tempo-run") {
                            setTempoDone((value) => !value);
                          }
                        }}
                        className="flex w-full items-center gap-3 py-3 text-left"
                      >
                        <span
                          className={cn(
                            "grid size-5 place-items-center border",
                            done
                              ? "border-[#e31c25] bg-[#e31c25]"
                              : "border-[#f6f1ea]/40"
                          )}
                          aria-hidden="true"
                        >
                          {done ? (
                            <span className="block h-[2px] w-3 rotate-[-28deg] bg-white" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block font-[family-name:var(--font-brand-display)] text-xl leading-none",
                              done && "text-[#b7b0a6] line-through decoration-[#e31c25]"
                            )}
                          >
                            {row.title}
                          </span>
                          <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-[#8c857c]">
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
        </BrandPhone>
      </main>
    </div>
  );
}
