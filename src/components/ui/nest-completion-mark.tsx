import { cn } from "@/lib/utils";

export function NestCompletionMark({
  done,
  className,
  label,
}: {
  done: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      data-completion-mark="nest"
      data-completed={done ? "true" : "false"}
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
      {done ? (
        <rect
          x="6.6"
          y="6.6"
          width="10.8"
          height="10.8"
          rx="2.4"
          fill="currentColor"
        />
      ) : null}
    </svg>
  );
}
