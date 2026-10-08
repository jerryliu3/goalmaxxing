"use client";

import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import type { PublicProfileShowcaseItem } from "@cadence/shared/social/public-profile";
import { MedalMark } from "@/features/achievements/medals";
import { cardFinish } from "@/features/achievements/prism/materials";
import { PrismMedal } from "@/features/achievements/prism/prism-medal";
import { cn } from "@/lib/utils";

export type ShowcaseTileSize = "full" | "compact";

export function showcaseItemName(item: PublicProfileShowcaseItem) {
  if (item.kind === "medal") return item.title ?? `Level ${item.level}`;
  if (item.kind === "record") return item.label;
  return item.title;
}

function formatShowcaseDate(value: string | null) {
  return value ? format(parseISO(value.slice(0, 10)), "MMM d, yyyy") : null;
}

function TileFrame({
  label,
  size,
  children,
}: {
  label: string;
  size: ShowcaseTileSize;
  children: ReactNode;
}) {
  return (
    <article
      aria-label={label}
      className={cn(
        "flex h-full flex-col items-center rounded-[14px] border border-border/80 bg-card text-center",
        size === "full" ? "gap-2 px-3 pb-4 pt-5" : "gap-1 px-2 pb-2.5 pt-3"
      )}
    >
      {children}
    </article>
  );
}

/** One pinned item: a level medal, a finished goal, or a personal record. */
export function ShowcaseTile({
  item,
  size = "full",
}: {
  item: PublicProfileShowcaseItem;
  size?: ShowcaseTileSize;
}) {
  const full = size === "full";
  const name = showcaseItemName(item);

  if (item.kind === "record") {
    return (
      <TileFrame label={name} size={size}>
        <p className="type-eyebrow text-[9px] text-primary">{item.label}</p>
        <p className={cn("type-figure tracking-tight", full ? "mt-2 text-4xl" : "text-2xl")}>
          {item.value}
        </p>
        {full ? <p className="text-xs text-muted-foreground">{item.hint}</p> : null}
      </TileFrame>
    );
  }

  const date = formatShowcaseDate(item.kind === "medal" ? item.unlockedAt : item.achievedOn);
  return (
    <TileFrame label={name} size={size}>
      {item.kind === "medal" ? (
        <MedalMark level={item.level} size={full ? 76 : 44} />
      ) : (
        <PrismMedal finish={cardFinish(item.material, item.color)} numeral="✓" goal size={full ? 76 : 44} />
      )}
      <p className={cn("type-title leading-tight", full ? "text-base" : "text-xs")}>{name}</p>
      {full && item.kind === "goal" && item.rewardText ? (
        <p className="text-xs text-muted-foreground">Reward · {item.rewardText}</p>
      ) : null}
      {full && date ? <p className="type-figure text-[11px] text-muted-foreground">{date}</p> : null}
    </TileFrame>
  );
}

export function EmptyPinSlot({ size = "full", hint }: { size?: ShowcaseTileSize; hint: string }) {
  return (
    <div
      className={cn(
        "grid h-full place-items-center rounded-[14px] border border-dashed border-border text-center text-xs text-muted-foreground",
        size === "full" ? "min-h-36 p-4" : "min-h-20 p-2"
      )}
    >
      {hint}
    </div>
  );
}

/** Small left-side mark used in picker rows. */
export function ShowcaseThumb({ item }: { item: PublicProfileShowcaseItem }) {
  if (item.kind === "medal") {
    return <MedalMark level={item.level} size={36} />;
  }
  if (item.kind === "goal") {
    return <PrismMedal finish={cardFinish(item.material, item.color)} numeral="✓" goal size={36} />;
  }
  return (
    <span className="grid size-9 place-items-center rounded-md bg-muted type-figure text-xs text-primary">
      {item.value}
    </span>
  );
}
