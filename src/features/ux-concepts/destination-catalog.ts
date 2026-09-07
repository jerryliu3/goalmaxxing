export type DestinationFamily = "progress" | "community" | "you";

export interface DestinationConcept {
  family: DestinationFamily;
  slug: string;
  href: string;
  letter: string;
  title: string;
  bet: string;
  firstViewport: string;
}

export const PROGRESS_CONCEPTS = [
  {
    family: "progress",
    slug: "pulse",
    href: "/ux/concepts/progress/pulse",
    letter: "P1",
    title: "Week Pulse",
    bet: "Progress is one truthful number, then drill. C recycled as a destination, not Home.",
    firstViewport: "7 of 10 this week. Recover. Not a streak threat.",
  },
  {
    family: "progress",
    slug: "ledger",
    href: "/ux/concepts/progress/ledger",
    letter: "P2",
    title: "Goal Ledger",
    bet: "Goal list plus heatmap. Lock: aggregate default, one goal editable, multi-select overlap.",
    firstViewport: "Tempo run 8 of 12. Tap a date on the heatmap to add a completion.",
  },
  {
    family: "progress",
    slug: "map",
    href: "/ux/concepts/progress/map",
    letter: "P3",
    title: "Continuity Map",
    bet: "Progress is a month of completions — spatial like Home, but history, not the plan.",
    firstViewport: "September grid. Tap a day to see what actually completed.",
  },
] as const satisfies readonly DestinationConcept[];

export const COMMUNITY_CONCEPTS = [
  {
    family: "community",
    slug: "duo",
    href: "/ux/concepts/community/duo",
    letter: "S1",
    title: "Duo",
    bet: "Maya is the object. Nudge and shared week. Feed and challenges are sheets.",
    firstViewport: "Maya completed Yoga. Your week beside hers.",
  },
  {
    family: "community",
    slug: "board",
    href: "/ux/concepts/community/board",
    letter: "S2",
    title: "Shared Board",
    bet: "Accountability is two columns of this week’s work. No social network chrome.",
    firstViewport: "You · Maya. Pills, not feed cards.",
  },
  {
    family: "community",
    slug: "quiet",
    href: "/ux/concepts/community/quiet",
    letter: "S3",
    title: "Quiet Circle",
    bet: "One stream: people you opted into. No XP fireworks, no four equal chips.",
    firstViewport: "Maya completed Yoga. Then Deep work. Challenge is one row.",
  },
] as const satisfies readonly DestinationConcept[];

export const YOU_CONCEPTS = [
  {
    family: "you",
    slug: "list",
    href: "/ux/concepts/you/list",
    letter: "Y1",
    title: "Settings List",
    bet: "You is identity plus a list that opens sheets. Closest to live Profile, minus the nested cards.",
    firstViewport: "Alex. Preferences, Notifications, Integrations.",
  },
  {
    family: "you",
    slug: "person",
    href: "/ux/concepts/you/person",
    letter: "Y2",
    title: "Person",
    bet: "You is a person in the product: name, partner, week — then the same controls.",
    firstViewport: "Alex. Partner Maya · 7 of 10 this week.",
  },
  {
    family: "you",
    slug: "controls",
    href: "/ux/concepts/you/controls",
    letter: "Y3",
    title: "Controls",
    bet: "No hero identity. Grouped controls for Plan, Connected, Account. You is not a dashboard.",
    firstViewport: "Plan, Connected, Account. Sign out last.",
  },
] as const satisfies readonly DestinationConcept[];

export const PROGRESS_LOCK = {
  family: "progress",
  slug: "ledger",
  href: "/ux/concepts/progress",
  letter: "P",
  title: "Goal Ledger",
  bet: "Default aggregate heatmap. One selected goal is editable. Multi-select is read-only overlap.",
  firstViewport: "Tempo run 8 of 12. Tap a date on the heatmap to add a completion.",
} as const satisfies DestinationConcept;

export const COMMUNITY_LOCK = {
  family: "community",
  slug: "compete",
  href: "/ux/concepts/community",
  letter: "S",
  title: "Team and compete",
  bet: "No feed. Team, challenges, and leaderboards stay. Duo is a platform mode, not this tab’s job.",
  firstViewport: "Team goals, then Challenges and Leaderboards as views.",
} as const satisfies DestinationConcept;

export const YOU_LOCK = {
  family: "you",
  slug: "account",
  href: "/ux/concepts/you",
  letter: "Y",
  title: "Account controls",
  bet: "Identity hero on top. Grouped controls underneath.",
  firstViewport: "Alex. Then Plan, Connected, Account.",
} as const satisfies DestinationConcept;

export const DESTINATION_FAMILIES = [
  {
    family: "progress" as const,
    label: "Progress",
    href: "/ux/concepts/progress",
    live: "Insights · /insights",
    question: "Where does this sit in the week and the longer goal?",
    lock: PROGRESS_LOCK,
    lockNote:
      "Ledger is the lock. Default heatmap is the aggregate. One selected goal is editable; multi-select is read-only overlap. Plan still owns placed work.",
    concepts: PROGRESS_CONCEPTS,
  },
  {
    family: "community" as const,
    href: "/ux/concepts/community",
    label: "Community",
    live: "Community · /social",
    question: "Who is with me — without becoming a feed?",
    lock: COMMUNITY_LOCK,
    lockNote:
      "Keep Team, Challenges, and Leaderboards. Cut the feed. Duo is Solo/Duo on Plan and Progress; week is the shared board.",
    concepts: COMMUNITY_CONCEPTS,
  },
  {
    family: "you" as const,
    href: "/ux/concepts/you",
    label: "You",
    live: "Profile · /settings",
    question: "How do I control the product without a second app?",
    lock: YOU_LOCK,
    lockNote: "Grouped controls, with identity and profile configuration at the top.",
    concepts: YOU_CONCEPTS,
  },
] as const;
