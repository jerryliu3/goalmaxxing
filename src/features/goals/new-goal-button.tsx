"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isDemoPathname } from "@/lib/navigation/demo-path";

export const GoalCreationActionContext = createContext<(() => void) | undefined>(undefined);

export function NewGoalButton({ presentation = "button" }: { presentation?: "button" | "card" }) {
  const onCreate = useContext(GoalCreationActionContext);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefix = isDemoPathname(pathname) ? "/demo" : "";
  const search = searchParams.toString();
  const returnTo = search ? `${pathname}?${search}` : pathname;
  const label = presentation === "card" ? "New goal" : "New Goal +";
  return <Button asChild={!onCreate} size="sm" onClick={onCreate} data-onboarding="nav.new-goal"
    variant={presentation === "card" ? "outline" : "default"}
    className={presentation === "card" ? "h-auto min-h-64 w-full rounded-xl border-2 border-dashed bg-transparent text-base text-muted-foreground hover:bg-muted/50" : undefined}>
    {onCreate ? label : <Link href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`}>{label}</Link>}
  </Button>;
}
