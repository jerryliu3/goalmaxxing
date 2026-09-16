import { checkInHeading } from "@/features/digest/check-in-actions";
import type { DigestFacts } from "@/lib/digest/contract";
import type { DigestKind } from "@/lib/digest/period";

function sessions(count: number) {
  return count === 1 ? "session" : "sessions";
}

/**
 * The check-in does not answer follow-ups itself — it hands the question to the
 * planner coach panel, which owns the conversation and the plan proposals. This
 * builds that question from the same facts the sheet just showed, so the coach
 * opens already knowing the numbers.
 */
export function buildCheckInCoachQuestion({
  kind,
  facts,
}: {
  kind: DigestKind;
  facts: DigestFacts;
}) {
  const horizon = facts.ahead.label.toLowerCase();
  const open = Math.max(facts.ahead.placed - facts.ahead.completed, 0);
  const lines = [
    `Following up on my ${checkInHeading(kind).toLowerCase()}.`,
    `${facts.recap.label}: ${facts.recap.completed} of ${facts.recap.placed} placed ${sessions(facts.recap.placed)} done.`,
    `${facts.ahead.label}: ${open} open ${sessions(open)}.`,
  ];
  if (facts.recover.count > 0) {
    lines.push(
      `${facts.recover.count} missed ${sessions(facts.recover.count)} still ${facts.recover.count === 1 ? "needs" : "need"} a new day.`
    );
  }
  if (facts.unscheduled.count > 0) {
    lines.push(
      `${facts.unscheduled.count} ${facts.unscheduled.count === 1 ? "goal has" : "goals have"} nothing placed in ${horizon}.`
    );
  }
  lines.push(`Help me decide how to tackle ${horizon}.`);
  return lines.join("\n");
}
