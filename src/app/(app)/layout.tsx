import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getFeatureFlags } from "@/lib/feature-flags";
import { parseDuoScopeCookieValue, DUO_SCOPE_COOKIE_NAME } from "@/lib/social/duo/scope-cookie";
import { loadDuoContext } from "@/lib/social/duo/load-duo-context";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({
  children,
  goalSheet,
}: {
  children: ReactNode;
  goalSheet?: ReactNode;
}) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, duo] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    loadDuoContext({ supabase }),
  ]);
  const profileDisplayName =
    typeof profile?.display_name === "string" ? profile.display_name.trim() : "";
  const profileUsername =
    typeof profile?.username === "string" ? profile.username.trim() : "";
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";
  const metadataUsername =
    typeof user.user_metadata?.username === "string"
      ? user.user_metadata.username.trim()
      : "";
  const viewerAvatarUrl =
    typeof profile?.avatar_url === "string" && profile.avatar_url.trim().length > 0
      ? profile.avatar_url.trim()
      : null;
  const emailLocalPart =
    typeof user.email === "string" && user.email.includes("@")
      ? user.email.split("@")[0]?.trim() ?? ""
      : "";
  const viewerLabel =
    profileDisplayName ||
    profileUsername ||
    metadataDisplayName ||
    metadataUsername ||
    emailLocalPart ||
    "You";
  const flags = getFeatureFlags();
  const journeyFlags = {
    journeyEnabled: flags.journeyEnabled,
  } as const;
  const initialDuoScopePreference = parseDuoScopeCookieValue(
    cookieStore.get(DUO_SCOPE_COOKIE_NAME)?.value
  );

  return (
    <AppShell
      userId={user.id}
      viewerLabel={viewerLabel}
      goalSheet={goalSheet}
      duoState={duo.state}
      duoAvailability={duo.availability}
      initialDuoScopePreference={initialDuoScopePreference}
      viewerAvatarUrl={viewerAvatarUrl}
      journeyFlags={journeyFlags}
      xpEnabled={flags.xpEnabled}
      digestEnabled={flags.digestEnabled}
      coachEnabled={flags.coachEnabled}
    >
      {children}
    </AppShell>
  );
}
