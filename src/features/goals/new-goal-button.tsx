"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import "./tempo-goal-creation.css";
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
    const card = <div className="tempo-card-frame">
      <article className={styles.ghost} aria-label="New Goal card">
        <span className={styles.plus} aria-hidden="true">+</span>
        <h2>New Goal</h2>
      </article>
    </div>;
    const className = "block w-full min-w-0 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-primary";
    return <section className="min-w-0">
      {onCreate ? <button type="button" aria-label="New Goal" className={className} onClick={onCreate} data-onboarding="nav.new-goal">{card}</button>
        : <Link aria-label="New Goal" className={className} href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`} data-onboarding="nav.new-goal">{card}</Link>}
      <p className="mt-5 text-center font-mono text-xs text-muted-foreground">Click to create</p>
    </section>;
  }
  return <Button asChild={!onCreate} size="sm" onClick={onCreate} data-onboarding="nav.new-goal">
    {onCreate ? "New Goal +" : <Link href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`}>New Goal +</Link>}
  </Button>;
}
