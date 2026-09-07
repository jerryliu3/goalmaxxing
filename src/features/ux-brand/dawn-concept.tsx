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

export function DawnConcept() {
  const [tempoDone, setTempoDone] = useState(false);

  return (
    <div className="min-h-dvh bg-[#eef2f4] text-[#243038]">
      <BrandExploreBar current="dawn" />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:py-12">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3b6ea8]">
            Direction 4 · landing energy
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Dawn Ridge
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#5b6a73]">
            This is the 8/10 marketing craft brought inside the product: the
            landing mountain’s parchment sky, one idea per viewport, numbers
            large enough to orient you. Flighty packs status until it is
            obvious. Copilot treats a single figure as architecture. Apple
            Fitness opens on a glance, then the list. No serif theatre. Air
            is the brand.
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#3b6ea8]">
                Type
              </dt>
              <dd>Instrument Sans, wide tracking on labels, huge remaining count</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#3b6ea8]">
                Color
              </dt>
              <dd>Sky #E7EEF2 · parchment #F4F1EA · sun #F7ECD6 · action #1D4ED8</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#3b6ea8]">
                Feeling in the UI
              </dt>
              <dd>
                Ridges sit under the work, not as wallpaper. The first thing
                you read is how many remain. Completion lifts a pale disc into
                a filled sky-blue circle.
              </dd>
            </div>
          </dl>
          <BrandSpecGrid>
            <BrandSpec title="Glance">
              <p className="text-5xl font-semibold tracking-[-0.06em]">
                {BRAND_TODAY_LEFT}
                <span className="ml-2 text-base font-medium text-[#5b6a73]">
                  left
                </span>
              </p>
            </BrandSpec>
            <BrandSpec title="Action">
              <button
                type="button"
                className="rounded-full bg-[#1d4ed8] px-5 py-2 text-sm font-medium text-white"
              >
                Continue
              </button>
            </BrandSpec>
          </BrandSpecGrid>
        </div>

        <BrandPhone label="Thursday home · Dawn Ridge">
          <div className="relative min-h-[640px] overflow-hidden bg-[#e7eef2] pb-8">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 78% 12%, rgba(247,236,214,0.95), transparent 36%), linear-gradient(180deg, #dfe8ee 0%, #f4f1ea 48%, #e8dfd2 100%)",
              }}
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 390 220"
              className="absolute inset-x-0 bottom-0 w-full opacity-90"
            >
              <path
                d="M0 140 C70 120 110 150 170 128 C230 108 280 150 390 118 L390 220 L0 220 Z"
                fill="#c5d3dc"
              />
              <path
                d="M0 168 C90 148 140 176 210 158 C280 140 330 172 390 154 L390 220 L0 220 Z"
                fill="#b7c4b8"
              />
              <path
                d="M0 188 C80 176 150 198 230 184 C300 172 340 190 390 178 L390 220 L0 220 Z"
                fill="#c9b8a6"
              />
            </svg>
            <div className="relative px-5 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#3b6ea8]">
                This week
              </p>
              <p className="mt-2 text-[4.2rem] font-semibold leading-none tracking-[-0.07em]">
                {BRAND_TODAY_LEFT}
              </p>
              <p className="mt-1 text-sm text-[#5b6a73]">
                left today · {BRAND_WEEK_DONE} of {BRAND_WEEK_PLANNED} on the ridge
              </p>
              <div className="mt-5 flex gap-1.5">
                {BRAND_WEEK.map((day, index) => (
                  <div
                    key={`${day.label}-${day.date}-${index}`}
                    className={cn(
                      "flex h-14 flex-1 flex-col items-center justify-center rounded-2xl bg-white/70 text-[11px]",
                      day.kind === "today" && "bg-[#1d4ed8] text-white",
                      day.kind === "miss" && "ring-1 ring-[#d97706]"
                    )}
                  >
                    <span className="opacity-70">{day.label}</span>
                    <span className="text-sm font-semibold">{day.date}</span>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2">
                {BRAND_TODAY_ROWS.map((row) => {
                  const done = row.id === "tempo-run" ? tempoDone : row.state === "done";
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (row.id === "tempo-run") {
                            setTempoDone((value) => !value);
                          }
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white/80 px-3 py-3 text-left backdrop-blur-sm"
                      >
                        <span
                          className={cn(
                            "size-6 rounded-full border-2",
                            done
                              ? "border-[#3b6ea8] bg-[#3b6ea8]"
                              : "border-[#c5d3dc] bg-white"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-[15px] font-semibold tracking-tight",
                              done && "text-[#5b6a73]"
                            )}
                          >
                            {row.title}
                          </span>
                          <span className="text-xs text-[#5b6a73]">{row.meta}</span>
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
