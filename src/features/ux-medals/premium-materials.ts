import type { CSSProperties } from "react";
import type { TempoCardMaterial } from "@/features/goals/card-material/tempo-card-material";
import type { Award } from "@/features/ux-medals/awards";

/**
 * Round 3 materials. Every palette here is lifted from a card material that
 * already ships or was studied: the production card recipes in
 * `goals/tempo-goal-creation.css` (alloy, glass, chromatic) and the twelve
 * study finishes in `ux-brand/card-materials` (Platinum Mirror, Sapphire
 * Prism, Foil Print, Ruby Cabochon). Medals and cards share one material
 * vocabulary; only the object changes.
 */

export type Variant = "machined" | "prism";
export type LadderKey = "graphite" | "steel" | "sapphire" | "gold" | "prism";
export type MaterialKey = LadderKey | TempoCardMaterial | "blank";

/**
 * How the face is lit. `turned` = lathe-spun metal (conic anisotropic light +
 * concentric grain), `brushed` = linear grain like the alloy card, `gem` =
 * faceted crystal (sapphire card facets), `glass` = the liquid-glass card,
 * `foil` = dark smoke metal with chromatic foil, `matte` = an unstruck blank.
 */
export type FaceKind = "turned" | "brushed" | "gem" | "glass" | "foil" | "matte";

export interface Metal {
  hi: string;
  mid: string;
  lo: string;
  /** The side wall you see when the medal turns. */
  edge: string;
}

export interface Finish {
  key: MaterialKey;
  name: string;
  face: FaceKind;
  /** Bezel, rim, and body metal. */
  metal: Metal;
  /** Face base gradient: light, middle, deep. */
  faceStops: readonly [string, string, string];
  /** Numeral gradient (the card's lettering recipe): deep, highlight, deep. */
  ink: readonly [string, string, string];
  /** Plain small type: captions, names, ticks. */
  type: string;
  /** Machined enamel band: base, light. */
  enamel: readonly [string, string];
  /** Colour of moving light. */
  shine: string;
  /** Chromatic foil stops (opaque; alpha is applied in CSS). */
  foil?: readonly [string, string, string, string];
}

const SPECTRUM = ["#ff9ad5", "#8fd8ff", "#aaffd0", "#fff09a"] as const;

const METAL = {
  graphite: { hi: "#8a96a0", mid: "#4a555e", lo: "#20272d", edge: "#12171b" },
  steel: { hi: "#fbfdff", mid: "#b1bdc9", lo: "#5d6b7a", edge: "#3c4754" },
  /** Sapphire Prism's platinum setting. */
  platinum: { hi: "#eef8ff", mid: "#a9bfd8", lo: "#3e5a80", edge: "#1c2f4d" },
  /** Platinum Mirror, the bright bezel for the prism capstone. */
  mirror: { hi: "#ffffff", mid: "#c3ccd6", lo: "#5b6773", edge: "#2f3740" },
  /** Foil Print / reward-object champagne gold. */
  gold: { hi: "#fff3cf", mid: "#d5b06a", lo: "#8a6630", edge: "#5a3f1c" },
  /** Chromatic Foil's smoke metal. */
  smoke: { hi: "#edf6f6", mid: "#8fa3ab", lo: "#25333b", edge: "#141c21" },
} as const satisfies Record<string, Metal>;

/** Production alloy numerals (`.tempo-card[data-material="alloy"] strong`). */
const ALLOY_INK = ["#25374d", "#687d92", "#293d56"] as const;
const FOIL_INK = ["#ffc6ea", "#ffffff", "#a8e6ff"] as const;

