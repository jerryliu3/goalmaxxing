export type RefreshPriority = "High" | "Medium";
export type RefreshArea =
  | "Shared"
  | "Agenda"
  | "Growth"
  | "Profile"
  | "Goals"
  | "Community";
export interface RefreshConcept {
  id: number;
  slug: string;
  title: string;
  area: RefreshArea;
  priority: RefreshPriority;
  problem: string;
  variants: readonly { name: string; premise: string; tradeoff: string }[];
  exercise: string;
}

export const REFRESH_CONCEPTS = [
  {
    id: 1,
    slug: "readable-cards",
    title: "Goal cards you can read",
    area: "Shared",
    priority: "High",
    problem: "Essential text gets lost as material fills the card.",
    variants: [
      {
        name: "Caption dock",
        premise:
          "Let the collectible be art; keep identity on a stable caption beneath it.",
        tradeoff:
          "Most reliable at every fill level; adds a little height to each card.",
      },
      {
        name: "Label plate",
        premise:
          "Keep the name and progress together on an opaque plate over the material.",
        tradeoff: "A more unified object; covers some of the artwork.",
      },
    ],
    exercise:
      "Change the fill from empty to complete. Names and progress should remain equally legible.",
  },
  {
    id: 2,
    slug: "agenda-hierarchy",
    title: "Work before controls",
    area: "Agenda",
    priority: "High",
    problem: "Several toolbar rows compete before the day's sessions appear.",
    variants: [
      {
        name: "Workbench",
        premise:
          "One date-and-view toolbar, with search and filters behind a deliberate entry.",
        tradeoff: "Compact default; filtering takes one extra action.",
      },
      {
        name: "Date spine",
        premise:
          "A small date rail anchors the work while view and search stay in a quiet header.",
        tradeoff:
          "Stronger time context; uses a narrow second column on desktop.",
      },
    ],
    exercise:
      "Switch Day/Week, search for a goal, and open filters. The work should stay the dominant element.",
  },
  {
    id: 3,
    slug: "recovery-actions",
    title: "Keep the decision and Save together",
    area: "Agenda",
    priority: "High",
    problem:
      "Recovery decisions and the final commit occupy different parts of the page.",
    variants: [
      {
        name: "Review desk",
        premise:
          "One goal at a time with a draft summary and final actions at the foot of the review panel.",
        tradeoff: "Focused review; slower to survey several goals.",
      },
      {
        name: "Session queue",
        premise:
          "All missed sessions in one compact queue, with a persistent change bar.",
        tradeoff: "Fast overview; less space for goal context.",
      },
    ],
    exercise:
      "Accept a date, edit another, undo a choice, then save or discard the sample draft. Switch to planner mode to compare Save/Undo placement.",
  },
  {
    id: 4,
    slug: "tracker-selection",
    title: "Know what the calendar represents",
    area: "Growth",
    priority: "High",
    problem: "Dozens of pills obscure selection, focus and aggregate scope.",
    variants: [
      {
        name: "Selection ledger",
        premise: "An explicit checklist and Focus action beside the calendar.",
        tradeoff: "Everything is visible; costs horizontal space.",
      },
      {
        name: "Scope drawer",
        premise: "One scope summary opens the full searchable selection list.",
        tradeoff: "A quieter calendar; the full list takes an extra click.",
      },
    ],
    exercise:
      "Select several goals, focus one, search the picker and clear the selection. Watch the calendar and scope update together.",
  },
  {
    id: 5,
    slug: "tracker-calendar",
    title: "A readable completion log",
    area: "Growth",
    priority: "High",
    problem:
      "Low-contrast cells and hidden hold interactions make the log difficult to operate.",
    variants: [
      {
        name: "Count calendar",
        premise:
          "A month of explicit counts with date details and visible logging actions.",
        tradeoff: "Strong monthly pattern; larger than a pure heatmap.",
      },
      {
        name: "Week log",
        premise:
          "A small month overview opens a seven-day strip and a readable log.",
        tradeoff: "Better touch targets; less month detail at once.",
      },
    ],
    exercise:
      "Pick a past day and log/remove a sample completion. Future dates remain unavailable.",
  },
  {
    id: 6,
    slug: "profile-location",
    title: "A profile with reachable settings",
    area: "Profile",
    priority: "High",
    problem:
      "The avatar has no active state and routine settings follow a long goal gallery.",
    variants: [
      {
        name: "Owner desk",
        premise:
          "Compact identity, curated highlights and settings side by side.",
        tradeoff:
          "Fast owner tasks; less emphasis on the full membership card.",
      },
      {
        name: "Profile / Settings",
        premise:
          "Keep the full identity object, with an immediate local switch to settings.",
        tradeoff:
          "Preserves the ceremonial profile; adds one local navigation choice.",
      },
    ],
    exercise:
      "Open settings from the first screen, edit the sample bio and expand the goal preview. The avatar stays active.",
  },
  {
    id: 7,
    slug: "dialogs",
    title: "One grammar for utility dialogs",
    area: "Shared",
    priority: "High",
    problem: "Exit controls, sizing and footer actions differ across dialogs.",
    variants: [
      {
        name: "Centered sheet",
        premise:
          "A readable, bounded dialog with a clear heading and stable action footer.",
        tradeoff: "Strong focus; covers the underlying context.",
      },
      {
        name: "Side inspector",
        premise:
          "The same header/body/footer anatomy in a desktop side sheet, full-screen on phone.",
        tradeoff:
          "Keeps context on desktop; more travel between the trigger and the sheet.",
      },
    ],
    exercise:
      "Open Preferences and Showcase. Change a sample value, then save, cancel or close using Escape.",
  },
  {
    id: 8,
    slug: "goal-score",
    title: "A score with context",
    area: "Growth",
    priority: "Medium",
    problem: "A busy chart says little about what the current number means.",
    variants: [
      {
        name: "Quiet trend",
        premise:
          "Current score and its definition lead; a restrained chart supports them.",
        tradeoff:
          "Fewer always-visible points; exact values move to point inspection.",
      },
    ],
    exercise:
      "Switch ranges and inspect a point. Open the definition and percentile notes.",
  },
  {
    id: 9,
    slug: "past-goals",
    title: "One library, organized by time",
    area: "Goals",
    priority: "Medium",
    problem: "The book library and a flat past-goal grid duplicate history.",
    variants: [
      {
        name: "Monthly volumes",
        premise:
          "Current-year months and prior-year volumes open to searchable contents.",
        tradeoff: "Adds a browsing step; removes the duplicate archive.",
      },
    ],
    exercise:
      "Open a monthly or yearly book, search its contents and choose an entry directly.",
  },
  {
    id: 10,
    slug: "week-day",
    title: "A week overview and a useful day",
    area: "Agenda",
    priority: "Medium",
    problem: "Stretched week rows and repeated day details waste space.",
    variants: [
      {
        name: "Week desk",
        premise:
          "A compact week selector and a single readable selected-day list.",
        tradeoff:
          "Less session text in the overview; details are one click away.",
      },
    ],
    exercise:
      "Choose a day, complete a sample session and expand the Done group.",
  },
  {
    id: 11,
    slug: "goal-view",
    title: "Goal lanes with named work",
    area: "Agenda",
    priority: "Medium",
    problem:
      "Tiny cards, bare milestones and ambiguous sequence labels weaken context.",
    variants: [
      {
        name: "Named lanes",
        premise: "Readable goal identity above date-labelled session buttons.",
        tradeoff: "More descriptive titles use more lane space.",
      },
    ],
    exercise:
      "Open a named session and move its sample date using the explicit date control.",
  },
  {
    id: 12,
    slug: "planner-settings",
    title: "Calendar essentials first",
    area: "Agenda",
    priority: "Medium",
    problem: "Rest-day preferences sit beside global repair and reset actions.",
    variants: [
      {
        name: "Calendar essentials",
        premise:
          "Common preferences stay together; advanced maintenance is disclosed separately.",
        tradeoff: "Maintenance requires an intentional extra step.",
      },
    ],
    exercise:
      "Change rest weekdays, save the sample preference and open the advanced explanation.",
  },
  {
    id: 13,
    slug: "growth-composition",
    title: "One Growth destination",
    area: "Growth",
    priority: "Medium",
    problem:
      "Multiple heroes and duplicate metrics make Growth a very long page.",
    variants: [
      {
        name: "Growth journal",
        premise:
          "A compact summary, activity log, records and a restrained medal shelf.",
        tradeoff:
          "Deep analysis opens separately rather than always filling the page.",
      },
    ],
    exercise: "Explore the activity log and open the optional records detail.",
  },
  {
    id: 14,
    slug: "medals",
    title: "The medal is the focal point",
    area: "Growth",
    priority: "Medium",
    problem:
      "Several layers of large framing surround a relatively small medal.",
    variants: [
      {
        name: "Collector shelf",
        premise:
          "A large earned object with useful context beside a compact shelf.",
        tradeoff: "One medal receives emphasis at a time.",
      },
    ],
    exercise: "Choose a medal and inspect its earned date and milestone.",
  },
  {
    id: 15,
    slug: "records",
    title: "Name the record precisely",
    area: "Growth",
    priority: "Medium",
    problem:
      "Day and week streaks share ambiguous labels; chart explanations sound technical.",
    variants: [
      {
        name: "Named records",
        premise:
          "Explicit units, windows and plain definitions, with focused detail on request.",
        tradeoff: "More words in labels; fewer misunderstandings.",
      },
    ],
    exercise: "Open a record definition and switch the statistics window.",
  },
  {
    id: 16,
    slug: "showcase-picker",
    title: "Curate three things deliberately",
    area: "Profile",
    priority: "Medium",
    problem:
      "Records follow a long finished-goal list with repetitive selection buttons.",
    variants: [
      {
        name: "Pin library",
        premise:
          "Selected pins first, a visible limit, category filters and a clear Done action.",
        tradeoff: "A structured picker rather than one continuous catalog.",
      },
    ],
    exercise:
      "Remove a pin, filter Records, search and fill the three available slots.",
  },
  {
    id: 17,
    slug: "preferences",
    title: "Find the setting by its purpose",
    area: "Profile",
    priority: "Medium",
    problem:
      "Privacy is buried in planner preferences and small choices fill empty drawers.",
    variants: [
      {
        name: "Settings directory",
        premise:
          "Separate Calendar, Privacy and Appearance, with controls sized for their content.",
        tradeoff: "More clearly named entries in the directory.",
      },
    ],
    exercise: "Open each category and save a local sample preference.",
  },
  {
    id: 18,
    slug: "plain-copy",
    title: "Speak in user outcomes",
    area: "Shared",
    priority: "Medium",
    problem:
      "Policy, testing and implementation language leaks into product surfaces.",
    variants: [
      {
        name: "Plain language",
        premise: "Explain what changes and what the user can do next.",
        tradeoff:
          "Internal terminology remains in engineering documentation only.",
      },
    ],
    exercise:
      "Compare the current and proposed language, and open a revised check-in availability state.",
  },
  {
    id: 19,
    slug: "community",
    title: "A team room with useful context",
    area: "Community",
    priority: "Medium",
    problem:
      "The leaderboard is hidden behind a flip, the shared week lacks dates and empty goals give no direction.",
    variants: [
      {
        name: "Team room",
        premise:
          "Visible standings, dated activity and a purposeful shared-goal empty state.",
        tradeoff:
          "Less decorative card interaction; faster access to the information.",
      },
    ],
    exercise:
      "Choose a day in the shared week and open the shared-goal explanation.",
  },
  {
    id: 20,
    slug: "navigation-scope",
    title: "Separate identity from viewing scope",
    area: "Shared",
    priority: "Medium",
    problem: "Solo/Partner/Duo dominates the identity menu.",
    variants: [
      {
        name: "Context switch",
        premise:
          "A labelled content-scope control sits apart from the avatar's profile menu.",
        tradeoff: "One extra labelled control in the header.",
      },
    ],
    exercise: "Switch sample scope, then open the avatar menu and Profile.",
  },
  {
    id: 21,
    slug: "goal-collection",
    title: "Browse intentions, not just cards",
    area: "Goals",
    priority: "Medium",
    problem:
      "A long gallery lacks prominent search and sort, and target figures dominate names.",
    variants: [
      {
        name: "Card catalog",
        premise:
          "A searchable collection with stable captions, progress and a clear details action.",
        tradeoff: "Less pure gallery space; easier scanning and retrieval.",
      },
    ],
    exercise:
      "Search, sort and open a goal. Rotation is optional rather than the navigation gesture.",
  },
  {
    id: 22,
    slug: "goal-editor",
    title: "Make details and editing explicit",
    area: "Goals",
    priority: "Medium",
    problem:
      "See details opens an editor; the reverse side hides important information.",
    variants: [
      {
        name: "Card and details",
        premise:
          "Read details first, with an explicit edit action and named sections.",
        tradeoff: "An extra deliberate step before editing.",
      },
    ],
    exercise: "Read the reward, edit a sample name, then save or cancel.",
  },
  {
    id: 23,
    slug: "phone-agenda",
    title: "A calendar composed for a phone",
    area: "Agenda",
    priority: "Medium",
    problem:
      "Off-screen chip rails and truncated calendar pills compete for narrow space.",
    variants: [
      {
        name: "Pocket agenda",
        premise:
          "A compact month overview opens readable daily work, with one filter summary.",
        tradeoff: "Fewer session names inside month cells.",
      },
    ],
    exercise:
      "Choose a date and filter the list. The selected date stays visible above the work.",
  },
  {
    id: 24,
    slug: "goal-creation",
    title: "A clear next step and a clear way back",
    area: "Goals",
    priority: "Medium",
    problem: "The wizard entrance lacks adjacent Back/Cancel controls.",
    variants: [
      {
        name: "Guided card",
        premise:
          "A short guided intention flow with stable Back/Continue/Cancel and a live card preview.",
        tradeoff:
          "This concept demonstrates navigation, not the complete production creation contract.",
      },
    ],
    exercise:
      "Enter an intention, move forward and back, review, then create the sample or cancel.",
  },
] as const satisfies readonly RefreshConcept[];

export type RefreshSlug = (typeof REFRESH_CONCEPTS)[number]["slug"];
export function findRefreshConcept(slug: string): RefreshConcept | undefined {
  return REFRESH_CONCEPTS.find((item) => item.slug === slug);
}
export const CONCEPT_COUNT = REFRESH_CONCEPTS.reduce(
  (total, item) => total + item.variants.length,
  0,
);
