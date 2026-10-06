"use client";

import { useState, type ReactNode } from "react";
import { resolveTempoCardMaterial } from "@/features/goals/card-material/tempo-card-material";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { EARNED_GOALS, FAMILY_EXAMPLE, goalAward, type Award } from "@/features/ux-medals/awards";
import { LightStage } from "@/features/ux-medals/light-stage";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import {
  MEDAL_FAMILIES,
  MEDAL_RUNGS,
  NEWEST_EARNED_INDEX,
  getMedalDirection,
  rankName,
  type MedalDirectionSlug,
  type MedalFamilyKey,
} from "@/features/ux-medals/model";
import { CARD_MATERIAL_NAME } from "@/features/ux-medals/premium-materials";

const MATERIAL_SHORT = { glass: "Glass", alloy: "Alloy", chromatic: "Chromatic" } as const;
const RUNG = MEDAL_RUNGS[NEWEST_EARNED_INDEX]!;

const familyOf = (key: MedalFamilyKey) => MEDAL_FAMILIES.find((family) => family.key === key)!;

/**
 * The real production goal card next to the medals it would sit beside, so
 * "do these go together?" is judged on the actual object, not a description.
 * Round 3 goal finishes are struck in the card's own material, so the picker
 * names both: category colour and material.
 */
export function CardPairing({ slugs }: { slugs: readonly MedalDirectionSlug[] }) {
  const [goalId, setGoalId] = useState(EARNED_GOALS[0]!.id);
  const seed = EARNED_GOALS.find((goal) => goal.id === goalId) ?? EARNED_GOALS[0]!;
  const award = goalAward(seed);
  const material = resolveTempoCardMaterial(seed.fields.difficulty);

  return (
    <section className="mt-12" aria-label="Side by side with the card">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="md-kicker">Do they go together?</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Side by side with the card</h2>
          <p className="md-muted mt-1 max-w-2xl text-sm">
            The production goal card beside the goal-finish medal for the same goal, a level, and a streak.
            Switch goals to change the category colour and the material — premium goal medals take the
            card&rsquo;s own material, so alloy sits beside alloy.
          </p>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Sample goal">
          {EARNED_GOALS.map((goal) => {
            const item = goalAward(goal);
            const short = MATERIAL_SHORT[resolveTempoCardMaterial(goal.fields.difficulty)];
            return (
              <button
                key={goal.id}
                type="button"
                className="md-button"
                aria-pressed={goal.id === seed.id}
                onClick={() => setGoalId(goal.id)}
              >
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: goal.fields.color }} />
                {item.category} · {short}
              </button>
            );
          })}
        </div>
      </div>

      <LightStage className="mt-5 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <figure className="md-surface flex flex-col items-center gap-4 p-5 lg:self-start">
          <div className="w-full max-w-[260px]">
            <TempoGoalCard fields={seed.fields} context="history" achieved rotatable={false} />
          </div>
          <figcaption className="md-kicker text-center">Goal card · {CARD_MATERIAL_NAME[material]}</figcaption>
        </figure>
        <ul className="grid gap-4">
          {slugs.map((slug) => (
            <PairRow key={slug} slug={slug} award={award} reward={seed.reward} />
          ))}
        </ul>
      </LightStage>
    </section>
  );
}

function Cell({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-center gap-2 text-center">
      <div className="grid min-h-[160px] place-items-center">{children}</div>
      <figcaption className="md-muted max-w-[11rem] text-xs leading-snug">{caption}</figcaption>
    </figure>
  );
}

function PairRow({ slug, award, reward }: { slug: MedalDirectionSlug; award: Award; reward: string }) {
  const direction = getMedalDirection(slug);
  const { Level, Family } = DIRECTION_MARKS[slug];
  const name = rankName(slug, RUNG.index);
  const streak = FAMILY_EXAMPLE.streak;
  return (
    <li className="md-surface p-4" data-direction={slug}>
      <p className="md-kicker">
        {direction.number} · {direction.name}
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-4">
        <Cell
          caption={
            <>
              <span className="font-semibold text-[color:var(--md-ink)]">Goal finish</span>
              {direction.round === 3 && award.material ? (
                <span className="block font-mono text-[10px] uppercase">Struck in {CARD_MATERIAL_NAME[award.material]}</span>
              ) : null}
              <span className="md-t-display md-t-italic block">&ldquo;{reward}&rdquo;</span>
            </>
          }
        >
          <Family family={familyOf("goal")} award={award} size={160} />
        </Cell>
        <Cell caption={`Level ${RUNG.level} · ${name}`}>
          <Level rung={RUNG} name={name} size={112} />
        </Cell>
        <Cell caption={streak.title}>
          <Family family={familyOf("streak")} award={streak} size={112} />
        </Cell>
        <Cell caption="Inline, next to a name">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            Maya
            <Family family={familyOf("goal")} award={award} size={20} />
            <Level rung={RUNG} name={name} size={20} />
            <Family family={familyOf("streak")} award={streak} size={20} />
          </span>
        </Cell>
      </div>
    </li>
  );
}
