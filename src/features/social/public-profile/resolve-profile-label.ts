import type { PublicProfileIdentity } from "@cadence/shared/social/public-profile";

export function resolvePublicProfileLabel(profile: PublicProfileIdentity) {
  if (profile.displayName?.trim()) {
    return profile.displayName.trim();
  }
  if (profile.username?.trim()) {
    return `@${profile.username.trim()}`;
  }
  return "Goalmaxxing user";
}
