import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import { buildMilestoneNameDrafts } from "@/lib/goals/milestones";
import { MATERIALS, MATERIAL_SAMPLES } from "../card-materials/materials";

export const REWARD_CONCEPTS = [
  { id: "reassemble", name: "Reassemble", description: "Pieces fly into an outline, then fuse into one card." },
  { id: "illuminate", name: "Illuminate", description: "Dim material gradually catches the light." },
  { id: "transmute", name: "Transmute", description: "Neutral grey becomes the selected material’s color." },
  { id: "illuminate-transmute", name: "Illuminate + Transmute", description: "Light and color return together." },
] as const;

export type RewardConcept = (typeof REWARD_CONCEPTS)[number];

export const REWARD_MATERIALS = MATERIALS.filter(material => material.form === "solid");
export const REWARD_TARGETS = [1, 6, 12, 24, 60, 120] as const;

export const REWARD_SAMPLES = [
  { id: "lifetime", label: "Total completions", target: 12, unit: "completions", reward: "A weekend away", fields: MATERIAL_SAMPLES[1].fields },
  { id: "milestones", label: "Named milestones", target: 6, unit: "milestones", reward: "Dinner somewhere special", fields: { ...MATERIAL_SAMPLES[1].fields, title: "Bring the idea to life.", frequency_type: "fixed_milestones" as const } },
  { id: "ongoing", label: "Open-ended weekly goal", target: 12, unit: "successful weeks", reward: "A slow Sunday brunch", fields: { ...MATERIAL_SAMPLES[0].fields, end_date: "" } },
] as const;

export type RewardSample = (typeof REWARD_SAMPLES)[number];

/** This study consumes credited units; it does not invent completion eligibility. */
export function getRewardProgress(completed: number, target: number) {
  const required = Number.isFinite(target) ? Math.max(1, Math.floor(target)) : 1;
  const credited = Number.isFinite(completed) ? Math.max(0, Math.min(required, Math.floor(completed))) : 0;
  return { required, credited, fraction: credited / required, earned: credited === required };
}

export function getRewardFilter(concept: RewardConcept["id"], fraction: number) {
  if (concept === "reassemble") return "saturate(1) brightness(1)";
  const progress = Math.max(0, Math.min(1, fraction));
  const saturation = concept === "illuminate" ? 1 : progress;
  const brightness = concept === "transmute" ? 1 : 0.28 + progress * 0.72;
  // Desaturating the selected finish preserves its hue throughout the journey.
  return `saturate(${saturation}) brightness(${brightness})`;
}

export function getRewardFields(sample: RewardSample, target: number): GoalCreationFields {
  if (sample.id === "ongoing") return { ...sample.fields };
  return {
    ...sample.fields,
    target_count: String(target),
    milestone_names: sample.id === "milestones" ? buildMilestoneNameDrafts(target) : [],
  };
}
