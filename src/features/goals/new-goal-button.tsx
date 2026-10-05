"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isDemoPathname } from "@/lib/navigation/demo-path";

export const GoalCreationActionContext = createContext<(() => void) | undefined>(undefined);

export function NewGoalButton() {
  const onCreate = useContext(GoalCreationActionContext);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefix = isDemoPathname(pathname) ? "/demo" : "";
  const search = searchParams.toString();
  const returnTo = search ? `${pathname}?${search}` : pathname;
  return <Button asChild={!onCreate} size="sm" onClick={onCreate} data-onboarding="nav.new-goal">
    {onCreate ? "New Goal +" : <Link href={`${prefix}/goals/new?returnTo=${encodeURIComponent(returnTo)}`}>New Goal +</Link>}
  </Button>;
}