const MACHINED: Record<LadderKey, Finish> = {
  graphite: {
    key: "graphite",
    name: "Anodized graphite",
    face: "turned",
    metal: METAL.graphite,
    faceStops: ["#6b7782", "#3b454e", "#1f262c"],
    // Cutting through dark anodizing exposes bright bare metal.
    ink: ["#aeb9c0", "#f6f9fa", "#8d99a2"],
    type: "#e3e8eb",
    enamel: ["#173d33", "#4a8a70"],
    shine: "#e8f0f4",
  },
  steel: {
    key: "steel",
    name: "Brushed steel",
    face: "brushed",
    metal: METAL.steel,
    faceStops: ["#f4f7fa", "#c3ccd5", "#8e9aa8"],
    ink: ALLOY_INK,
    type: "#2f3f4e",
    enamel: ["#14294a", "#4a72a8"],
    shine: "#ffffff",
  },
  sapphire: {
    key: "sapphire",
    name: "Sapphire & platinum",
    face: "gem",
    metal: METAL.platinum,
    faceStops: ["#1551a7", "#101f53", "#2c6dcc"],
    ink: ["#bcd8f2", "#ffffff", "#9cbfe5"],
    type: "#e5f3ff",
    // An ivory enamel ring around the cabochon, like a watch dial.
    enamel: ["#dfe9f2", "#ffffff"],
    shine: "#b2edff",
  },
  gold: {
    key: "gold",
    name: "Gold anodized",
    face: "turned",
    metal: METAL.gold,
    faceStops: ["#f8e6b4", "#d4b26d", "#a98348"],
    ink: ["#5a3f1c", "#a07a35", "#4a3315"],
    type: "#4f3818",
    // Ruby Cabochon's lacquer as an oxblood enamel band.
    enamel: ["#5c1028", "#c0566f"],
    shine: "#fff6dc",
  },
  prism: {
    key: "prism",
    name: "Chromatic prism",
    face: "foil",
    metal: METAL.smoke,
    faceStops: ["#2a353c", "#192127", "#10161a"],
    ink: FOIL_INK,
    type: "#edf2f4",
    enamel: ["#2b2350", "#8a7bff"],
    shine: "#ffffff",
    foil: SPECTRUM,
  },
};

const PRISM: Record<LadderKey, Finish> = {
  graphite: {
    ...MACHINED.graphite,
    name: "Smoked quartz",
    face: "gem",
    faceStops: ["#5d5853", "#1f1d1c", "#6a635b"],
    ink: ["#cfd5da", "#ffffff", "#9aa5ad"],
    type: "#eef0f1",
    shine: "#fff3e6",
  },
  steel: {
    ...MACHINED.steel,
    name: "Clear crystal",
    face: "gem",
    faceStops: ["#f2f7fa", "#c2d0d9", "#e9f1f5"],
    ink: ["#30445a", "#7d93a9", "#263a50"],
  },
  sapphire: { ...MACHINED.sapphire, name: "Sapphire crystal" },
  gold: {
    ...MACHINED.gold,
    name: "Champagne crystal",
    face: "gem",
    faceStops: ["#fbe7b5", "#d6a54a", "#fff1c9"],
    ink: ["#5a3f1c", "#b08637", "#4a3315"],
    shine: "#fff8e6",
  },
  prism: {
    ...MACHINED.prism,
    name: "Dichroic prism",
    metal: METAL.mirror,
    faceStops: ["#2a2f52", "#141827", "#35264f"],
    type: "#f1f3ff",
  },
};

export function ladderFinish(variant: Variant, key: LadderKey): Finish {
  return (variant === "machined" ? MACHINED : PRISM)[key];
}

/** The unstruck blank: matte pewter, no enamel, no light. Every locked medal. */
export const BLANK: Finish = {
  key: "blank",
  name: "Unstruck blank",
  face: "matte",
  metal: { hi: "#eef0ef", mid: "#c9cdcb", lo: "#8f9593", edge: "#6c7270" },
  faceStops: ["#e3e6e4", "#d0d4d2", "#b8bdbb"],
  ink: ["#7f8684", "#7f8684", "#7f8684"],
  type: "#5f6664",
  enamel: ["#b3b8b6", "#c9cdcb"],
  shine: "#ffffff",
};

/**
 * Goal finishes take the card's own material, mixed with the goal colour by
 * the same formulas as `tempo-goal-creation.css`, so a medal beside its card
 * is the same stock.
 */
export function cardFinish(material: TempoCardMaterial, color: string): Finish {
  const m = (pct: number, base: string) => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  const enamel = [color, m(45, "#ffffff")] as const;
  if (material === "alloy") {
    return {
      key: "alloy",
      name: "Anodized alloy",
      face: "brushed",
      metal: { hi: "#ffffff", mid: m(14, "#c8d1da"), lo: m(18, "#8c98a5"), edge: m(18, "#5f6b78") },
      faceStops: [m(14, "#d4dde5"), "#f2f5f7", m(8, "#d8e0e9")],
      ink: ALLOY_INK,
      type: "#2f3f4e",
      enamel,
      shine: "#ffffff",
    };
  }
  if (material === "chromatic") {
    return {
      key: "chromatic",
      name: "Chromatic foil",
      face: "foil",
      metal: { hi: "#eef3f5", mid: m(40, "#c4cbd0"), lo: "#242c31", edge: "#151b1f" },
      faceStops: [m(14, "#222b31"), m(9, "#192127"), m(6, "#12181c")],
      ink: ["#f5f8f9", m(40, "#c2cdd1"), "#ffffff"],
      type: "#edf2f4",
      enamel,
      shine: m(35, "#ffffff"),
      foil: [m(60, "#ffffff"), m(25, "#192127"), m(45, "#e8f1f3"), m(15, "#192127")],
    };
  }
  return {
    key: "glass",
    name: "Liquid glass",
    face: "glass",
    metal: { hi: "#ffffff", mid: m(12, "#e6efec"), lo: m(22, "#adccc5"), edge: m(22, "#7f9c95") },
    faceStops: ["#fdfff8", m(20, "#f6f8ef"), m(10, "#ffffff")],
    ink: ["#1f2a24", "#52665b", "#1f2a24"],
    type: "#1f2a24",
    enamel,
    shine: "#ffffff",
  };
}

