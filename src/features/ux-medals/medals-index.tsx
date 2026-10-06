import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MedalMark } from "@/features/achievements/medals";
import { MedalsStage } from "@/features/ux-medals/chrome";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import {
  MEDAL_DIRECTIONS,
  MEDAL_FAMILIES,
  MEDAL_RUNGS,
  NEWEST_EARNED_INDEX,
  RANK_NAMES,
  rankName,
  type MedalDirection,
} from "@/features/ux-medals/model";

const NEWEST = MEDAL_RUNGS[NEWEST_EARNED_INDEX]!;
const CAPSTONE = MEDAL_RUNGS[MEDAL_RUNGS.length - 1]!;

function IndexNav() {
  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
      <p className="md-kicker">Goalmaxxing / Medals study</p>
      <div className="flex gap-4 text-xs font-semibold">
        <Link href="/ux/achievements" className="md-deep">
          Achievements study
        </Link>
        <Link href="/ux" className="md-deep">
          UX labs
        </Link>
      </div>
    </div>
  );
}

function DirectionCard({ direction }: { direction: MedalDirection }) {
  const { Level } = DIRECTION_MARKS[direction.slug];
  return (
    <li className="md-surface flex flex-col p-5" data-direction={direction.slug}>
      <p className="md-kicker">{direction.number}</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{direction.name}</h3>
      <div className="mt-4 grid place-items-center">
        <Level rung={NEWEST} name={rankName(direction.slug, NEWEST.index)} size={150} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <Level rung={CAPSTONE} name={rankName(direction.slug, CAPSTONE.index)} locked size={64} />
        <div className="flex items-center gap-1" role="group" aria-label={`${direction.name} at inline size`}>
          {MEDAL_RUNGS.map((rung) => (
            <Level
              key={rung.level}
              rung={rung}
              name={rankName(direction.slug, rung.index)}
              locked={!rung.unlockedAt}
              size={20}
            />
          ))}
        </div>
      </div>
      <p className="md-deep mt-4 font-mono text-[11px] leading-relaxed">
        {RANK_NAMES[direction.slug].join(" · ")}
      </p>
      <p className="md-deep mt-3 flex-1 text-sm leading-relaxed">{direction.thesis}</p>
      <Link
        href={`/ux/medals/${direction.slug}`}
        aria-label={`Open ${direction.name}`}
        className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-semibold"
      >
        Open
        <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </li>
  );
}

function FamiliesSection() {
  return (
    <section id="families" className="md-hair mt-16 border-t pt-10" aria-label="Future families">
      <p className="md-kicker">Scoping · no data model</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Future families</h2>
      <p className="md-deep mt-3 max-w-2xl text-sm leading-relaxed">
        Levels are only the first family. Each direction has to stretch to challenges, weekly boards,
        streaks, finished goals, and teams without inventing a new visual system each time.
      </p>

      <div className="md-surface mt-6 overflow-x-auto p-4">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className="md-kicker pb-3 pr-4 font-semibold">Direction</th>
              {MEDAL_FAMILIES.map((family) => (
                <th key={family.key} scope="col" className="md-kicker pb-3 text-center font-semibold">
                  {family.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEDAL_DIRECTIONS.map((direction) => {
              const { Family } = DIRECTION_MARKS[direction.slug];
              return (
                <tr key={direction.slug} className="md-hair border-t">
                  <th scope="row" className="py-3 pr-4 align-middle font-semibold">
                    <span className="md-muted mr-2 font-mono text-xs">{direction.number}</span>
                    {direction.name}
                  </th>
                  {MEDAL_FAMILIES.map((family) => (
                    <td key={family.key} className="py-3 text-center align-middle">
                      <span className="inline-flex items-end gap-1.5">
                        <Family family={family} size={76} />
                        <Family family={family} size={20} />
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="md-kicker pb-3 text-left">Proposed criteria</caption>
          <thead>
            <tr className="md-kicker">
              <th scope="col" className="pb-2 pr-4 font-semibold">Family</th>
              <th scope="col" className="pb-2 pr-4 font-semibold">Earns when</th>
              <th scope="col" className="pb-2 pr-4 font-semibold">Tiers</th>
              <th scope="col" className="pb-2 font-semibold">Guardrail</th>
            </tr>
          </thead>
          <tbody>
            {MEDAL_FAMILIES.map((family) => (
              <tr key={family.key} className="md-hair border-t align-top">
                <th scope="row" className="py-3 pr-4 font-semibold">{family.name}</th>
                <td className="md-deep py-3 pr-4 leading-relaxed">{family.earnsWhen}</td>
                <td className="py-3 pr-4 font-mono text-xs">{family.tiers}</td>
                <td className="md-deep py-3 leading-relaxed">{family.guardrail}</td>
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
              Medals worth keeping.
            </h1>
            <p className="md-deep mt-6 max-w-2xl text-lg leading-relaxed">
              Production Achievements draws each level as a gradient disc on a ribbon with a bare number.
              These four directions redraw the same five awards inside the Gazetteer world — printed,
              pressed, enamelled, engraved — and give every rank a name.
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

        <section className="mt-14" aria-label="Directions">
          <p className="md-kicker">Same medal, four ways</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Level 8 earned · Level 10 still ahead · the whole ladder inline
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {MEDAL_DIRECTIONS.map((direction) => (
              <DirectionCard key={direction.slug} direction={direction} />
            ))}
          </ul>
        </section>

        <FamiliesSection />

        <section className="md-hair mt-16 border-t pt-10" aria-label="Where this leans">
          <p className="md-kicker">Where this leans</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight">
            Postmark leads: it is the atlas metaphor made literal, it extends to every family by changing
            the handstamp, and its locked state is the most honest. Letterpress seal is the runner-up for
            surfaces that need to feel ceremonial.
          </h2>
        </section>
      </main>
    </MedalsStage>
  );
}
