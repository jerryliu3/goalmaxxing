export type FocusedStudy = {
  slug: string;
  title: string;
  question: string;
  evidence: string;
  source: string;
  baselineCommit?: string;
  task: string;
  variants: readonly { name: string; change: string; tradeoff: string }[];
};

export const FOCUSED_STUDIES: readonly FocusedStudy[] = [
  {
    slug: "team",
    title: "A partnership home, beyond Duo",
    question:
      "What deserves its own Team destination when shared planning and progress already exist elsewhere?",
    evidence:
      "Current main gives Team partner management, XP, a weekday strip and shared-goal links. Duo already supplies shared calendar and progress views. This round explores a dedicated partnership purpose, rather than expanding the same calendar.",
    source: "src/features/social/team/team-panel.tsx",
    baselineCommit: "d33e11e9",
    task: "Compare the three purposes. Inspect the film contributions, record your rough cut with the hold control, send a nudge, inspect the partner, and try every relationship state. In C, publish/edit a check-in and acknowledge Alex’s note. The other-person controls are clearly marked simulations.",
    variants: [
      {
        name: "Partnership brief",
        change:
          "A pair chooses one shared weekly focus. Its finite brief connects attributed contributions to that focus’s next work. A nudge is the main social action; no calendar or ranked progress board.",
        tradeoff:
          "The lightest collaboration addition: a team-owned weekly focus choice plus context from visible work and existing nudges. The focus choice needs persistence before adoption. Its value depends on having genuinely relevant shared activity; an empty team gets a direct shared-goal entrance.",
      },
      {
        name: "Shared-goal dossiers",
        change:
          "Each team goal has a joint home with contributions, next work, and finished-goal keepsakes. The film dossier adds an explicit editing → ready for partner → reviewed handoff. Team history sits alongside present work rather than a feed.",
        tradeoff:
          "Best when the shared goal is the reason for the partnership. More goal-centric than A, but distinct from Duo’s personal goal comparison. The handoff is a new team-goal capability needing persistence and permissions; it never changes dates or grants completion credit. Historical availability also needs confirmation.",
      },
      {
        name: "Weekly rendezvous",
        change:
          "Each person shares one focus and an optional support request. Read acknowledgements close the loop, while goals, nudges, XP and membership remain accessible.",
        tradeoff:
          "Creates a reason to return that Duo cannot provide. This introduces a new optional weekly-note capability and would need persistence/visibility rules. Reading a note does not change plans, log completion, or promise attendance.",
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
  {
    slug: "tracker",
    title: "Inspect the log without losing the heatmap",
    question:
      "How can date details be discoverable while preserving hold-to-complete?",
    evidence:
      "Main already replaced tracker pills. This study isolates the remaining date-legibility and inspection questions. Both panels reuse MonthHeatmap; a visual contrast assessment across themes is still pending.",
    source: "src/features/insights/month-heatmap.tsx",
    task: "Inspect October 6 without changing its count, log a completion with the existing hold control, then compare several goals. Inspect a future date and confirm it cannot be logged.",
    variants: [
      {
        name: "Inspect a day",
        change:
          "Keep hold logging on the calendar. Add one explicit inspection entrance with a date selector and readable completion rows. Add stable date labels and an intensity key.",
        tradeoff:
          "Keeps the familiar gesture and calendar footprint; date inspection takes an extra action. Combined activity opens read-only detail.",
      },
      {
        name: "Log / Inspect",
        change:
          "Add an explicit interaction switch. Log retains hold on date cells; Inspect opens an inline date detail without changing the count. Reuse the same heatmap and completion controls.",
        tradeoff:
          "Date inspection is direct and visible, but the mode must be understood. Switching to multiple goals always makes the calendar read only.",
      },
    ],
  },
  {
    slug: "profile",
    title: "Reach settings, keep your profile",
    question:
      "Can routine settings and pin selection become easier without rebuilding the membership card?",
    evidence:
      "Main already marks Profile active and places bio/records on the card. Settings still follows the profile collection, privacy still lives under Preferences, and the pin catalog has no search. This proposal preserves those completed main changes.",
    source: "src/features/settings/settings-tab.tsx",
    task: "Open Settings from the top, find Privacy, then choose a new showcase item. Fill its budget, search, remove a selected item and replace it. Done previews the change; Save profile commits only the sample.",
    variants: [
      {
        name: "Settings button + centered sheets",
        change:
          "Add Settings beside Edit profile, give Privacy a direct entry, and use a centered sheet with a fixed header/footer. Make the picker searchable with sticky selections. Records and showcase retain separate budgets. Exact copy proposals are listed below.",
        tradeoff:
          "Adds an entrance rather than a tab bar. Other settings remain as context in this excerpt; their existing editors are not redesigned. The centered sheet covers the page while it is open.",
      },
    ],
  },
  {
    slug: "goal-collection",
    title: "Retrieve a goal in the collection",
    question:
      "Can you find a named goal and read its identity before inspecting the material?",
    evidence:
      "The current goal grid already provides progress labels. This study does not claim those are missing: it adds a stable name band, search and sorting while preserving GoalProgressCard and its progress/reward rendering.",
    source: "src/features/insights/folio/current-goal-grid.tsx",
    task: "Find Japanese by name, clear the search, then sort by progress. Compare the same cards in both panels. Try the small Back/Cancel addition on the creation entrance below.",
    variants: [
      {
        name: "Searchable gallery with name bands",
        change:
          "Keep the current card and its existing progress footer. Add a small name band above the material and collection-level search/name-or-progress sorting. Demonstrate adjacent Back/Cancel on Intention without replacing the wizard.",
        tradeoff:
          "The stable name repeats the title on the artwork and adds height. This is a readability/retrieval hypothesis, not a new card system or a change to details-versus-editing.",
      },
    ],
  },
];
export const BASELINE_COMMIT = "63efc13e";
export function focusedStudy(slug: string) {
  return FOCUSED_STUDIES.find((study) => study.slug === slug);
}

export function focusedVariant(value: string | undefined, count: number) {
  const index = value?.length === 1 ? "abcde".indexOf(value) : 0;
  return index >= 0 && index < count ? index : 0;
}
