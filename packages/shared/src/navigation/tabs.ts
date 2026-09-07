export type AppTabKey =
  | "insights"
  | "calendar"
  | "social"
  | "settings";

export type PlannerPrimaryTabPreference = "calendar" | "checklist";

export interface AppTabDefinition {
  key: AppTabKey;
  href: string;
  label: string;
}

const TAB_BY_KEY: Record<AppTabKey, AppTabDefinition> = {
  calendar: { key: "calendar", href: "/calendar", label: "Plan" },
  insights: { key: "insights", href: "/insights", label: "Progress" },
  social: { key: "social", href: "/social", label: "Community" },
  settings: { key: "settings", href: "/settings", label: "You" },
};

export const DEFAULT_PLANNER_PRIMARY_TAB_PREFERENCE: PlannerPrimaryTabPreference =
  "checklist";

export function normalizePlannerPrimaryTabPreference(
  value: string | null | undefined
): PlannerPrimaryTabPreference {
  if (value === "calendar" || value === "checklist") {
    return value;
  }
  return DEFAULT_PLANNER_PRIMARY_TAB_PREFERENCE;
}

export function isAppTabActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function buildAppTabs(
  plannerPrimaryTab: PlannerPrimaryTabPreference = DEFAULT_PLANNER_PRIMARY_TAB_PREFERENCE,
  options?: { hrefPrefix?: string }
): AppTabDefinition[] {
  void plannerPrimaryTab;
  const prefix = normalizeHrefPrefix(options?.hrefPrefix);
  const orderedKeys: AppTabKey[] = [
    "calendar",
    "insights",
    "social",
    "settings",
  ];
  return orderedKeys.map((key) => {
    const tab = TAB_BY_KEY[key];
    return prefix ? { ...tab, href: `${prefix}${tab.href}` } : tab;
  });
}

function normalizeHrefPrefix(hrefPrefix: string | undefined) {
  if (!hrefPrefix) {
    return "";
  }
  return hrefPrefix.endsWith("/") ? hrefPrefix.slice(0, -1) : hrefPrefix;
}

export const APP_TABS: AppTabDefinition[] = buildAppTabs();

export const TAB_ORDER = APP_TABS.map((tab) => tab.href);
