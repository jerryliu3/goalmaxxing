import type { CSSProperties } from "react";
import type { AwardTier } from "@/features/achievements/types";
import {
  GAZETTEER,
  GAZETTEER_FALLBACK_COLORS,
  gazetteerDarkTheme,
} from "@cadence/shared/brand/gazetteer";
import { minTotalXpForLevel } from "@/lib/xp/progression";

export type MedalDirectionSlug = "postmark" | "seal" | "enamel" | "coin";

export interface MedalDirection {
  slug: MedalDirectionSlug;
  number: string;
  name: string;
  object: string;
  thesis: string;
  naming: string;
  locked: string;
  unlock: string;
  small: string;
  risk: string;
}

export const MEDAL_DIRECTIONS: readonly MedalDirection[] = [
  {
    slug: "postmark",
    number: "M1",
    name: "Postmark",
    object: "Inked cancellation stamps on a passport page",
    thesis:
      "Levels are places you have been. Each one is stamped into your passport in rank ink, slightly crooked, never quite registered twice.",
    naming: "Ports of call — Trailhead, Waystation, Crossing, High Pass, Far Shore.",
    locked: "A light pencil guide where the stamp will land: the ring, the name, a pair of registration ticks.",
    unlock: "The stamp strikes: overshoot, settle, ink spreads into the paper.",
    small: "Ring plus numeral. The cancel waves and ring text drop out below shelf size.",
    risk: "Ink texture and rotation can read as messy if every stamp is crooked the same way.",
  },
  {
    slug: "seal",
    number: "M2",
    name: "Letterpress seal",
    object: "A scalloped society seal, blind-embossed until earned",
    thesis:
      "The page is already Gazetteer paper. Locked seals are pressed into it without ink; earning one inks the bite and lays foil on the rim.",
    naming: "Society ranks — Wayfarer, Pathfinder, Surveyor, Cartographer, Fellow.",
    locked: "Blind emboss: the full seal is visible as relief in the paper, uninked.",
    unlock: "Ink rolls across the bite, then a single glint crosses the foil.",
    small: "Scalloped edge, foil ring, numeral. Survives 20px because the silhouette carries it.",
    risk: "Emboss relies on fine highlight/shadow lines that vanish on low-contrast dark screens.",
  },
  {
    slug: "enamel",
    number: "M3",
    name: "Enamel pin",
    object: "Cloisonné trail pins on a felt board",
    thesis:
      "Each level is a souvenir pin from the trail — flat enamel cells in brand colours, held by metal lines, plated by tier.",
    naming: "Trail emblems — Campfire, Compass, Ridgeline, Lighthouse, North Star.",
    locked: "The stamped metal blank before enamel: every cell is drawn, none are filled.",
    unlock: "Enamel floods the cells one by one, then the glaze catches the light.",
    small: "Main enamel field, plating ring, one emblem cell.",
    risk: "Illustration-heavy: every new level needs a drawn scene, which slows new families.",
  },
  {
    slug: "coin",
    number: "M4",
    name: "Engraved coin",
    object: "Line-engraved medallions minted in distance denominations",
    thesis:
      "A coin you mint by moving. Flat line engraving — reeded edge, beaded border, laurel — and a denomination instead of a bare number.",
    naming: "Distance denominations — Furlong, Mile, League, Degree, Meridian.",
    locked: "A graphite rubbing of the die: the relief is there in pencil, the coin is not struck yet.",
    unlock: "The coin spins in edge-on and lands face up.",
    small: "Reeded ring plus an Arabic numeral; Roman numerals and legend stay at hero size.",
    risk: "Coins skew toward currency and rewards-as-money if the copy leans on ‘earning’.",
  },
] as const;

export function getMedalDirection(slug: MedalDirectionSlug): MedalDirection {
  return MEDAL_DIRECTIONS.find((direction) => direction.slug === slug)!;
}

