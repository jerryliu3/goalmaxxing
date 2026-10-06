import type { CSSProperties } from "react";
import type { AwardTier } from "@/features/achievements/types";
import { GAZETTEER_THEME } from "@cadence/shared/brand";
import { GAZETTEER, GAZETTEER_FALLBACK_COLORS } from "@cadence/shared/brand/gazetteer";
import { minTotalXpForLevel } from "@/lib/xp/progression";

export type MedalDirectionSlug = "machined" | "prism" | "tile" | "token" | "mark";

/** Every direction names the form it uses per award family — the mix-per-family idea. */
export type FormKey = "level" | MedalFamilyKey;

export interface MedalDirection {
  slug: MedalDirectionSlug;
  /** 3 = premium materials (the lead); 2 = flat systems kept as references. */
  round: 2 | 3;
  number: string;
  name: string;
  object: string;
  thesis: string;
  naming: string;
  locked: string;
  unlock: string;
  small: string;
  risk: string;
  forms: Record<FormKey, string>;
}

export const MEDAL_DIRECTIONS: readonly MedalDirection[] = [
  {
    slug: "machined",
    round: 3,
    number: "M8",
    name: "Machined",
    object: "Medals cut from the card’s own metal",
    thesis:
      "The Round 2 mix made physical: turned and brushed metal with a polished, reeded rim, an enamel band under a clear coat, and numerals engraved to bright metal. Levels climb a material ladder; goal finishes are struck in their card’s material.",
    naming: "Token’s card vocabulary — Footing, Stride, Pace, Rhythm, Tempo — with the material named beside it.",
    locked: "An unstruck blank: matte pewter, an empty enamel groove, the numeral as an outline. Progress still shows.",
    unlock: "The medal is struck into place, a light sweep crosses the metal, then a catch-light runs once around the rim.",
    small: "44px keeps the metal gradient, the rim, and the enamel colour; 20px is a polished rim, a face, and a bold numeral.",
    risk: "Heaviest to render: layered gradients, masks, and a relief filter per hero numeral. Needs device checks before a long shelf ships.",
    forms: {
      level: "Turned disc, enamel band",
      goal: "Card tile in the card’s material",
      streak: "Turned disc, enamel week segments",
      challenge: "Notched disc",
      leaderboard: "Shield",
      team: "Hexagon",
    },
  },
  {
    slug: "prism",
    round: 3,
    number: "M9",
    name: "Prism",
    object: "Crystal faces in a fine metal bezel",
    thesis:
      "The same forms as Machined, built like jewellery: a thin polished bezel holds a faceted crystal or chromatic-foil face, and the numerals are raised foil. The ladder runs from smoked quartz to a dichroic prism.",
    naming: "Token’s card vocabulary — Footing, Stride, Pace, Rhythm, Tempo — with the stone named beside it.",
    locked: "An unstruck blank in the bezel: matte, no facets, no foil; the numeral outlined.",
    unlock: "The stone is set, light sweeps across the facets, and the bezel catches once.",
    small: "44px keeps the bezel and the stone’s colour; facets and foil drop out below 56px.",
    risk: "Dark stones (sapphire, quartz, prism) read heavy on dark paper and need the bezel to separate them from the page.",
    forms: {
      level: "Faceted disc",
      goal: "Card tile in the card’s material",
      streak: "Disc, a channel of set stones",
      challenge: "Notched disc",
      leaderboard: "Shield",
      team: "Hexagon",
    },
  },
  {
    slug: "tile",
    round: 2,
    number: "M5",
    name: "Tile",
    object: "Every medal is a miniature of the goal card",
    thesis:
      "Cut each medal from the same stock as the goal card: rounded corners, a category-tinted face, a big light numeral, mono small caps. The family is the proportion of the tile.",
    naming: "Plain progress words — Starter, Regular, Steady, Seasoned, Keystone.",
    locked: "The die line: the tile is drawn as a hairline outline with an outlined numeral, exactly where it will sit.",
    unlock: "The tile is set down on the page, then its inset rule draws in.",
    small: "Solid accent tile with a paper numeral. Proportion alone tells a goal tile from a streak strip.",
    risk: "So close to the card that a shelf of tiles can read as a shelf of cards; proportions must stay strict.",
    forms: {
      level: "Square tile + effort bars",
      goal: "Card-proportion tile",
      streak: "Wide strip",
      challenge: "Ticket tile, perforated stub",
      leaderboard: "Podium tile",
      team: "Stacked tile pair",
    },
  },
  {
    slug: "token",
    round: 2,
    number: "M6",
    name: "Token",
    object: "Flat card-stock tokens with one hairline ring",
    thesis:
      "The seal, modernised: no scallops, no foil, no arc text. A disc of card material, one inset hairline, an embossed numeral. Families differ only by their edge.",
    naming: "Card vocabulary — Footing, Stride, Pace, Rhythm, Tempo.",
    locked: "Debossed: the token is pressed into the page with no ink, ring and numeral visible as relief.",
    unlock: "The hairline ring draws once around the edge, then the numeral rises.",
    small: "Disc + numeral. Edge (notches, segments, facets) is the only family cue, so it survives 20px.",
    risk: "Circles are the most generic badge shape; the card's tint and type have to do all the brand work.",
    forms: {
      level: "Plain disc",
      goal: "Disc + category band",
      streak: "Segmented progress ring",
      challenge: "Punched-notch disc",
      leaderboard: "Octagon",
      team: "Double ring",
    },
  },
  {
    slug: "mark",
    round: 2,
    number: "M7",
    name: "Mark",
    object: "Typographic marks: numeral, rule, label, simple shape",
    thesis:
      "Medals as a small identity system, not objects. Solid ink shapes with a paper numeral, a short rule, and a mono label — logo-like, and legible at 16px.",
    naming: "Print-shop stages — Outline, Draft, Plan, Proof, Edition.",
    locked: "Outline only: the shape and numeral as a single ink line, nothing filled.",
    unlock: "Ink fills the shape from the baseline up, like a mark being printed.",
    small: "Solid shape + numeral. Circle, card, pill, diamond, shield, hexagon — six shapes, no detail to lose.",
    risk: "Most abstract: without the card's material it leans on the colour of goal finishes for warmth.",
    forms: {
      level: "Circle",
      goal: "Card outline (category ink)",
      streak: "Pill",
      challenge: "Diamond",
      leaderboard: "Chevron shield",
      team: "Hexagon",
    },
  },
] as const;

