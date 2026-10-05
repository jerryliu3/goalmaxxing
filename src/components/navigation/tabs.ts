import { CalendarDays, Target, Trophy, Globe } from "lucide-react";
import type { ComponentType } from "react";

export type AppTab = {
  key: "calendar" | "goals" | "achievements" | "social";
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const APP_TABS: AppTab[] = [
  { key: "calendar", href: "/calendar", label: "Agenda", icon: CalendarDays },
  { key: "goals", href: "/goals", label: "Goals", icon: Target },
  { key: "achievements", href: "/achievements", label: "Achievements", icon: Trophy },
  { key: "social", href: "/social", label: "Community", icon: Globe },
];
export const TAB_ORDER = APP_TABS.map((tab) => tab.href);
export function buildAppTabs(options?: { hrefPrefix?: string }): AppTab[] {
  const prefix = options?.hrefPrefix?.replace(/\/$/, "") ?? "";
  return APP_TABS.map((tab) => ({ ...tab, href: `${prefix}${tab.href}` }));
}
