"use client";

import { Play } from "lucide-react";
import { formatAwardDate } from "@/features/achievements/format";
import { FAMILY_EXAMPLE } from "@/features/ux-medals/awards";
import { BetNote, DirectionNav, LadderStrip, MedalsStage, useLadderSelection } from "@/features/ux-medals/chrome";
import { LightStage } from "@/features/ux-medals/light-stage";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import {
  MEDAL_FAMILIES,
  MEDAL_RUNGS,
  getMedalDirection,
  rankName,
  type MedalDirectionSlug,
  type MedalRung,
} from "@/features/ux-medals/model";
import { CardPairing } from "@/features/ux-medals/pairing";
import { LADDER, ladderFinish, type Variant } from "@/features/ux-medals/premium-materials";
import { SystemFamilies } from "@/features/ux-medals/system-families";

/** Round 3 pages: hero object under a lamp, ladder, shelves, the card, families. */
export function PremiumDirectionPage({ slug }: { slug: MedalDirectionSlug }) {
  const direction = getMedalDirection(slug);
  const variant = slug as Variant;
  const { Level } = DIRECTION_MARKS[slug];
  const ladder = useLadderSelection();
  const { rung, locked, replay, previewing } = ladder;
  const name = rankName(slug, rung.index);

  return (
    <MedalsStage nav={<DirectionNav direction={direction} />}>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-6">
        <p className="md-kicker">
          {direction.number} · {direction.name} · Round 3 premium · Study, not shipped
        </p>
        <h1 className="mt-2 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.02] tracking-tight">
          {direction.object}
        </h1>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_1fr]" aria-label="Selected medal">
          <LightStage className="md-surface pm-velvet pm-hero flex flex-col items-center justify-center gap-5 px-4 py-10">
            <div key={replay} className={replay > 0 ? "md-unlock" : undefined}>
              <Level rung={rung} name={name} locked={locked && !previewing} size={280} unlocking={replay > 0} tilt />
            </div>
            <p className="md-muted text-center text-xs">Move the pointer across the stage to turn it in the light.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" className="md-button" data-variant="primary" onClick={ladder.play}>
                <Play aria-hidden className="size-3.5" />
                Play unlock
              </button>
              {previewing ? <p className="md-muted text-xs">Preview — not earned yet.</p> : null}
            </div>
          </LightStage>
          <PremiumDetail variant={variant} rung={rung} name={name} locked={locked} />
        </section>

        <LadderStrip
          slug={slug}
          selected={rung.index}
          onSelect={ladder.select}
          Level={Level}
          surface="md-surface pm-velvet"
          note={(item) => ladderFinish(variant, LADDER[item.index]!.key).name}
        />
        <Shelves slug={slug} />
        <CardPairing slugs={[slug]} />
        <SystemFamilies slug={slug} />
        <BetNote direction={direction} />
      </main>
    </MedalsStage>
  );
}

function PremiumDetail({ variant, rung, name, locked }: { variant: Variant; rung: MedalRung; name: string; locked: boolean }) {
  const step = LADDER[rung.index]!;
  const finish = ladderFinish(variant, step.key);
  return (
    <article className="md-surface flex flex-col gap-5 p-6" aria-live="polite">
      <div>
        <p className="md-kicker">
          Level {rung.level} · {finish.name}
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
          <dt className="md-kicker">Material</dt>
          <dd className="mt-1 leading-relaxed">
            {finish.name} — {step[variant]}.
          </dd>
        </div>
        <div>
          <dt className="md-kicker">Borrowed from the cards</dt>
          <dd className="mt-1 leading-relaxed">{step.mirrors}.</dd>
        </div>
        {locked ? (
          <div>
            <dt className="md-kicker">Still ahead</dt>
            <dd className="mt-1 leading-relaxed">
              Shown as an unstruck blank — matte pewter, no enamel, no light. It is struck in {finish.name.toLowerCase()} when
              earned.
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

const GROUNDS = [
  { key: "velvet", label: "Graphite velvet", className: "pm-velvet" },
  { key: "paper", label: "Paper", className: "pm-paper" },
] as const;

/** The whole set on two grounds, at shelf, compact, and inline sizes. */
function Shelves({ slug }: { slug: MedalDirectionSlug }) {
  const { Level, Family } = DIRECTION_MARKS[slug];
  const row = (size: number) => (
    <>
      {MEDAL_RUNGS.map((item) => (
        <Level key={item.level} rung={item} name={rankName(slug, item.index)} locked={!item.unlockedAt} size={size} />
      ))}
      {MEDAL_FAMILIES.map((family) => (
        <Family key={family.key} family={family} award={FAMILY_EXAMPLE[family.key]} size={size} />
      ))}
    </>
  );
  return (
    <section className="mt-10" aria-label="Shelves">
      <h2 className="text-xl font-semibold tracking-tight">On the shelf</h2>
      <p className="md-muted mt-1 max-w-2xl text-sm">
        The ladder and one medal per family, on graphite velvet and on paper. Move the pointer over a shelf: one lamp
        lights the whole set. Below 56px grain and specular drop out; the metal, rim, and enamel stay.
      </p>
      <div className="mt-4 grid gap-5">
        {GROUNDS.map((ground) => (
          <figure key={ground.key} className="m-0" aria-label={`${ground.label} shelf`}>
            <LightStage className={`md-surface ${ground.className} px-5 pb-6 pt-8`}>
              <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-6">{row(96)}</div>
              <div className="pm-ledge" aria-hidden />
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{row(44)}</div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">{row(20)}</div>
            </LightStage>
            <figcaption className="md-kicker mt-2">{ground.label} · 96, 44, 20px</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
