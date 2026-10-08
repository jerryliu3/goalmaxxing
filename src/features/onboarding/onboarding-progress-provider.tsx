"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getApiErrorMessage, getJson, postJson } from "@/lib/api/client";
import { onboardingProgressSchema, type OnboardingAction, type OnboardingProgress } from "@/lib/onboarding/progress";

interface OnboardingProgressContextValue {
  progress: OnboardingProgress | null;
  error: string | null;
  loading: boolean;
  save: (action: OnboardingAction) => Promise<OnboardingProgress>;
  reload: () => void;
}
const Context = createContext<OnboardingProgressContextValue | null>(null);
export function useOnboardingProgress() { return useContext(Context); }

function AccountProgress({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void getJson<{ progress: unknown }>("/api/onboarding").then(result => {
      if (active) { setProgress(onboardingProgressSchema.parse(result.progress)); setError(null); }
    }).catch(cause => {
      if (active) setError(getApiErrorMessage(cause, "Getting started could not be loaded."));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const save = useCallback(async (action: OnboardingAction) => {
    const result = await postJson<{ progress: unknown }>("/api/onboarding", action);
    const next = onboardingProgressSchema.parse(result.progress);
    setProgress(next);
    return next;
  }, []);
  return <Context.Provider value={{ progress, error, loading, save, reload }}>{children}</Context.Provider>;
}

export function OnboardingProgressProvider({ userId, enabled, children }: { userId: string; enabled: boolean; children: ReactNode }) {
  return enabled ? <AccountProgress key={userId}>{children}</AccountProgress> : children;
}
