export const SOCIAL_SURFACE_TABS = [
  "feed",
  "challenges",
  "leaderboards",
  "team",
] as const;

export type SocialSurfaceTab = (typeof SOCIAL_SURFACE_TABS)[number];

export function resolveSocialSurfaceTab(
  value: string | undefined,
  options?: { socialActivityVisible?: boolean }
): SocialSurfaceTab {
  if (options?.socialActivityVisible === false) {
    return "team";
  }
  if (value === "challenges" || value === "leaderboards" || value === "team") {
    return value;
  }
  return "feed";
}
