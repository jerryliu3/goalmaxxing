"use client";

import Link from "next/link";
import { ArrowRight, Check, Undo2 } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties, DragEvent, ReactNode } from "react";
import { dayLabel, formatDay, formatShort, type IsoDate } from "@/features/ux-recovery/dates";
import {
  STRATEGY_LABEL,
  type RecoveryPrompt,
  type Shift,
  type Strategy,
  type Suggestion,
} from "@/features/ux-recovery/model";
import type { CalendarEntry } from "@/features/ux-recovery/projection";
import type { RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

export function goalStyle(color: string): CSSProperties {
  return { "--goal": color } as CSSProperties;
}

export function GoalSwatch({ color, className = "size-2.5" }: { color: string; className?: string }) {
  return <span aria-hidden className={`inline-block flex-none rounded-full ${className}`} style={{ background: color }} />;
}

type Tone = "primary" | "quiet" | "ghost";

const TONE: Record<Tone, string> = {
  primary: "bg-[color:var(--rc-ink)] text-[color:var(--rc-paper)] hover:opacity-90",
  quiet: "border border-[color:var(--rc-rule)] bg-[color:var(--rc-paper)] hover:border-[color:var(--rc-deep)]",
  ghost: "text-[color:var(--rc-deep)] hover:bg-black/5",
};

export function ActionButton({
  tone = "quiet",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${TONE[tone]} ${className}`}
      {...props}
    />
  );
}

export function StrategyToggle({
  value,
  onChange,
  label,
  compact = false,
}: {
  value: Strategy;
  onChange: (strategy: Strategy) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex rounded-full border border-[color:var(--rc-rule)] bg-[color:var(--rc-page)] p-0.5 ${compact ? "text-[11px]" : "text-xs"}`}
    >
      {(["squeeze", "rebalance"] as const).map((strategy) => (
        <button
          key={strategy}
          type="button"
          aria-pressed={value === strategy}
          onClick={() => onChange(strategy)}
          className={`rounded-full font-semibold transition ${compact ? "min-h-7 px-2.5" : "min-h-8 px-3"} ${
            value === strategy
              ? "bg-[color:var(--rc-ink)] text-[color:var(--rc-paper)]"
              : "text-[color:var(--rc-deep)] hover:bg-black/5"
          }`}
        >
          {STRATEGY_LABEL[strategy]}
        </button>
      ))}
    </div>
  );
}

export function missedLabel(row: Suggestion) {
  return `Missed ${formatDay(row.missedDate)}`;
}

export function DatePill({
  row,
  today,
  onClick,
}: {
  row: Suggestion;
  today: IsoDate;
  onClick?: () => void;
}) {
  if (!row.date) {
    return (
      <span className="inline-flex min-h-8 items-center rounded-full border border-dashed border-[color:var(--rc-amber-line)] px-3 text-xs font-semibold text-[color:var(--rc-amber)]">
        No day left
      </span>
    );
  }
  const decided = row.status !== "pending";
  const className = `rc-pill inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold ${
    decided
      ? "bg-[color:var(--rc-gain)] text-[color:var(--rc-paper)]"
      : "border-[1.5px] border-dashed border-[color:var(--rc-ink)]"
  }`;
  const content = (
    <>
      {decided ? <Check aria-hidden className="size-3" /> : null}
      {dayLabel(row.date, today)}
    </>
  );
  return onClick ? (
    <button
      type="button"
      className={className}
      data-rest={row.rest}
      onClick={onClick}
      aria-label={`Suggested ${formatDay(row.date)}. Change day`}
    >
      {content}
    </button>
  ) : (
    <span className={className} data-rest={row.rest}>
      {content}
    </span>
  );
}

function optionNote(option: Suggestion["options"][number]) {
  if (option.full) return "full";
  if (option.sameGoal) return "taken";
  if (option.rest) return "rest";
  return null;
}

/**
 * Day picker limited to the row's window; invalid days stay visible but disabled.
 * Without `onPick` it renders as a read-only mini week with the suggestion lit.
 */
