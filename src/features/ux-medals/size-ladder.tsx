"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DIRECTION_MARKS } from "@/features/ux-medals/marks";
import {
  MEDAL_FAMILIES,
  MEDAL_RUNGS,
  NEWEST_EARNED_INDEX,
  rankName,
  type MedalDirectionSlug,
} from "@/features/ux-medals/model";

const PEOPLE = [
  { name: "Maya Chen", initials: "MC", rung: 3 },
  { name: "Jonah Reyes", initials: "JR", rung: 2 },
  { name: "Priya Nair", initials: "PN", rung: 1 },
] as const;

function Figure({ caption, children, slug }: { caption: string; children: ReactNode; slug: MedalDirectionSlug }) {
  return (
    <figure className="md-surface flex flex-col justify-between gap-4 p-5" data-direction={slug}>
      <div className="flex flex-wrap items-end gap-4">{children}</div>
      <figcaption className="md-kicker">{caption}</figcaption>
    </figure>
  );
}

export function SizeLadder({ slug }: { slug: MedalDirectionSlug }) {
  const { Level } = DIRECTION_MARKS[slug];
  const newest = MEDAL_RUNGS[NEWEST_EARNED_INDEX]!;
  const capstone = MEDAL_RUNGS[MEDAL_RUNGS.length - 1]!;
  const mark = (index: number, size: number) => {
    const rung = MEDAL_RUNGS[index]!;
    return <Level rung={rung} name={rankName(slug, index)} locked={!rung.unlockedAt} size={size} />;
  };

  return (
    <section className="mt-10" aria-label="Sizes">
      <h2 className="text-xl font-semibold tracking-tight">Sizes</h2>
      <p className="md-muted mt-1 max-w-2xl text-sm">
        One mark, three jobs. Ring text, texture, and fine lines drop out as it shrinks; the silhouette
        and numeral have to carry the inline size alone.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <Figure caption="Hero · 160px" slug={slug}>
          {mark(newest.index, 160)}
          {mark(capstone.index, 160)}
        </Figure>
        <Figure caption="Shelf · 72px and 44px" slug={slug}>
          {mark(newest.index, 72)}
          {mark(capstone.index, 72)}
          {mark(newest.index, 44)}
          {mark(capstone.index, 44)}
        </Figure>
        <Figure caption="Inline · 20px" slug={slug}>
          <div className="grid w-full gap-3 text-sm">
            <ul className="grid gap-2">
              {PEOPLE.map((person, place) => (
                <li key={person.name} className="md-hair flex items-center gap-2 border-b pb-2 last:border-b-0">
                  <span className="md-muted w-4 font-mono text-xs">{place + 1}</span>
                  <span
                    className="grid size-7 place-items-center rounded-full text-[10px] font-semibold"
                    style={{ background: "var(--md-page)", border: "1px solid var(--md-rule)" }}
                  >
                    {person.initials}
                  </span>
                  <span className="font-semibold">{person.name}</span>
                  <span className="inline-flex" title={rankName(slug, person.rung)}>
                    {mark(person.rung, 20)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="md-deep leading-relaxed">
              Maya reached{" "}
              <span className="inline-flex translate-y-[3px]">{mark(newest.index, 18)}</span>{" "}
              <span className="font-semibold">{rankName(slug, newest.index)}</span> this week.
            </p>
            <div className="flex items-center gap-1.5" role="group" aria-label="Full ladder at inline size">
              {MEDAL_RUNGS.map((rung) => (
                <span key={rung.level} className="inline-flex">
                  {mark(rung.index, 20)}
                </span>
              ))}
            </div>
          </div>
        </Figure>
      </div>
    </section>
  );
}

export function DirectionFamilies({ slug }: { slug: MedalDirectionSlug }) {
  const { Family } = DIRECTION_MARKS[slug];
  return (
    <section className="mt-10" aria-label="Future families">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Extends to</h2>
        <Link href="/ux/medals#families" className="md-muted text-xs font-semibold underline-offset-4 hover:underline">
          Criteria for every family
        </Link>
      </div>
      <p className="md-muted mt-1 max-w-2xl text-sm">
        Scoping only. One example mark per future family, drawn in this direction&rsquo;s language.
      </p>
      <ul className="md-surface mt-4 grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-5" data-direction={slug}>
        {MEDAL_FAMILIES.map((family) => (
          <li key={family.key} className="flex flex-col items-center gap-2 text-center">
            <Family family={family} size={96} />
            <p className="text-sm font-semibold">{family.name}</p>
            <p className="md-muted flex items-center gap-1.5 text-xs">
              <span className="inline-flex">
                <Family family={family} size={20} />
              </span>
              {family.legend}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
