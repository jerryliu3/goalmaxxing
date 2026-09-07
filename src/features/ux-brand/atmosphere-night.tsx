"use client";

import {
  BRAND_TODAY_LEFT,
  BRAND_TODAY_ROWS,
  BRAND_WEEK,
} from "@/features/ux-brand/catalog";
import {
  AtmosphereFrame,
  useTempoCompletion,
} from "@/features/ux-brand/atmosphere-frame";
import { cn } from "@/lib/utils";

export function NeonPassConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="neon-pass"
      className="min-h-dvh bg-[#08040e] font-[family-name:var(--font-brand-display)] text-[#f5eaff]"
      kicker="Atmosphere A4 · cyberpunk"
      kickerClassName="text-[#2de2ff]"
      title="Neon Pass"
      titleClassName="mt-2 font-[family-name:var(--font-brand-display)] text-6xl font-semibold uppercase leading-[0.82] tracking-[-0.035em] text-[#ff2bd6] sm:text-7xl"
      intro={
        <>
          A city route after midnight, built as one coherent machine:
          ultraviolet glass, cyan wayfinding, chamfered geometry, and terminal
          type. Unlike Forge, there is no heritage serif, athletic red, or
          slash. The emotional object is a luminous pass through the dark.
        </>
      }
      type="Rajdhani for compressed display and commands · IBM Plex Mono for route IDs and status."
      color="Void #08040E · ultraviolet #FF2BD6 · electric cyan #2DE2FF · phosphor #F5EAFF."
      feeling="Scan lines and clipped panels create the material. The week is a route graph. Completion ignites a diamond waypoint."
      detailClassName="text-[#2de2ff]"
      signature={
        <span className="relative inline-flex size-11 rotate-45 items-center justify-center border border-[#2de2ff] shadow-[0_0_18px_#2de2ff]">
          <span className="size-5 bg-[#ff2bd6] shadow-[0_0_16px_#ff2bd6]" />
        </span>
      }
      material={
        <div
          className="border border-[#ff2bd6]/60 bg-[#ff2bd6]/10 px-3 py-2 font-[family-name:var(--font-brand-mono)] text-[10px] text-[#2de2ff]"
          style={{
            clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
          }}
        >
          PASS::03 / LINK_UP
        </div>
      }
      phoneLabel="Thursday home · Neon Pass"
      phoneStyle={{ filter: "drop-shadow(0 24px 45px rgba(255,43,214,.16))" }}
    >
      <div
        className="relative min-h-[640px] overflow-hidden bg-[#0d0613] pb-8"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(45,226,255,.035) 0 1px, transparent 1px 4px), radial-gradient(circle at 90% 5%, rgba(255,43,214,.24), transparent 34%), linear-gradient(145deg, transparent 45%, rgba(45,226,255,.08) 45% 46%, transparent 46%)",
        }}
      >
        <div className="absolute left-4 top-0 h-full w-px bg-[#2de2ff]/20" />
        <div className="relative px-5 pt-4">
          <div className="flex items-center justify-between font-[family-name:var(--font-brand-mono)] text-[8px] uppercase tracking-[0.16em] text-[#2de2ff]">
            <span>GMX://PASS_03</span>
            <span className="text-[#ff2bd6]">link active</span>
          </div>
          <p className="mt-7 font-[family-name:var(--font-brand-display)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2de2ff]">
            Thursday protocol
          </p>
          <div className="mt-1 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-brand-display)] text-[3.2rem] font-semibold uppercase leading-[0.82] tracking-[-0.035em]">
              Night
              <br />
              ascent
            </h2>
            <div className="text-right font-[family-name:var(--font-brand-mono)]">
              <p className="text-4xl leading-none text-[#ff2bd6]">
                0{BRAND_TODAY_LEFT}
              </p>
              <p className="mt-1 text-[8px] text-[#2de2ff]">NODES OPEN</p>
            </div>
          </div>
          <div className="relative mt-7 flex items-center justify-between px-1">
            <span className="absolute left-2 right-2 top-1/2 h-px bg-gradient-to-r from-[#ff2bd6] via-[#2de2ff] to-[#31253b]" />
            {BRAND_WEEK.map((day, index) => (
              <span
                key={`${day.label}-${day.date}-${index}`}
                className={cn(
                  "relative z-10 flex size-6 rotate-45 items-center justify-center border bg-[#0d0613]",
                  day.kind === "today"
                    ? "border-[#ff2bd6] shadow-[0_0_12px_#ff2bd6]"
                    : day.kind === "past"
                      ? "border-[#2de2ff]"
                      : "border-[#4a3c55]"
                )}
              >
                <span className="-rotate-45 font-[family-name:var(--font-brand-mono)] text-[7px]">
                  {day.label}
                </span>
              </span>
            ))}
          </div>
          <ul className="mt-7 space-y-2.5">
            {BRAND_TODAY_ROWS.map((row, index) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="flex w-full items-center gap-3 border border-[#493356] bg-[#160b20]/90 px-3 py-2.5 text-left"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                    }}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 rotate-45 items-center justify-center border",
                        done
                          ? "border-[#2de2ff] bg-[#ff2bd6] shadow-[0_0_13px_#ff2bd6]"
                          : "border-[#655271]"
                      )}
                      aria-hidden="true"
                    >
                      {done ? (
                        <span className="size-2 bg-[#2de2ff]" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-[family-name:var(--font-brand-display)] text-[16px] font-semibold uppercase tracking-wide",
                          done && "text-[#8b7896]"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="font-[family-name:var(--font-brand-mono)] text-[8px] uppercase text-[#2de2ff]">
                        NODE_{String(index + 1).padStart(2, "0")} · {row.meta}
                      </span>
                    </span>
                    <span className="font-[family-name:var(--font-brand-mono)] text-[8px] text-[#ff2bd6]">
                      {done ? "SYNC" : "OPEN"}
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

export function SummitNightConcept() {
  const completion = useTempoCompletion();

  return (
    <AtmosphereFrame
      current="summit-night"
      className="min-h-dvh bg-[#0c1220] font-[family-name:var(--font-brand-sans)] text-[#e8eef8]"
      kicker="Atmosphere A6 · mountain / night"
      kickerClassName="text-[#88d8e8]"
      title="Summit Night"
      titleClassName="mt-3 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl"
      intro={
        <>
          Night alpinism rather than premium athletic darkness. Indigo air,
          cold snow, rope lines, and one warm hut light form the entire world.
          It is deliberately neither Forge nor Dawn Ridge: no red serif
          theatre, no pale morning landscape.
        </>
      }
      type="Sora for calm cold-air legibility · IBM Plex Mono for elevation and bearings."
      color="Night #0C1220 · snow #E8EEF8 · ice #88D8E8 · lantern #F0B45A."
      feeling="A star chart opens above a layered ridge. Work is a rope team; completion turns an outlined lantern warm."
      detailClassName="text-[#88d8e8]"
      signature={
        <span className="relative inline-flex h-11 w-8 items-center justify-center rounded-t-full border border-[#f0b45a] bg-[#f0b45a]/15 shadow-[0_0_24px_rgba(240,180,90,.5)]">
          <span className="size-3 rounded-full bg-[#f0b45a]" />
          <span className="absolute -top-2 h-2 w-4 rounded-t-full border border-b-0 border-[#f0b45a]" />
        </span>
      }
      material={
        <p className="font-[family-name:var(--font-brand-mono)] text-xs text-[#88d8e8]">
          2,840 m · NE 36°
        </p>
      }
      phoneLabel="Thursday home · Summit Night"
      phoneStyle={{ filter: "drop-shadow(0 30px 55px rgba(0,0,0,.55))" }}
    >
      <div
        className="relative min-h-[640px] overflow-hidden bg-[#101a2c] pb-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at 14% 12%, #e8eef8 0 1px, transparent 1.5px), radial-gradient(circle at 69% 7%, #88d8e8 0 1px, transparent 1.5px), radial-gradient(circle at 85% 24%, #e8eef8 0 1px, transparent 1.5px), radial-gradient(circle at 38% 31%, #e8eef8 0 1px, transparent 1.5px), linear-gradient(#0b1120, #172842 58%, #162238)",
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 390 230"
          className="absolute inset-x-0 bottom-0 w-full"
        >
          <path
            d="M0 155 58 102 103 132 171 56 225 119 282 82 390 147V230H0Z"
            fill="#18243a"
          />
          <path
            d="M0 184 82 137 126 163 201 111 266 162 327 125 390 169V230H0Z"
            fill="#111a2b"
          />
          <path d="m158 68 13-12 17 21-13-5-7 8Z" fill="#dce8f4" />
          <circle cx="282" cy="82" r="4" fill="#f0b45a" />
          <circle
            cx="282"
            cy="82"
            r="11"
            fill="none"
            stroke="#f0b45a"
            opacity=".35"
          />
        </svg>
        <div className="relative px-5 pt-5">
          <div className="flex items-center justify-between font-[family-name:var(--font-brand-mono)] text-[8px] uppercase tracking-[0.16em] text-[#88d8e8]">
            <span>Rope 04 · wk36</span>
            <span>2,840 m</span>
          </div>
          <h2 className="mt-8 text-4xl font-semibold leading-none tracking-[-0.05em]">
            Keep the
            <br />
            light in sight.
          </h2>
          <p className="mt-3 max-w-[15rem] text-xs leading-relaxed text-[#a9b9cd]">
            {BRAND_TODAY_LEFT} moves before the high camp. Thursday, Sep 3.
          </p>
          <div className="mt-6 flex items-center gap-2">
            {BRAND_WEEK.map((day, index) => (
              <div
                key={`${day.label}-${day.date}-${index}`}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    day.kind === "today"
                      ? "bg-[#f0b45a] shadow-[0_0_9px_#f0b45a]"
                      : day.kind === "past"
                        ? "bg-[#88d8e8]"
                        : "bg-[#52627a]"
                  )}
                />
                <span className="text-[8px] text-[#a9b9cd]">{day.label}</span>
              </div>
            ))}
          </div>
          <ul className="relative mt-6 space-y-2 before:absolute before:bottom-5 before:left-[15px] before:top-5 before:w-px before:bg-[#56677e]">
            {BRAND_TODAY_ROWS.map((row) => {
              const done = completion.isDone(row);
              return (
                <li key={row.id} className="relative">
                  <button
                    type="button"
                    onClick={() => completion.toggle(row.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#314159] bg-[#111b2d]/90 px-2.5 py-2.5 text-left backdrop-blur-sm"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex h-8 w-6 shrink-0 items-center justify-center rounded-t-full border",
                        done
                          ? "border-[#f0b45a] bg-[#f0b45a]/15 shadow-[0_0_18px_rgba(240,180,90,.45)]"
                          : "border-[#56677e] bg-[#111b2d]"
                      )}
                      aria-hidden="true"
                    >
                      {done ? (
                        <span className="size-2 rounded-full bg-[#f0b45a]" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[13px] font-medium",
                          done && "text-[#8796aa]"
                        )}
                      >
                        {row.title}
                      </span>
                      <span className="font-[family-name:var(--font-brand-mono)] text-[8px] uppercase text-[#88d8e8]">
                        {row.effort} · {row.meta}
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
