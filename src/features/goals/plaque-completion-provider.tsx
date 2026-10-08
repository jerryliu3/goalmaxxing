"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { fetchProgressContext } from "@/lib/goals/progress-context";
import { subscribeCompletionAchievement } from "@/lib/goals/completion-presentation";
import { subscribeXpRefresh } from "@/lib/xp/events";
import { getDateInTimezone, timezoneFromPreferences } from "@/lib/dates/timezone";
import { reportError } from "@/lib/observability/report-error";
import { goalCardFields } from "./goal-card-fields";
import { createClient } from "@/lib/supabase/client";
import { EarnedCeremony, type FlightOrigin } from "@/features/ux-brand/plaque-motion/earned-ceremony";
import { buildFolioEntries, buildGoalBooks, splitPastGoals, type GoalFolio } from "@/features/insights/folio/folio-model";
import type { Goal } from "@/lib/goals/types";

type Celebration = { goal: Goal; target: number; origin: FlightOrigin; folio: GoalFolio };

/** Achievement comes from a confirmed transition, after source/parent feedback. */
export function PlaqueCompletionProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Celebration[]>([]);
  const supabase = useMemo(() => createClient(), []);
  const router = useAppRouter();
  const reducedMotion = Boolean(useReducedMotion());
  useEffect(() => {
    let mounted = true;
    let pending = Promise.resolve();
    const seen = new Set<string>();
    const undone = new Set<string>();
    const unsubscribeUndo = subscribeXpRefresh(detail => {
      if (detail?.desiredFactState !== "absent" || !detail.goalId) return;
      setQueue([]);
      for (const id of seen) undone.add(id);
      seen.clear();
    });
    const unsubscribe = subscribeCompletionAchievement(detail => {
      const earned = detail.feedback?.goals.filter(goal => goal.newlyAchieved && !seen.has(goal.goalId)) ?? [];
      if (!earned.length) return;
      for (const goal of earned) { seen.add(goal.goalId); undone.delete(goal.goalId); }
      pending = pending.then(async () => {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user || !mounted) return;
        const [result, profile] = await Promise.all([
          supabase.from("goals").select("*").eq("owner_id", auth.user.id).eq("is_deleted", false).order("id").limit(1001),
          supabase.from("profiles").select("timezone").eq("id", auth.user.id).maybeSingle(),
        ]);
        if (result.error) throw result.error;
        if (profile.error) throw profile.error;
        if (!mounted || result.data.length > 1000) return;
        const timezone = timezoneFromPreferences(profile.data?.timezone);
        const today = getDateInTimezone(new Date(), timezone);
        const progress = await fetchProgressContext({ asOfDate: today, timezone, forceRefresh: true });
        const goals = result.data as Goal[];
        const books = buildGoalBooks(splitPastGoals(buildFolioEntries(goals, progress.summaries, auth.user.id)).past, today.slice(0, 4));
        const celebrations = earned.flatMap(item => {
          const goal = goals.find(goal => goal.id === item.goalId);
          const summary = progress.summaries.find(summary => summary.goalId === item.goalId);
          const folio = books.find(book => book.entries.some(entry => entry.goal.id === item.goalId));
          if (!goal || !summary || summary.outcome !== "achieved" || !folio || undone.has(item.goalId)) return [];
          const origin = detail.sourceRect ?? { left: window.innerWidth / 2 - 80, top: window.innerHeight / 2 - 80, width: 160, height: 160 };
          return [{ goal, target: Math.max(1, summary.expectedUnitCount), origin, folio }];
        });
        setQueue(current => [...current, ...celebrations]);
      }).catch(error => reportError(error, { code: "achievement_presentation_failed" })).then(() => undefined);
    });
    return () => { mounted = false; unsubscribe(); unsubscribeUndo(); };
  }, [supabase]);
  const celebration = queue[0];
  const close = () => setQueue(current => current.slice(1));
  return <>
    {children}
    <DialogPrimitive.Root open={Boolean(celebration)} onOpenChange={open => { if (!open) close(); }}>
      {celebration ? <EarnedCeremony key={celebration.goal.id} fields={goalCardFields(celebration.goal)} target={celebration.target}
        reward={celebration.goal.reward_text ?? ""} still={reducedMotion} grand origin={celebration.origin} folio={celebration.folio}
        onClose={close} onOpenLibrary={() => { setQueue([]); router.push("/goals#past-goals"); }} /> : null}
    </DialogPrimitive.Root>
  </>;
}