export function DateStrip({
  row,
  today,
  onPick,
  limit,
}: {
  row: Suggestion;
  today: IsoDate;
  onPick?: (date: IsoDate) => void;
  limit?: number;
}) {
  const options = limit ? row.options.slice(0, limit) : row.options;
  return (
    <div
      className="rc-strip"
      role="group"
      aria-label={onPick ? `Pick a day for ${row.label}` : `Days left for ${row.label}`}
    >
      {options.map((option) => {
        const selected = option.date === row.date;
        const note = optionNote(option);
        const className = `flex min-h-14 min-w-12 flex-none flex-col items-center justify-center rounded-xl border px-2 text-xs transition ${
          selected
            ? "border-[color:var(--rc-ink)] bg-[color:var(--rc-ink)] text-[color:var(--rc-paper)]"
            : option.available
              ? "border-[color:var(--rc-rule)] bg-[color:var(--rc-paper)] hover:border-[color:var(--rc-deep)]"
              : "border-transparent text-[color:var(--rc-muted)] opacity-50"
        }`;
        const label = `${formatDay(option.date)}${note ? ` (${note})` : ""}`;
        const content = (
          <>
            <span className="font-semibold">{dayLabel(option.date, today)}</span>
            <span className="font-mono text-[10px] opacity-75">{note ?? formatShort(option.date)}</span>
          </>
        );
        if (!onPick) {
          return (
            <span key={option.date} className={className} aria-label={label} aria-current={selected ? "date" : undefined}>
              {content}
            </span>
          );
        }
        return (
          <button
            key={option.date}
            type="button"
            disabled={!option.available}
            aria-pressed={selected}
            aria-label={label}
            onClick={() => onPick(option.date)}
            className={`${className} disabled:cursor-not-allowed`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

const LEGEND = [
  { kind: "slipped", text: "Slipped" },
  { kind: "suggested", text: "Suggested" },
  { kind: "accepted", text: "Accepted" },
  { kind: "shift-from", text: "Moving away" },
] as const;

export function Legend() {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[color:var(--rc-deep)]" aria-label="Legend">
      {LEGEND.map((item) => (
        <li key={item.kind} className="flex items-center gap-1.5">
          <span
            className="rc-chip"
            style={{ ...goalStyle("#5c4e3f"), width: 24, minHeight: 14, padding: 0 }}
            data-kind={item.kind === "accepted" ? "suggested" : item.kind}
            data-accepted={item.kind === "accepted"}
            aria-hidden
          />
          {item.text}
        </li>
      ))}
    </ul>
  );
}

export function ShiftList({ shifts, today, accepted }: { shifts: Shift[]; today: IsoDate; accepted?: boolean }) {
  if (!shifts.length) return null;
  return (
    <div className="mt-2 rounded-xl border border-dashed border-[color:var(--rc-rule)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">
        {accepted ? "Also moving" : "Rebalancing also moves"}
      </p>
      <ul className="mt-1 space-y-0.5 text-xs">
        {shifts.map((shift) => (
          <li key={shift.sessionId} className="flex items-center gap-1.5">
            <span className="text-[color:var(--rc-deep)]">{shift.label}</span>
            <span className="font-mono line-through opacity-60">{dayLabel(shift.from, today)}</span>
            <ArrowRight aria-hidden className="size-3" />
            <span className="font-mono font-semibold">{dayLabel(shift.to, today)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CHIP_SUFFIX: Partial<Record<CalendarEntry["kind"], (entry: CalendarEntry, today: IsoDate) => string>> = {
  slipped: (entry, today) => (entry.counterpart ? `→ ${dayLabel(entry.counterpart, today)}` : "slipped"),
  suggested: (entry, today) => `from ${dayLabel(entry.counterpart ?? "", today)}`,
  "shift-from": (entry, today) => `→ ${dayLabel(entry.counterpart ?? "", today)}`,
  "shift-to": (entry, today) => `from ${dayLabel(entry.counterpart ?? "", today)}`,
  "let-go": () => "let go",
};

export function SessionChip({
  entry,
  today,
  selected = false,
  onSelect,
  onDragStart,
  onDragEnd,
  compact = false,
}: {
  entry: CalendarEntry;
  today: IsoDate;
  selected?: boolean;
  onSelect?: () => void;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
  compact?: boolean;
}) {
  const suffix = CHIP_SUFFIX[entry.kind]?.(entry, today);
  const title = `${entry.goal.short} · ${entry.label}${suffix ? ` · ${suffix}` : ""}`;
  const body = (
    <>
      <span className="rc-chip-dot" />
      <span className={`rc-chip-label min-w-0 truncate font-semibold ${compact ? "hidden sm:inline" : ""}`}>
        {entry.goal.short}
      </span>
      {suffix && !compact ? (
        <span className="ml-auto flex-none font-mono text-[10px] opacity-70">{suffix}</span>
      ) : null}
    </>
  );
  const common = {
    className: "rc-chip",
    style: goalStyle(entry.goal.color),
    "data-kind": entry.kind,
    "data-accepted": entry.accepted,
    "data-moving": entry.kind === "slipped" && entry.counterpart !== null,
    "data-selected": selected,
    title,
  };
  if (!onSelect) {
    return (
      <div {...common}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      {...common}
      aria-label={title}
      aria-pressed={selected}
      onClick={onSelect}
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {body}
    </button>
  );
}

/** The Agenda's calm one-line entry. Replaces the hidden settings button. */
export function EntryPrompt({
  prompt,
  onReview,
  href,
  children,
}: {
  prompt: RecoveryPrompt;
  onReview?: () => void;
  href?: string;
  children?: ReactNode;
}) {
  if (prompt.count === 0) {
    return (
      <p className="flex min-h-11 items-center gap-2 text-sm text-[color:var(--rc-muted)]">
        <Check aria-hidden className="size-4 text-[color:var(--rc-gain)]" />
        Nothing slipped. You’re on plan.
      </p>
    );
  }
  const label = "Review";
  const action = href ? (
    <Link href={href} className="inline-flex min-h-9 items-center gap-1 font-semibold underline-offset-4 hover:underline">
      {label}
      <ArrowRight aria-hidden className="size-3.5" />
    </Link>
  ) : (
    <button type="button" onClick={onReview} className="inline-flex min-h-9 items-center gap-1 font-semibold underline-offset-4 hover:underline">
      {label}
      <ArrowRight aria-hidden className="size-3.5" />
    </button>
  );
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span aria-hidden className="size-2 rounded-full bg-[color:var(--rc-amber-dot)]" />
      <span>
        {prompt.text}
        {prompt.fit < prompt.count ? (
          <span className="text-[color:var(--rc-muted)]"> · {prompt.fit} can still fit</span>
        ) : null}
      </span>
      <span aria-hidden className="text-[color:var(--rc-rule)]">—</span>
      {action}
      {children}
    </div>
  );
}

export function ReviewFooter({ review }: { review: RecoveryReview }) {
  const { counts, state } = review;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ActionButton tone="ghost" onClick={review.undo} disabled={!state.history.length}>
        <Undo2 aria-hidden className="size-4" />
        Undo
      </ActionButton>
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={review.acceptAll} disabled={!counts.acceptable}>
          Accept all ({counts.acceptable})
        </ActionButton>
        <ActionButton tone="primary" onClick={review.apply} disabled={!counts.decided}>
          Apply{counts.decided ? ` (${counts.decided})` : ""}
        </ActionButton>
      </div>
    </div>
  );
}

export function AppliedSummary({ review }: { review: RecoveryReview }) {
  const summary = review.state.applied?.summary;
  if (!summary) return null;
  const parts = [
    `${summary.moved} moved`,
    summary.shifted ? `${summary.shifted} future session${summary.shifted === 1 ? "" : "s"} shifted` : null,
    summary.letGo ? `${summary.letGo} let go` : null,
    summary.leftForLater ? `${summary.leftForLater} left for later` : null,
  ].filter(Boolean);
  return (
    <div className="rc-rise" role="status">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-gain)]">Applied</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Your plan is back on track.</h2>
      <p className="mt-2 text-sm text-[color:var(--rc-deep)]">{parts.join(" · ")}.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={review.undoApply}>
          <Undo2 aria-hidden className="size-4" />
          Undo
        </ActionButton>
        <ActionButton tone="ghost" onClick={review.reset}>
          Start the study over
        </ActionButton>
      </div>
    </div>
  );
}
