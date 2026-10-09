import { Link2 } from "lucide-react";

export function linkedGoalMarkLabel(outgoing: boolean, incoming: boolean) {
  if (outgoing && incoming) {
    return "Counts toward another goal, and another goal counts toward this";
  }
  if (outgoing) return "Counts toward another goal";
  return "Another goal counts toward this";
}

export function LinkedGoalMarks({
  outgoing,
  incoming,
  pressed = false,
  compact = false,
  onToggle,
}: {
  outgoing: boolean;
  incoming: boolean;
  pressed?: boolean;
  compact?: boolean;
  onToggle?: () => void;
}) {
  if (!outgoing && !incoming) return null;
  const label = linkedGoalMarkLabel(outgoing, incoming);
  const iconClass = compact ? "size-2 shrink-0" : "size-2.5 shrink-0";
  const marks = (
    <span
      className={
        compact
          ? "flex h-5 w-2.5 shrink-0 flex-col items-center justify-between"
          : "flex h-6 w-3 shrink-0 flex-col items-center justify-between py-0.5"
      }
    >
      <Link2 className={outgoing ? iconClass : `invisible ${iconClass}`} aria-hidden />
      <Link2 className={incoming ? iconClass : `invisible ${iconClass}`} aria-hidden />
    </span>
  );
  if (!onToggle) {
    return (
      <span className="inline-flex shrink-0 text-muted-foreground" role="img" aria-label={label} data-plan-link-mark="true">
        {marks}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="inline-flex shrink-0 text-muted-foreground"
      aria-label={label}
      aria-pressed={pressed}
      data-plan-link-mark="true"
      data-plan-completion-hit="true"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      {marks}
    </button>
  );
}
