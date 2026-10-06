"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { useState } from "react";
import { formatAwardDate } from "@/features/achievements/format";
import { AWARDS, awardStatus } from "@/features/ux-medals/awards";
import { LightStage } from "@/features/ux-medals/light-stage";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import { MEDAL_FAMILIES, getMedalDirection, type MedalDirectionSlug } from "@/features/ux-medals/model";

/**
 * Each system, family by family: the form each family takes, every seeded
 * award in it (earned and honestly locked), and the same row at 20px.
 */
export function SystemFamilies({ slug }: { slug: MedalDirectionSlug }) {
  const direction = getMedalDirection(slug);
  const { Family } = DIRECTION_MARKS[slug];
  const [replay, setReplay] = useState(0);

  return (
    <section className="mt-10" aria-label="The system">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">The system, family by family</h2>
          <p className="md-muted mt-1 max-w-2xl text-sm">
            One form per family, each shown earned and locked. Goal finishes take the goal&rsquo;s
            category colour (and, in Round 3, its card&rsquo;s material); everything else takes its
            family&rsquo;s ink or a rung of the material ladder.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/ux/medals#families" className="md-muted text-xs font-semibold underline-offset-4 hover:underline">
            Criteria for every family
          </Link>
          <button type="button" className="md-button" onClick={() => setReplay((n) => n + 1)}>
            <Play aria-hidden className="size-3.5" />
            Replay family unlocks
          </button>
        </div>
      </div>

      <LightStage className="mt-4 grid gap-3">
        {MEDAL_FAMILIES.map((family) => (
          <article
            key={family.key}
            className="md-surface grid gap-4 p-4 md:grid-cols-[11rem_minmax(0,1fr)]"
            data-direction={slug}
            aria-label={family.name}
          >
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{family.name}</h3>
              <p className="md-deep mt-1 font-mono text-[11px]">{direction.forms[family.key]}</p>
              <p className="md-muted mt-2 text-xs leading-relaxed">{family.tiers}</p>
              <p className="mt-3 flex items-center gap-1" aria-label={`${family.name} at 20px`}>
                {AWARDS[family.key].map((award) => (
                  <span key={award.id} className="inline-flex">
                    <Family family={family} award={award} size={20} />
                  </span>
                ))}
              </p>
            </div>
            <ul className="flex flex-wrap items-start gap-x-5 gap-y-5">
              {AWARDS[family.key].map((award) => {
                const animate = replay > 0 && Boolean(award.date);
                return (
                  <li key={award.id} className="flex w-[8.75rem] flex-col items-center gap-1.5 text-center">
                    <div
                      key={animate ? replay : "still"}
                      className={animate ? "md-unlock" : undefined}
                      data-direction={slug}
                    >
                      <div className="md-hero-art">
                        <Family family={family} award={award} size={136} unlocking={animate} />
                      </div>
                    </div>
                    <p className="text-xs font-semibold leading-snug">{award.title}</p>
                    <p className="md-muted font-mono text-[10px] uppercase">
                      {award.date ? formatAwardDate(award.date) : `Locked · ${awardStatus(award)}`}
                    </p>
                    {award.reward ? (
                      <p className="md-deep md-t-display md-t-italic text-xs leading-snug">&ldquo;{award.reward}&rdquo;</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </LightStage>
    </section>
  );
}
