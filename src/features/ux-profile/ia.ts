/** Proposed tab map, redundancy moves, and score names for the study index. */

export interface TabPlan {
  name: string;
  kind: "tab" | "button";
  was?: string;
  holds: readonly string[];
}

export const NEW_MAP: readonly TabPlan[] = [
  {
    name: "Agenda",
    kind: "tab",
    holds: ["Today and calendar", "Period check-in overlay"],
  },
  {
    name: "Goals",
    kind: "tab",
    holds: ["Current goals", "Past goals (absorbs the Goal library)"],
  },
  {
    name: "Growth",
    kind: "tab",
    was: "Achievements",
    holds: [
      "Medals + personal records",
      "Progress tracker (from Goals)",
      "Score, renamed",
      "Stats + heatmap (absorbs /insights/more)",
    ],
  },
  {
    name: "Community",
    kind: "tab",
    holds: ["Feed, friends, club", "Other people’s profiles open here"],
  },
  {
    name: "Avatar",
    kind: "button",
    holds: ["Your public profile (curated view of Growth)", "Settings"],
  },
] as const;

export interface RedundancyRow {
  item: string;
  today: string;
  home: string;
}

export const REDUNDANCY_ROWS: readonly RedundancyRow[] = [
  { item: "Past goals", today: "Goals · Past goals and Achievements · Goal library", home: "Goals · Past" },
  { item: "Goal library", today: "Achievements (FolioShelf of the same data)", home: "Removed — merged into Goals · Past" },
  { item: "Progress tracker", today: "Goals", home: "Growth" },
  { item: "Score", today: "Settings presence chart, /user page", home: "Growth (renamed)" },
  { item: "Stats tiles", today: "Settings, public sheet, orphan /insights/more", home: "Growth · Stats" },
  { item: "Year heatmap", today: "Settings, /user page, public sheet", home: "Growth · Stats" },
  { item: "Medals", today: "Achievements and the public sheet’s medal shelf", home: "Growth; profile shows only pinned" },
  { item: "Membership card", today: "Settings (editable) and /user page", home: "Public profile header, rendered once" },
  { item: "Public profile", today: "/user page and in-app sheet, different content", home: "One PublicProfileView: full + compact" },
] as const;

export interface ScoreName {
  name: string;
  why: string;
  caution: string;
}

export const SCORE_NAMES: readonly ScoreName[] = [
  {
    name: "Form",
    why: "Sports sense of “in form”: recent, earned, recoverable. Short enough for a chip (Form 72).",
    caution: "Reads as “a form” out of context; needs the number beside it.",
  },
  {
    name: "Momentum",
    why: "Says the score moves with recent effort and decays gently when you stop.",
    caution: "Long for a chip and common in fitness apps.",
  },
  {
    name: "Stride",
    why: "Walking metaphor that fits Gazetteer’s quiet voice; implies steady, not peak.",
    caution: "Less self-explanatory than Form.",
  },
] as const;

/** Names that collide with existing internals and should not be used for the score. */
export const SCORE_NAME_COLLISIONS = [
  { name: "Pace", reason: "already a field on every grow-score point (`pace`)" },
  { name: "Tempo", reason: "already the goal card / creation family name" },
] as const;
