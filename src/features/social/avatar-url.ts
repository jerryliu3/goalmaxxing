export function normalizeAvatarUrlDraft(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const ALLOWED_PUBLIC_AVATAR_URL =
  /^https:\/\/randomuser\.me\/api\/portraits\/(men|women)\/[0-9]+\.jpg$|^https:\/\/api\.dicebear\.com\/[0-9]+\.x\/[a-z0-9-]+\/png\?seed=[A-Za-z0-9_-]+$|^https:\/\/placedog\.net\/[0-9]+\/[0-9]+\?id=[0-9]+$/;

function configuredSupabaseOrigin() {
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (!rawSupabaseUrl) {
    return null;
  }
  try {
    return new URL(rawSupabaseUrl).origin;
  } catch {
    return null;
  }
}

export function getAvatarUrlValidationError(
  avatarUrl: string | null
): string | null {
  if (!avatarUrl) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(avatarUrl);
  } catch {
    return "Avatar URL must be a valid absolute URL.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Avatar URL must start with http:// or https://.";
  }

  if (ALLOWED_PUBLIC_AVATAR_URL.test(avatarUrl)) {
    return null;
  }

  if (!parsed.pathname.startsWith("/storage/v1/object/public/avatars/")) {
    return "Avatar URL must point to the public avatars storage path.";
  }
  const expectedOrigin = configuredSupabaseOrigin();
  if (expectedOrigin && parsed.origin !== expectedOrigin) {
    return "Avatar URL must use your configured Supabase storage origin.";
  }

  return null;
}
