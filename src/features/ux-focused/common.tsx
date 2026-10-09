"use client";
import { useCompletionHold } from "@/components/ui/use-completion-hold";
import { CompletionProgressMark } from "@/components/ui/completion-progress-mark";
import { Action } from "@/features/ux-refresh/primitives";
import type { ReactNode } from "react";

export function ProductHeader({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <header className="fc-product-header">
      <div>
        <p className="type-eyebrow">{detail}</p>
        <h2 className="type-title">{title}</h2>
      </div>
      <div className="rf-actions">{children}</div>
    </header>
  );
}
export function HoldCompletion({
  done,
  disabled = false,
  title,
  onCommit,
}: {
  done: boolean;
  disabled?: boolean;
  title: string;
  onCommit: () => void;
}) {
  const hold = useCompletionHold({ completed: done, disabled, onCommit });
  return (
    <button
      type="button"
      {...hold.holdProps}
      disabled={disabled}
      className="fc-complete"
      aria-pressed={hold.visualCompleted}
      aria-label={`${done ? "Remove completion for" : "Complete"} ${title}`}
    >
      <CompletionProgressMark
        done={hold.visualCompleted}
        holding={hold.holding}
        fillProgress={hold.fillProgress}
        fillTransition={hold.fillTransition}
        className="size-6"
      />
    </button>
  );
}
export function PersonMark({ partner = false }: { partner?: boolean }) {
  return (
    <span className="fc-person" data-partner={partner}>
      {partner ? "AL" : "MC"}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="fc-empty">
      <h3 className="type-heading">{title}</h3>
      {children}
    </div>
  );
}
export function StudyState({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="fc-scenario">
      Sample state{" "}
      <select
        className="rf-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
export { Action };
