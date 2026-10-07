import type { CSSProperties } from "react";
import type { TempoCardMaterial } from "@/features/goals/card-material/tempo-card-material";

export type LadderKey = "graphite" | "steel" | "sapphire" | "gold" | "prism";
export type MaterialKey = LadderKey | TempoCardMaterial | "blank";

export type FaceKind = "brushed" | "gem" | "glass" | "foil" | "matte";

export interface Metal {
  hi: string;
  mid: string;
  lo: string;
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
  /** Colour of moving light. */
  shine: string;
  /** Chromatic foil stops (opaque; alpha is applied in CSS). */
  foil?: readonly [string, string, string, string];
}

const ALLOY_INK = ["#25374d", "#687d92", "#293d56"] as const;

const PRISM: Record<LadderKey, Finish> = {
  graphite: {
    key: "graphite",
    name: "Smoked quartz",
    face: "gem",
    metal: { hi: "#8a96a0", mid: "#4a555e", lo: "#20272d" },
    faceStops: ["#5d5853", "#1f1d1c", "#6a635b"],
    ink: ["#cfd5da", "#ffffff", "#9aa5ad"],
    type: "#eef0f1",
    shine: "#fff3e6",
  },
  steel: {
    key: "steel",
    name: "Clear crystal",
    face: "gem",
    metal: { hi: "#fbfdff", mid: "#b1bdc9", lo: "#5d6b7a" },
    faceStops: ["#f2f7fa", "#c2d0d9", "#e9f1f5"],
    ink: ["#30445a", "#7d93a9", "#263a50"],
    type: "#2f3f4e",
    shine: "#ffffff",
  },
  sapphire: {
    key: "sapphire",
    name: "Sapphire crystal",
    face: "gem",
    metal: { hi: "#eef8ff", mid: "#a9bfd8", lo: "#3e5a80" },
    faceStops: ["#1551a7", "#101f53", "#2c6dcc"],
    ink: ["#bcd8f2", "#ffffff", "#9cbfe5"],
    type: "#e5f3ff",
    shine: "#b2edff",
  },
  gold: {
    key: "gold",
    name: "Champagne crystal",
    face: "gem",
    metal: { hi: "#fff3cf", mid: "#d5b06a", lo: "#8a6630" },
    faceStops: ["#fbe7b5", "#d6a54a", "#fff1c9"],
    ink: ["#5a3f1c", "#b08637", "#4a3315"],
    type: "#4f3818",
    shine: "#fff8e6",
  },
  prism: {
    key: "prism",
    name: "Dichroic prism",
    face: "foil",
    metal: { hi: "#ffffff", mid: "#c3ccd6", lo: "#5b6773" },
    faceStops: ["#2a2f52", "#141827", "#35264f"],
    ink: ["#ffc6ea", "#ffffff", "#a8e6ff"],
    type: "#f1f3ff",
    shine: "#ffffff",
    foil: ["#ff9ad5", "#8fd8ff", "#aaffd0", "#fff09a"],
  },
};

export function levelFinish(level: number): Finish {
  return PRISM[level >= 10 ? "prism" : level >= 8 ? "gold" : level >= 6 ? "sapphire" : level >= 4 ? "steel" : "graphite"];
}

/** The unstruck blank: matte pewter, no enamel, no light. Every locked medal. */
export const BLANK: Finish = {
  key: "blank",
  name: "Unstruck blank",
  face: "matte",
  metal: { hi: "#eef0ef", mid: "#c9cdcb", lo: "#8f9593"},
  faceStops: ["#e3e6e4", "#d0d4d2", "#b8bdbb"],
  ink: ["#7f8684", "#7f8684", "#7f8684"],
  type: "#5f6664",
  shine: "#ffffff",
};

/**
 * Goal finishes take the card's own material, mixed with the goal colour by
 * the same formulas as `tempo-goal-creation.css`, so a medal beside its card
 * is the same stock.
 */
export function cardFinish(material: TempoCardMaterial, color: string): Finish {
  const m = (pct: number, base: string) => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  if (material === "alloy") {
    return {
      key: "alloy",
      name: "Anodized alloy",
      face: "brushed",
      metal: { hi: "#ffffff", mid: m(14, "#c8d1da"), lo: m(18, "#8c98a5")},
      faceStops: [m(14, "#d4dde5"), "#f2f5f7", m(8, "#d8e0e9")],
      ink: ALLOY_INK,
      type: "#2f3f4e",
      shine: "#ffffff",
    };
  }
  if (material === "chromatic") {
    return {
      key: "chromatic",
      name: "Chromatic foil",
      face: "foil",
      metal: { hi: "#eef3f5", mid: m(40, "#c4cbd0"), lo: "#242c31"},
      faceStops: [m(14, "#222b31"), m(9, "#192127"), m(6, "#12181c")],
      ink: ["#f5f8f9", m(40, "#c2cdd1"), "#ffffff"],
      type: "#edf2f4",
      shine: m(35, "#ffffff"),
      foil: [m(60, "#ffffff"), m(25, "#192127"), m(45, "#e8f1f3"), m(15, "#192127")],
    };
  }
  return {
    key: "glass",
    name: "Liquid glass",
    face: "glass",
    metal: { hi: "#ffffff", mid: m(12, "#e6efec"), lo: m(22, "#adccc5")},
    faceStops: ["#fdfff8", m(20, "#f6f8ef"), m(10, "#ffffff")],
    ink: ["#1f2a24", "#52665b", "#1f2a24"],
    type: "#1f2a24",
    shine: "#ffffff",
  };
}

/** Material tokens as scoped CSS variables for the layered Prism faces. */
export function finishVars(finish: Finish): CSSProperties {
  const foil = finish.foil ?? [finish.shine, finish.shine, finish.shine, finish.shine];
  const alpha = (color: string) => `color-mix(in srgb, ${color} 34%, transparent)`;
  return {
    "--m-hi": finish.metal.hi,
    "--m-mid": finish.metal.mid,
    "--m-lo": finish.metal.lo,
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

export const PRISM_LIGHT = { white: "#ffffff", black: "#000000" } as const;
