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

export function FolioConcept() {
  const [tempoDone, setTempoDone] = useState(false);

  return (
    <div className="min-h-dvh bg-[#efe6d6] text-[#241c14]">
      <BrandExploreBar current="folio" />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:py-12">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b5522a]">
            Direction 3 · editorial journey
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-brand-display)] text-5xl leading-[0.95] sm:text-6xl">
            Folio
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#5c4e3f]">
            Completing a journey as a book you can hold. Polarsteps turns trips
            into bound volumes. Letterboxd splits Graphik chrome from Tiempos
            prose so the product can feel like a magazine without becoming
            cinema-dark. Day One treats a date as an entry, not a cell. This
            direction is paper, ink, and chapter marks — not athletics.
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#b5522a]">
                Type
              </dt>
              <dd>Newsreader for the story · Source Sans 3 for the apparatus</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#b5522a]">
                Color
              </dt>
              <dd>Cream #EFE6D6 · walnut #241C14 · stamp #B5522A · rule #C8B79A</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#b5522a]">
                Feeling in the UI
              </dt>
              <dd>
                Running heads like a printed book. Dates are stamps. Completion
                is a marginal check and a struck line, the way you mark a
                journal.
              </dd>
            </div>
          </dl>
          <BrandSpecGrid>
            <BrandSpec title="Chapter mark">
              <p className="font-[family-name:var(--font-brand-display)] text-3xl italic">
                Ch. 36
              </p>
            </BrandSpec>
            <BrandSpec title="Stamp">
              <span className="inline-block rotate-[-8deg] rounded-sm border-2 border-[#b5522a] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b5522a]">
                3 Sep 2026
              </span>
            </BrandSpec>
          </BrandSpecGrid>
        </div>

        <BrandPhone label="Thursday home · Folio">
          <div className="min-h-[640px] bg-[#f7f0e2] pb-8">
            <div className="border-b border-[#c8b79a] px-5 py-3">
              <div className="flex items-baseline justify-between font-[family-name:var(--font-brand-sans)] text-[10px] uppercase tracking-[0.18em] text-[#7a6a56]">
                <span>Goalmaxxing</span>
                <span>Week 36</span>
              </div>
            </div>
            <div className="px-5 pt-4">
              <p className="font-[family-name:var(--font-brand-sans)] text-[11px] uppercase tracking-[0.16em] text-[#b5522a]">
                Chapter {BRAND_WEEK_DONE} of {BRAND_WEEK_PLANNED}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.6rem] leading-[0.9]">
                Thursday
              </h2>
              <p className="mt-2 font-[family-name:var(--font-brand-display)] text-lg italic text-[#5c4e3f]">
                {BRAND_TODAY_LEFT} entries still open in today’s page.
              </p>
              <div className="mt-4 flex gap-2">
                {BRAND_WEEK.map((day, index) => (
                  <div
                    key={`${day.label}-${day.date}-${index}`}
                    className={cn(
                      "flex flex-1 flex-col items-center border-t border-[#c8b79a] pt-2 text-[10px]",
                      day.kind === "today" && "border-[#b5522a] text-[#b5522a]"
                    )}
                  >
                    <span>{day.label}</span>
                    <span className="font-[family-name:var(--font-brand-display)] text-base">
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="mt-5">
                {BRAND_TODAY_ROWS.map((row, index) => {
                  const done = row.id === "tempo-run" ? tempoDone : row.state === "done";
                  return (
                    <li
                      key={row.id}
                      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 border-t border-[#c8b79a] py-3"
                    >
                      <span className="font-[family-name:var(--font-brand-display)] text-sm italic text-[#b5522a]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (row.id === "tempo-run") {
                            setTempoDone((value) => !value);
                          }
                        }}
                        className="text-left"
                      >
                        <span
                          className={cn(
                            "block font-[family-name:var(--font-brand-display)] text-[1.35rem] leading-tight",
                            done && "text-[#7a6a56] line-through decoration-[#b5522a]"
                          )}
                        >
                          {row.title}
                        </span>
                        <span className="mt-1 block font-[family-name:var(--font-brand-sans)] text-[11px] uppercase tracking-[0.12em] text-[#7a6a56]">
                          {row.meta}
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
