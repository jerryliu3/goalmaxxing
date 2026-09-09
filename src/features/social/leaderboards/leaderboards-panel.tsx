"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CompeteSnapRail,
  CompeteTile,
  competeDensity,
  type CompetePerson,
  type CompeteTileModel,
} from "@/features/social/compete-snap-rail";
import { SocialFreshnessIndicator } from "@/features/social/social-freshness-indicator";
import { useDuo } from "@/features/social/duo/duo-context";
import {
  fetchSocialLeaderboards,
  fetchSocialLeaderboardStandings,
  peekSocialLeaderboardsCache,
} from "@/features/social/data";
import type { LeaderboardSeason, LeaderboardStanding } from "@/features/social/types";
import { describeSeasonMetric } from "@/features/social/leaderboards/season-metric-copy";
import { formatTimeLeftLabel } from "@/lib/social/time-left-label";

interface StandingsState {
  season: LeaderboardSeason;
  standings: LeaderboardStanding[];
  viewerRank: number | null;
}

interface LeaderboardsPanelProps {
  isActive?: boolean;
  refreshToken?: number;
  onRefreshRequested?: () => void;
}

function liveSeasons(seasons: LeaderboardSeason[]) {
  const rank = (status: LeaderboardSeason["status"]) =>
    status === "open" ? 0 : 1;
  return seasons
    .filter((season) => season.status !== "closed")
    .sort((a, b) => rank(a.status) - rank(b.status));
}

export function LeaderboardsPanel({
  isActive = true,
  refreshToken = 0,
  onRefreshRequested,
}: LeaderboardsPanelProps) {
  const { viewerUserId, state: duoState } = useDuo();
  const partnerId = duoState.activePartner?.partnerId ?? null;
  const cachedLeaderboards = peekSocialLeaderboardsCache();
  const [seasons, setSeasons] = useState<LeaderboardSeason[]>(
    liveSeasons(cachedLeaderboards?.items ?? [])
  );
  const [standingsBySeason, setStandingsBySeason] = useState<
    Record<string, StandingsState>
  >({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedLeaderboards);
  const hasPaintedLeaderboardsRef = useRef(Boolean(cachedLeaderboards));

  const loadSeasons = useCallback(async () => {
    setError(null);
    if (!hasPaintedLeaderboardsRef.current) {
      setIsLoading(true);
    }
    try {
      const response = await fetchSocialLeaderboards();
      hasPaintedLeaderboardsRef.current = true;
      const nextSeasons = liveSeasons(response.items);
      setSeasons(nextSeasons);
      const standingsEntries = await Promise.all(
        nextSeasons.map(async (season) => {
          const standing = await fetchSocialLeaderboardStandings(season.id);
          return [
            season.id,
            {
              season: standing.season,
              standings: standing.standings,
              viewerRank: standing.viewerRank,
            } satisfies StandingsState,
          ] as const;
        })
      );
      setStandingsBySeason(Object.fromEntries(standingsEntries));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load leaderboards.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadSeasons();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isActive, loadSeasons, refreshToken]);

  const tiles = useMemo<CompeteTileModel[]>(() => {
    return seasons.map((season) => {
      const standing = standingsBySeason[season.id];
      const leader = standing?.standings[0]?.score ?? 1;
      const people: CompetePerson[] = (standing?.standings ?? []).map((row) => ({
        rank: row.rank,
        name: row.displayName,
        you: row.subjectId === viewerUserId,
        partner: Boolean(partnerId) && row.subjectId === partnerId,
        label: String(row.score),
        percent: Math.round((row.score / Math.max(leader, 1)) * 100),
      }));
      return {
        key: season.id,
        title: season.title,
        titleBadge: formatTimeLeftLabel(season.endsAt) ?? undefined,
        detail: describeSeasonMetric(season.metric, season.metricTrackKey),
        joined: true,
        closed: false,
        people,
      } satisfies CompeteTileModel;
    });
  }, [partnerId, seasons, standingsBySeason, viewerUserId]);

  if (isLoading && seasons.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <SocialFreshnessIndicator
            refreshToken={refreshToken}
            onRefreshRequested={onRefreshRequested}
          />
          <CardTitle>Leaderboards</CardTitle>
          <CardDescription>Loading leaderboard seasons...</CardDescription>
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
          <CardTitle>Leaderboards</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (tiles.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-2">
          <SocialFreshnessIndicator
            refreshToken={refreshToken}
            onRefreshRequested={onRefreshRequested}
          />
          <CardTitle>Leaderboards</CardTitle>
          <CardDescription>Leaderboard seasons will appear once admins publish one.</CardDescription>
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
      <CompeteSnapRail
        label="Leaderboards"
      >
        {tiles.map((tile) => {
          const expanded = expandedId === tile.key;
          return (
            <CompeteTile
              key={tile.key}
              tile={tile}
              span="wide"
              density={competeDensity({ joined: tile.joined, expanded })}
              expanded={expanded}
              onExpand={() =>
                setExpandedId((current) => (current === tile.key ? null : tile.key))
              }
            />
          );
        })}
      </CompeteSnapRail>
    </div>
  );
}
