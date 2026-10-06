"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { formatAwardDate } from "@/features/achievements/format";
import { LetteringFilters } from "@/features/ux-brand/card-materials/lettering-filters";
import { LightStage } from "@/features/ux-medals/light-stage";
import type { LevelMarkProps } from "@/features/ux-medals/mark-kit";
import {
  MEDAL_RUNGS,
  NEWEST_EARNED_INDEX,
  ROUND_THREE,
  ROUND_TWO,
  rankName,
  themeVars,
  type MedalDirection,
  type MedalDirectionSlug,
  type MedalRung,
  type MedalsTheme,
} from "@/features/ux-medals/model";
import { LETTERING_ID } from "@/features/ux-medals/premium-medal";
import "@/features/ux-medals/medals.css";
import "@/features/ux-medals/premium.css";

/** Root for every medals page: scoped Gazetteer tokens plus a paper light/dark toggle. */
export function MedalsStage({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  const [theme, setTheme] = useState<MedalsTheme>("light");
  const dark = theme === "dark";
  return (
    <div className="md-root" data-theme={theme} style={themeVars(theme)}>
      {/* Engraved / raised relief for medal numerals, shared by every medal on the page. */}
      <LetteringFilters id={LETTERING_ID} />
      <header className="md-hair border-b px-4 py-2 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {nav}
          <button
            type="button"
            className="md-button"
            aria-pressed={dark}
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {dark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
            Dark paper
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

const NAV_ROUNDS = [
  { label: "Round 3 premium", items: ROUND_THREE },
  { label: "Round 2 (flat)", items: ROUND_TWO },
] as const;

export function DirectionNav({ direction }: { direction: MedalDirection }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <Link href="/ux/medals" className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <ArrowLeft aria-hidden className="size-4" />
        Medals
      </Link>
      <p className="md-kicker hidden sm:block">
        {direction.number} / {direction.name}
      </p>
      <nav aria-label="Medal directions" className="flex items-center gap-2">
        {NAV_ROUNDS.map((round, index) => (
          <ul key={round.label} className="flex items-center gap-1" aria-label={round.label}>
            {index > 0 ? <li aria-hidden className="md-hair mx-1 h-6 border-l" /> : null}
            {round.items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/ux/medals/${item.slug}`}
                  aria-label={`Open ${item.name}`}
                  aria-current={item.slug === direction.slug ? "page" : undefined}
                  className="md-chip"
                  title={item.name}
                >
                  {item.number}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </nav>
    </div>
  );
}

/** Selected rung + unlock replay; selecting another rung clears the replay. */
export function useLadderSelection() {
  const [selected, setSelected] = useState(NEWEST_EARNED_INDEX);
  const [replay, setReplay] = useState(0);
  const rung = MEDAL_RUNGS[selected]!;
  const locked = !rung.unlockedAt;
  return {
    rung,
    locked,
    replay,
    previewing: replay > 0 && locked,
    select: (index: number) => {
      setSelected(index);
      setReplay(0);
    },
    play: () => setReplay((n) => n + 1),
  };
}

export function LadderStrip({
  slug,
  selected,
  onSelect,
  Level,
  note,
  surface = "md-surface",
}: {
  slug: MedalDirectionSlug;
  selected: number;
  onSelect: (index: number) => void;
  Level: ComponentType<LevelMarkProps>;
  /** Extra line under each rung (Round 3 names the material). */
  note?: (rung: MedalRung) => string;
  surface?: string;
}) {
  return (
    <section className="mt-8" aria-label="Level ladder">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">The ladder</h2>
        <p className="md-muted text-xs">
          {MEDAL_RUNGS.filter((item) => item.unlockedAt).length} of {MEDAL_RUNGS.length} earned
        </p>
      </div>
      <LightStage className={`${surface} mt-3 p-2`}>
        <ul className="grid grid-cols-3 gap-1 sm:grid-cols-5">
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
                  onClick={() => onSelect(item.index)}
                >
                  <span className="grid place-items-center p-1">
                    <Level rung={item} name={itemName} locked={itemLocked} size={72} />
                  </span>
                  <span className="truncate text-sm font-semibold">{itemName}</span>
                  <span className="md-muted font-mono text-[11px]">
                    Lv {item.level} · {itemLocked ? "locked" : formatAwardDate(item.unlockedAt)}
                  </span>
                  {note ? <span className="md-muted text-[11px] leading-tight">{note(item)}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </LightStage>
    </section>
  );
}

export function BetNote({ direction }: { direction: MedalDirection }) {
  const rows: [string, string][] = [
    ["Ranks", direction.naming],
    ["Locked", direction.locked],
    ["Unlock", direction.unlock],
    ["Small sizes", direction.small],
    ["Risk", direction.risk],
  ];
  return (
    <section className="md-hair mt-14 border-t pt-8" aria-label="The bet">
      <p className="md-kicker">The bet</p>
      <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight">{direction.thesis}</h2>
      <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([term, detail]) => (
          <div key={term}>
            <dt className="md-kicker">{term}</dt>
            <dd className="md-deep mt-1 leading-relaxed">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
