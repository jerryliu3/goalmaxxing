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
  {
    slug: "phone-agenda",
    title: "Find the work, then act on it",
    question:
      "On a phone, can you read today's sessions and move one without losing date context?",
    evidence:
      "The original phone audit found truncated month-cell titles and competing horizontal controls. This is a targeted layout hypothesis, not a claim that horizontal calendars are inherently wrong. The baseline reconstructs the relevant current structure.",
    source: "src/features/planner/calendar-month-day-cell.tsx",
    task: "Read today's three sessions. Move Build the rough cut to Friday, inspect the unsaved change, undo it, then repeat and save. Filter to a single goal. Compare finding Saturday's run.",
    variants: [
      {
        name: "Calendar + day",
        change:
          "Retain horizontal date browsing, but pair it with one full-width selected-day list. Consolidate filters into a labeled entry and keep the existing hold completion gesture.",
        tradeoff:
          "Preserves spatial browsing and the selected day, but neighboring days' session titles take a tap to reveal. The sample isolates one week; production must retain month navigation.",
      },
      {
        name: "Date-grouped agenda",
        change:
          "Read today and upcoming placed work in date groups, with earlier days folded below. Opening and moving a session use the same interactions as A.",
        tradeoff:
          "Full titles and successive days are easy to scan; the calendar's spatial overview is reduced. This is an optional representation, not a new default or a replacement for Week.",
      },
    ],
  },
  {
    slug: "mobile-landing",
    title: "Show the product at a readable size",
    question:
      "Can a phone visitor understand goal → plan → adjustment without deciphering a miniature desktop?",
    evidence:
      "Marketing was not included in the original browser audit. Current source places the planner overview below the hero. These are exploratory mobile narratives, not validated findings about conversion or the live landing page.",
    source: "src/components/landing/landing-page.tsx",
    task: "Follow one running goal into its week. Move Thursday's run to Friday and save the example. In B, also change the rhythm and inspect the different plan.",
    variants: [
      {
        name: "Readable chapters",
        change:
          "Interleave three short explanations with a real goal-card rendering, full-width sessions and an explicit move/review/save example. Keep primary conversion separate from the example.",
        tradeoff:
          "The product story is understandable without interaction, but takes more scrolling. This studies the hero and primary proof, not a wholesale rewrite of the landing page.",
      },
      {
        name: "Make a little plan",
        change:
          "Let the visitor choose two or three weekly runs, reveal the example sessions, then move one and explicitly save. Keep the same goal and message as A.",
        tradeoff:
          "Cause and effect is tangible, but visitors must act to see the full example. It is deterministic sample data, not AI generation or a real goal-creation flow.",
      },
    ],
  },
];
export const BASELINE_COMMIT = "63efc13e";
export function focusedStudy(slug: string) {
  return FOCUSED_STUDIES.find((study) => study.slug === slug);
}
