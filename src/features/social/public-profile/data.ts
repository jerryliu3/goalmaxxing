import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";
import { getApiErrorMessage, getJson } from "@/lib/api/client";
import { PUBLIC_PROFILE_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import {
  loadTabDataCache,
  readTabDataCache,
} from "@/lib/cache/tab-data-cache";

const PUBLIC_PROFILE_REQUEST_TIMEOUT_MS = 15_000;

interface PublicProfileResponse {
  schemaVersion: "1";
  correlationId: string;
  item: PublicProfileBundle;
}

function buildPublicProfileCacheKey(subjectUserId: string, year?: number) {
  return `${PUBLIC_PROFILE_CACHE_PREFIX}${subjectUserId.trim()}:${year ?? "current"}`;
}

export function peekPublicProfileBundle(subjectUserId: string, year?: number) {
  return readTabDataCache<PublicProfileBundle>(buildPublicProfileCacheKey(subjectUserId, year));
}

export async function fetchPublicProfileBundle({
  subjectUserId,
  year,
  forceRefresh = false,
}: {
  subjectUserId: string;
  year?: number;
  forceRefresh?: boolean;
}) {
  const normalizedSubjectUserId = subjectUserId.trim();
  const cacheKey = buildPublicProfileCacheKey(normalizedSubjectUserId, year);
  try {
    return await loadTabDataCache(cacheKey, async () => {
      const payload = await getJson<PublicProfileResponse>(
        `/api/social/profiles/${encodeURIComponent(normalizedSubjectUserId)}`,
        {
          query: year ? { year: String(year) } : undefined,
          timeoutMs: PUBLIC_PROFILE_REQUEST_TIMEOUT_MS,
        }
      );
      return payload.item;
    }, { forceRefresh });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Public profile could not be loaded.")
    );
  }
}
