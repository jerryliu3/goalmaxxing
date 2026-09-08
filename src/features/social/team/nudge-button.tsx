"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendTeamNudge } from "@/features/social/data";
import {
  TEAM_NUDGE_USER_TEXT_MAX_LENGTH,
  buildTeamNudgeContent,
} from "@cadence/shared/social/team";

export function NudgeButton({
  partnerId,
  optionalMessage = "",
  onSent,
}: {
  partnerId: string;
  optionalMessage?: string;
  onSent?: () => void;
}) {
  const [message, setMessage] = useState(optionalMessage);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendNudge() {
    setIsPending(true);
    setError(null);
    try {
      const content = buildTeamNudgeContent(message);
      await sendTeamNudge({
        toUserId: partnerId,
        ...content,
      });
      setMessage("");
      onSent?.();
    } catch (nudgeError) {
      setError(nudgeError instanceof Error ? nudgeError.message : "Could not send nudge.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-1 sm:items-end">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Optional nudge message"
          maxLength={TEAM_NUDGE_USER_TEXT_MAX_LENGTH}
          className="h-8 min-w-[12rem] flex-1 sm:max-w-[16rem]"
        />
        <Button type="button" disabled={isPending} onClick={() => void sendNudge()}>
          {isPending ? "Sending..." : "Send nudge"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