export const CARD_MATERIAL_NAME: Record<TempoCardMaterial, string> = {
  glass: "Liquid glass",
  alloy: "Anodized alloy",
  chromatic: "Chromatic foil",
};

/* ------------------------------------------------------------------ */
/* The ladder: one material per level, mirrored from a card material.  */
/* ------------------------------------------------------------------ */

export interface LadderStep {
  key: LadderKey;
  level: number;
  name: string;
  mirrors: string;
  machined: string;
  prism: string;
}

export const LADDER: readonly LadderStep[] = [
  {
    key: "graphite",
    level: 2,
    name: "Graphite",
    mirrors: "Chromatic Foil’s smoke metal, anodized like Alloy",
    machined: "Lathe-turned graphite, pine enamel band, numerals cut to bright metal",
    prism: "Smoked quartz in a graphite bezel",
  },
  {
    key: "steel",
    level: 4,
    name: "Steel",
    mirrors: "Platinum Mirror / the alloy card’s brushed grain",
    machined: "Brushed steel, navy enamel band, the alloy card’s engraved numerals",
    prism: "Clear crystal in a steel bezel",
  },
  {
    key: "sapphire",
    level: 6,
    name: "Sapphire",
    mirrors: "Sapphire Prism: midnight blue, cyan facets, platinum setting",
    machined: "Platinum rim, ivory enamel ring, sapphire cabochon centre",
    prism: "Faceted sapphire in a platinum bezel",
  },
  {
    key: "gold",
    level: 8,
    name: "Gold",
    mirrors: "Foil Print’s champagne gold, Ruby Cabochon’s lacquer",
    machined: "Turned gold anodizing, oxblood enamel band",
    prism: "Champagne crystal in a gold bezel",
  },
  {
    key: "prism",
    level: 10,
    name: "Prism",
    mirrors: "Chromatic Foil’s smoke face with Foil Print’s spectral sheen",
    machined: "Smoke metal, chromatic foil face and band",
    prism: "Dichroic crystal in a mirror-platinum bezel",
  },
] as const;

/** System awards climb the same ladder: longer runs and better finishes earn better stock. */
const AWARD_MATERIAL: Record<string, LadderKey> = {
  "streak-4": "graphite",
  "streak-12": "steel",
  "streak-26": "sapphire",
  "streak-52": "gold",
  climb: "steel",
  "spring-5k": "gold",
  mornings: "steel",
  "board-31": "steel",
  "board-36": "gold",
  "board-first": "prism",
  "ridge-member": "graphite",
  "ridge-anchor": "gold",
};

export function awardFinish(variant: Variant, award: Award): Finish {
  if (!award.date) return BLANK;
  if (award.family === "goal") return cardFinish(award.material ?? "glass", award.color ?? "#8c98a5");
  return ladderFinish(variant, AWARD_MATERIAL[award.id] ?? "steel");
}

/** Material tokens as scoped CSS variables for the layered faces in `premium.css`. */
export function finishVars(finish: Finish): CSSProperties {
  const foil = finish.foil ?? [finish.shine, finish.shine, finish.shine, finish.shine];
  const alpha = (color: string) => `color-mix(in srgb, ${color} 34%, transparent)`;
  return {
    "--m-hi": finish.metal.hi,
    "--m-mid": finish.metal.mid,
    "--m-lo": finish.metal.lo,
    "--m-edge": finish.metal.edge,
    "--m-fa": finish.faceStops[0],
    "--m-fb": finish.faceStops[1],
    "--m-fc": finish.faceStops[2],
    "--m-shine": finish.shine,
    "--m-f1": alpha(foil[0]),
    "--m-f2": alpha(foil[1]),
    "--m-f3": alpha(foil[2]),
    "--m-f4": alpha(foil[3]),
  } as CSSProperties;
}
