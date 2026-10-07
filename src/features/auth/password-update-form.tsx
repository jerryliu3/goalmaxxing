"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/observability/report-error";
import { isBrowserDemoPath } from "@/lib/navigation/demo-path";

export function PasswordUpdateForm({
  requireCurrentPassword = false,
  onSuccess,
}: {
  requireCurrentPassword?: boolean;
  onSuccess?: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setErrorMessage(null);
    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setErrorMessage("The new passwords do not match.");
      return;
    }
    if (isBrowserDemoPath()) {
      setErrorMessage("Password changes are unavailable in the demo.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await createClient().auth.updateUser({
        password,
        ...(requireCurrentPassword ? { current_password: currentPassword } : {}),
      });
      if (error) {
        reportError(error, { surface: "password-update", status: error.status });
        setErrorMessage(error.message);
        return;
      }
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
      toast.success("Password updated.");
      onSuccess?.();
    } catch (error) {
      reportError(error, { surface: "password-update" });
      setErrorMessage("Could not update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <fieldset className="space-y-4" disabled={saving}>
        {requireCurrentPassword ? (
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" autoComplete="current-password"
              value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" autoComplete="new-password"
            value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
          <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password"
            value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required />
        </div>
        {errorMessage ? <p role="alert" className="text-sm text-destructive">{errorMessage}</p> : null}
        <Button type="submit" className="w-full">
          {saving ? "Saving..." : requireCurrentPassword ? "Change password" : "Set new password"}
        </Button>
      </fieldset>
    </form>
  );
}
