import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import {
  parsePlannerProfilePreferencesRow,
  resolvePlannerPreferencesSnapshot,
} from "@/lib/planner/preferences-snapshot";

export interface ProfilePlannerPreferenceFields {
  timezone?: string | null;
  timezone_confirmed_at?: string | null;
  week_starts_on?: number | null;
  rest_weekdays?: number[] | null;
}

export interface PlannerPreferencesFromProfile {
  timezone: string;
  weekStartsOn: number;
  restWeekdays: number[];
}

export function buildProfilePreferencesUpdate({
  socialActivityVisibleDirty,
  socialActivityVisible,
}: {
  socialActivityVisibleDirty: boolean;
  socialActivityVisible: boolean;
}) {
  if (!socialActivityVisibleDirty) {
    return null;
  }

  return {
    social_activity_visible: socialActivityVisible,
  };
}

export function plannerPreferencesFromProfile(
  profile: ProfilePlannerPreferenceFields | null,
  fallback: PlannerPreferencesFromProfile
): PlannerPreferencesFromProfile {
  if (!profile?.timezone?.trim()) {
    return fallback;
  }

  try {
    const snapshot = resolvePlannerPreferencesSnapshot({
      profile: parsePlannerProfilePreferencesRow({
        timezone: profile.timezone,
        timezone_confirmed_at: profile.timezone_confirmed_at ?? null,
        week_starts_on: profile.week_starts_on ?? null,
        rest_weekdays: profile.rest_weekdays ?? null,
      }),
    });
    if (!snapshot) {
      return fallback;
    }
    return {
      timezone: snapshot.timezone,
      weekStartsOn: normalizeWeekStartsOn(snapshot.default_policy.weekStartsOn),
      restWeekdays: [...snapshot.default_policy.restWeekdays],
    };
  } catch {
    return fallback;
  }
}
