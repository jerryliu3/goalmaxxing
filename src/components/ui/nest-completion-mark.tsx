import { cn } from "@/lib/utils";

export function NestCompletionMark({
  done,
  fillProgress = done ? 1 : 0,
  fillTransition = false,
  className,
  label,
}: {
  done: boolean;
  fillProgress?: number;
  fillTransition?: boolean;
  className?: string;
  label?: string;
}) {
  const progress = Math.min(1, Math.max(0, fillProgress));
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      data-completion-mark="nest"
      data-completed={done ? "true" : "false"}
      data-fill-progress={progress}
    >
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="6.6"
        y="6.6"
        width="10.8"
        height="10.8"
        rx="2.4"
        fill="currentColor"
        className="origin-center"
        style={{
          transform: `scale(${progress})`,
          transformOrigin: "12px 12px",
          transition: fillTransition
            ? "transform var(--motion-duration-hold, 480ms) linear"
            : "none",
        }}
      />
    </svg>
  );
}
