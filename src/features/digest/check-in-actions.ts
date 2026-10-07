import type {
  DigestFacts,
  DigestSuggestionAction,
  DigestSuggestions,
} from "@/lib/digest/contract";
import {
  DIGEST_DEFAULT_SESSION_MINUTES,
  formatEstimatedDuration,
} from "@/lib/digest/hours";
import type { DigestKind } from "@/lib/digest/period";
import { recoveryPromptText } from "@/lib/planner/recovery/model";

export interface CheckInRow {
  id: string;
  title: string;
  detail: string;
  action: DigestSuggestionAction | null;
}

/** The one thing the primary button should do for each cadence. */
export function primaryCheckInAction(kind: DigestKind): DigestSuggestionAction {
  return kind === "daily" ? "today" : "plan";
}

export function checkInHeading(kind: DigestKind) {
  if (kind === "monthly") {
    return "Monthly check-in";
  }
  if (kind === "weekly") {
    return "Weekly check-in";
  }
  return "Daily check-in";
}

export function checkInRecapSummary(facts: DigestFacts) {
  const { recap } = facts;
  if (recap.placed === 0) {
    return `${recap.label.toLowerCase()}: nothing was placed`;
  }
  return `${recap.label.toLowerCase()}: ${recap.completed} of ${recap.placed} done`;
}

function pluralSessions(count: number) {
  return count === 1 ? "session" : "sessions";
}

function recoverAction(facts: DigestFacts): CheckInRow | null {
  const { recover } = facts;
  if (recover.count === 0) {
    return null;
  }
  const named = recover.items.map((item) => item.title).join(", ");
  return {
    id: "recover",
    title: recoveryPromptText(recover.count),
    detail:
      named.length > 0
        ? `${named}${recover.count > recover.items.length ? ", and more" : ""}.`
        : "Give the work a new day, or let it go.",
    action: "plan",
  };
}

function unscheduledAction(facts: DigestFacts): CheckInRow | null {
  const { unscheduled, ahead } = facts;
  if (unscheduled.count === 0) {
    return null;
  }
  const named = unscheduled.titles.join(", ");
  return {
    id: "unscheduled",
    title: `${unscheduled.count} ${unscheduled.count === 1 ? "goal has" : "goals have"} nothing in ${ahead.label.toLowerCase()}`,
    detail:
      named.length > 0
        ? `${named}${unscheduled.count > unscheduled.titles.length ? ", and more" : ""}.`
        : "Place work for them, or park them for now.",
    action: "plan",
  };
}

/**
 * Only on the monthly check-in, and unconditionally: the month boundary *is*
 * the moment to decide what you are taking on, so this is a standing prompt
 * rather than something the facts have to earn.
 */
function newGoalsAction(): CheckInRow {
  return {
    id: "new-goals",
    title: "Set what this month is for",
    detail: "Add what you're taking on, or retire what you're not.",
    action: "goals",
  };
}

function workloadInformation(facts: DigestFacts): CheckInRow | null {
  const { ahead } = facts;
  const open = ahead.placed - ahead.completed;
  if (open <= 0) {
    return null;
  }
  return {
    id: "workload",
    title: `${open} ${pluralSessions(open)} in ${ahead.label.toLowerCase()}, about ${formatEstimatedDuration(ahead.estimatedMinutes)}`,
    detail: `Estimated at ${DIGEST_DEFAULT_SESSION_MINUTES} minutes a session.`,
    action: null,
  };
}

/**
 * Orders the structured rows by what the cadence is for. A month starts by
 * deciding what to take on, a week starts by cleaning up and shaping, and a day
 * starts by looking at the day. Unscheduled goals are left out of the daily
 * check-in, where a list of unplaced goals is noise rather than a decision.
 *
 * Nothing here writes. Actionable rows jump into the surface that owns the
 * change; informational rows deliberately have no action.
 */
export function buildStructuredCheckInRows({
  kind,
  facts,
}: {
  kind: DigestKind;
  facts: DigestFacts;
}): CheckInRow[] {
  const recover = recoverAction(facts);
  const unscheduled = kind === "daily" ? null : unscheduledAction(facts);
  const workload = workloadInformation(facts);
  const ordered =
    kind === "monthly"
      ? [newGoalsAction(), unscheduled, recover, workload]
      : kind === "weekly"
        ? [recover, unscheduled, workload]
        : [recover, workload];

  return ordered.filter(
    (entry): entry is CheckInRow => entry !== null
  );
}

export function buildCoachCheckInRows(
  suggestions: DigestSuggestions | null
): CheckInRow[] {
  return (suggestions?.suggestions ?? []).flatMap((suggestion) =>
    suggestion.action
      ? [
          {
            id: `coach:${suggestion.title}`,
            title: suggestion.title,
            detail: suggestion.body,
            action: suggestion.action,
          },
        ]
      : []
  );
}

/**
 * What the check-in shows next: facts and decisions implied by the window,
 * followed by actionable suggestions the coach added.
 */
export function buildCheckInRows({
  kind,
  facts,
  suggestions,
}: {
  kind: DigestKind;
  facts: DigestFacts;
  suggestions: DigestSuggestions | null;
}): CheckInRow[] {
  return [
    ...buildStructuredCheckInRows({ kind, facts }),
    ...buildCoachCheckInRows(suggestions),
  ];
}

/**
 * The check-in does not answer follow-ups itself — it hands the question to the
 * planner coach panel, which owns the conversation and the plan proposals.
 *
 * The question is built from the rows the sheet just rendered rather than from
 * the facts again, so the coach opens knowing exactly what the user is looking
 * at. The model's own suggestions are left out: they are its words, not the
 * user's situation.
 */
export function buildCheckInCoachQuestion({
  kind,
  facts,
}: {
  kind: DigestKind;
  facts: DigestFacts;
}) {
  const horizon = facts.ahead.label.toLowerCase();
  const decisions = buildStructuredCheckInRows({ kind, facts });
  return [
    `Following up on my ${checkInHeading(kind).toLowerCase()}.`,
    `How it went — ${checkInRecapSummary(facts)}.`,
    ...(decisions.length > 0
      ? ["What the check-in flagged:", ...decisions.map((entry) => `- ${entry.title}`)]
      : []),
    `Help me decide how to tackle ${horizon}.`,
  ].join("\n");
}
