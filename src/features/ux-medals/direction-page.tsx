"use client";

import { Play } from "lucide-react";
import { formatAwardDate } from "@/features/achievements/format";
import { BetNote, DirectionNav, LadderStrip, MedalsStage, useLadderSelection } from "@/features/ux-medals/chrome";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import {
  TIER_LABEL,
  getMedalDirection,
  rankName,
  type MedalDirectionSlug,
  type MedalRung,
} from "@/features/ux-medals/model";
import { CardPairing } from "@/features/ux-medals/pairing";
import { PremiumDirectionPage } from "@/features/ux-medals/premium-page";
import { SizeLadder } from "@/features/ux-medals/size-ladder";
import { SystemFamilies } from "@/features/ux-medals/system-families";

export function MedalDirectionPage({ slug }: { slug: MedalDirectionSlug }) {
  return getMedalDirection(slug).round === 3 ? <PremiumDirectionPage slug={slug} /> : <FlatDirectionPage slug={slug} />;
}

/** Round 2 (flat) reference pages. */
function FlatDirectionPage({ slug }: { slug: MedalDirectionSlug }) {
  const direction = getMedalDirection(slug);
  const { Level } = DIRECTION_MARKS[slug];
  const ladder = useLadderSelection();
  const { rung, locked, replay, previewing } = ladder;
  const name = rankName(slug, rung.index);

  return (
    <MedalsStage nav={<DirectionNav direction={direction} />}>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-6">
        <p className="md-kicker">
          {direction.number} · {direction.name} · Round 2 (flat) reference · Study, not shipped
        </p>
        <h1 className="mt-2 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.02] tracking-tight">
          {direction.object}
        </h1>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_1fr]" aria-label="Selected medal">
          <div className="md-surface flex flex-col items-center gap-4 px-4 py-8">
            <div key={replay} className={replay > 0 ? "md-unlock" : undefined} data-direction={slug}>
              <div className="md-hero-art grid place-items-center">
                <Level rung={rung} name={name} locked={locked && !previewing} size={240} unlocking={replay > 0} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" className="md-button" data-variant="primary" onClick={ladder.play}>
                <Play aria-hidden className="size-3.5" />
                Play unlock
              </button>
              {previewing ? <p className="md-muted text-xs">Preview — not earned yet.</p> : null}
            </div>
          </div>
          <MedalDetail rung={rung} name={name} locked={locked} />
        </section>

        <LadderStrip slug={slug} selected={rung.index} onSelect={ladder.select} Level={Level} />
        <CardPairing slugs={[slug]} />
        <SystemFamilies slug={slug} />
        <SizeLadder slug={slug} />
        <BetNote direction={direction} />
      </main>
    </MedalsStage>
  );
}

function MedalDetail({ rung, name, locked }: { rung: MedalRung; name: string; locked: boolean }) {
  return (
    <article className="md-surface flex flex-col gap-5 p-6" aria-live="polite">
      <div>
        <p className="md-kicker">
          Level {rung.level} · {TIER_LABEL[rung.tier]}
        </p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight">{name}</h2>
        <p className="md-deep mt-2 text-sm">
          {locked ? "Not yet earned" : `Earned ${formatAwardDate(rung.unlockedAt)}`}
        </p>
      </div>
      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="md-kicker">{locked ? "What it takes" : "What it took"}</dt>
          <dd className="mt-1 leading-relaxed">{rung.took}</dd>
        </div>
        <div>
          <dt className="md-kicker">Tier</dt>
          <dd className="mt-1 leading-relaxed">
            {TIER_LABEL[rung.tier]} — {locked ? "the ink and finish this rank will carry." : "the ink and finish this rank carries."}
          </dd>
        </div>
        {locked ? (
          <div>
            <dt className="md-kicker">Still ahead</dt>
            <dd className="mt-1 leading-relaxed">
              The mark is drawn but not struck. Nothing about it is hidden; it simply is not yours yet.
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
