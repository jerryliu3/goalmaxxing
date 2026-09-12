"use client";

import { Button } from "@/components/ui/button";
import type { SocialChallenge } from "@/features/social/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_PUNCHES = 12;

function punchMarks(progress: number, target: number) {
  const cappedTarget = Math.min(target, MAX_VISIBLE_PUNCHES);
  const filled = Math.min(progress, cappedTarget);
  const overflow = target > MAX_VISIBLE_PUNCHES ? target - MAX_VISIBLE_PUNCHES : 0;
  return { cappedTarget, filled, overflow };
}

export function ChallengePosterTile({
  challenge,
  timeLeftLabel,
  expanded,
  joinPending,
  joinError,
  onExpand,
  onJoin,
}: {
  challenge: SocialChallenge;
  timeLeftLabel?: string | null;
  expanded: boolean;
  joinPending: boolean;
  joinError: string | null;
  onExpand: () => void;
  onJoin: () => void;
}) {
  const progress = challenge.viewerProgress ?? 0;
  const { cappedTarget, filled, overflow } = punchMarks(progress, challenge.targetValue);
  const joinDisabled = joinPending || challenge.status === "closed";

  return (
    <article
      data-testid="challenge-poster-tile"
      className="relative flex min-h-[22.5rem] w-[28rem] max-w-[calc(100%-1.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[16px] border border-border bg-card p-5 shadow-sm"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 rounded-[16px]"
        aria-expanded={expanded}
        aria-label={
          expanded ? `Collapse ${challenge.title}` : `Tap to open ${challenge.title}`
        }
        onClick={onExpand}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              {challenge.title}
            </h3>
            {timeLeftLabel ? (
              <span className="rounded-full border border-border bg-muted/70 px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground">
                {timeLeftLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-mono text-lg tracking-tight">
            {challenge.viewerJoined
              ? `${progress} / ${challenge.targetValue}`
              : "Join to track"}
          </p>
          {challenge.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Your progress punches">
          {Array.from({ length: cappedTarget }, (_, index) => (
            <span
              key={`${challenge.id}-punch-${index}`}
              aria-hidden
              className={cn(
                "size-3 rounded-full border",
                index < filled
                  ? "border-primary bg-primary"
                  : "border-border bg-background"
              )}
            />
          ))}
          {overflow > 0 ? (
            <span className="self-center font-mono text-[11px] text-muted-foreground">
              +{overflow}
            </span>
          ) : null}
        </div>

        {!challenge.viewerJoined ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Ranked people stay hidden until you join or open this tile.
          </p>
        ) : null}

        {expanded ? (
          <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <p>
              {challenge.participantCount} participant
              {challenge.participantCount === 1 ? "" : "s"}
            </p>
            <p>Tap to open</p>
          </div>
        ) : null}
      </div>

      <div className="relative z-20 mt-auto flex items-center justify-between gap-3 pt-4">
        {joinError ? <p className="text-xs text-destructive">{joinError}</p> : <span />}
        {!challenge.viewerJoined ? (
          <Button
            type="button"
            size="sm"
            disabled={joinDisabled}
            className="pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation();
              onJoin();
            }}
          >
            {joinPending ? "Saving..." : "Join challenge"}
          </Button>
        ) : expanded ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={joinDisabled}
            className="pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation();
              onJoin();
            }}
          >
            {joinPending ? "Saving..." : "Leave challenge"}
          </Button>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}
