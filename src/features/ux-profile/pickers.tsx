"use client";

import { Check, Lock, Pin } from "lucide-react";
import {
  PIN_LIMIT,
  showcaseItemName,
  SHOWCASE_KIND_LABEL,
  type ProfileGoalEntry,
  type ShowcaseItem,
  type ShowcaseKind,
} from "@/features/ux-profile/model";
import { ShowcaseThumb } from "@/features/ux-profile/showcase-tiles";

const KIND_ORDER: readonly ShowcaseKind[] = ["medal", "plaque", "record"];

/** The one pin control, used in pickers and on Growth objects alike. */
export function PinToggle({
  item,
  pinned,
  onToggle,
  compact = false,
}: {
  item: ShowcaseItem;
  pinned: boolean;
  onToggle: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label={`Show ${showcaseItemName(item)} on profile`}
      onClick={() => onToggle(item.id)}
      className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition ${
        pinned
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      <Pin aria-hidden className={`size-3.5 ${pinned ? "fill-current" : ""}`} />
      {compact ? null : pinned ? "On profile" : "Show on profile"}
    </button>
  );
}

export function PinCounter({ count, notice }: { count: number; notice: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-mono text-xs" aria-live="polite">
        <span className="font-semibold">{count}</span>/{PIN_LIMIT} on profile
      </p>
      {notice ? (
        <p role="status" className="text-xs font-semibold text-primary">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

export function ShowcasePicker({
  catalog,
  pins,
  notice,
  onToggle,
}: {
  catalog: readonly ShowcaseItem[];
  pins: readonly string[];
  notice: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <PinCounter count={pins.length} notice={notice} />
      {KIND_ORDER.map((kind) => (
        <section key={kind} aria-label={SHOWCASE_KIND_LABEL[kind]}>
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {SHOWCASE_KIND_LABEL[kind]}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {catalog
              .filter((item) => item.kind === kind)
              .map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2"
                >
                  <ShowcaseThumb item={item} />
                  <span className="min-w-0 flex-1 truncate text-sm">{showcaseItemName(item)}</span>
                  <PinToggle item={item} pinned={pins.includes(item.id)} onToggle={onToggle} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Current goals only (pass `currentGoals(profile, "owner")`); private ones stay locked. */
export function FeaturedGoalPicker({
  entries,
  featuredIds,
  onToggle,
}: {
  entries: readonly ProfileGoalEntry[];
  featuredIds: readonly string[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="space-y-1.5" aria-label="Featured goals">
      {entries.map(({ goal }) => {
        const featured = featuredIds.includes(goal.id);
        return (
          <li key={goal.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={goal.is_private ? false : featured}
              disabled={goal.is_private}
              onClick={() => onToggle(goal.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-left disabled:opacity-60"
            >
              <span
                aria-hidden
                className={`grid size-5 place-items-center rounded border ${
                  featured && !goal.is_private ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {goal.is_private ? <Lock className="size-3" /> : featured ? <Check className="size-3.5" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{goal.title}</span>
              {goal.is_private ? (
                <span className="text-[11px] text-muted-foreground">Private goal</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-semibold"
    >
      {label}
    </button>
  );
}
