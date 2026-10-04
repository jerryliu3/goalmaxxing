"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getJson } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/observability/report-error";

type Connection = { client_id: string; client_name: string; connected_at: string; revoked_at: string | null };
export function ExternalAppConnections() {
  const supabase = useMemo(() => createClient(), []);
  const [enabled, setEnabled] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getJson<{ externalToolsEnabled: boolean }>("/api/config").then(async config => {
      if (!active || !config.externalToolsEnabled) return;
      setEnabled(true);
      const { data, error } = await supabase.from("external_app_connections").select("client_id,client_name,connected_at,revoked_at").is("revoked_at", null).order("connected_at");
      if (error) throw error;
      if (active) setConnections(data ?? []);
    }).catch(cause => { reportError(cause); if (active) setError("Connected apps could not be loaded."); });
    return () => { active = false; };
  }, [supabase]);
  if (!enabled) return null;
  const disconnect = async (clientId: string) => {
    setBusy(clientId); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in again.");
      const result = await supabase.from("external_app_connections").update({ revoked_at: new Date().toISOString() }).eq("owner_id", user.id).eq("client_id", clientId);
      if (result.error) throw result.error;
      // API access stops immediately; also revoke the provider grant and refresh sessions.
      const revoked = await supabase.auth.oauth.revokeGrant({ clientId });
      if (revoked.error) throw revoked.error;
      setConnections(previous => previous.filter(item => item.client_id !== clientId));
    } catch (cause) { reportError(cause); setError("API access is blocked once disconnected. If this action failed, retry to finish revoking the sign-in grant."); }
    finally { setBusy(null); }
  };
  return <section className="space-y-4 rounded-xl border p-5">
    <div><h3 className="font-semibold">Connected AI apps</h3><p className="text-sm text-muted-foreground">Connect from your assistant using your Goalmaxxing MCP URL. Your assistant provides the AI; Goalmaxxing saves your goals and plans.</p></div>
    <code className="block break-all text-xs">{typeof window === "undefined" ? "/api/mcp" : `${window.location.origin}/api/mcp`}</code>
    {connections.length ? connections.map(item => <div key={item.client_id} className="flex items-center justify-between gap-3"><span>{item.client_name}</span><Button variant="outline" disabled={busy !== null} onClick={() => void disconnect(item.client_id)}>{busy === item.client_id ? "Disconnecting…" : "Disconnect"}</Button></div>) : <p className="text-sm text-muted-foreground">No connected apps.</p>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </section>;
}