export const RANK_NAMES: Record<MedalDirectionSlug, readonly string[]> = {
  postmark: ["Trailhead", "Waystation", "Crossing", "High Pass", "Far Shore"],
  seal: ["Wayfarer", "Pathfinder", "Surveyor", "Cartographer", "Fellow"],
  enamel: ["Campfire", "Compass", "Ridgeline", "Lighthouse", "North Star"],
  coin: ["Furlong", "Mile", "League", "Degree", "Meridian"],
};

export interface MedalRung {
  index: number;
  level: number;
  tier: AwardTier;
  unlockedAt: string | null;
  took: string;
}

/** Seed mirrors the Achievements study: level 8 at 2,840 XP, level 10 still ahead. */
export const SEED_TOTAL_XP = 2840;

const xp = (level: number) => minTotalXpForLevel(level).toLocaleString("en-US");

export const MEDAL_RUNGS: readonly MedalRung[] = [
  {
    index: 0,
    level: 2,
    tier: "bronze",
    unlockedAt: "2026-03-12T14:20:00.000Z",
    took: `${xp(2)} XP — the first full week of logged sessions.`,
  },
  {
    index: 1,
    level: 4,
    tier: "copper",
    unlockedAt: "2026-05-02T09:10:00.000Z",
    took: `${xp(4)} XP — the plan held through a busy month.`,
  },
  {
    index: 2,
    level: 6,
    tier: "sage",
    unlockedAt: "2026-07-18T18:40:00.000Z",
    took: `${xp(6)} XP across three goals, one of them finished.`,
  },
  {
    index: 3,
    level: 8,
    tier: "gold",
    unlockedAt: "2026-09-01T11:05:00.000Z",
    took: `${xp(8)} XP — including Thesis defense, marked achieved.`,
  },
  {
    index: 4,
    level: 10,
    tier: "ink",
    unlockedAt: null,
    took: `${xp(10)} XP. ${(minTotalXpForLevel(10) - SEED_TOTAL_XP).toLocaleString("en-US")} to go.`,
  },
] as const;

export const NEWEST_EARNED_INDEX = 3;

export const TIER_LABEL: Record<AwardTier, string> = {
  bronze: "Bronze",
  copper: "Copper",
  sage: "Verdigris",
  gold: "Gold",
  ink: "Ink",
};

export function rankName(slug: MedalDirectionSlug, index: number) {
  return RANK_NAMES[slug][index] ?? `Level ${MEDAL_RUNGS[index]?.level ?? "?"}`;
}

