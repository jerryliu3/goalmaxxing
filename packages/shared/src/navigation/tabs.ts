export type AppTabKey =
  | "insights"
  | "calendar"
  | "social"
  | "settings";

export interface AppTabDefinition {
  key: AppTabKey;
  href: string;
  label: string;
}

const TAB_BY_KEY: Record<AppTabKey, AppTabDefinition> = {
  calendar: { key: "calendar", href: "/calendar", label: "Plan" },
  insights: { key: "insights", href: "/insights", label: "Progress" },
  social: { key: "social", href: "/social", label: "Community" },
  settings: { key: "settings", href: "/settings", label: "Profile" },
};

export function isAppTabActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function buildAppTabs(
  options?: { hrefPrefix?: string }
): AppTabDefinition[] {
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
