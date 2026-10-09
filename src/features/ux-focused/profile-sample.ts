import type {
  PublicProfileShowcaseCatalog,
  PublicProfileShowcasePin,
} from "@cadence/shared/social/public-profile";
import { GOALS } from "@/features/ux-profile/seed";
export const PROFILE_BIO =
  "Training for a fall 10K. Making a little time for Japanese.";
export const PROFILE_CATALOG: PublicProfileShowcaseCatalog = {
  medals: [2, 4, 6, 8].map((level) => ({
    kind: "medal",
    ref: `level-${level}`,
    level,
    title: `Level ${level}`,
    unlockedAt: "2026-09-28T12:00:00Z",
  })),
  goals: [
    {
      kind: "goal",
      ref: "half",
      title: "Run a half marathon",
      rewardText: "A weekend away",
      achievedOn: "2026-08-23",
      material: "glass",
      color: GOALS[0].color ?? "var(--primary)",
    },
    {
      kind: "goal",
      ref: "film",
      title: "Finish the first cut",
      rewardText: null,
      achievedOn: "2026-09-18",
      material: "alloy",
      color: GOALS[1].color ?? "var(--primary)",
    },
  ],
  records: [
    {
      kind: "record",
      ref: "day-streak",
      label: "Best day streak",
      value: "21 days",
      hint: "Your longest run of consecutive days with a completion.",
    },
    {
      kind: "record",
      ref: "week-streak",
      label: "Active-week streak",
      value: "9 weeks",
      hint: "Consecutive calendar weeks with at least one completion.",
    },
    {
      kind: "record",
      ref: "activities",
      label: "Total activities",
      value: "412",
      hint: "All completion events you have logged.",
    },
    {
      kind: "record",
      ref: "goals",
      label: "Goals finished",
      value: "4",
      hint: "Goals that reached their finish condition.",
    },
  ],
};
export const PROFILE_PINS: PublicProfileShowcasePin[] = [
  { kind: "medal", ref: "level-8" },
  { kind: "goal", ref: "half" },
  { kind: "record", ref: "day-streak" },
  { kind: "record", ref: "week-streak" },
];
