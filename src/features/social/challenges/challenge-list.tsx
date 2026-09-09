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
import { useDuo } from "@/features/social/duo/duo-context";
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

function challengeMetric(item: SocialChallenge) {
  if (!item.viewerJoined) {
    return "Join to track";
  }
  return `${item.viewerProgress ?? 0} / ${item.targetValue}`;
}

export function ChallengeList({
  isActive = true,
  refreshToken = 0,
  onRefreshRequested,
  hideWhenEmpty = false,
}: ChallengeListProps) {
  const { viewerLabel, state: duoState } = useDuo();
  const partner = duoState.activePartner;
  const cachedChallenges = peekSocialChallengesCache();
  const [items, setItems] = useState<SocialChallenge[]>(cachedChallenges?.items ?? []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
    const openItems = items.filter(
      (item) => item.status !== "closed" && item.status !== "archived"
    );
    const mapped = openItems.map((item) => {
      const percent =
        item.targetValue > 0
          ? Math.round(((item.viewerProgress ?? 0) / item.targetValue) * 100)
          : 0;
      const people = item.viewerJoined
        ? [
            {
              rank: 1,
              name: viewerLabel,
              you: true,
              partner: false,
              label: `${item.viewerProgress ?? 0}/${item.targetValue}`,
              percent,
            },
            ...(item.subjectKind === "team" && partner
              ? [
                  {
                    rank: 1,
                    name:
                      partner.partnerDisplayName ??
                      partner.partnerUsername ??
                      "Partner",
                    you: false,
                    partner: true,
                    label: "Team",
                    percent,
                  },
                ]
              : []),
          ]
        : [];
      return {
        key: item.id,
        title: item.title,
        titleBadge: formatTimeLeftLabel(item.endsAt) ?? undefined,
        metric: challengeMetric(item),
        detail: item.description ?? `${item.status} · target ${item.targetValue}`,
        joined: item.viewerJoined,
        closed: false,
        people,
        joinLabel: "Join challenge",
        leaveLabel: "Leave challenge",
      } satisfies CompeteTileModel;
    });
    return sortJoinedFirst(mapped);
  }, [items, partner, viewerLabel]);

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
      setExpandedId(challenge.id);
    } catch (joinError) {
      setActionError(
        joinError instanceof Error
          ? joinError.message
          : challenge.viewerJoined
            ? "Could not leave challenge."
            : "Could not join challenge."
      );
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
      <CompeteSnapRail
        label="Challenges"
      >
        {tiles.map((tile) => {
          const challenge = challengeById.get(tile.key);
          const expanded = expandedId === tile.key;
          return (
            <CompeteTile
              key={tile.key}
              tile={tile}
              span="card"
              density={competeDensity({ joined: tile.joined, expanded })}
              expanded={expanded}
              joinPending={pendingId === tile.key}
              joinError={expanded ? actionError : null}
              onExpand={() =>
                setExpandedId((current) => (current === tile.key ? null : tile.key))
              }
              onJoin={challenge ? () => void toggleJoin(challenge) : undefined}
            />
          );
        })}
      </CompeteSnapRail>
    </div>
  );
}
