export const PLAN_CLARITY_CONCEPTS = [
  {
    slug: "focus",
    href: "/ux/concepts/plan-clarity/focus",
    letter: "F1",
    title: "Goal focus",
    bet: "Filter Plan to one goal’s placed days. Ledger already does this for completions — this is the same select, on the calendar that actually schedules work.",
    firstViewport: "This week: Sun 30, Wed 2, Thu 3. Next: Sun 7. Everything else recedes.",
  },
  {
    slug: "history",
    href: "/ux/concepts/plan-clarity/history",
    letter: "F2",
    title: "Past-day done",
    bet: "Past completed pills should not look cancelled. Strike is the control. Quiet, fold, and marks are the alternatives. A nest on the date marks a fully done day.",
    firstViewport: "Wednesday’s Tempo run and Deep work, without a strike. Nest on Sun 30, Mon 31, Wed 2.",
  },
  {
    slug: "checklist",
    href: "/ux/concepts/plan-clarity/checklist",
    letter: "F3",
    title: "Collapsed completed",
    bet: "Checklist keeps open work on top. Completed becomes a closed section at the bottom, so the list stays a queue.",
    firstViewport: "Tempo run, Weekly reset, Review offer. Completed · 2 at the bottom.",
  },
] as const;

export type PlanClarityConcept = (typeof PLAN_CLARITY_CONCEPTS)[number];