export function romanNumeral(value: number) {
  const table: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let rest = value;
  let out = "";
  for (const [amount, glyph] of table) {
    while (rest >= amount) {
      out += glyph;
      rest -= amount;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Future families — scoping only, no data model.                       */
/* ------------------------------------------------------------------ */

export type MedalFamilyKey = "challenge" | "leaderboard" | "streak" | "goal" | "team";

export interface MedalFamily {
  key: MedalFamilyKey;
  name: string;
  earnsWhen: string;
  tiers: string;
  guardrail: string;
  /** Short legend printed on the example mark. */
  legend: string;
}

export const MEDAL_FAMILIES: readonly MedalFamily[] = [
  {
    key: "challenge",
    name: "Challenges",
    earnsWhen: "Completed every session of a challenge inside its window; ‘won’ adds a winner variant.",
    tiers: "Completed · Won",
    guardrail: "One mark per challenge instance. Leaving early earns nothing, loses nothing.",
    legend: "30-day climb",
  },
  {
    key: "leaderboard",
    name: "Leaderboards",
    earnsWhen: "Finished a weekly board in the top 10, top 3, or first.",
    tiers: "Top 10 · Top 3 · 1st",
    guardrail: "Only boards with ≥ 8 active members award marks; repeats stack as a count, not new marks.",
    legend: "Top 3",
  },
  {
    key: "streak",
    name: "Streaks",
    earnsWhen: "Hit your weekly plan N weeks running: 4, 12, 26, 52.",
    tiers: "4 · 12 · 26 · 52 weeks",
    guardrail: "Weeks, not days. Recover weeks keep the run; a break never revokes a mark.",
    legend: "12 weeks",
  },
  {
    key: "goal",
    name: "Goal finishes",
    earnsWhen: "A goal marked achieved. The mark carries its title, date, and reward text.",
    tiers: "None — one per goal",
    guardrail: "Yours alone; colour follows the goal’s category, not a tier.",
    legend: "Thesis defense",
  },
  {
    key: "team",
    name: "Team",
    earnsWhen: "A club goal finished together, for members who logged at least one session toward it.",
    tiers: "Member · Anchor (top contributor)",
    guardrail: "No individual ranking inside the team mark.",
    legend: "Ridge club",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Theme: Gazetteer tokens as scoped CSS variables for light and dark.  */
/* ------------------------------------------------------------------ */

export type MedalsTheme = "light" | "dark";

/** Bronze is the brand's fallback ochre; gold is the one study-only foil. */
export const BRONZE = GAZETTEER_FALLBACK_COLORS[5];
export const FOIL = { deep: "#94702a", mid: "#c49a45", light: "#e6cd8c" } as const;

const mix = (color: string, pct: number, base: string) =>
  `color-mix(in srgb, ${color} ${pct}%, ${base})`;

const TIER_INK: Record<AwardTier, Record<MedalsTheme, string>> = {
  bronze: { light: BRONZE, dark: mix(BRONZE, 55, GAZETTEER.page) },
  copper: { light: GAZETTEER.stamp, dark: GAZETTEER.stampLight },
  sage: { light: mix(GAZETTEER.sage, 85, GAZETTEER.ink), dark: mix(GAZETTEER.sage, 62, GAZETTEER.page) },
  gold: { light: FOIL.deep, dark: FOIL.light },
  ink: { light: GAZETTEER.ink, dark: GAZETTEER.page },
};

/** `var(--md-tier-…)`: rank ink that stays legible on the active page colour. */
export function tierInk(tier: AwardTier) {
  return `var(--md-tier-${tier})`;
}

export function themeVars(mode: MedalsTheme): CSSProperties {
  const dark = gazetteerDarkTheme;
  const base =
    mode === "light"
      ? {
          "--md-page": GAZETTEER.page,
          "--md-paper": GAZETTEER.paper,
          "--md-ink": GAZETTEER.ink,
          "--md-muted": GAZETTEER.muted,
          "--md-deep": GAZETTEER.mutedDeep,
          "--md-rule": GAZETTEER.rule,
          "--md-stamp": GAZETTEER.stamp,
          "--md-hi": mix("#fff", 72, GAZETTEER.paper),
          "--md-lo": mix(GAZETTEER.ink, 24, GAZETTEER.paper),
          "--md-pencil": mix(GAZETTEER.mutedDeep, 62, GAZETTEER.paper),
        }
      : {
          "--md-page": dark.background,
          "--md-paper": dark.card,
          "--md-ink": dark.foreground,
          "--md-muted": dark.mutedForeground,
          "--md-deep": GAZETTEER.rule,
          "--md-rule": dark.border,
          "--md-stamp": dark.primary,
          "--md-hi": mix("#fff", 14, dark.card),
          "--md-lo": mix("#000", 60, dark.card),
          "--md-pencil": mix(dark.mutedForeground, 70, dark.card),
        };
  const tiers = Object.fromEntries(
    (Object.keys(TIER_INK) as AwardTier[]).map((tier) => [
      `--md-tier-${tier}`,
      TIER_INK[tier][mode],
    ])
  );
  return { ...base, ...tiers } as CSSProperties;
}

/** Compact UTC date for stamp faces: "01 SEP 26". */
export function stampDate(value: string | null) {
  if (!value) return "— — —";
  const date = new Date(value);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return `${day} ${month} ${String(date.getUTCFullYear()).slice(2)}`;
}
