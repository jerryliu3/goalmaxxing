"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { TempoGoalChoices } from "@/features/goals/tempo-goal-choices";
import "@/features/goals/tempo-goal-creation.css";
import { SetupProfileCard } from "./setup-profile-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage, getJson, putJson } from "@/lib/api/client";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { buildTimezoneOptions } from "@/lib/dates/timezone-options";
import { weekStartOptions } from "@/lib/dates/weekday-options";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import { createDefaultPlannerPolicy, plannerPolicySchema, type PlannerPolicy } from "@/lib/planner/policy";
import { createClient } from "@/lib/supabase/client";

interface PlannerPreferencesContextPayload {
  preferences: {
    timezone: string;
    defaultPolicy: PlannerPolicy;
  } | null;
}

export interface JourneyIntroPreferencesValue {
  defaultPolicy: PlannerPolicy;
  timezone: string;
  weekStartsOn: number;
  restWeekdays: number[];
  socialActivityVisible: boolean;
}

export function resolveJourneyIntroSocialActivityVisible(
  value: boolean | null | undefined
): boolean {
  return value !== false;
}

export function createDefaultJourneyIntroPreferences(): JourneyIntroPreferencesValue {
  const timezone = resolveUserTimezone();
  return {
    defaultPolicy: createDefaultPlannerPolicy(timezone, new Date().toISOString()),
    timezone,
    weekStartsOn: 1,
    restWeekdays: [],
    socialActivityVisible: resolveJourneyIntroSocialActivityVisible(undefined),
  };
}

export async function loadJourneyIntroPreferences(
  userId: string
): Promise<JourneyIntroPreferencesValue> {
  const defaults = createDefaultJourneyIntroPreferences();
  const supabase = createClient();
  const scopeMonth = format(new Date(), "yyyy-MM");
  const [plannerContext, profileResult] = await Promise.all([
    getJson<PlannerPreferencesContextPayload>("/api/planner/context", {
      query: { scopeMonth },
    }),
    supabase
      .from("profiles")
      .select("social_activity_visible")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);
  return {
    defaultPolicy: plannerContext?.preferences?.defaultPolicy ? plannerPolicySchema.parse(plannerContext.preferences.defaultPolicy) : defaults.defaultPolicy,
    timezone: plannerContext?.preferences?.timezone || defaults.timezone,
    weekStartsOn: normalizeWeekStartsOn(
      plannerContext?.preferences?.defaultPolicy.weekStartsOn ?? defaults.weekStartsOn
    ),
    restWeekdays: [
      ...(plannerContext?.preferences?.defaultPolicy.restWeekdays ??
        defaults.restWeekdays),
    ],
    socialActivityVisible: resolveJourneyIntroSocialActivityVisible(
      profileResult.data?.social_activity_visible
    ),
  };
}

export async function saveJourneyIntroPreferences(
  userId: string,
  value: JourneyIntroPreferencesValue
) {
  const defaultPolicy: PlannerPolicy = { ...value.defaultPolicy, timezone: value.timezone, timezoneConfirmedAt: new Date().toISOString() };
  defaultPolicy.weekStartsOn = normalizeWeekStartsOn(value.weekStartsOn);
  defaultPolicy.restWeekdays = [...value.restWeekdays];
  await putJson("/api/planner/context", {
    timezone: value.timezone,
    defaultPolicy,
  });
  invalidatePlannerRelatedTabCaches();

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      social_activity_visible: value.socialActivityVisible,
    })
    .eq("id", userId);
  if (error) {
    throw new Error(error.message);
  }
}

interface JourneyIntroPreferencesStepProps {
  userId: string;
  value: JourneyIntroPreferencesValue;
  onChange: (next: JourneyIntroPreferencesValue) => void;
  loading?: boolean;
  saveProfileRef: { current: () => Promise<void> };
  onProfileReadyChange: (ready: boolean) => void;
}

export function JourneyIntroPreferencesStep({
  userId,
  value,
  onChange,
  loading = false,
  saveProfileRef,
  onProfileReadyChange,
}: JourneyIntroPreferencesStepProps) {
  const timezoneOptions = useMemo(
    () => buildTimezoneOptions(value.timezone),
    [value.timezone]
  );

  const profileVisible = value.socialActivityVisible !== false;
  return (
    <fieldset disabled={loading} className="min-w-0 space-y-5 border-0 p-0 disabled:opacity-60">
      <SetupProfileCard
        userId={userId}
        isPrivate={!profileVisible}
        saveRef={saveProfileRef}
        onReadyChange={onProfileReadyChange}
      />
      <div className="tempo-creation space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <label className="block min-w-0 space-y-2">
            <Label className="tempo-label">Timezone</Label>
            <Select
              value={value.timezone}
              onValueChange={(nextTimezone) => onChange({ ...value, timezone: nextTimezone })}
              disabled={loading}
            >
              <SelectTrigger className="h-11 w-full rounded-xl px-3 text-base">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {timezoneOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="space-y-2">
            <Label className="tempo-label">Profile visibility</Label>
            <div className="tempo-choices flex-nowrap" role="group" aria-label="Profile visibility" style={{ flexWrap: "nowrap" }}>
              {([
                ["Public", true],
                ["Private", false],
              ] as const).map(([label, visible]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={profileVisible === visible}
                  onClick={() => onChange({ ...value, socialActivityVisible: visible })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="tempo-label">First day of week</Label>
          <TempoGoalChoices
            label="First day of week"
            value={`${value.weekStartsOn}`}
            options={weekStartOptions.map((option) => ({ value: `${option.value}`, label: option.shortLabel }))}
            onChange={(nextValue) => onChange({
              ...value,
              weekStartsOn: normalizeWeekStartsOn(Number.parseInt(nextValue, 10)),
            })}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function useJourneyIntroPreferences(userId: string, active: boolean) {
  const [value, setValue] = useState<JourneyIntroPreferencesValue>(
    createDefaultJourneyIntroPreferences
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true); setError(null);
    void loadJourneyIntroPreferences(userId).then(next => {
      if (!cancelled) setValue(next);
    }).catch(cause => {
      if (!cancelled) setError(getApiErrorMessage(cause, "Preferences could not be loaded."));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [active, userId, revision]);
  return { value, setValue, loading, error, reload: () => setRevision(value => value + 1) };
}
