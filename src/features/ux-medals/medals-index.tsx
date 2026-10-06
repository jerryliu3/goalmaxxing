import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MedalMark } from "@/features/achievements/medals";
import { AWARDS, FAMILY_EXAMPLE, PROPOSED_MIX } from "@/features/ux-medals/awards";
import { MedalsStage } from "@/features/ux-medals/chrome";
import { LightStage } from "@/features/ux-medals/light-stage";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import {
  MEDAL_DIRECTIONS,
  MEDAL_FAMILIES,
  MEDAL_RUNGS,
  NEWEST_EARNED_INDEX,
  RANK_NAMES,
  ROUND_THREE,
  ROUND_TWO,
  getMedalDirection,
  rankName,
  type FormKey,
  type MedalDirection,
  type MedalDirectionSlug,
} from "@/features/ux-medals/model";
import { CardPairing } from "@/features/ux-medals/pairing";
import { CARD_MATERIAL_NAME, LADDER, ladderFinish, type Variant } from "@/features/ux-medals/premium-materials";

const NEWEST = MEDAL_RUNGS[NEWEST_EARNED_INDEX]!;
const GOAL_FAMILY = MEDAL_FAMILIES.find((family) => family.key === "goal")!;
const CAPSTONE = MEDAL_RUNGS[MEDAL_RUNGS.length - 1]!;

function IndexNav() {
  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
      <p className="md-kicker">Goalmaxxing / Medals study</p>
      <div className="flex gap-4 text-xs font-semibold">
        <Link href="/ux/achievements" className="md-deep">
          Achievements study
        </Link>
        <Link href="/ux/brand/card-materials" className="md-deep">
          Card materials
        </Link>
        <Link href="/ux" className="md-deep">
          UX labs
        </Link>
      </div>
    </div>
  );
}

/** One mark for any column of the matrix: the level ladder or a family example. */
function FormMark({ slug, form, size }: { slug: MedalDirectionSlug; form: FormKey; size: number }) {
  const { Level, Family } = DIRECTION_MARKS[slug];
  if (form === "level") return <Level rung={NEWEST} name={rankName(slug, NEWEST.index)} size={size} />;
  const family = MEDAL_FAMILIES.find((item) => item.key === form)!;
  return <Family family={family} award={FAMILY_EXAMPLE[form]} size={size} />;
}

function OpenLink({ direction }: { direction: MedalDirection }) {
  return (
    <Link
      href={`/ux/medals/${direction.slug}`}
      aria-label={`Open ${direction.name}`}
      className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-semibold"
    >
      Open
      <ArrowUpRight aria-hidden className="size-4" />
    </Link>
  );
}

