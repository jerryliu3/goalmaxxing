export type RecoveryConceptSlug = "goal-by-goal" | "goal-view";

export interface RecoveryConcept {
  slug: RecoveryConceptSlug;
  /** Letters kept from round 2 (A, Focused list, is retired). */
  number: string;
  name: string;
  thesis: string;
  review: string;
  edit: string;
  risk: string;
}

export const RECOVERY_CONCEPTS: readonly RecoveryConcept[] = [
  {
    slug: "goal-by-goal",
    number: "B",
    name: "Goal by goal",
    thesis:
      "Leading. One goal at a time — “Goal 2 of 4” — with the calendar filtered to it. Every decision saves and stays as a confirmation with its own Undo; the walk ends on a recap of every change.",
    review:
      "Press “N sessions slipped · Review”. The panel shows one goal; Accept, Edit + Apply or Let it go saves at once and the row turns into “Moved to Thu Oct 8 ✓” (or “Let go ✓”) with Undo. Next goal is always there, Back too. After the last goal, the summary lists every goal’s sessions old → new, still undoable. Auto-rebalance skips to that summary as a proposal; Apply rebalance saves it in one go.",
    edit: "Edit opens a strip of the goal’s valid days. Pick one, then Apply. A pick moves only that session.",
    risk: "Extra steps when one session slipped; you can’t see what else is waiting without stepping (the summary shows it).",
  },
  {
    slug: "goal-view",
    number: "C",
    name: "In Goal View",
    thesis:
      "Recovery inside Goal View’s lanes. A lane is already one goal, so the filter is free: open its “N slipped” marker and decide right there.",
    review:
      "Review in the toolbar adds an “N slipped” marker to each lane that has one and opens the first. The open lane brings its slipped cards in ahead of today, ghosts the suggested days, and lists the rows under the lane — decided rows stay as confirmations with Undo, Back / Next goal step through the lanes, and Summary (or Auto-rebalance) shows the same recap above the lanes.",
    edit: "Same per-row strip and Apply, in the tray under the lane.",
    risk: "Goal View hides past sessions by default, so this only works because Review adds them back; on phones the goal deck has no lanes.",
  },
];

export function getRecoveryConcept(slug: RecoveryConceptSlug): RecoveryConcept {
  const concept = RECOVERY_CONCEPTS.find((item) => item.slug === slug);
  if (!concept) throw new Error(`Unknown recovery concept: ${slug}`);
  return concept;
}
