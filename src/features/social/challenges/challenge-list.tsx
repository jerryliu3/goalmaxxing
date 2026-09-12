"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompeteSnapRail } from "@/features/social/compete-snap-rail";
import { ChallengePosterTile } from "@/features/social/challenges/challenge-poster-tile";
import { SocialFreshnessIndicator } from "@/features/social/social-freshness-indicator";
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

  const openItems = useMemo(
    () => items.filter((item) => item.status !== "closed" && item.status !== "archived"),
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

  if (openItems.length === 0) {
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
        {openItems.map((challenge) => {
          const expanded = expandedId === challenge.id;
          return (
            <ChallengePosterTile
              key={challenge.id}
              challenge={challenge}
              timeLeftLabel={formatTimeLeftLabel(challenge.endsAt)}
              expanded={expanded}
              joinPending={pendingId === challenge.id}
              joinError={expanded ? actionError : null}
              onExpand={() =>
                setExpandedId((current) => (current === challenge.id ? null : challenge.id))
              }
              onJoin={() => void toggleJoin(challenge)}
            />
          );
        })}
      </CompeteSnapRail>
    </div>
  );
}
