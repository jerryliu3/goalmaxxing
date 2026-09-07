export type BrandSkinId = "gazetteer" | "col";

export interface BrandSkin {
  id: BrandSkinId;
  name: string;
  href: `/ux/brand/${string}`;
  otherHref: `/ux/brand/${string}`;
  otherName: string;
  kicker: string;
  thesis: string;
  typeNote: string;
  pageBg: string;
  paper: string;
  ink: string;
  muted: string;
  rule: string;
  accent: string;
  gain: string;
  recover: string;
  markIdle: string;
  markDone: string;
  stackVariant: "blaze" | "cairn";
  sky: boolean;
}

export const GAZETTEER_SKIN: BrandSkin = {
  id: "gazetteer",
  name: "Gazetteer",
  href: "/ux/brand/kit-gazetteer",
  otherHref: "/ux/brand/kit-col",
  otherName: "Col kit",
  kicker: "Leading lock · vibe",
  thesis:
    "The surveyor’s ledger applied to Spatial Plan atoms: pills, rows, week, month, heatmap, sheet. Nest is the completion mark. Soft paper is the corner lock.",
  typeNote: "Newsreader names · Source Sans 3 labels · IBM Plex Mono rise",
  pageBg: "#f3ead8",
  paper: "#f8f1e3",
  ink: "#241c14",
  muted: "#7a6a56",
  rule: "#d4c4a4",
  accent: "#9a4f2c",
  gain: "#4a6740",
  recover: "#b45309",
  markIdle: "#9a4f2c",
  markDone: "#9a4f2c",
  stackVariant: "blaze",
  sky: false,
};

export const COL_SKIN: BrandSkin = {
  id: "col",
  name: "Col",
  href: "/ux/brand/kit-col",
  otherHref: "/ux/brand/kit-gazetteer",
  otherName: "Gazetteer kit",
  kicker: "Runner-up · Figtree on Col furniture",
  thesis:
    "The pass and parchment sky, with Figtree instead of Newsreader. Same ridges and rust. Nest is the completion mark. The cairn stack stays as a toggle.",
  typeNote: "Figtree chapter and chrome · IBM Plex Mono gain",
  pageBg: "#efe8dc",
  paper: "#f4f1ea",
  ink: "#2a241c",
  muted: "#6b6054",
  rule: "#d4c8b8",
  accent: "#b5522a",
  gain: "#5c5348",
  recover: "#b45309",
  markIdle: "#c4a992",
  markDone: "#6e8b74",
  stackVariant: "cairn",
  sky: true,
};
