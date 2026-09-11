export const PUBLIC_PROFILE_USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

export function normalizePublicProfileUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidPublicProfileUsername(value: string) {
  return PUBLIC_PROFILE_USERNAME_PATTERN.test(normalizePublicProfileUsername(value));
}

export function buildPublicProfilePath(username: string) {
  return `/user/${normalizePublicProfileUsername(username)}`;
}

export function buildPublicProfileUrl(username: string, appUrl?: string | null) {
  const base =
    appUrl?.trim().replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    "https://goalmaxxing.xyz";
  return `${base}${buildPublicProfilePath(username)}`;
}
