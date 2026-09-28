export const plannerConcepts = [
  {
    id: "toolbar", number: "01", name: "Direct toolbar",
    premise: "All controls within reach.",
    description: "View, category, goal, and search stay visible above the calendar. Every change applies immediately.",
    tradeoff: "Fast and discoverable. The cost is persistent chrome, especially on a small screen.",
    task: "Choose Day, select Health, then complete the run. This is the reference workflow.",
  },
  {
    id: "canvas", number: "02", name: "Canvas navigation",
    premise: "Navigate the work itself.",
    description: "Open a date to zoom into it. Use the breadcrumb to pull back. Selecting a session reveals its actions in a bottom dock.",
    tradeoff: "The calendar leads and controls appear in context. Zooming and selecting introduce extra steps.",
    task: "Open September 23, select Easy run, and complete it from the action dock. Use September to zoom out.",
  },
  {
    id: "navigator", number: "03", name: "Goal navigator",
    premise: "Start with an intention.",
    description: "A collapsible goal list scopes the calendar. Select a goal to reveal its schedule and cadence, then navigate its dates.",
    tradeoff: "Strong for tracing one goal through time. A sidebar uses width and makes unselected work less visible.",
    task: "Choose Run a comfortable 10K in the navigator, inspect its sessions, then collapse the navigator.",
  },
  {
    id: "composer", number: "04", name: "View composer",
    premise: "Ask for the view you need.",
    description: "A single sentence describes the current view. Open it to stage view, goal, and filter changes, then apply them together.",
    tradeoff: "The cleanest resting canvas. Routine changes require opening a panel and committing the selection.",
    task: "Open Change view, choose Day and Health, then Apply view. Reopen and cancel a change to compare the workflow.",
  },
] as const;
export type PlannerVariant = typeof plannerConcepts[number]["id"];
