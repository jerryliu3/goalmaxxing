"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CompeteSnapRail,
  CompeteTile,
  competeDensity,
  sortJoinedFirst,
  type CompeteTileModel,
} from "@/features/social/compete-snap-rail";
import { SocialFreshnessIndicator } from "@/features/social/social-freshness-indicator";
import {
  challengeUnitLabel,
  describeChallengeTarget,
} from "@/features/social/challenges/challenge-metric-copy";
import {
  fetchSocialChallenges,
  joinSocialChallenge,
  leaveSocialChallenge,
  peekSocialChallengesCache,
} from "@/features/social/data";
import type { SocialChallenge } from "@/features/social/types";
import { formatTimeLeftLabel } from "@/lib/social/time-left-label";

interface ChallengeListProps {
  isActive?: boolean;
  refreshToken?: number;
  onRefreshRequested?: () => void;
  hideWhenEmpty?: boolean;
}

export function ChallengeList({
  isActive = true,
  refreshToken = 0,
  onRefreshRequested,
  hideWhenEmpty = false,
}: ChallengeListProps) {
  const cachedChallenges = peekSocialChallengesCache();
  const [items, setItems] = useState<SocialChallenge[]>(cachedChallenges?.items ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{
    challengeId: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedChallenges);
  const [error, setError] = useState<string | null>(null);
  const hasPaintedChallengesRef = useRef(Boolean(cachedChallenges));

  const loadChallenges = useCallback(async () => {
    if (!hasPaintedChallengesRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await fetchSocialChallenges();
      hasPaintedChallengesRef.current = true;
      setItems(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load challenges.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadChallenges();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isActive, loadChallenges, refreshToken]);

  const tiles = useMemo<CompeteTileModel[]>(() => {
    // Mirrors the leave window in `leave_challenge_service`: a challenge whose
    // window has elapsed keeps an 'active' status until the refresh cron runs,
    // and offering Leave on one of those only produces a failed request.
    const now = Date.now();
    const openItems = items.filter(
      (item) =>
        item.status !== "closed" &&
        item.status !== "archived" &&
        new Date(item.endsAt).getTime() > now
    );
    const mapped = openItems.map(
      (item) =>
        ({
          key: item.id,
          title: item.title,
          titleBadge: formatTimeLeftLabel(item.endsAt) ?? undefined,
          kicker:
            item.rewardXp > 0
              ? `${item.rewardXp.toLocaleString()} XP reward`
              : undefined,
          detail:
            item.description ??
            describeChallengeTarget(
              item.metric,
              item.metricTrackKey,
              item.targetValue
            ),
          joined: item.viewerJoined,
          closed: false,
          people: [],
          requirement: {
            progress: item.viewerProgress ?? 0,
            target: item.targetValue,
            unitLabel: challengeUnitLabel(item.metric, item.metricTrackKey),
          },
          joinLabel: "Join challenge",
          leaveLabel: "Leave challenge",
        }) satisfies CompeteTileModel
    );
    return sortJoinedFirst(mapped);
  }, [items]);

  const challengeById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  );

  async function toggleJoin(challenge: SocialChallenge) {
    setPendingId(challenge.id);
    setActionError(null);
    try {
      if (challenge.viewerJoined) {
        await leaveSocialChallenge(challenge.id);
      } else {
        await joinSocialChallenge(challenge.id);
      }
      await loadChallenges();
    } catch (joinError) {
      setActionError({
        challengeId: challenge.id,
        message:
          joinError instanceof Error
            ? joinError.message
            : challenge.viewerJoined
              ? "Could not leave challenge."
              : "Could not join challenge.",
      });
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading && items.length === 0) {
    if (hideWhenEmpty) {
      return null;
    }
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <SocialFreshnessIndicator
            refreshToken={refreshToken}
            onRefreshRequested={onRefreshRequested}
          />
          <CardTitle>Challenges</CardTitle>
          <CardDescription>Loading challenge roster...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <SocialFreshnessIndicator
            refreshToken={refreshToken}
            onRefreshRequested={onRefreshRequested}
          />
          <CardTitle>Challenges</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (tiles.length === 0) {
    if (hideWhenEmpty) {
      return null;
    }
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <SocialFreshnessIndicator
            refreshToken={refreshToken}
            onRefreshRequested={onRefreshRequested}
          />
          <CardTitle>Challenges</CardTitle>
          <CardDescription>New challenges will appear here when published.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-1">
        <SocialFreshnessIndicator
          refreshToken={refreshToken}
          onRefreshRequested={onRefreshRequested}
        />
      </div>
      <CompeteSnapRail label="Challenges">
        {tiles.map((tile) => {
          const challenge = challengeById.get(tile.key);
          return (
            <CompeteTile
              key={tile.key}
              tile={tile}
              span="card"
              density={competeDensity({ joined: tile.joined, expanded: false })}
              joinPending={pendingId === tile.key}
              joinError={
                actionError?.challengeId === tile.key ? actionError.message : null
              }
              onJoin={challenge ? () => void toggleJoin(challenge) : undefined}
            />
          );
        })}
      </CompeteSnapRail>
    </div>
  );
}
