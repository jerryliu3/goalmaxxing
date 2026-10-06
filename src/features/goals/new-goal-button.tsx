"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TempoGoalCard } from "./tempo-goal-card";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
import styles from "./new-goal-button.module.css";
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
    const card = <div className={styles.ghost}>
      <TempoGoalCard fields={{ ...createDefaultGoalCreationFields(), title: "New Goal" }}
        surface="plain" rotatable={false}
        visibility={{ category: false, rhythm: false, count: false, schedule: false, difficulty: false }}
        renderLettering={(text, size) => size === "display" ? <span aria-hidden="true">+</span> : text} />
    </div>;
    const className = "block w-full min-w-0 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-primary";
    return <section className="min-w-0">
      {onCreate ? <button type="button" aria-label="New Goal" className={className} onClick={onCreate} data-onboarding="nav.new-goal">{card}</button>
        : <Link aria-label="New Goal" className={className} href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`} data-onboarding="nav.new-goal">{card}</Link>}
    </section>;
  }
  return <Button asChild={!onCreate} size="sm" onClick={onCreate} data-onboarding="nav.new-goal">
    {onCreate ? "New Goal +" : <Link href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`}>New Goal +</Link>}
  </Button>;
}
