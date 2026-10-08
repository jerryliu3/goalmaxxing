import { cn } from "@/lib/utils";

/** A hold traces the ring; only the committed state fills the centre. */
export function CompletionProgressMark({
  done,
  holding = false,
  fillTransition = false,
  fillProgress = done ? 1 : 0,
  className,
}: {
  done: boolean;
  holding?: boolean;
  fillTransition?: boolean;
  fillProgress?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"
      className={cn("block shrink-0 overflow-visible", className)}
      data-completion-mark="circle" data-completed={done}
      data-pressed={holding} data-fill-progress={fillProgress}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8"
        pathLength="1" strokeDasharray="1" strokeLinecap="round"
        transform="rotate(-90 12 12)" data-completion-ring
        className="motion-reduce:transition-none!"
        style={{ strokeDashoffset: holding ? 0 : 1, transition: fillTransition ? "stroke-dashoffset var(--motion-duration-hold, 480ms) linear" : "none" }} />
      <circle cx="12" cy="12" r="7" fill="currentColor" data-completion-fill
        className="motion-reduce:transition-none!"
        style={{ transform: `scale(${done && !holding ? 1 : 0})`, transformOrigin: "12px 12px", transition: "transform var(--motion-duration-fast) var(--motion-ease-standard)" }} />
    </svg>
  );
}
