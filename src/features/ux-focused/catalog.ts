export type FocusedStudy = {
  slug: string;
  title: string;
  question: string;
  evidence: string;
  source: string;
  task: string;
  variants: readonly { name: string; change: string; tradeoff: string }[];
};

export const FOCUSED_STUDIES: readonly FocusedStudy[] = [
  {
    slug: "team",
    title: "A team worth coming back to",
    question:
      "Can you tell what you and your partner are working on, and get to the right work?",
    evidence:
      "The current Team week strip colors elapsed weekdays rather than activity. All shared-goal links open the same week calendar. This is confirmed in source; the new round has not been visually verified.",
    source: "src/features/social/team/team-panel.tsx",
    task: "Inspect Thursday, open the corresponding shared goal, then try No partner → invite → pending → paired. Compare the two entrances using the same sessions.",
    variants: [
      {
        name: "Shared week",
        change:
          "Lead with dated activity for each partner; open the exact day's work below. Keep shared goals and partner management one action away.",
        tradeoff:
          "Best for checking in on each other; retrieving a particular goal starts farther down the page.",
      },
      {
        name: "Goal desk",
        change:
          "Lead with shared goals and who is doing the next session. Select a goal to focus its week and next owner/date inline; partner actions stay reachable.",
        tradeoff:
          "Best for a joint project; individual activity is less prominent. Neither direction replaces Agenda's Duo planning board.",
      },
    ],
  },
];
export const BASELINE_COMMIT = "63efc13e";
export function focusedStudy(slug: string) {
  return FOCUSED_STUDIES.find((study) => study.slug === slug);
}
