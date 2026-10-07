"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordUpdateForm } from "@/features/auth/password-update-form";
import { getPublicEnv } from "@/lib/env";
import { reportError } from "@/lib/observability/report-error";
import { createClient } from "@/lib/supabase/client";
import { resolveAuthRedirectBaseUrl } from "@/lib/supabase/public-app-url";

const invalidLinkMessage =
  "This reset link has expired or could not be verified. Request a new link and open it in the same browser where you requested it.";

export function ResetPasswordForm() {
  const router = useRouter();
  const initialUrl = useRef<URL | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"loading" | "request" | "update" | "complete">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    // Capture intent before the SSR browser client exchanges and removes the code.
    const url = initialUrl.current ??= new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const recoveryRequested = url.searchParams.has("code") ||
      url.searchParams.get("flow") === "recovery" || hash.get("type") === "recovery";
    const linkError = url.searchParams.has("error") || hash.has("error");
    const supabase = createClient();

    async function resolveRecovery() {
      if (linkError) {
        if (active) { setErrorMessage(invalidLinkMessage); setMode("request"); }
        return;
      }
      if (!recoveryRequested) {
        if (active) setMode("request");
        return;
      }
      try {
        // detectSessionInUrl is enabled by createBrowserClient. Await that one
        // exchange instead of exchanging the single-use code a second time.
        const initialized = await supabase.auth.initialize();
        // The mobile app sends an implicit recovery link to this same web page.
        // The SSR client uses PKCE, so install that session explicitly instead.
        const implicitRecovery = hash.get("type") === "recovery" &&
          hash.has("access_token") && hash.has("refresh_token");
        if (implicitRecovery) {
          const { error } = await supabase.auth.setSession({
            access_token: hash.get("access_token")!,
            refresh_token: hash.get("refresh_token")!,
          });
          if (error) {
            if (active) { setErrorMessage(invalidLinkMessage); setMode("request"); }
            return;
          }
        }
        const { data, error } = await supabase.auth.getSession();
        const unconsumedCode = new URL(window.location.href).searchParams.has("code");
        if (!active) return;
        if ((!implicitRecovery && initialized.error) || error || !data.session || unconsumedCode) {
          setErrorMessage(invalidLinkMessage);
          setMode("request");
          return;
        }
        // Keep the form available on refresh after Supabase removes the code/hash.
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.set("flow", "recovery");
        cleanUrl.hash = "";
        window.history.replaceState(window.history.state, "", cleanUrl);
        setMode("update");
      } catch (error) {
        reportError(error, { surface: "password-recovery" });
        if (active) { setErrorMessage(invalidLinkMessage); setMode("request"); }
      }
    }
    void resolveRecovery();
    return () => { active = false; };
  }, []);

  async function sendResetLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSent(false);
    try {
      const appBaseUrl = resolveAuthRedirectBaseUrl(
        getPublicEnv().NEXT_PUBLIC_APP_URL, window.location.origin
      );
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${appBaseUrl}/reset-password`,
      });
      if (error) {
        reportError(error, { surface: "password-recovery-request", status: error.status });
        setErrorMessage(error.message);
        return;
      }
      // A fresh request must not carry an old, failed callback into a refresh.
      window.history.replaceState(window.history.state, "", "/reset-password");
      setSent(true);
    } catch (error) {
      reportError(error, { surface: "password-recovery-request" });
      setErrorMessage("Could not send reset instructions. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "loading") return <p role="status" className="text-sm text-muted-foreground">Checking reset link...</p>;
  if (mode === "update") return <PasswordUpdateForm onSuccess={() => {
    window.history.replaceState(window.history.state, "", "/reset-password");
    setMode("complete");
    router.refresh();
  }} />;
  if (mode === "complete") return (
    <div className="space-y-4">
      <p role="status" className="text-sm">Your password has been updated. You can continue to your plan.</p>
      <Button className="w-full" onClick={() => { router.replace("/calendar"); router.refresh(); }}>Continue to plan</Button>
    </div>
  );
  return (
    <form className="space-y-4" onSubmit={sendResetLink}>
      {errorMessage ? <p role="alert" className="text-sm text-destructive">{errorMessage}</p> : null}
      {sent ? <p role="status" className="text-sm">If an account exists for this email, reset instructions are on their way. Open the link in this browser to choose your new password.</p> : null}
      <div className="space-y-2">
        <Label htmlFor="reset-email">Account email</Label>
        <Input id="reset-email" type="email" autoComplete="email" value={email}
          onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} required />
      </div>
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
