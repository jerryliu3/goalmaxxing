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

const PATH =
  "M 18 92 C 48 88, 52 58, 78 52 S 118 78, 148 70 S 188 28, 218 34 S 258 62, 292 48 S 338 18, 372 22";

export function WaypathConcept() {
  const [tempoDone, setTempoDone] = useState(false);

  return (
    <div className="min-h-dvh bg-[#f3ebe3] text-[#3a2a24]">
      <BrandExploreBar current="waypath" />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:py-12">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c46a48]">
            Direction 5 · embarking
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-brand-display)] text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-6xl">
            Waypath
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#6a574c]">
            Adventure as a line of cairns. Monument Valley and Alto’s Odyssey
            make progress feel like walking through quiet architecture — stacked
            stones, dusk color, the next landing obvious. Polarsteps plots a
            trip as dots on a route. This is not Duolingo: no owl, no cartoon
            green, no guilt chest. The path is the chrome.
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#c46a48]">
                Type
              </dt>
              <dd>Syne for display · Outfit for the trail labels</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#c46a48]">
                Color
              </dt>
              <dd>Sand #F3EBE3 · terracotta #C46A48 · dusk #6D5B7A · lichen #6E8B74</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#c46a48]">
                Feeling in the UI
              </dt>
              <dd>
                The week is a winding path of stones. Today is the cairn you
                stand on. Completing a row stacks a second stone on the marker.
              </dd>
            </div>
          </dl>
          <BrandSpecGrid>
            <BrandSpec title="Cairn">
              <div className="flex h-12 items-end gap-1">
                <span className="h-4 w-8 rounded-sm bg-[#c46a48]" />
                <span className="h-6 w-6 rounded-sm bg-[#6d5b7a]" />
                <span className="h-3 w-10 rounded-sm bg-[#6e8b74]" />
              </div>
            </BrandSpec>
            <BrandSpec title="Waypoint">
              <p className="font-[family-name:var(--font-brand-display)] text-2xl font-extrabold">
                Stone 4
              </p>
            </BrandSpec>
          </BrandSpecGrid>
        </div>

        <BrandPhone label="Thursday home · Waypath">
          <div className="relative min-h-[640px] overflow-hidden bg-[#f7f0e8] pb-8">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, #e7d7c8 0%, #f7f0e8 38%, #d8c4b4 100%)",
              }}
            />
            <div className="relative px-4 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c46a48]">
                Waypoint {BRAND_WEEK_DONE} of {BRAND_WEEK_PLANNED}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-[2.4rem] font-extrabold leading-none">
                Thursday
              </h2>
              <p className="mt-2 text-sm text-[#6a574c]">
                {BRAND_TODAY_LEFT} stones still to place today.
              </p>
              <svg viewBox="0 0 390 110" className="mt-3 w-full">
                <path
                  d={PATH}
                  fill="none"
                  stroke="#c4a992"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d={PATH}
                  fill="none"
                  stroke="#c46a48"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="240 400"
                />
                {BRAND_WEEK.map((day, index) => {
                  const x = 18 + index * 58;
                  const y = [92, 70, 52, 70, 34, 48, 22][index] ?? 50;
                  const today = day.kind === "today";
                  return (
                    <g key={`${day.label}-${day.date}-${index}`}>
                      <rect
                        x={x - 9}
                        y={y - 7}
                        width={today ? 22 : 18}
                        height={today ? 16 : 12}
                        rx="2"
                        fill={today ? "#c46a48" : day.kind === "miss" ? "#6d5b7a" : "#efe0d2"}
                        stroke="#3a2a24"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={y + 22}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#6a574c"
                      >
                        {day.label}
                        {day.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <ul className="mt-2 space-y-2">
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
                        className="flex w-full items-center gap-3 rounded-xl bg-[#fffaf4]/90 px-3 py-3 text-left shadow-[inset_0_0_0_1px_rgba(58,42,36,0.08)]"
                      >
                        <span className="flex w-6 flex-col items-center justify-end gap-0.5">
                          <span
                            className={cn(
                              "h-2 w-4 rounded-[1px]",
                              done ? "bg-[#6e8b74]" : "bg-transparent"
                            )}
                          />
                          <span
                            className={cn(
                              "h-2.5 w-5 rounded-[1px]",
                              done ? "bg-[#c46a48]" : "bg-[#e7d7c8]"
                            )}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-[family-name:var(--font-brand-display)] text-lg font-bold leading-none">
                            {row.title}
                          </span>
                          <span className="mt-1 block text-xs text-[#6a574c]">
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
