"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { dayLabel, formatDay, formatShort, type IsoDate } from "@/features/ux-recovery/dates";
import type { DayOption, RecoveryPrompt, Suggestion } from "@/features/ux-recovery/model";
import type { CalendarEntry } from "@/features/ux-recovery/projection";

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

/** The one strategy setting. Off: only the missed session moves. */
export function RebalanceSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      title="Also respace each goal's later sessions evenly"
      className="inline-flex min-h-9 items-center gap-2 rounded-full px-2 text-xs font-semibold hover:bg-black/5"
    >
      <span
        aria-hidden
        className={`relative h-[18px] w-8 rounded-full transition-colors ${
          on ? "bg-[color:var(--rc-ink)]" : "bg-[color:var(--rc-rule)]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-3.5 rounded-full bg-[color:var(--rc-paper)] shadow-sm transition-transform ${
            on ? "translate-x-3.5" : ""
          }`}
        />
      </span>
      Auto-rebalance
    </button>
  );
}

/**
 * The calm entry: nothing about recovery shows until this is pressed.
 * Renders a link on the index, a button in the concepts.
 */
export function ReviewEntry({
  prompt,
  reviewing = false,
  onReview,
  href,
}: {
  prompt: RecoveryPrompt;
  reviewing?: boolean;
  onReview?: () => void;
  href?: string;
}) {
  if (prompt.count === 0) {
    return (
      <p className="flex min-h-10 items-center gap-2 text-sm text-[color:var(--rc-muted)]">
        <Check aria-hidden className="size-4 text-[color:var(--rc-gain)]" />
        Nothing slipped. You’re on plan.
      </p>
    );
  }
  if (reviewing) {
    return (
      <p className="flex min-h-10 items-center gap-2 text-sm text-[color:var(--rc-deep)]">
        <span aria-hidden className="size-2 rounded-full bg-[color:var(--rc-amber-dot)]" />
        {prompt.text} · reviewing
      </p>
    );
  }
  const label = `${prompt.text} · Review`;
  const className =
    "inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--rc-amber-line)] bg-[color:var(--rc-amber-wash)] px-3.5 text-sm transition hover:border-[color:var(--rc-amber)]";
  const content = (
    <>
      <span aria-hidden className="size-2 rounded-full bg-[color:var(--rc-amber-dot)]" />
      <span>{prompt.text}</span>
      <span aria-hidden className="text-[color:var(--rc-amber)]">·</span>
      <span className="font-semibold">Review</span>
      <ArrowRight aria-hidden className="size-3.5" />
    </>
  );
  return href ? (
    <Link href={href} aria-label={label} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onReview} aria-label={label} className={className}>
      {content}
    </button>
  );
}

export function missedLabel(row: Suggestion) {
  return `Missed ${formatDay(row.missedDate)}`;
}

export function DatePill({ row, today }: { row: Suggestion; today: IsoDate }) {
  if (!row.date) {
    return (
      <span className="inline-flex min-h-8 flex-none items-center rounded-full border border-dashed border-[color:var(--rc-amber-line)] px-3 text-xs font-semibold text-[color:var(--rc-amber)]">
        No day left
      </span>
    );
  }
  return (
    <span
      className="rc-pill inline-flex min-h-8 flex-none items-center rounded-full border-[1.5px] border-dashed border-[color:var(--rc-ink)] px-3 text-xs font-semibold"
      data-rest={row.rest}
      title={`Suggested ${formatDay(row.date)}`}
    >
      {dayLabel(row.date, today)}
    </span>
  );
}

function optionNote(option: DayOption) {
  if (option.full) return "full";
  if (option.sameGoal) return "taken";
  if (option.rest) return "rest";
  return null;
}

/** Day picker limited to the row's window; invalid days stay visible but disabled. */
export function DateStrip({
  options,
  today,
  label,
  selected,
  suggested,
  onPick,
}: {
  options: readonly DayOption[];
  today: IsoDate;
  label: string;
  selected: IsoDate | null;
  suggested: IsoDate | null;
  onPick: (date: IsoDate) => void;
}) {
  return (
    <div className="rc-strip" role="group" aria-label={label}>
      {options.map((option) => {
        const isSelected = option.date === selected;
        const note = optionNote(option);
        return (
          <button
            key={option.date}
            type="button"
            disabled={!option.available}
            aria-pressed={isSelected}
            aria-label={`${formatDay(option.date)}${note ? ` (${note})` : ""}${option.date === suggested ? ", suggested" : ""}`}
            onClick={() => onPick(option.date)}
            className={`flex min-h-14 min-w-12 flex-none flex-col items-center justify-center rounded-xl border px-2 text-xs transition disabled:cursor-not-allowed ${
              isSelected
                ? "border-[color:var(--rc-ink)] bg-[color:var(--rc-ink)] text-[color:var(--rc-paper)]"
                : option.available
                  ? `bg-[color:var(--rc-paper)] hover:border-[color:var(--rc-deep)] ${
                      option.date === suggested
                        ? "border-dashed border-[color:var(--rc-ink)]"
                        : "border-[color:var(--rc-rule)]"
                    }`
                  : "border-transparent text-[color:var(--rc-muted)] opacity-50"
            }`}
          >
            <span className="font-semibold">{dayLabel(option.date, today)}</span>
            <span className="font-mono text-[10px] opacity-75">{note ?? formatShort(option.date)}</span>
          </button>
        );
      })}
    </div>
  );
}

const LEGEND = [
  { kind: "slipped", text: "Slipped" },
  { kind: "suggested", text: "Suggested" },
  { kind: "shift-from", text: "Moving away" },
  { kind: "recovered", text: "Saved" },
] as const;

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[color:var(--rc-deep)]" aria-label="Legend">
      {LEGEND.map((item) => (
        <li key={item.kind} className="flex items-center gap-1.5">
          <span
            className="rc-chip"
            style={{ ...goalStyle("#5c4e3f"), width: 24, minHeight: 14, padding: 0 }}
            data-kind={item.kind}
            aria-hidden
          />
          {item.text}
        </li>
      ))}
    </ul>
  );
}

const CHIP_SUFFIX: Partial<Record<CalendarEntry["kind"], (entry: CalendarEntry, today: IsoDate) => string>> = {
  slipped: (entry, today) => (entry.counterpart ? `→ ${dayLabel(entry.counterpart, today)}` : "slipped"),
  suggested: (entry, today) => `from ${dayLabel(entry.counterpart ?? "", today)}`,
  "shift-from": (entry) => `→ ${formatShort(entry.counterpart ?? "")}`,
  "shift-to": (entry) => `from ${formatShort(entry.counterpart ?? "")}`,
  recovered: (entry) => `moved from ${formatShort(entry.counterpart ?? "")}`,
  "let-go": () => "let go",
};

export function SessionChip({
  entry,
  today,
  selected = false,
  dimmed = false,
}: {
  entry: CalendarEntry;
  today: IsoDate;
  selected?: boolean;
  dimmed?: boolean;
}) {
  const suffix = CHIP_SUFFIX[entry.kind]?.(entry, today);
  return (
    <div
      className="rc-chip"
      style={goalStyle(entry.goal.color)}
      data-kind={entry.kind}
      data-moving={entry.kind === "slipped" && entry.counterpart !== null}
      data-selected={selected}
      data-dimmed={dimmed}
      title={`${entry.goal.short} · ${entry.label}${suffix ? ` · ${suffix}` : ""}`}
    >
      <span className="rc-chip-dot" />
      <span className="rc-chip-label hidden min-w-0 truncate font-semibold sm:inline">{entry.goal.short}</span>
    </div>
  );
}
