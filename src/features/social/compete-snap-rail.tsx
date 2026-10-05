"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CompeteDensity = "join-only" | "peek" | "ranks";

export type CompetePerson = {
  rank: number;
  name: string;
  you: boolean;
  partner: boolean;
  label: string;
  percent: number;
};

/**
 * What a participant has to do to finish, rendered as the tile's centrepiece.
 * Countable targets get one numbered mark each; larger ones fall back to a
 * single readout because a few hundred marks would be unreadable.
 */
export type CompeteRequirement = {
  progress: number;
  target: number;
  unitLabel: string;
};

export type CompeteTileModel = {
  key: string;
  title: string;
  titleBadge?: string;
  kicker?: string;
  metric?: string;
  detail: string;
  joined: boolean;
  closed: boolean;
  people: CompetePerson[];
  requirement?: CompeteRequirement;
  joinLabel?: string;
  leaveLabel?: string;
};

export function CompeteSnapRail({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    const node = scroller.current;
    if (!node) return;
    const child = node.querySelector("article");
    const amount = child ? child.getBoundingClientRect().width + 16 : 320;
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {label}
          </h2>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Scroll ${label} left`}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Scroll ${label} right`}
            onClick={() => scroll(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div
        ref={scroller}
        className="-mx-4 flex items-start snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
      >
        {children}
      </div>
    </div>
  );
}

export function CompeteTile({
  tile,
  density,
  expanded = false,
  span = "card",
  joinPending = false,
  joinError = null,
  rankingsLoading = false,
  rankingsError = null,
  rankingsHasMore = false,
  onExpand,
  onJoin,
  onLoadMoreRankings,
}: {
  tile: CompeteTileModel;
  density: CompeteDensity;
  expanded?: boolean;
  span?: "card" | "wide";
  joinPending?: boolean;
  joinError?: string | null;
  rankingsLoading?: boolean;
  rankingsError?: string | null;
  rankingsHasMore?: boolean;
  onExpand?: () => void;
  onJoin?: () => void;
  onLoadMoreRankings?: () => void;
}) {
  const peekPeople = tile.people.filter((row) => row.you || row.partner);
  const rows = density === "peek" ? peekPeople : tile.people;
  const wide = span === "wide";
  const joinDisabled = tile.closed || joinPending;
  const showExpandedLeaderboard = density === "ranks";
  const showRequirement = Boolean(tile.requirement) && !showExpandedLeaderboard;
  const showPeople = !showRequirement && density !== "join-only";
  const showFoot = Boolean(onJoin) || Boolean(joinError);

  function handleJoinClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (joinDisabled) {
      return;
    }
    onJoin?.();
  }

  function handleLoadMoreClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (rankingsLoading) {
      return;
    }
    onLoadMoreRankings?.();
  }

  return (
    <article
      data-testid="compete-plaque"
      className={`relative flex min-h-[16rem] snap-start flex-col overflow-hidden rounded-[14px] border border-border bg-card p-5 shadow-[inset_0_1px_0_color-mix(in_srgb,white_40%,transparent),0_12px_22px_-16px_color-mix(in_srgb,var(--foreground)_30%,transparent)] ${
        wide
          ? "flex-[0_0_calc(100%-2.75rem)] md:flex-[0_0_min(calc(100%-2.75rem),34rem)]"
          : "w-[21rem] max-w-[calc(100%-1.5rem)] shrink-0"
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 size-24 rotate-12 rounded-[18px] border-2 border-primary/25"
      />
      {onExpand ? (
        <button
          type="button"
          className="absolute inset-0 z-0 rounded-[16px]"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Show progress for ${tile.title}`
              : `Show rankings for ${tile.title}`
          }
          onClick={onExpand}
        />
      ) : null}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
        <div>
          {tile.kicker ? <p className={EYEBROW_CLASS}>{tile.kicker}</p> : null}
          <div
            className={`flex flex-wrap items-center gap-2 ${
              tile.kicker ? "mt-2" : ""
            }`}
          >
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {tile.title}
            </h3>
            {tile.titleBadge ? (
              <span
                className="rounded-full border border-border bg-muted/70 px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground"
              >
                {tile.titleBadge}
              </span>
            ) : null}
          </div>
          {tile.metric && !showExpandedLeaderboard && !showRequirement ? (
            <p className="mt-1 font-mono text-lg tracking-tight">{tile.metric}</p>
          ) : null}
          {!showExpandedLeaderboard ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {tile.detail}
            </p>
          ) : (
            <p className={`mt-3 ${EYEBROW_CLASS}`}>Challenge standings</p>
          )}
        </div>

        {showRequirement && tile.requirement ? (
          <CompeteRequirementFace
            requirement={tile.requirement}
            joined={tile.joined}
          />
        ) : null}

        {density === "join-only" && !showRequirement ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ranked people stay hidden until you join or open this tile.
          </p>
        ) : showPeople ? (
          <div
            className={`pointer-events-auto mt-3 w-full ${
              showExpandedLeaderboard
                ? "max-h-56 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"
                : ""
            }`}
          >
            {rankingsError ? (
              <p className="text-sm text-destructive">{rankingsError}</p>
            ) : rows.length > 0 ? (
              <ol className="space-y-2">
                {rows.map((row) => (
                  <li
                    key={`${tile.key}-${row.name}-${row.rank}`}
                    className={
                      row.you ? "rounded-md bg-muted/80 px-2 py-2" : "px-2 py-1"
                    }
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        {density === "ranks" ? (
                          <span
                            aria-hidden
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] border-2 border-primary font-display text-sm font-semibold text-primary [transform:rotate(-8deg)]"
                          >
                            {row.rank}
                          </span>
                        ) : null}
                        <span className="truncate">
                          {row.name}
                          {row.you ? " · you" : row.partner ? " · team" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {row.label}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-muted shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--foreground)_16%,transparent)]">
                      <div
                        className="h-full rounded-sm bg-primary shadow-[inset_0_-2px_0_color-mix(in_srgb,black_18%,transparent)]"
                        style={{
                          width: `${Math.min(100, Math.max(0, row.percent))}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : rankingsLoading ? (
              <p className="text-sm text-muted-foreground">Loading standings…</p>
            ) : (
              <p className="text-sm text-muted-foreground">No standings yet.</p>
            )}
            {rankingsHasMore ? (
              <button
                type="button"
                onClick={handleLoadMoreClick}
                aria-disabled={rankingsLoading}
                className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold aria-disabled:opacity-40"
              >
                {rankingsLoading ? "Loading…" : "Show more participants"}
              </button>
            ) : null}
          </div>
        ) : null}

        {density === "peek" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Tap card to view rankings
          </p>
        ) : null}

        {showFoot ? (
          <div className={`mt-auto pt-5 ${wide ? "sm:max-w-xs" : ""}`}>
            {joinError ? (
              <p className="mb-2 text-xs text-destructive">{joinError}</p>
            ) : null}
            {onJoin && !tile.joined ? (
              <button
                type="button"
                aria-disabled={joinDisabled}
                onClick={handleJoinClick}
                className="pointer-events-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_0_color-mix(in_srgb,white_28%,transparent)] aria-disabled:opacity-40"
              >
                {tile.closed ? "Closed" : tile.joinLabel ?? "Join"}
                {tile.closed ? null : <ArrowRight aria-hidden className="size-4" />}
              </button>
            ) : onJoin && tile.joined ? (
              <button
                type="button"
                aria-disabled={joinDisabled}
                onClick={handleJoinClick}
                className="pointer-events-auto flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted-foreground aria-disabled:opacity-40"
              >
                {tile.leaveLabel ?? "Leave"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </div>
    </article>
  );
}

export function competeDensity({
  joined,
  expanded,
}: {
  joined: boolean;
  expanded: boolean;
}): CompeteDensity {
  if (!joined && !expanded) {
    return "join-only";
  }
  if (expanded) {
    return "ranks";
  }
  return "peek";
}

export function sortJoinedFirst<T extends { joined: boolean }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => Number(b.joined) - Number(a.joined));
}

/**
 * Two rows of five. Tiles in the rail share the tallest tile's height, so a
 * taller mark grid would leave every other tile with a large empty gap above
 * its button. Two rows is also close to the height of the readout below, which
 * keeps mixed rails even.
 */
const MAX_NUMBERED_MARKS = 10;

const EYEBROW_CLASS =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

function CompeteRequirementFace({
  requirement,
  joined,
}: {
  requirement: CompeteRequirement;
  joined: boolean;
}) {
  const target = Math.max(0, Math.round(requirement.target));
  const done = joined
    ? Math.max(0, Math.min(Math.round(requirement.progress), target))
    : 0;
  const eyebrow = joined ? "Your progress" : "What you’ll need to do";

  if (target > 0 && target <= MAX_NUMBERED_MARKS) {
    return (
      <div className="mt-4">
        <p className={EYEBROW_CLASS}>{eyebrow}</p>
        {/* One graphic, not a list: reading out "01, 02, 03..." helps nobody. */}
        <div
          role="img"
          aria-label={`${done} of ${target} ${requirement.unitLabel} complete`}
          data-testid="requirement-marks"
          className="mt-2.5 grid max-w-[20rem] grid-cols-5 gap-2"
        >
          {Array.from({ length: target }, (_, index) => {
            const complete = index < done;
            return (
              <span
                key={`mark-${index}`}
                data-testid="requirement-mark"
                className={`grid aspect-square place-items-center rounded-full font-display text-sm font-semibold tabular-nums ${
                  complete
                    ? "border-2 border-primary bg-primary text-primary-foreground"
                    : "border-2 border-dashed border-border text-muted-foreground"
                }`}
              >
                {complete ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
            );
          })}
        </div>
        {joined ? (
          <p className="mt-2.5 text-xs text-muted-foreground">
            {done} of {target} {requirement.unitLabel}
          </p>
        ) : null}
      </div>
    );
  }

  const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const remaining = Math.max(0, target - done);
  return (
    <div className="mt-4">
      <p className={EYEBROW_CLASS}>{eyebrow}</p>
      <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight tabular-nums">
        {done.toLocaleString()}
        <span className="text-lg font-medium text-muted-foreground">
          {" / "}
          {target.toLocaleString()} {requirement.unitLabel}
        </span>
      </p>
      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--foreground)_16%,transparent)]">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {remaining > 0
          ? `${remaining.toLocaleString()} ${requirement.unitLabel} to go`
          : "Target reached"}
      </p>
    </div>
  );
}
