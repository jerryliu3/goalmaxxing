import type { ReactNode } from "react";

export function CompletionTitle({
  completed,
  children,
  className,
  treatment = "strike",
}: {
  completed: boolean;
  children: ReactNode;
  className?: string;
  treatment?: "strike" | "quiet";
}) {
  return (
    <span className={className}>
      <span
        className="gm-completion-title"
        data-completion-treatment={treatment}
        data-completed={completed ? "true" : "false"}
        data-testid="completion-title"
      >
        {children}
      </span>
    </span>
  );
}
