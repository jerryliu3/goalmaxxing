export type FirstPrinciplesConceptSlug =
  | "orbit"
  | "tide"
  | "relay"
  | "fieldbook";

export type ConceptTone = "coral" | "cobalt" | "gold" | "mint";

export interface ConceptItem {
  id: string;
  title: string;
  detail: string;
  day: "Tue" | "Thu" | "Fri";
  time: string | null;
  kind: "goal" | "task";
  tone: ConceptTone;
  state: "placed" | "unplanned" | "complete";
}

export const CONCEPT_TODAY = {
  day: "Thursday",
  date: "September 3",
  shortDate: "Sep 3",
  weekProgress: "7 of 10",
  partner: "Maya",
} as const;

export const CONCEPT_ITEMS: readonly ConceptItem[] = [
  {
    id: "tempo",
    title: "Tempo run",
    detail: "45 min · Endurance",
    day: "Thu",
    time: "7:30",
    kind: "goal",
    tone: "coral",
    state: "placed",
  },
  {
    id: "launch",
    title: "Launch notes",
    detail: "Task · Product",
    day: "Thu",
    time: "11:00",
    kind: "task",
    tone: "cobalt",
    state: "placed",
  },
  {
    id: "review",
    title: "Review offer",
    detail: "Task · Flexible",
    day: "Thu",
    time: null,
    kind: "task",
    tone: "gold",
    state: "unplanned",
  },
  {
    id: "strength",
    title: "Strength",
    detail: "30 min · Missed Tuesday",
    day: "Tue",
    time: null,
    kind: "goal",
    tone: "mint",
    state: "unplanned",
  },
  {
    id: "deep-work",
    title: "Deep work",
    detail: "90 min · Product",
    day: "Thu",
    time: "6:30",
    kind: "goal",
    tone: "cobalt",
    state: "complete",
  },
] as const;

export interface FirstPrinciplesConcept {
  slug: FirstPrinciplesConceptSlug;
  number: string;
  name: string;
  thesis: string;
  object: string;
  navigation: string;
  completion: string;
  calendar: string;
  risk: string;
  references: readonly string[];
}

export const FIRST_PRINCIPLES_CONCEPTS: readonly FirstPrinciplesConcept[] = [
  {
    slug: "orbit",
    number: "01",
    name: "Orbit",
    thesis: "Goals exert gravity; the calendar is a navigable field around now.",
    object: "Goal bodies and day arcs",
    navigation: "Zoom, rotate, and select — no destination tabs",
    completion: "Fill the selected body’s circumference",
    calendar: "Concentric now / week / month scales",
    risk: "Spatial novelty can hide density and exact dates",
    references: ["Feather", "Taobao spatial comparison", "Apple Activity"],
  },
  {
    slug: "tide",
    number: "02",
    name: "Tide",
    thesis: "Time is a current; work lands, moves, and clears across one continuous surface.",
    object: "Time bands crossing a live threshold",
    navigation: "Scrub and change scale instead of changing screens",
    completion: "Sweep work across the completed shore",
    calendar: "One stream from day to week to month",
    risk: "Flexible work has no natural duration",
    references: ["Tiimo", "Structured", "Flighty smart states"],
  },
  {
    slug: "relay",
    number: "03",
    name: "Relay",
    thesis: "Show one commitment at full strength, then hand off to the next.",
    object: "The active commitment",
    navigation: "Context doors around a stable focus stage",
    completion: "Press and hold a large completion ring",
    calendar: "A compact route map behind the active item",
    risk: "Focus can conceal the shape of a busy day",
    references: ["iA Writer", "Gentler Streak", "Live Activities"],
  },
  {
    slug: "fieldbook",
    number: "04",
    name: "Fieldbook",
    thesis: "Planning, doing, people, and history are annotations on one living page.",
    object: "Dated lines and physical marks",
    navigation: "Page-edge index and direct date turns",
    completion: "Apply a visible completion stamp",
    calendar: "Month folio facing a daily log",
    risk: "The analog metaphor may resist high-volume planning",
    references: ["Superlist", "Apple Journal", "Partiful social utility"],
  },
] as const;

export function getFirstPrinciplesConcept(
  slug: FirstPrinciplesConceptSlug
): FirstPrinciplesConcept {
  return FIRST_PRINCIPLES_CONCEPTS.find((concept) => concept.slug === slug)!;
}
