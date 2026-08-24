"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  PlannerPreferencesSettings,
  type PlannerPreferencesDraft,
} from "@/features/settings/planner-preferences-settings";
import { getApiErrorMessage, getJson, putJson } from "@/lib/api/client";
import { invalidatePlannerRelatedTabCaches } from "@/lib/cache/planner-tab-cache";
import { resolveUserTimezone } from "@/lib/dates/timezone";
import { normalizeWeekStartsOn } from "@/lib/dates/week-start";
import { createDefaultPlannerPolicy, type PlannerPolicy } from "@/lib/planner/policy";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface PlannerPreferencesContextPayload {
  preferences: {
    timezone: string;
    defaultPolicy: {
      weekStartsOn: number;
      restWeekdays: number[];
    };
  } | null;
}

export interface JourneyIntroPreferencesValue {
  timezone: string;
  weekStartsOn: number;
  restWeekdays: number[];
  socialActivityVisible: boolean;
}

export function createDefaultJourneyIntroPreferences(): JourneyIntroPreferencesValue {
  return {
    timezone: resolveUserTimezone(),
    weekStartsOn: 1,
    restWeekdays: [],
    socialActivityVisible: true,
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
    }).catch(() => null),
    supabase
      .from("profiles")
      .select("social_activity_visible")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  return {
    timezone: plannerContext?.preferences?.timezone || defaults.timezone,
    weekStartsOn: normalizeWeekStartsOn(
      plannerContext?.preferences?.defaultPolicy.weekStartsOn ?? defaults.weekStartsOn
    ),
    restWeekdays: [
      ...(plannerContext?.preferences?.defaultPolicy.restWeekdays ??
        defaults.restWeekdays),
    ],
    socialActivityVisible:
      profileResult.data?.social_activity_visible ?? defaults.socialActivityVisible,
  };
}

export async function saveJourneyIntroPreferences(
  userId: string,
  value: JourneyIntroPreferencesValue
) {
  const defaultPolicy: PlannerPolicy = createDefaultPlannerPolicy(
    value.timezone,
    new Date().toISOString()
  );
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
    .update({ social_activity_visible: value.socialActivityVisible })
    .eq("id", userId);
  if (error) {
    throw new Error(error.message);
  }
}

interface JourneyIntroPreferencesStepProps {
  value: JourneyIntroPreferencesValue;
  onChange: (next: JourneyIntroPreferencesValue) => void;
  loading?: boolean;
}

export function JourneyIntroPreferencesStep({
  value,
  onChange,
  loading = false,
}: JourneyIntroPreferencesStepProps) {
  const plannerDraft: PlannerPreferencesDraft = {
    timezone: value.timezone,
    weekStartsOn: value.weekStartsOn,
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set your planner defaults now. You can change these anytime under Profile.
      </p>
      <PlannerPreferencesSettings
        value={plannerDraft}
        disabled={loading}
        onChange={(next) =>
          onChange({
            ...value,
            timezone: next.timezone,
            weekStartsOn: next.weekStartsOn,
          })
        }
      />
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Account visibility</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={loading}
            aria-pressed={value.socialActivityVisible}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm",
              value.socialActivityVisible
                ? "border-primary bg-primary/10"
                : "border-border bg-background"
            )}
            onClick={() => onChange({ ...value, socialActivityVisible: true })}
          >
            <span className="font-medium">Public</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Feed, Challenges, and Leaderboards
            </span>
          </button>
          <button
            type="button"
            disabled={loading}
            aria-pressed={!value.socialActivityVisible}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm",
              !value.socialActivityVisible
                ? "border-primary bg-primary/10"
                : "border-border bg-background"
            )}
            onClick={() => onChange({ ...value, socialActivityVisible: false })}
          >
            <span className="font-medium">Private</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Community stays on Team only
            </span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          A private account can still form a private team. Public Community tabs stay
          disabled until you switch this under Profile.
        </p>
      </div>
    </div>
  );
}

export function useJourneyIntroPreferences(userId: string, active: boolean) {
  const [value, setValue] = useState<JourneyIntroPreferencesValue>(
    createDefaultJourneyIntroPreferences
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadJourneyIntroPreferences(userId)
      .then((next) => {
        if (!cancelled) {
          setValue(next);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Preferences could not be loaded.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [active, userId]);

  return { value, setValue, loading };
}
