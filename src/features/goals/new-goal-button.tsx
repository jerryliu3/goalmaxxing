"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TempoGoalCard } from "./tempo-goal-card";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import { isDemoPathname } from "@/lib/navigation/demo-path";

export const GoalCreationActionContext = createContext<(() => void) | undefined>(undefined);

export function NewGoalButton({ presentation = "button" }: { presentation?: "button" | "card" }) {
  const onCreate = useContext(GoalCreationActionContext);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefix = isDemoPathname(pathname) ? "/demo" : "";
  const search = searchParams.toString();
  const returnTo = search ? `${pathname}?${search}` : pathname;
  if (presentation === "card") {
    const card = <TempoGoalCard fields={{ ...createDefaultGoalCreationFields(), title: "New Goal", target_basis: "lifetime" }}
      surface="plain" rotatable={false}
      visibility={{ category: false, rhythm: true, interval: false, count: true, schedule: false, difficulty: false }}
      renderLettering={(text, size) => size === "display" ? "00" : text} />;
    const className = "block w-full min-w-0 text-left [&_.tempo-card]:border-dashed [&_.tempo-card]:border-2 [&_.tempo-card-dates]:invisible";
    return <section className="min-w-0">
      {onCreate ? <button type="button" aria-label="New Goal" className={className} onClick={onCreate} data-onboarding="nav.new-goal">{card}</button>
        : <Link aria-label="New Goal" className={className} href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`} data-onboarding="nav.new-goal">{card}</Link>}
      <p className="mt-5 text-center font-mono text-xs text-muted-foreground">0 completions</p>
    </section>;
  }
  return <Button asChild={!onCreate} size="sm" onClick={onCreate} data-onboarding="nav.new-goal">
    {onCreate ? "New Goal +" : <Link href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`}>New Goal +</Link>}
  </Button>;
}
