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

const PROFILE = [18, 28, 12, 42, 58, 64, 88];

export function ContourConcept() {
  const [tempoDone, setTempoDone] = useState(false);

  return (
    <div className="min-h-dvh bg-[#f2f4f1] text-[#1a1c18]">
      <BrandExploreBar current="contour" />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:py-12">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3d6b2f]">
            Direction 2 · outdoor cartography
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Contour
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#5c6156]">
            Progress as elevation. AllTrails and Komoot make the route the
            product: a polyline you can trust, a gain number, a paper-colored
            map. Relive turns a finished trace into a memory. The week is not
            a dashboard. It is a ridge you can point to.
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#3d6b2f]">
                Type
              </dt>
              <dd>IBM Plex Sans · IBM Plex Mono for metres and dates</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#3d6b2f]">
                Color
              </dt>
              <dd>Paper #F2F4F1 · forest #3D6B2F · strain #C77700 · miss #B3261E</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-[#3d6b2f]">
                Feeling in the UI
              </dt>
              <dd>
                Contour lines behind every surface. Completing an item extends
                the green trace. Missed Tuesday is a break in the ridge, not a
                shame badge.
              </dd>
            </div>
          </dl>
          <BrandSpecGrid>
            <BrandSpec title="Trail pills">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#3d6b2f] px-3 py-1 text-xs text-white">
                  Easy
                </span>
                <span className="rounded-full bg-[#c77700] px-3 py-1 text-xs text-white">
                  Moderate
                </span>
                <span className="rounded-full bg-[#b3261e] px-3 py-1 text-xs text-white">
                  Recover
                </span>
              </div>
            </BrandSpec>
            <BrandSpec title="Elevation">
              <p className="font-[family-name:var(--font-brand-mono)] text-2xl tabular-nums">
                +{240 + 80 + 40} m
                <span className="ml-2 text-sm text-[#5c6156]">today</span>
              </p>
            </BrandSpec>
          </BrandSpecGrid>
        </div>

        <BrandPhone label="Thursday home · Contour">
          <div className="relative min-h-[640px] bg-[#f7f8f5] pb-8">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
            >
              {Array.from({ length: 14 }, (_, index) => (
                <ellipse
                  key={index}
                  cx="50%"
                  cy="58%"
                  rx={40 + index * 18}
                  ry={18 + index * 10}
                  fill="none"
                  stroke="#7a8a72"
                  strokeWidth="0.8"
                />
              ))}
            </svg>
            <div className="relative px-4 pt-2">
              <p className="font-[family-name:var(--font-brand-mono)] text-[11px] text-[#3d6b2f]">
                Ridge 36 · Sep 3
              </p>
              <h2 className="mt-1 text-[1.85rem] font-semibold leading-none tracking-tight">
                Thursday trail
              </h2>
              <p className="mt-2 text-sm text-[#5c6156]">
                {BRAND_TODAY_LEFT} waypoints left · {BRAND_WEEK_DONE}/
                {BRAND_WEEK_PLANNED} this week
              </p>
              <svg viewBox="0 0 140 54" className="mt-4 w-full">
                <polyline
                  fill="none"
                  stroke="#c5cebf"
                  strokeWidth="2"
                  points={PROFILE.map((y, x) => `${x * 22},${52 - y * 0.5}`).join(" ")}
                />
                <polyline
                  fill="none"
                  stroke="#3d6b2f"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  points={PROFILE.slice(0, 5)
                    .map((y, x) => `${x * 22},${52 - y * 0.5}`)
                    .join(" ")}
                />
                <circle cx="88" cy={52 - 58 * 0.5} r="4" fill="#3d6b2f" />
              </svg>
              <div className="mt-2 flex justify-between font-[family-name:var(--font-brand-mono)] text-[10px] text-[#5c6156]">
                {BRAND_WEEK.map((day, index) => (
                  <span
                    key={`${day.label}-${day.date}-${index}`}
                    className={cn(day.kind === "today" && "font-semibold text-[#3d6b2f]")}
                  >
                    {day.label}
                    {day.date}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2">
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
                        className="flex w-full items-center gap-3 rounded-2xl border border-[#d5dbd0] bg-white/90 px-3 py-3 text-left"
                      >
                        <span
                          className={cn(
                            "size-8 rounded-full border-2",
                            done ? "border-[#3d6b2f] bg-[#3d6b2f]" : "border-[#3d6b2f]/40"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold">
                            {row.title}
                          </span>
                          <span className="text-xs text-[#5c6156]">{row.meta}</span>
                        </span>
                        <span className="font-[family-name:var(--font-brand-mono)] text-xs text-[#3d6b2f]">
                          {row.effort}
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
