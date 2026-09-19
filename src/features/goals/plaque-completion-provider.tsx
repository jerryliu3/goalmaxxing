"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { fetchProgressContext } from "@/lib/goals/progress-context";
import { artificialCadenceAssemblyTarget } from "./card-material/cadence-assembly-target";
import { goalCardFields } from "./goal-card-fields";
import { createClient } from "@/lib/supabase/client";
import { subscribeXpRefresh, type XpRefreshRequestDetail } from "@/lib/xp/events";
import { EarnedCeremony, type FlightOrigin } from "@/features/ux-brand/plaque-motion/earned-ceremony";
import { clampPlaqueTarget } from "./card-material/creation-plaque-target";
import type { Goal } from "@/lib/goals/types";

type Celebration = { goal: Goal; target: number; origin: FlightOrigin };

function targetForGoal(goal: Goal, expected: number) {
  if (goal.frequency_type === "fixed_milestones" || goal.target_basis === "lifetime") {
    return Math.max(1, expected);
  }
  return clampPlaqueTarget(goal.plaque_target ?? artificialCadenceAssemblyTarget(goal) ?? 1);
}

/** Mount once in AppShell; completion state remains owned by the domain/API. */
export function PlaqueCompletionProvider({ children }: { children: ReactNode }) {
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const reducedMotion = Boolean(useReducedMotion());
  useEffect(() => subscribeXpRefresh((detail?: XpRefreshRequestDetail) => {
    const goalId = detail?.goalId;
    if (!goalId || detail?.desiredFactState !== "present") return;
    const key = `goalmaxxing:plaque-celebrated:${goalId}`;
    if (sessionStorage.getItem(key)) return;
    void (async () => {
      const [{ data: goal }, progress] = await Promise.all([
        supabase.from("goals").select("*").eq("id", goalId).maybeSingle(),
        fetchProgressContext({ asOfDate: new Date().toISOString().slice(0, 10), forceRefresh: true }),
      ]);
      const typedGoal = goal as Goal | null;
      const summary = progress.summaries.find(item => item.goalId === goalId);
      if (!typedGoal || !summary || summary.outcome !== "achieved") return;
      sessionStorage.setItem(key, "1");
      const rect = detail.sourceRect ?? { left: window.innerWidth / 2 - 160, top: window.innerHeight / 2 - 160, width: 320, height: 320 };
      setCelebration({ goal: typedGoal, target: targetForGoal(typedGoal, summary.expectedUnitCount), origin: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } });
    })();
  }), [supabase]);
  const close = () => setCelebration(null);
  return <>
    {children}
    <DialogPrimitive.Root open={Boolean(celebration)} onOpenChange={open => { if (!open) close(); }}>
      {celebration ? <EarnedCeremony fields={goalCardFields(celebration.goal)} target={celebration.target}
        reward={celebration.goal.reward_text ?? ""} still={reducedMotion} grand origin={celebration.origin} onClose={close} /> : null}
    </DialogPrimitive.Root>
  </>;
}
