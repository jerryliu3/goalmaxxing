export type DayWorkConceptSlug =
  | "now"
  | "folio"
  | "phrase"
  | "peek"
  | "deck"
  | "gazette"
  | "stations";

export type DayWorkFamily = "inspect" | "replace";

export interface DayWorkConcept {
  slug: DayWorkConceptSlug;
  number: string;
  name: string;
  family: DayWorkFamily;
  thesis: string;
  object: string;
  open: string;
  edit: string;
  complete: string;
  risk: string;
  steal: string;
}

export const DAY_WORK_CONCEPTS: readonly DayWorkConcept[] = [
  {
    slug: "now",
    number: "00",
    name: "Now",
    family: "inspect",
    thesis:
      "The live control: an unfold under the row with title, date, and time as input fields. Metadata about the goal itself is missing, and the surface reads as a form, not an object.",
    object: "Dashed form panel under the selected row",
    open: "Click the row; the editor portals into a slot below it",
    edit: "Type into labeled inputs. Lock and Edit goal are outline buttons",
    complete: "The row checkbox, unchanged",
    risk: "Useful as a comparison, not a direction",
    steal: "Keep instance prev/next and lock. Drop the input-first chrome",
  },
  {
    slug: "folio",
    number: "01",
    name: "Folio",
    family: "inspect",
    thesis:
      "The row unfolds into a compact Tempo card. Cadence, deadline, and time are typeset facts. Tap a fact to change it — the base view is a reading surface.",
    object: "In-place Tempo folio under the work row",
    open: "Click the title. The row grows into the card you already met at creation",
    edit: "Tap any fact. It becomes chips or a line editor, then settles back to prose",
    complete: "The row’s Nest mark. Opening never competes with completing",
    risk: "A card in a list can still feel tall on a busy day",
    steal: "The creation card’s number, wash, and effort bars — scaled for inspect",
  },
  {
    slug: "phrase",
    number: "02",
    name: "Phrase",
    family: "inspect",
    thesis:
      "Opening a goal writes one sentence. Frequency, deadline, sitting, and effort are phrases you can tap. No card, no fields — a brief that becomes editable where you touch it.",
    object: "A typeset sentence under the row",
    open: "Click the title. A sentence appears, not a panel",
    edit: "Tap a phrase. A small choice row replaces only that phrase",
    complete: "Still the row mark. The sentence is for understanding and changing",
    risk: "A long sentence can wrap poorly if every fact is always on",
    steal: "Things 3 / Superhuman: language as the control, not a form around the language",
  },
  {
    slug: "peek",
    number: "03",
    name: "Peek",
    family: "inspect",
    thesis:
      "The list stays compact. Opening a goal brings the living Tempo card beside it (or up as a sheet on a phone), with metadata as a quiet facts column. You inspect without losing the day.",
    object: "List plus the creation card as an inspect object",
    open: "Click a row. Desktop peeks right; phone sheets up",
    edit: "Tap a fact beside the card, or tap the card’s own type to edit it",
    complete: "Row mark in the list. The peek is for identity and schedule",
    risk: "A second pane can hide on small phones if the sheet is greedy",
    steal: "Linear Peek continuity, Tempo card as the goal’s face",
  },
  {
    slug: "deck",
    number: "04",
    name: "Deck",
    family: "replace",
    thesis:
      "Today is a hand of Tempo cards, not a checklist. Flip through commitments. Complete the front card. Remaining titles live as a spine so you never lose the set.",
    object: "A stack of goal cards for the day",
    open: "The front card is already open. The spine selects another",
    edit: "Tap a fact on the front card. Same read-first rule as Folio",
    complete: "A large Nest on the front card. The next card steps forward",
    risk: "A stack conceals how many sit behind it unless the spine is honest",
    steal: "The creation stack you already swipe through when drafting many goals",
  },
  {
    slug: "gazette",
    number: "05",
    name: "Gazette",
    family: "replace",
    thesis:
      "Today is a newspaper spread. Each goal is a short article: kicker, headline, dek of cadence and deadline. Opening expands the article in the grid. Completing stamps it.",
    object: "Editorial columns of the day’s work",
    open: "Tap an article. It widens in the spread; others recede",
    edit: "The expanded dek is tappable phrases, same as Phrase",
    complete: "A stamp on the article, not a checkbox in a row",
    risk: "Newspaper density can feel precious if the day only has two items",
    steal: "Gazetteer masthead, Newsreader, stamp rust — pride without a list",
  },
  {
    slug: "stations",
    number: "06",
    name: "Stations",
    family: "replace",
    thesis:
      "The day is a path, not a queue. Timed work sits on a rail from morning to evening. Unplaced work waits as anytime islands. You walk the path; opening a station shows its facts.",
    object: "A timed path with anytime islands",
    open: "Tap a station. Its facts unfold beside the rail",
    edit: "Tap a fact in the station brief",
    complete: "Fill the station mark. The path shows what remains",
    risk: "Flexible work has no natural time, so anytime must stay first-class",
    steal: "Relay’s one-at-a-time focus, without hiding the shape of the day",
  },
];

export function getDayWorkConcept(slug: DayWorkConceptSlug): DayWorkConcept {
  const concept = DAY_WORK_CONCEPTS.find((item) => item.slug === slug);
  if (!concept) {
    throw new Error(`Unknown day-work concept: ${slug}`);
  }
  return concept;
}

export const INSPECT_CONCEPTS = DAY_WORK_CONCEPTS.filter(
  (concept) => concept.family === "inspect",
);
export const REPLACE_CONCEPTS = DAY_WORK_CONCEPTS.filter(
  (concept) => concept.family === "replace",
);
