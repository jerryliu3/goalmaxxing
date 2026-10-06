export type RecoveryConceptSlug = "ledger" | "calendar" | "deck";

export interface RecoveryConcept {
  slug: RecoveryConceptSlug;
  number: string;
  name: string;
  thesis: string;
  review: string;
  edit: string;
  risk: string;
}

export const RECOVERY_CONCEPTS: readonly RecoveryConcept[] = [
  {
    slug: "ledger",
    number: "A",
    name: "Ledger",
    thesis:
      "A review sheet over the calendar. Every slipped session is a row with a suggested day; the calendar behind previews the result.",
    review:
      "Rows grouped by goal. Missed date → suggested pill. Accept, Edit, or Let it go. Accept all and Apply in the footer.",
    edit: "Tap the pill or Edit: a date strip limited to the goal's valid days.",
    risk: "A sheet is one more surface; on phones it covers most of the preview.",
  },
  {
    slug: "calendar",
    number: "B",
    name: "On the calendar",
    thesis:
      "No new surface. Slipped sessions sit on their day as amber chips, with a dashed ghost on the day we suggest.",
    review:
      "A slim bar counts what slipped. Tap a chip to accept, choose a day, or let it go. Drag a chip onto any open day on desktop.",
    edit: "Drag to an open day, or Choose day in the chip panel.",
    risk: "Misses from last week live off-screen; the Earlier lane has to carry them.",
  },
  {
    slug: "deck",
    number: "C",
    name: "One at a time",
    thesis:
      "Triage cards. One slipped session, one decision, then the next — and a summary before anything changes.",
    review:
      "Each card shows the goal, the missed day, and a mini week with the suggestion lit. Accept, Pick another day, Let it go, or Later.",
    edit: "Pick another day turns the mini week into a picker. Rebalance on the card reveals what else moves.",
    risk: "Slow when many sessions slipped; Accept all lives only on the summary.",
  },
];

export function getRecoveryConcept(slug: RecoveryConceptSlug): RecoveryConcept {
  const concept = RECOVERY_CONCEPTS.find((item) => item.slug === slug);
  if (!concept) throw new Error(`Unknown recovery concept: ${slug}`);
  return concept;
}
