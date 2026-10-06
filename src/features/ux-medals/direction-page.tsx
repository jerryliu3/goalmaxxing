"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { formatAwardDate } from "@/features/achievements/format";
import { BetNote, DirectionNav, MedalsStage } from "@/features/ux-medals/chrome";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import {
  MEDAL_RUNGS,
  NEWEST_EARNED_INDEX,
  TIER_LABEL,
  getMedalDirection,
  rankName,
  type MedalDirectionSlug,
  type MedalRung,
} from "@/features/ux-medals/model";
import { DirectionFamilies, SizeLadder } from "@/features/ux-medals/size-ladder";

export function MedalDirectionPage({ slug }: { slug: MedalDirectionSlug }) {
  const direction = getMedalDirection(slug);
  const { Level } = DIRECTION_MARKS[slug];
  const [selected, setSelected] = useState(NEWEST_EARNED_INDEX);
  const [replay, setReplay] = useState(0);
  const rung = MEDAL_RUNGS[selected]!;
  const name = rankName(slug, selected);
  const locked = !rung.unlockedAt;
  const previewing = replay > 0 && locked;

  const select = (index: number) => {
    setSelected(index);
    setReplay(0);
  };

  return (
    <MedalsStage nav={<DirectionNav direction={direction} />}>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-6">
        <p className="md-kicker">
          {direction.number} · {direction.name} · Study, not shipped
        </p>
        <h1 className="mt-2 max-w-3xl text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.02] tracking-tight">
          {direction.object}
        </h1>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_1fr]" aria-label="Selected medal">
          <div className="md-surface flex flex-col items-center gap-4 px-4 py-8" data-direction={slug}>
            <div key={replay} className={replay > 0 ? "md-unlock" : undefined} data-direction={slug}>
              <div className="md-hero-stage grid place-items-center">
                <div className="md-hero-art">
                  <Level rung={rung} name={name} locked={locked && !previewing} size={240} unlocking={replay > 0} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" className="md-button" data-variant="primary" onClick={() => setReplay((n) => n + 1)}>
                <Play aria-hidden className="size-3.5" />
                Play unlock
              </button>
              {previewing ? <p className="md-muted text-xs">Preview — not earned yet.</p> : null}
            </div>
          </div>
          <MedalDetail rung={rung} name={name} locked={locked} />
        </section>

        <section className="mt-8" aria-label="Level ladder">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">The ladder</h2>
            <p className="md-muted text-xs">
              {MEDAL_RUNGS.filter((item) => item.unlockedAt).length} of {MEDAL_RUNGS.length} earned
            </p>
          </div>
          <ul className="md-surface mt-3 grid grid-cols-3 gap-1 p-2 sm:grid-cols-5" data-direction={slug}>
            {MEDAL_RUNGS.map((item) => {
              const itemName = rankName(slug, item.index);
              const itemLocked = !item.unlockedAt;
              return (
                <li key={item.level} className="min-w-0">
                  <button
                    type="button"
                    className="md-slot w-full"
                    aria-pressed={item.index === selected}
                    aria-label={`${itemName}, level ${item.level}, ${itemLocked ? "locked" : "earned"}`}
                    onClick={() => select(item.index)}
                  >
                    <span className="md-well grid place-items-center p-1">
                      <Level rung={item} name={itemName} locked={itemLocked} size={72} />
                    </span>
                    <span className="truncate text-sm font-semibold">{itemName}</span>
                    <span className="md-muted font-mono text-[11px]">
                      Lv {item.level} · {itemLocked ? "locked" : formatAwardDate(item.unlockedAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <SizeLadder slug={slug} />
        <DirectionFamilies slug={slug} />
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