export const ROUND_THREE = MEDAL_DIRECTIONS.filter((direction) => direction.round === 3);
export const ROUND_TWO = MEDAL_DIRECTIONS.filter((direction) => direction.round === 2);

export function getMedalDirection(slug: MedalDirectionSlug): MedalDirection {
  return MEDAL_DIRECTIONS.find((direction) => direction.slug === slug)!;
}

export const RANK_NAMES: Record<MedalDirectionSlug, readonly string[]> = {
  machined: ["Footing", "Stride", "Pace", "Rhythm", "Tempo"],
  prism: ["Footing", "Stride", "Pace", "Rhythm", "Tempo"],
  tile: ["Starter", "Regular", "Steady", "Seasoned", "Keystone"],
  token: ["Footing", "Stride", "Pace", "Rhythm", "Tempo"],
  mark: ["Outline", "Draft", "Plan", "Proof", "Edition"],
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

/* ------------------------------------------------------------------ */
/* Award families — scoping only, no data model.                        */
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
    key: "goal",
    name: "Goal finishes",
    earnsWhen: "A goal marked achieved. The mark carries its title, date, and reward text.",
    tiers: "None — one per goal",
    guardrail: "Yours alone; colour follows the goal’s category, not a tier.",
    legend: "Defend the thesis",
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

/** Physical objects (tiles, tokens) keep a light-paper tier ink in both themes, like the card. */
const TIER_HEX: Record<AwardTier, string> = {
  bronze: GAZETTEER_FALLBACK_COLORS[5],
  copper: GAZETTEER.stamp,
  sage: `color-mix(in srgb, ${GAZETTEER.sage} 85%, ${GAZETTEER.ink})`,
  gold: "#94702a",
  ink: GAZETTEER.ink,
};

export function tierHex(tier: AwardTier) {
  return TIER_HEX[tier];
}

const mix = (color: string, pct: number, base: string) =>
  `color-mix(in srgb, ${color} ${pct}%, ${base})`;

export function themeVars(mode: MedalsTheme): CSSProperties {
  const dark = GAZETTEER_THEME.darkColors;
  const vars =
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
  return vars as CSSProperties;
}
