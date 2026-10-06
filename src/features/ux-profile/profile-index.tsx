import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  NEW_MAP,
  REDUNDANCY_ROWS,
  SCORE_NAME_COLLISIONS,
  SCORE_NAMES,
} from "@/features/ux-profile/ia";
import { PROFILE_CONCEPTS } from "@/features/ux-profile/model";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";

export function ProfileIndex() {
  return (
    <main
      className="min-h-dvh text-[#241c14]"
      style={{
        background: `radial-gradient(ellipse 90% 50% at 50% -15%, rgba(154, 79, 44, 0.14), transparent 55%), ${GAZETTEER.page}`,
      }}
    >
      <section className="px-5 pb-10 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
            style={{ borderColor: GAZETTEER.rule }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Goalmaxxing / Profile study</p>
            <Link href="/ux" className="text-xs font-semibold" style={{ color: GAZETTEER.mutedDeep }}>
              UX labs
            </Link>
          </div>
          <h1 className="mt-10 max-w-4xl font-display text-[clamp(2.4rem,7vw,5.2rem)] font-semibold leading-[0.92] tracking-tight">
            One profile, rendered once.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
            Your public profile is a curated view of Growth: a bio line, up to three pinned medals,
            records, or finished goals, and the goals you choose to feature. It points at Growth
            instead of copying it, so your own avatar never re-renders your stats.
          </p>
          <p className="mt-4 text-sm" style={{ color: GAZETTEER.muted }}>
            Study only, seeded data, nothing writes. Every concept renders the same PublicProfileView.
          </p>
        </div>
      </section>

      <Band eyebrow="New map" title="Four tabs and a button">
        <ol className="grid gap-3 md:grid-cols-5">
          {NEW_MAP.map((tab) => (
            <li
              key={tab.name}
              className={`rounded-[14px] border p-4 ${tab.kind === "button" ? "border-dashed" : ""}`}
              style={{
                borderColor: GAZETTEER.rule,
                background: tab.kind === "button" ? "transparent" : GAZETTEER.paper,
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-semibold">{tab.name}</h3>
                <span className="font-mono text-[10px]" style={{ color: GAZETTEER.muted }}>
                  {tab.kind === "button" ? "button" : "tab"}
                </span>
              </div>
              {tab.was ? (
                <p className="mt-1 text-[11px] font-semibold" style={{ color: GAZETTEER.stamp }}>
                  was {tab.was}
                </p>
              ) : null}
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: GAZETTEER.mutedDeep }}>
                {tab.holds.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <caption className="sr-only">Where each duplicated surface ends up</caption>
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.16em]" style={{ color: GAZETTEER.muted }}>
                <th scope="col" className="py-2 pr-4 font-semibold">Surface</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Today</th>
                <th scope="col" className="py-2 font-semibold">Single new home</th>
              </tr>
            </thead>
            <tbody>
              {REDUNDANCY_ROWS.map((row) => (
                <tr key={row.item} className="border-t" style={{ borderColor: GAZETTEER.rule }}>
                  <th scope="row" className="py-2.5 pr-4 font-semibold">{row.item}</th>
                  <td className="py-2.5 pr-4" style={{ color: GAZETTEER.mutedDeep }}>{row.today}</td>
                  <td className="py-2.5 font-semibold" style={{ color: GAZETTEER.gain }}>{row.home}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      <Band eyebrow="Score rename" title="What Growth calls the score">
        <ul className="grid gap-3 md:grid-cols-3">
          {SCORE_NAMES.map((name) => (
            <li key={name.name} className="rounded-[14px] border p-5" style={{ borderColor: GAZETTEER.rule, background: GAZETTEER.paper }}>
              <h3 className="font-display text-2xl font-semibold">{name.name}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>{name.why}</p>
              <p className="mt-2 text-xs" style={{ color: GAZETTEER.muted }}>{name.caution}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm" style={{ color: GAZETTEER.muted }}>
          Avoid{" "}
          {SCORE_NAME_COLLISIONS.map((item, index) => (
            <span key={item.name}>
              {index > 0 ? "; " : ""}
              <span className="font-semibold">{item.name}</span> ({item.reason})
            </span>
          ))}
          .
        </p>
      </Band>

      <Band eyebrow="Concepts" title="Where you edit what others see">
        <ul className="grid gap-4 md:grid-cols-2">
          {PROFILE_CONCEPTS.map((concept) => (
            <li key={concept.slug}>
              <Link
                href={`/ux/profile/${concept.slug}`}
                aria-label={`Open ${concept.name}`}
                className="flex h-full flex-col rounded-[14px] border p-5 transition hover:border-[#9a4f2c]/60"
                style={{ borderColor: GAZETTEER.rule, background: GAZETTEER.paper }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: GAZETTEER.muted }}>
                  {concept.letter}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{concept.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
                  {concept.thesis}
                </p>
                <p className="mt-3 font-mono text-[11px]" style={{ color: GAZETTEER.muted }}>
                  {concept.avatar}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
                  Open
                  <ArrowUpRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
          <span className="font-semibold text-[#241c14]">Leaning:</span> A as the avatar destination,
          with C’s pins on Growth objects writing the same three-item list. Both edit one record; D’s
          per-section audiences wait for a friend graph.
        </p>
      </Band>
    </main>
  );
}

function Band({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t px-5 py-12 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: GAZETTEER.muted }}>
          {eyebrow}
        </p>
        <h2 className="mt-3 mb-8 max-w-3xl font-display text-3xl font-semibold tracking-tight">{title}</h2>
        {children}
      </div>
    </section>
  );
}
