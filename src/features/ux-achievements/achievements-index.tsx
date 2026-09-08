import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ACHIEVEMENT_CONCEPTS } from "@/features/ux-achievements/model";
import { GAZETTEER } from "@/lib/brand/gazetteer";

export function AchievementsIndex() {
  return (
    <main className="min-h-dvh text-[#241c14]">
      <style>{`
        .ach-index-stage {
          background:
            radial-gradient(ellipse 90% 55% at 50% -15%, rgba(154, 79, 44, 0.16), transparent 55%),
            linear-gradient(180deg, #f7efe0 0%, ${GAZETTEER.page} 50%, #ebe0cb 100%);
        }
      `}</style>
      <div className="ach-index-stage">
        <section className="px-5 pb-12 pt-8 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
              style={{ borderColor: GAZETTEER.rule }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Goalmaxxing / Achievements study
              </p>
              <div className="flex gap-4">
                <Link
                  href="/ux/destinations"
                  className="text-xs font-semibold"
                  style={{ color: GAZETTEER.mutedDeep }}
                >
                  Destinations
                </Link>
                <Link
                  href="/ux"
                  className="text-xs font-semibold"
                  style={{ color: GAZETTEER.mutedDeep }}
                >
                  UX labs
                </Link>
              </div>
            </div>
            <h1 className="mt-10 max-w-4xl font-display text-[clamp(2.4rem,7vw,5.5rem)] font-semibold leading-[0.9] tracking-tight">
              A place to be proud of.
            </h1>
            <p
              className="mt-6 max-w-2xl text-lg leading-relaxed"
              style={{ color: GAZETTEER.mutedDeep }}
            >
              Live Achievements is still two scrollable cards. These concepts
              borrow decisions from Duolingo’s Records/Awards split, Apple
              Fitness rings, Letterboxd-style hung frames, and trophy-case
              status displays — then re-skin them in Gazetteer metal and paper.
            </p>
            <p className="mt-4 text-sm" style={{ color: GAZETTEER.muted }}>
              Study only. No lock. Production page unchanged. Worktree branch{" "}
              <span className="font-mono">ux/achievements-study</span>.
            </p>
          </div>
        </section>

        <section className="border-t px-5 py-12 sm:px-8" style={{ borderColor: GAZETTEER.rule }}>
          <div className="mx-auto max-w-6xl">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: GAZETTEER.muted }}
            >
              Five bets
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight">
              Case · Vault · Gallery · Records · Rings
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ACHIEVEMENT_CONCEPTS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ux/achievements/${item.slug}`}
                    aria-label={`Open ${item.name}`}
                    className="group flex h-full flex-col rounded-[14px] border p-5 transition hover:border-[#9a4f2c]/60"
                    style={{
                      borderColor: GAZETTEER.rule,
                      background: GAZETTEER.paper,
                    }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: GAZETTEER.muted }}
                    >
                      {item.number}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                      {item.name}
                    </h3>
                    <p
                      className="mt-3 flex-1 text-sm leading-relaxed"
                      style={{ color: GAZETTEER.mutedDeep }}
                    >
                      {item.thesis}
                    </p>
                    <p className="mt-3 text-[11px] leading-snug" style={{ color: GAZETTEER.muted }}>
                      {item.research}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
                      Open
                      <ArrowUpRight aria-hidden className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
