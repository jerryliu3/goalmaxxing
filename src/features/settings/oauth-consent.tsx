"use client";
import { useEffect, useMemo, useState } from "react";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/observability/report-error";

export function OAuthConsent({ authorizationId }: { authorizationId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.auth.oauth.getAuthorizationDetails(authorizationId).then(({ data, error }) => {
      if (!active) return;
      if (error || !data) { setError("This request expired or could not be loaded. Start again from your assistant."); return; }
      if ("redirect_url" in data) { window.location.assign(data.redirect_url); return; }
      setDetails(data);
    }).catch(cause => { reportError(cause); if (active) setError("The connection request could not be loaded."); });
    return () => { active = false; };
  }, [supabase, authorizationId]);

  const decide = async (approve: boolean) => {
    if (!details || busy) return;
    setBusy(true); setError(null);
    try {
      if (approve) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Sign in again to connect this app.");
        const result = await supabase.from("external_app_connections").upsert({
          owner_id: user.id, client_id: details.client.id,
          client_name: (details.client.name || "Connected app").slice(0, 200),
          connected_at: new Date().toISOString(), revoked_at: null,
        });
        if (result.error) throw result.error;
      }
      const result = approve
        ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
        : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
      if (result.error || !result.data) throw result.error ?? new Error("Connection could not be completed.");
      window.location.assign(result.data.redirect_url);
    } catch (cause) {
      reportError(cause);
      setError("The connection could not be completed. Please try again."); setBusy(false);
    }
  };
  return <div className="space-y-5">
    {details ? <>
      <p><strong>{details.client.name || "This app"}</strong> wants to connect to your Goalmaxxing account.</p>
      <p className="text-sm text-muted-foreground">Connecting grants access to read and modify your account data, including goals, progress, completions, and plans. Only connect apps you trust.</p>
      <p className="text-sm">The assistant uses its own AI to help you. These account tools do not call Goalmaxxing’s AI.</p>
      <p className="text-xs text-muted-foreground">Requested sign-in permissions: {details.scope || "Account access"}. You can disconnect the app in Settings → Integrations.</p>
      <div className="flex gap-3"><Button disabled={busy} onClick={() => void decide(true)}>{busy ? "Connecting…" : "Allow access"}</Button><Button variant="outline" disabled={busy} onClick={() => void decide(false)}>Deny</Button></div>
    </> : !error ? <p>Loading connection request…</p> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </div>;
}
