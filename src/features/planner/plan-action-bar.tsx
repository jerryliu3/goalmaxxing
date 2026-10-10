"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./plan-action-bar.module.css";

export const PLAN_ACTION_BUTTON_CLASS = "h-9 rounded-full px-3.5";

/**
 * The one place a pending plan change is kept or thrown away: a bar floating
 * just above the phone tab bar (and near the bottom edge once tabs move into
 * the header), so Save stays in reach while scrolling a month. Planning and
 * Recovery share it.
 */
export function PlanActionBar({
  label,
  title,
  detail,
  dotClassName,
  testId,
  children,
}: {
  label: string;
  title: ReactNode;
  detail?: ReactNode;
  dotClassName: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    // m-0: a parent's space-y margin would otherwise lift the fixed bar off the offset panels stack from.
    <div className={cn("pointer-events-none fixed inset-x-0 z-40 m-0 flex justify-center px-3", styles.anchor)}>
      <div
        role="region"
        aria-label={label}
        data-testid={testId}
        data-plan-action-bar
        className="pointer-events-auto flex h-(--plan-action-bar-height) w-full max-w-2xl items-center gap-2 rounded-2xl border border-border bg-popover/95 py-1.5 pl-4 pr-1.5 text-popover-foreground shadow-[0_12px_40px_rgb(0_0_0/0.16)] backdrop-blur supports-[backdrop-filter]:bg-popover/85"
      >
        <p className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span aria-hidden className={cn("size-2 flex-none rounded-full", dotClassName)} />
          <span className="shrink-0 font-semibold">{title}</span>
          {detail ? <span className="min-w-0 truncate text-muted-foreground">· {detail}</span> : null}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">{children}</div>
      </div>
    </div>
  );
}

/** Planning's bar: the unsaved draft, with Discard and Save plan. */
export function PlanningActionBar({
  canSave,
  saveLabel,
  saveDisabled,
  saveBlockedMessage,
  discardDisabled,
  onSave,
  onDiscard,
}: {
  canSave: boolean;
  saveLabel: string;
  saveDisabled: boolean;
  saveBlockedMessage: string | null;
  discardDisabled: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <PlanActionBar
      label="Planning"
      testId="planner-preview-mode-badge"
      title="Planning"
      detail={saveBlockedMessage}
      dotClassName="bg-primary"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={PLAN_ACTION_BUTTON_CLASS}
        onClick={onDiscard}
        disabled={discardDisabled}
      >
        Discard
      </Button>
      {canSave ? (
        <Button
          type="button"
          size="sm"
          className={PLAN_ACTION_BUTTON_CLASS}
          onClick={onSave}
          title={saveBlockedMessage ?? undefined}
          disabled={saveDisabled}
        >
          {saveLabel}
        </Button>
      ) : null}
    </PlanActionBar>
  );
}
