export const APPLICATION_PRINCIPLES = [
  {
    title: "One question per screen",
    body: "Now, where it sits, or how to adapt. If a layout answers all three at once, it is a dashboard.",
  },
  {
    title: "Objects, not chrome",
    body: "The first thing you can touch is the work: a pill, a row, a day. Brand, XP, and nested chips recede.",
  },
  {
    title: "Rows complete. Pills move. Sheets propose.",
    body: "Complete on a list row. Drag a pill to replan. Coach and create open a sheet. Do not stack all three on the same control.",
  },
  {
    title: "Peers, not nested products",
    body: "Destinations are Plan, Progress, Community, and You. Week, month, and day are views of Plan. Day is the list. Do not hide a product behind a chip row.",
  },
  {
    title: "Recover is replanning",
    body: "Unplaced work is amber and movable. It is never a failed checkbox or a streak threat.",
  },
  {
    title: "Desktop recomposes",
    body: "At md+, two panes. Never a stretched phone with a header card.",
  },
] as const;

export const APPLICATION_ATOMS = [
  {
    name: "Work pill",
    use: "Plan week and month cells. Grab-able. Category is the fill, not a dot.",
  },
  {
    name: "Work row",
    use: "Day (the checklist). Complete + open. Unplanned via Show unplanned. Not a second tab.",
  },
  {
    name: "Recover banner",
    use: "When something is unplaced. Adaptive copy. Opens Recover, does not complete.",
  },
  {
    name: "Sheet",
    use: "New goal, Coach proposal, Recover confirm, item detail. One job.",
  },
  {
    name: "View toggle",
    use: "Week / Month / Day on Plan. Not a second tab bar.",
  },
  {
    name: "Destination tabs",
    use: "Plan, Progress, Community, You. Not twelve chips.",
  },
] as const;

export const APPLICATION_COLOR = [
  { name: "Blue", use: "Action, primary, next step" },
  { name: "Emerald", use: "Complete, saved, recovered into the plan" },
  { name: "Violet", use: "Long-range, community, Duo" },
  { name: "Amber", use: "Recover, unplaced, needs a new day" },
] as const;
