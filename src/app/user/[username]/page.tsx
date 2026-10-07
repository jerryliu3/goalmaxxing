import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfileChrome } from "@/features/social/public-profile/public-profile-chrome";
import { PublicProfileView } from "@/features/social/public-profile/public-profile-view";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import { ApiRouteError } from "@/lib/api/route";
import { getFeatureFlags } from "@/lib/feature-flags";
import { loadPublicProfileBundleByUsername } from "@/lib/social/public-profile";
import {
  isValidPublicProfileUsername,
  normalizePublicProfileUsername,
} from "@/lib/social/public-profile-username";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function resolveSelectedYear(searchParams: Record<string, string | string[] | undefined>) {
  const raw = Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year;
  if (!raw) {
    return new Date().getUTCFullYear();
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1970 || parsed > 2100) {
    return new Date().getUTCFullYear();
  }
  return parsed;
}

async function loadProfilePageBundle(username: string, selectedYear: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  return loadPublicProfileBundleByUsername({
    admin,
    username,
    viewerUserId: user?.id ?? null,
    selectedYear,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const normalized = normalizePublicProfileUsername(username);
  if (!isValidPublicProfileUsername(normalized)) {
    return {
      title: "Profile not found · Goalmaxxing",
      robots: { index: false, follow: false },
    };
  }

  try {
    const bundle = await loadProfilePageBundle(normalized, new Date().getUTCFullYear());
    const label = resolvePublicProfileLabel(bundle.profile);
    const handle = bundle.profile.username ? `@${bundle.profile.username}` : normalized;
    const title = `${label} (${handle}) · Goalmaxxing`;
    const description = bundle.profile.isPrivate
      ? "This Goalmaxxing account is private."
      : bundle.bio?.trim() || `${label}'s Goalmaxxing profile: showcase and current goals.`;

    return {
      title,
      description,
      robots: bundle.profile.isPrivate
        ? { index: false, follow: false }
        : { index: true, follow: true },
      openGraph: {
        title,
        description,
        type: "profile",
        ...(bundle.profile.avatarUrl ? { images: [bundle.profile.avatarUrl] } : {}),
      },
    };
  } catch {
    return {
      title: "Profile not found · Goalmaxxing",
      robots: { index: false, follow: false },
    };
  }
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ username }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const normalized = normalizePublicProfileUsername(username);
  if (!isValidPublicProfileUsername(normalized)) {
    notFound();
  }

  const selectedYear = resolveSelectedYear(resolvedSearchParams);
  let bundle;
  try {
    bundle = await loadProfilePageBundle(normalized, selectedYear);
  } catch (error) {
    if (error instanceof ApiRouteError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const flags = getFeatureFlags();

  return (
    <PublicProfileChrome>
      <PublicProfileView
        bundle={bundle}
        xpEnabled={flags.xpEnabled}
        copyLink={bundle.showcaseCatalog !== null}
      />
    </PublicProfileChrome>
  );
}
