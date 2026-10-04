import { redirect, notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OAuthConsent } from "@/features/settings/oauth-consent";
import { buildLoginHref } from "@/lib/auth/login-redirect";
import { areExternalToolsEnabled } from "@/lib/feature-flags";
import { authorizationIdSchema } from "@/lib/external-tools/oauth";
import { createClient } from "@/lib/supabase/server";

export default async function ConsentPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string }> }) {
  if (!areExternalToolsEnabled()) notFound();
  const parsed = authorizationIdSchema.safeParse((await searchParams).authorization_id);
  if (!parsed.success) return <p className="p-8">This connection request is invalid. Start again from your assistant.</p>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(buildLoginHref(`/oauth/consent?authorization_id=${encodeURIComponent(parsed.data)}`));
  return <AuthShell title="Connect Goalmaxxing" description="Choose whether this app can access your account." alternateText="Manage connections" alternateLabel="Settings" alternateHref="/settings?tab=integrations">
    <OAuthConsent authorizationId={parsed.data} />
  </AuthShell>;
}
