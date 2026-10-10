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
    title: "A whole month that works on a phone",
    question:
      "Which mobile Month representation best preserves the horizon while making every session readable and actionable?",
    evidence:
      "Current main uses a seven-column month track with a 42rem minimum width. This explores three deliberate mobile alternatives using a complete month and the same work. Mobile Week remains unchanged; no browser-verified usability claim is made.",
    source: "src/features/planner/calendar-surface.module.css",
    baselineCommit: "d33e11e9",
    task: "Inspect October 8’s five Solo sessions, including the long title and linked session. Move October 31’s film work into November, change filters before saving, then undo or save. Switch to Partner and inspect the read-only work. Return to Today, record and unrecord a session, then explicitly Review the missed lifetime-goal session.",
    variants: [
      {
        name: "Month map + day",
        change:
          "Fit all seven dates across the phone. Small goal initials and recorded/placed counts give each date meaning; select a date to read its full-width work below. The month stays a map rather than a miniature checklist.",
        tradeoff:
          "The best overall month orientation and shortest overview. Session titles require a tap, and the compact initials need a key. Busy dates remain readable in the day pane rather than expanding the grid.",
      },
      {
        name: "Readable calendar window",
        change:
          "Keep a complete horizontal seven-column month with stable readable columns and visible scrolling affordance. Select a date to inspect the same full-width day work below; large cells expose up to three full titles.",
        tradeoff:
          "Closest to the present spatial model. Preserves titles in context, but requires sideways browsing and a longer month; the selected column is brought into the horizontal viewport.",
      },
      {
        name: "Month chapters",
        change:
          "Show every week in the chosen month as a compact dated chapter with workload totals and seven date entrances. Expand a chapter to act on a full-width day list; move between chapters without switching to Week.",
        tradeoff:
          "Good for understanding monthly workload on a narrow screen. Sacrifices continuous grid geometry and adds expansion state. This is a Month representation, not a redesign of the existing vertical Week view.",
      },
    ],
  },
  {
    slug: "mobile-landing",
    title: "A readable mobile product story",
    question:
      "Which entrance helps a phone visitor understand a real goal, its plan, and the control they keep over changes?",
    evidence:
      "Marketing source uses the hero, planner preview, product tour, adaptive-planning/coach proof and feature narrative. This round recomposes that story for a phone without claiming conversion evidence or a fresh browser audit.",
    source: "src/components/landing/landing-page.tsx",
    baselineCommit: "d33e11e9",
    task: "Compare understanding without touching anything. Then change the October running target, inspect a date in the month, review a Thursday → Friday move, undo and save, and record past work. In C, try project and shared-goal stories and confirm partner/future work stays read only. Expand the feature details and use the existing conversion/privacy routes.",
    variants: [
      {
        name: "Editorial journey",
        change:
          "One intention carries a complete scroll narrative: real goal card, target, fitted month, explicit adaptation, recorded progress, partner encouragement, and reviewed coach suggestion. Full-size proof is interleaved with brief explanations.",
        tradeoff:
          "Understandable without interaction and gives the material/card identity room to read. Longest page; optional controls enrich the explanation rather than gate it. A fitted month is orientation, never a shrunken desktop checklist.",
      },
      {
        name: "Product lesson",
        change:
          "Lead with the outcome, then a self-contained Shape / Adapt / Record lesson. Steps preserve one local goal/plan state; every step is directly accessible. Broader month, partner, reward and privacy explanations follow.",
        tradeoff:
          "The most direct experience of cause and effect. Requires some participation to inspect every state, but starts with legible proof and hides no primary CTA. No mock AI stream or fake account creation.",
      },
      {
        name: "Choose your intention",
        change:
          "A visitor chooses rhythm, project, or a shared goal and gets a corresponding goal card, placed work, editable plan and progress. Their chosen story sets the proof; subsequent feature details preserve the broader product.",
        tradeoff:
          "Best for showing this is more than a habit tracker. Adds a choice and needs consistent scenarios; switching stories explicitly resets only the fictional example. The collaboration copy points to existing Team/Duo roles, not a promised new check-in feature.",
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
