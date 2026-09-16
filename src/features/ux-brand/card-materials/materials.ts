import type { GoalCreationFields } from "@/features/goals/goal-creation-model";

export const MATERIALS = [
  { id: "glass", name: "Liquid Glass", tag: "01 / Optical · 3D", premise: "A translucent object with a polished rim. Color lives behind the glass; the commitment floats just above it.", detail: "Pointer light, a beveled edge, and a suspended face. A milky reading layer keeps small type grounded.", use: "A single featured goal or the active folio card.", tradeoff: "The most luminous option; blur and transparency need careful contrast and device checks." },
  { id: "ceramic", name: "Ceramic Relief", tag: "02 / Sculptural · 3D", premise: "A substantial, glazed tile. Softly rounded corners, a thick colored edge, and raised numerals you almost want to touch.", detail: "Directional shadows give the tile weight. The large target and title sit above a softly lit ceramic face.", use: "The strongest starting point for everyday goal cards.", tradeoff: "Tactile without blur; keep the depth restrained in dense layouts." },
  { id: "diorama", name: "Layered Diorama", tag: "03 / Spatial · 3D", premise: "A miniature paper sculpture. Separate planes of color, type, and detail reveal themselves as the card turns.", detail: "A recessed backplate, offset paper sheets, and floating typography create real separation between layers.", use: "Folio browsing and a focused goal preview.", tradeoff: "The most expressive silhouette; needs breathing room and a flatter list treatment." },
  { id: "foil", name: "Foil Print", tag: "04 / Iridescent · Surface", premise: "A collectible printed card. A narrow spectral sheen catches the light across deep ink and a finely ruled frame.", detail: "Pearlescent coating and foil numerals provide richness without tilting the card or extruding its content.", use: "Completed goals and special collection moments.", tradeoff: "A celebratory treatment; too much foil would make everyday planning noisy." },
  { id: "woven", name: "Woven Paper", tag: "05 / Textile · Surface", premise: "Warm, quiet, and kept for years. Cloth fibers, an inset stitched border, and printed category color feel like a personal archive.", detail: "Fine crosshatching and an inked target replace shine with tactility. A calm match for the folio’s cloth cover.", use: "Past goals, long reading sessions, and the warmest everyday direction.", tradeoff: "The least flashy option; texture must stay subtle behind small text." },
] as const;

export type CardMaterial = (typeof MATERIALS)[number];

const BASE: GoalCreationFields = {
  title: "Make time for the long run.", description: "", category_selection: "health", custom_category: "", color: "#10b981",
  frequency_type: "recurring", recurrence_interval: "weekly", target_count: "3", target_basis: "period", milestone_names: [],
  start_date: "2026-06-01", end_date: "2026-09-01", default_local_time: "", difficulty: "medium", is_private: false, linked_target_goal_id: "none",
};

export const MATERIAL_SAMPLES: { label: string; fields: GoalCreationFields }[] = [
  { label: "Health / green", fields: BASE },
  { label: "Career / violet", fields: { ...BASE, title: "Build something worth sharing.", category_selection: "career", color: "#8b5cf6", target_count: "12", target_basis: "lifetime", difficulty: "hard" } },
  { label: "Personal / rose", fields: { ...BASE, title: "A little more room for the things that make me feel like myself.", category_selection: "personal", color: "#f43f5e", target_count: "1", recurrence_interval: "daily", difficulty: "easy" } },
];
