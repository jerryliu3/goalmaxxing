import type { FormKey } from "@/features/ux-medals/model";
import { VIEW, notchedCirclePath, polygonPath, roundedRectPath } from "@/features/ux-medals/svg-geometry";

/**
 * Round 3 geometry. The silhouettes are the Round 2 mix (Token discs, the
 * goal Tile, Mark's shield and hexagon); each is expressed as `path(k)`, the
 * shape inset by k units, so rims, enamel bands, and faces nest exactly.
 */

export type PremiumForm = "disc" | "notched" | "tile" | "shield" | "hexagon";

/**
 * Level of detail. Hero and shelf carry grain, specular light, engraving and
 * ornament; small (≈44px) keeps metal gradient, rim, and enamel; tiny (≈20px)
 * is a polished rim, a face gradient, and a bold numeral.
 */
export type PremiumDetail = "hero" | "shelf" | "small" | "tiny";

export function premiumDetail(size: number): PremiumDetail {
  if (size >= 120) return "hero";
  if (size >= 56) return "shelf";
  if (size >= 32) return "small";
  return "tiny";
}

export interface FormGeometry {
  path: (k: number) => string;
  circular: boolean;
  /** Machined: rim inner edge, then enamel band inner edge. */
  rim: number;
  band: number;
  /** Prism: thin bezel. */
  bezel: number;
  /** Tiny sizes widen the rim so the silhouette reads. */
  tinyRim: number;
  /** Prism hairline (the card's inset rule / a gem's table). */
  table: number;
}

const r2 = (value: number) => Math.round(value * 100) / 100;

export const circlePath = (r: number) =>
  `M ${r2(60 - r)} 60 A ${r2(r)} ${r2(r)} 0 1 1 ${r2(60 + r)} 60 A ${r2(r)} ${r2(r)} 0 1 1 ${r2(60 - r)} 60 Z`;

function shieldPath(k: number) {
  const side = r2(70 - 0.45 * k);
  return `M ${r2(14 + k)} ${r2(10 + k)} H ${r2(106 - k)} V ${side} L 60 ${r2(112 - 1.35 * k)} L ${r2(14 + k)} ${side} Z`;
}

export const FORMS: Record<PremiumForm, FormGeometry> = {
  disc: { path: (k) => circlePath(56 - k), circular: true, rim: 5, band: 13, bezel: 3.2, tinyRim: 10, table: 15 },
  notched: {
    // Only the outer edge is punched; inner rings stay round.
    path: (k) => (k === 0 ? notchedCirclePath(56, 8, 4.6, 22.5) : circlePath(54.5 - k)),
    circular: true,
    rim: 5,
    band: 13,
    bezel: 3.2,
    tinyRim: 10,
    table: 15,
  },
  tile: {
    path: (k) => roundedRectPath(12 + k, 4 + k, 96 - 2 * k, 112 - 2 * k, Math.max(9 - k * 0.7, 2.5)),
    circular: false,
    rim: 4,
    band: 7.5,
    bezel: 3,
    tinyRim: 9,
    table: 7,
  },
  shield: { path: shieldPath, circular: false, rim: 5, band: 11, bezel: 3.2, tinyRim: 10, table: 11 },
  hexagon: {
    path: (k) => polygonPath(57 - k * 1.155, 6),
    circular: false,
    rim: 5,
    band: 11,
    bezel: 3.2,
    tinyRim: 10,
    table: 11,
  },
};

export const FORM_FOR: Record<FormKey, PremiumForm> = {
  level: "disc",
  goal: "tile",
  streak: "disc",
  challenge: "notched",
  leaderboard: "shield",
  team: "hexagon",
};

/** Two closed paths filled even-odd: the band between them. */
export const ringPath = (outer: string, inner: string) => `${outer} ${inner}`;

const maskCache = new Map<string, string>();

/**
 * A path as a CSS mask image on the same 120-unit grid as the SVG overlay, so
 * CSS material layers (conic turned metal, brushed grain, facets) and SVG
 * ornament line up at every size. Cached: each shape is encoded once.
 */
export function shapeMask(d: string) {
  let url = maskCache.get(d);
  if (!url) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}"><path fill-rule="evenodd" d="${d}"/></svg>`;
    url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    maskCache.set(d, url);
  }
  return url;
}