/** Round 3: the object under a lamp on velvet, then its ladder and families at shelf size. */
function PremiumCard({ direction }: { direction: MedalDirection }) {
  const { Level, Family } = DIRECTION_MARKS[direction.slug];
  return (
    <li className="md-surface flex flex-col p-5">
      <p className="md-kicker">{direction.number} · Round 3</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{direction.name}</h3>
      <p className="md-deep mt-1 text-sm">{direction.object}</p>
      <LightStage className="md-surface pm-velvet mt-4 grid gap-5 px-4 pb-5 pt-7">
        <div className="flex items-end justify-center gap-4">
          <Family family={GOAL_FAMILY} award={AWARDS.goal[0]} size={150} />
          <Level rung={NEWEST} name={rankName(direction.slug, NEWEST.index)} size={150} />
        </div>
        <div className="flex flex-wrap items-end justify-center gap-2" role="group" aria-label={`${direction.name} ladder`}>
          {MEDAL_RUNGS.map((rung) => (
            <Level key={rung.level} rung={rung} name={rankName(direction.slug, rung.index)} locked={!rung.unlockedAt} size={56} />
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-center gap-2" role="group" aria-label={`${direction.name} families`}>
          {MEDAL_FAMILIES.map((family) => (
            <span key={family.key} title={`${family.name}: ${direction.forms[family.key]}`} className="inline-flex">
              <Family family={family} award={FAMILY_EXAMPLE[family.key]} size={44} />
            </span>
          ))}
          <span className="ml-2 flex items-center gap-1" role="group" aria-label={`${direction.name} at inline size`}>
            {MEDAL_RUNGS.map((rung) => (
              <Level key={rung.level} rung={rung} name={rankName(direction.slug, rung.index)} locked={!rung.unlockedAt} size={20} />
            ))}
          </span>
        </div>
      </LightStage>
      <p className="md-deep mt-4 flex-1 text-sm leading-relaxed">{direction.thesis}</p>
      <OpenLink direction={direction} />
    </li>
  );
}

/** Round 2 (flat): kept as references for form, not material. */
function FlatCard({ direction }: { direction: MedalDirection }) {
  const { Level } = DIRECTION_MARKS[direction.slug];
  return (
    <li className="md-surface flex flex-col p-5">
      <p className="md-kicker">{direction.number} · Round 2 (flat)</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{direction.name}</h3>
      <p className="md-deep mt-1 text-sm">{direction.object}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <Level rung={NEWEST} name={rankName(direction.slug, NEWEST.index)} size={96} />
        <Level rung={CAPSTONE} name={rankName(direction.slug, CAPSTONE.index)} locked size={56} />
        <div className="flex items-center gap-1" role="group" aria-label={`${direction.name} at inline size`}>
          {MEDAL_RUNGS.map((rung) => (
            <Level key={rung.level} rung={rung} name={rankName(direction.slug, rung.index)} locked={!rung.unlockedAt} size={20} />
          ))}
        </div>
      </div>
      <div className="md-hair mt-4 flex flex-wrap items-end justify-between gap-2 border-t pt-4" role="group" aria-label={`${direction.name} families`}>
        {MEDAL_FAMILIES.map((family) => (
          <span key={family.key} title={`${family.name}: ${direction.forms[family.key]}`} className="inline-flex">
            <FormMark slug={direction.slug} form={family.key} size={44} />
          </span>
        ))}
      </div>
      <p className="md-deep mt-4 font-mono text-[11px] leading-relaxed">{RANK_NAMES[direction.slug].join(" · ")}</p>
      <OpenLink direction={direction} />
    </li>
  );
}

function MaterialLadder() {
  const goal = AWARDS.goal[0]!;
  return (
    <section className="md-hair mt-16 border-t pt-10" aria-label="Material ladder">
      <p className="md-kicker">Tiers read as materials</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">The material ladder</h2>
      <p className="md-deep mt-3 max-w-2xl text-sm leading-relaxed">
        Each level is struck in a better stock, and every stock is borrowed from a card material. Streaks,
        challenges, and boards climb the same ladder; goal finishes skip it and take their card&rsquo;s material.
      </p>
      <LightStage className="md-surface pm-velvet mt-6 overflow-x-auto p-4">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="md-kicker">
              <th scope="col" className="pb-3 pr-4 font-semibold">Level</th>
              <th scope="col" className="pb-3 pr-4 font-semibold">Machined</th>
              <th scope="col" className="pb-3 pr-4 font-semibold">Prism</th>
              <th scope="col" className="pb-3 font-semibold">Borrowed from the cards</th>
            </tr>
          </thead>
          <tbody>
            {LADDER.map((step, index) => {
              const rung = MEDAL_RUNGS[index]!;
              return (
                <tr key={step.key} className="border-t border-white/10 align-middle">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    <span className="md-muted mr-2 font-mono text-xs">Lv {step.level}</span>
                    {step.name}
                  </th>
                  {ROUND_THREE.map((direction) => {
                    const { Level } = DIRECTION_MARKS[direction.slug];
                    const variant = direction.slug as Variant;
                    return (
                      <td key={direction.slug} className="py-3 pr-4">
                        <span className="flex items-center gap-3">
                          <Level rung={rung} name={rankName(direction.slug, index)} size={64} />
                          <span className="text-xs leading-snug">
                            <span className="block font-semibold">{ladderFinish(variant, step.key).name}</span>
                            <span className="md-muted">{step[variant]}</span>
                          </span>
                        </span>
                      </td>
                    );
                  })}
                  <td className="md-muted py-3 text-xs leading-snug">{step.mirrors}</td>
                </tr>
              );
            })}
            <tr className="border-t border-white/10 align-middle">
              <th scope="row" className="py-3 pr-4 font-semibold">
                <span className="md-muted mr-2 font-mono text-xs">Goal</span>
                The card&rsquo;s own
              </th>
              {ROUND_THREE.map((direction) => {
                const { Family } = DIRECTION_MARKS[direction.slug];
                return (
                  <td key={direction.slug} className="py-3 pr-4">
                    <Family family={GOAL_FAMILY} award={goal} size={64} />
                  </td>
                );
              })}
              <td className="md-muted py-3 text-xs leading-snug">
                {Object.values(CARD_MATERIAL_NAME).join(" · ")} — chosen by the goal&rsquo;s difficulty, exactly as the card
                chooses it.
              </td>
            </tr>
          </tbody>
        </table>
      </LightStage>
    </section>
  );
}

const COLUMNS: { form: FormKey; name: string }[] = [
  { form: "level", name: "Levels" },
  ...MEDAL_FAMILIES.map((family) => ({ form: family.key, name: family.name })),
];

function MatrixRow({ direction }: { direction: MedalDirection }) {
  const premium = direction.round === 3;
  return (
    <tr className="md-hair border-t">
      <th scope="row" className="py-3 pr-4 align-middle font-semibold">
        <span className="md-muted mr-2 font-mono text-xs">{direction.number}</span>
        {direction.name}
        {premium ? <span className="md-muted block text-[11px] font-normal">Proposed mix, premium</span> : null}
      </th>
      {COLUMNS.map(({ form }) => (
        <td key={form} className="px-1 py-3 text-center align-top">
          <span className="inline-flex items-end gap-1.5">
            <FormMark slug={direction.slug} form={form} size={64} />
            <FormMark slug={direction.slug} form={form} size={20} />
          </span>
          <span className="md-muted mt-1 block font-mono text-[10px] leading-tight">
            {premium ? `${getMedalDirection(PROPOSED_MIX[form]).name} form · ` : ""}
            {direction.forms[form]}
          </span>
        </td>
      ))}
    </tr>
  );
}

function FamiliesSection() {
  return (
    <section id="families" className="md-hair mt-16 border-t pt-10" aria-label="Mix per family">
      <p className="md-kicker">Scoping · no data model</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Mix per family</h2>
      <p className="md-deep mt-3 max-w-2xl text-sm leading-relaxed">
        Round 2 settled the form per family: Token discs for levels, streaks, and challenges; the card Tile
        for goal finishes; Mark&rsquo;s shield and hexagon for boards and team. Round 3 keeps that mix and
        changes only the material. The flat systems stay below for comparison.
      </p>

      <LightStage className="md-surface mt-6 overflow-x-auto p-4">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="md-kicker pb-3 pr-4 font-semibold">System</th>
              {COLUMNS.map((column) => (
                <th key={column.form} scope="col" className="md-kicker pb-3 text-center font-semibold">
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEDAL_DIRECTIONS.map((direction) => (
              <MatrixRow key={direction.slug} direction={direction} />
            ))}
          </tbody>
        </table>
      </LightStage>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <caption className="md-kicker pb-3 text-left">Proposed criteria and forms</caption>
          <thead>
            <tr className="md-kicker">
              <th scope="col" className="pb-2 pr-4 font-semibold">Family</th>
              <th scope="col" className="pb-2 pr-4 font-semibold">Earns when</th>
              <th scope="col" className="pb-2 pr-4 font-semibold">Tiers</th>
              <th scope="col" className="pb-2 pr-4 font-semibold">Guardrail</th>
              <th scope="col" className="pb-2 font-semibold">Form by system</th>
            </tr>
          </thead>
          <tbody>
            {MEDAL_FAMILIES.map((family) => (
              <tr key={family.key} className="md-hair border-t align-top">
                <th scope="row" className="py-3 pr-4 font-semibold">{family.name}</th>
                <td className="md-deep py-3 pr-4 leading-relaxed">{family.earnsWhen}</td>
                <td className="py-3 pr-4 font-mono text-xs">{family.tiers}</td>
                <td className="md-deep py-3 pr-4 leading-relaxed">{family.guardrail}</td>
                <td className="py-3 font-mono text-[11px] leading-relaxed">
                  {[ROUND_THREE[0]!, ...ROUND_TWO].map((direction) => (
                    <span key={direction.slug} className="block">
                      <span className="md-muted">{direction.round === 3 ? "Round 3" : direction.name}:</span>{" "}
                      {direction.forms[family.key]}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MedalsIndex() {
  return (
    <MedalsStage nav={<IndexNav />}>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-6">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="max-w-4xl text-[clamp(2.4rem,7vw,5rem)] font-semibold leading-[0.92] tracking-tight">
              Medals made of the same stuff as the card.
            </h1>
            <p className="md-deep mt-6 max-w-2xl text-lg leading-relaxed">
              Round 3 keeps the Round 2 forms and rebuilds the surface: machined metal, enamel under a clear coat,
              crystal and chromatic foil — the card materials, lit by the same light. Two constructions, Machined and
              Prism, across every family.
            </p>
            <p className="md-muted mt-3 text-sm">Study only. Nothing here ships.</p>
          </div>
          <figure className="md-surface flex items-center gap-4 p-4">
            <MedalMark level={NEWEST.level} tier="gold" size={72} markId="md-index-before" />
            <figcaption className="max-w-[11rem] text-xs leading-relaxed">
              <span className="md-kicker block">Today</span>
              Level 8 on /achievements: radial metal, hard-coded hexes, no name.
            </figcaption>
          </figure>
        </div>

        <section className="mt-14" aria-label="Round 3 premium">
          <p className="md-kicker">Round 3 · Premium</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Two constructions, one material language</h2>
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {ROUND_THREE.map((direction) => (
              <PremiumCard key={direction.slug} direction={direction} />
            ))}
          </ul>
        </section>

        <MaterialLadder />

        <CardPairing slugs={ROUND_THREE.map((direction) => direction.slug)} />

        <FamiliesSection />

        <section className="md-hair mt-16 border-t pt-10" aria-label="Round 2 (flat)">
          <p className="md-kicker">Round 2 (flat) · references</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Tile, Token, and Mark</h2>
          <p className="md-deep mt-3 max-w-2xl text-sm leading-relaxed">
            The flat systems that settled the forms. Next to the anodized card their beige card-stock faces read as
            paper, not as things you keep — which is what Round 3 fixes.
          </p>
          <ul className="mt-6 grid gap-4 lg:grid-cols-3">
            {ROUND_TWO.map((direction) => (
              <FlatCard key={direction.slug} direction={direction} />
            ))}
          </ul>
        </section>

        <section className="md-hair mt-16 border-t pt-10" aria-label="Chosen direction">
          <p className="md-kicker">Chosen direction</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight">
            Prism: crystal faces in a fine metal bezel, with goal-finish medals taking their card&rsquo;s own
            material. Machined stays here as the reference it was weighed against.
          </h2>
        </section>
      </main>
    </MedalsStage>
  );
}
