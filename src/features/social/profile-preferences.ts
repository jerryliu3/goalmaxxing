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
  timezoneConfirmed: boolean;
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

export function plannerPreferencesNeedSave({
  draft,
  persisted,
}: {
  draft: { timezone: string; weekStartsOn: number };
  persisted: { timezone: string; weekStartsOn: number; timezoneConfirmed?: boolean };
}) {
  if (persisted.timezoneConfirmed !== true) {
    return true;
  }
  return (
    draft.timezone !== persisted.timezone ||
    normalizeWeekStartsOn(draft.weekStartsOn) !==
      normalizeWeekStartsOn(persisted.weekStartsOn)
  );
}

export function plannerPreferencesFromProfile(
  profile: ProfilePlannerPreferenceFields | null,
  fallback: PlannerPreferencesFromProfile
): PlannerPreferencesFromProfile {
  const pending = { ...fallback, timezoneConfirmed: false as const };
  if (!profile?.timezone?.trim()) {
    return pending;
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
      return pending;
    }
    return {
      timezone: snapshot.timezone,
      weekStartsOn: normalizeWeekStartsOn(snapshot.default_policy.weekStartsOn),
      restWeekdays: [...snapshot.default_policy.restWeekdays],
      timezoneConfirmed: true,
    };
  } catch {
    return pending;
  }
}
