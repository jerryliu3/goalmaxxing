import type { ReactNode } from "react";

export function CompletionTitle({
  completed,
  children,
  className,
}: {
  completed: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={className}>
      <span
        className="gm-completion-title"
        data-completed={completed ? "true" : "false"}
        data-testid="completion-title"
      >
        {children}
      </span>
    </span>
  );
}
