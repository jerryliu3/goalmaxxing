"use client";

import { useEffect, useMemo, useState } from "react";
import { GoalRouteSheet } from "@/features/goals/goal-route-sheet";
import { PublicProfileView } from "@/features/social/public-profile/public-profile-view";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import { fetchPublicProfileBundle } from "@/features/social/public-profile/data";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";

export function PublicProfileSheet({
  subjectUserId,
  onClose,
  xpEnabled = true,
}: {
  subjectUserId: string;
  onClose: () => void;
  xpEnabled?: boolean;
}) {
  const selectedYear = useMemo(() => new Date().getUTCFullYear(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<PublicProfileBundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      setBundle(null);
      try {
        const response = await fetchPublicProfileBundle({
          subjectUserId,
          year: selectedYear,
        });
        if (!cancelled) {
          setBundle(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Public profile could not be loaded."
          );
          setBundle(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedYear, subjectUserId]);

  const title = useMemo(() => {
    if (bundle) {
      return resolvePublicProfileLabel(bundle.profile);
    }
    return "Profile";
  }, [bundle]);

  return (
    <GoalRouteSheet onClose={onClose} title={title} closeButtonLabel="Close profile">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      ) : error || !bundle ? (
        <p className="text-sm text-destructive">
          {error ?? "Public profile could not be loaded."}
        </p>
      ) : (
        <PublicProfileView bundle={bundle} variant="compact" xpEnabled={xpEnabled} />
      )}
    </GoalRouteSheet>
  );
}
