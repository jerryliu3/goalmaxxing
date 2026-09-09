"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]"
      >
        {children}
      </div>
    </div>
  );
}

export function CompeteTile({
  tile,
  density,
  expanded,
  span = "card",
  joinPending = false,
  joinError = null,
  onExpand,
  onJoin,
}: {
  tile: CompeteTileModel;
  density: CompeteDensity;
  expanded: boolean;
  span?: "card" | "wide";
  joinPending?: boolean;
  joinError?: string | null;
  onExpand: () => void;
  onJoin?: () => void;
}) {
  const peekPeople = tile.people.filter((row) => row.you || row.partner);
  const rows = density === "peek" ? peekPeople : tile.people;
  const wide = span === "wide";
  const joinDisabled = tile.closed || joinPending;

  function handleJoinClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (joinDisabled) {
      return;
    }
    onJoin?.();
  }

  return (
    <article
      data-testid="compete-plaque"
      className={`relative flex min-h-[22.5rem] snap-start flex-col overflow-hidden rounded-[16px] border border-border bg-card p-5 shadow-[inset_0_1px_0_color-mix(in_srgb,white_40%,transparent),0_16px_28px_-18px_color-mix(in_srgb,var(--foreground)_30%,transparent)] ${
        wide
          ? "flex-[0_0_calc(100%-2.75rem)]"
          : "w-[28rem] max-w-[calc(100%-1.5rem)] shrink-0"
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 size-24 rotate-12 rounded-[18px] border-2 border-primary/25"
      />
      <button
        type="button"
        className="absolute inset-0 z-0 rounded-[16px]"
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${tile.title}` : `Tap to open ${tile.title}`}
        onClick={onExpand}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
        <div>
          {tile.kicker ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {tile.kicker}
            </p>
          ) : null}
          <div
            className={`flex flex-wrap items-center gap-2 ${
              tile.kicker ? "mt-2" : ""
            }`}
          >
            <h3 className="font-display text-2xl font-semibold tracking-tight">
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
          {tile.metric ? (
            <p className="mt-1 font-display text-lg tracking-tight">{tile.metric}</p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">{tile.detail}</p>
        </div>

        {density === "join-only" ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Ranked people stay hidden until you join or open this tile.
          </p>
        ) : (
          <ol className="mt-5 w-full space-y-2">
            {rows.map((row) => (
              <li
                key={`${tile.key}-${row.name}-${row.rank}`}
                className={row.you ? "rounded-md bg-muted/80 px-2 py-2" : "px-2 py-1"}
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
                  <span className="shrink-0 text-muted-foreground">{row.label}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-muted shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--foreground)_16%,transparent)]">
                  <div
                    className="h-full rounded-sm bg-primary shadow-[inset_0_-2px_0_color-mix(in_srgb,black_18%,transparent)]"
                    style={{ width: `${Math.min(100, Math.max(0, row.percent))}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}

        {density === "peek" ? (
          <p className="mt-3 text-xs text-muted-foreground">Tap to open</p>
        ) : null}

        {joinError ? <p className="mt-3 text-xs text-destructive">{joinError}</p> : null}

        {onJoin && !tile.joined ? (
          <button
            type="button"
            aria-disabled={joinDisabled}
            onClick={handleJoinClick}
            className={`pointer-events-auto mt-auto min-h-10 rounded-md bg-primary text-sm font-semibold text-primary-foreground aria-disabled:opacity-40 ${
              wide ? "w-full sm:max-w-xs" : "w-full"
            }`}
          >
            {tile.closed ? "Closed" : tile.joinLabel ?? "Join"}
          </button>
        ) : onJoin && tile.joined && expanded ? (
          <button
            type="button"
            aria-disabled={joinDisabled}
            onClick={handleJoinClick}
            className="pointer-events-auto mt-auto self-start rounded-md bg-background px-2 py-1 text-xs font-medium text-destructive aria-disabled:opacity-40"
          >
            {tile.leaveLabel ?? "Leave"}
          </button>
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
