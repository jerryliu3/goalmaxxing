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
  fetchSocialChallengeStandings,
  joinSocialChallenge,
  leaveSocialChallenge,
  peekSocialChallengesCache,
} from "@/features/social/data";
import type {
  ChallengeStanding,
  SocialChallenge,
} from "@/features/social/types";
import { formatTimeLeftLabel } from "@/lib/social/time-left-label";

const STANDINGS_PAGE_SIZE = 50;

interface ChallengeStandingsState {
  standings: ChallengeStanding[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [standingsByChallenge, setStandingsByChallenge] = useState<
    Record<string, ChallengeStandingsState>
  >({});
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

  const loadStandings = useCallback(
    async (challengeId: string, offset = 0) => {
      setStandingsByChallenge((current) => ({
        ...current,
        [challengeId]: {
          standings:
            offset > 0 ? current[challengeId]?.standings ?? [] : [],
          totalCount: current[challengeId]?.totalCount ?? 0,
          isLoading: true,
          error: null,
        },
      }));
      try {
        const response = await fetchSocialChallengeStandings(challengeId, {
          limit: STANDINGS_PAGE_SIZE,
          offset,
        });
        setStandingsByChallenge((current) => ({
          ...current,
          [challengeId]: {
            standings:
              offset > 0
                ? [
                    ...(current[challengeId]?.standings ?? []),
                    ...response.standings,
                  ]
                : response.standings,
            totalCount: response.totalCount,
            isLoading: false,
            error: null,
          },
        }));
      } catch (standingsError) {
        setStandingsByChallenge((current) => ({
          ...current,
          [challengeId]: {
            standings: current[challengeId]?.standings ?? [],
            totalCount: current[challengeId]?.totalCount ?? 0,
            isLoading: false,
            error:
              standingsError instanceof Error
                ? standingsError.message
                : "Could not load challenge standings.",
          },
        }));
      }
    },
    []
  );

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
    const mapped = openItems.map((item) => {
      const unitLabel = challengeUnitLabel(item.metric, item.metricTrackKey);
      const standings = standingsByChallenge[item.id]?.standings ?? [];
      return {
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
          people: standings.map((standing) => ({
            rank: standing.rank,
            name: standing.displayName,
            you: standing.isViewer,
            partner: false,
            label: `${standing.score.toLocaleString()}/${item.targetValue.toLocaleString()} ${unitLabel}`,
            percent:
              item.targetValue > 0
                ? Math.round((standing.score / item.targetValue) * 100)
                : 0,
          })),
          requirement: {
            progress: item.viewerProgress ?? 0,
            target: item.targetValue,
            unitLabel,
          },
          joinLabel: "Join challenge",
          leaveLabel: "Leave challenge",
        } satisfies CompeteTileModel;
    });
    return sortJoinedFirst(mapped);
  }, [items, standingsByChallenge]);

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
        setExpandedId((current) =>
          current === challenge.id ? null : current
        );
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
          const expanded = expandedId === tile.key;
          const standingsState = standingsByChallenge[tile.key];
          return (
            <CompeteTile
              key={tile.key}
              tile={tile}
              span="card"
              density={competeDensity({ joined: tile.joined, expanded })}
              expanded={expanded}
              joinPending={pendingId === tile.key}
              joinError={
                actionError?.challengeId === tile.key ? actionError.message : null
              }
              rankingsLoading={standingsState?.isLoading}
              rankingsError={standingsState?.error}
              rankingsHasMore={
                Boolean(standingsState) &&
                standingsState.standings.length < standingsState.totalCount
              }
              onExpand={
                tile.joined
                  ? () => {
                      const opening = expandedId !== tile.key;
                      setExpandedId(opening ? tile.key : null);
                      if (opening) {
                        void loadStandings(tile.key);
                      }
                    }
                  : undefined
              }
              onLoadMoreRankings={
                standingsState &&
                standingsState.standings.length < standingsState.totalCount
                  ? () =>
                      void loadStandings(
                        tile.key,
                        standingsState.standings.length
                      )
                  : undefined
              }
              onJoin={challenge ? () => void toggleJoin(challenge) : undefined}
            />
          );
        })}
      </CompeteSnapRail>
    </div>
  );
}
