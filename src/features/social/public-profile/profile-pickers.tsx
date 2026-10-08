"use client";

import { Check, Lock, Pin } from "lucide-react";
import {
  type PublicProfileCurrentGoal,
  type PublicProfileShowcaseCatalog,
  type PublicProfileShowcaseItem,
  type PublicProfileShowcasePin,
} from "@cadence/shared/social/public-profile";
import { pinKey } from "@/features/social/public-profile/profile-draft";
import { ShowcaseThumb, showcaseItemName } from "@/features/social/public-profile/showcase-tile";
import { cn } from "@/lib/utils";

type CatalogSection = keyof PublicProfileShowcaseCatalog;

const CATALOG_SECTIONS: Record<CatalogSection, { label: string; empty: string }> = {
  medals: { label: "Medals", empty: "Level up to earn your first medal." },
  goals: { label: "Finished goals", empty: "Finish a public goal to pin it here." },
  records: { label: "Records", empty: "Records appear once you have some history." },
};

function PinToggle({
  item,
  pinned,
  onToggle,
}: {
  item: PublicProfileShowcaseItem;
  pinned: boolean;
  onToggle: (pin: PublicProfileShowcasePin) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label={`Show ${showcaseItemName(item)} on profile`}
      onClick={() => onToggle({ kind: item.kind, ref: item.ref })}
      className={cn(
        "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition",
        pinned
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      <Pin aria-hidden className={cn("size-3.5", pinned && "fill-current")} />
      {pinned ? "On profile" : "Show on profile"}
    </button>
  );
}

/** Pins one budget: the showcase (medals, goals) or the card (records). */
export function ShowcasePicker({
  catalog,
  sections,
  limit,
  pins,
  notice,
  onToggle,
}: {
  catalog: PublicProfileShowcaseCatalog;
  sections: readonly CatalogSection[];
  limit: number;
  pins: readonly PublicProfileShowcasePin[];
  notice: string | null;
  onToggle: (pin: PublicProfileShowcasePin) => void;
}) {
  const pinned = new Set(pins.map(pinKey));
  const pinnedCount = sections.reduce(
    (count, key) => count + catalog[key].filter((item) => pinned.has(pinKey(item))).length,
    0
  );
  return (
    <div className="space-y-5 px-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-figure text-xs" aria-live="polite">
          <span className="font-semibold">{pinnedCount}</span>/{limit} on profile
        </p>
        {notice ? (
          <p role="status" className="text-xs font-semibold text-primary">
            {notice}
          </p>
        ) : null}
      </div>
      {sections.map((key) => {
        const { label, empty } = CATALOG_SECTIONS[key];
        return (
          <section key={key} aria-label={label}>
            <h4 className="type-eyebrow text-[10px] text-muted-foreground">{label}</h4>
            {catalog[key].length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{empty}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {catalog[key].map((item) => (
                  <li
                    key={pinKey(item)}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2"
                  >
                    <ShowcaseThumb item={item} />
                    <span className="min-w-0 flex-1 truncate text-sm">{showcaseItemName(item)}</span>
                    <PinToggle item={item} pinned={pinned.has(pinKey(item))} onToggle={onToggle} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Every current goal; private ones stay locked and can never be featured. */
export function FeaturedGoalPicker({
  goals,
  featuredIds,
  onToggle,
}: {
  goals: readonly PublicProfileCurrentGoal[];
  featuredIds: readonly string[];
  onToggle: (goalId: string) => void;
}) {
  if (goals.length === 0) {
    return <p className="px-4 pb-6 text-sm text-muted-foreground">You have no current goals yet.</p>;
  }
  return (
    <ul className="space-y-1.5 px-4 pb-6" aria-label="Featured goals">
      {goals.map((goal) => {
        const featured = !goal.isPrivate && featuredIds.includes(goal.id);
        return (
          <li key={goal.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={featured}
              disabled={goal.isPrivate}
              onClick={() => onToggle(goal.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-left disabled:opacity-60"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-5 place-items-center rounded border",
                  featured ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}
              >
                {goal.isPrivate ? <Lock className="size-3" /> : featured ? <Check className="size-3.5" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{goal.title}</span>
              {goal.isPrivate ? <span className="text-[11px] text-muted-foreground">Private goal</span> : null}
            </button>
          </li>
          );
      })}
    </ul>
  );
}
