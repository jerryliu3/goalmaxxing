"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildCheckInCoachQuestion,
  checkInHeading,
  primaryCheckInAction,
} from "@/features/digest/check-in-actions";
import { CheckInBody } from "@/features/digest/check-in-body";
import { applyRecapCompletion } from "@/features/digest/check-in-recap";
import { canAutoShowDigestAfterOnboarding } from "@/features/digest/digest-eligibility";
import {
  DIGEST_OPEN_EVENT,
  digestActionHref,
  type DigestPayload,
} from "@/features/digest/digest-api";
import { getJson, postJson } from "@/lib/api/client";
import { stashCoachPromptSeed } from "@/lib/coach/coach-prompt-seed";
import { toLocalDateString } from "@/lib/dates/day";
/**
 * The period check-in starts as a small, non-recurring prompt. Opening it
 * splits what happened from what to do next, without mutating the plan.
 */
export function CheckInOverlay({
  hrefPrefix = "",
}: {
  hrefPrefix?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const [view, setView] = useState<"prompt" | "details">("prompt");
  const [payload, setPayload] = useState<DigestPayload | null>(null);
  const [briefingSettled, setBriefingSettled] = useState(false);
  const generateStartedRef = useRef(false);
  const presentedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const handleOpenRequest = () => {
      setForced(true);
      setView("prompt");
      setOpen(true);
    };
    window.addEventListener(DIGEST_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(DIGEST_OPEN_EVENT, handleOpenRequest);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const digest = await getJson<DigestPayload>("/api/digest");
        if (cancelled) {
          return;
        }
        setPayload(digest);
        const allowAuto =
          forced ||
          (digest.shouldAutoShow &&
            canAutoShowDigestAfterOnboarding(window.localStorage, toLocalDateString()));
        if (allowAuto) {
          setOpen(true);
        }
      } catch {
        if (!cancelled && forced) {
          setOpen(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [forced]);

  // Being offered the lightweight prompt counts as today's presentation. This
  // keeps it from nagging again after a refresh even when the user never opens
  // the full check-in. Settings replay remains available.
  useEffect(() => {
    if (!open || !payload || payload.acknowledged) {
      return;
    }
    const key = `${payload.kind}:${payload.periodKey}`;
    if (presentedKeyRef.current === key) {
      return;
    }
    presentedKeyRef.current = key;
    setPayload((current) =>
      current
        ? { ...current, acknowledged: true, shouldAutoShow: false }
        : current
    );
    void postJson("/api/digest/ack", {referenceId:payload.id,localDate:payload.localDate}).catch(() => undefined);
  }, [open, payload]);

  // At most one generate per open. `close` re-arms the guard, so the cleanup
  // must not: `payload` is a dependency and this effect writes it, so resetting
  // on every dependency change would let a second request through.
  useEffect(() => {
    if (
      !open ||
      view !== "details" ||
      !payload ||
      payload.suggestions ||
      generateStartedRef.current
    ) {
      return;
    }
    generateStartedRef.current = true;
    let cancelled = false;
    void postJson<{ facts?: DigestPayload["facts"]; suggestions: DigestPayload["suggestions"] }>(
      "/api/digest/generate",
      {referenceId:payload.id}
    )
      .then((generated) => {
        if (!cancelled) {
          setPayload((current) =>
            current
              ? {
                  ...current,
                  facts: generated.facts ?? current.facts,
                  suggestions: generated.suggestions,
                }
              : current
          );
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setBriefingSettled(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, payload, view]);

  const close = () => {
    setOpen(false);
    setForced(false);
    setView("prompt");
    generateStartedRef.current = false;
    setBriefingSettled(false);
  };

  const leave = (href: string | null) => {
    close();
    if (href) {
      router.push(href);
    }
  };

  // The sheet has nothing to say until the facts land, and it only ever opens
  // once they have. Bailing here keeps the body free of `facts &&` guards.
  if (!payload) {
    return null;
  }
  const { facts, kind, suggestions } = payload;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={false}
        // The prompt is an interruption the user did not ask for, so it does
        // not dim or blur what they were already looking at.
        overlayClassName={
          view === "prompt"
            ? "bg-transparent supports-backdrop-filter:backdrop-blur-none"
            : undefined
        }
      >
        {view === "prompt" ? (
          <>
            <DialogHeader>
              <DialogTitle>
                Your {checkInHeading(kind).toLowerCase()} is ready
              </DialogTitle>
              <DialogDescription>
                A quick look at what changed and what may need your attention.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Skip
              </Button>
              <Button type="button" onClick={() => setView("details")}>
                Open
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{checkInHeading(kind)}</DialogTitle>
            </DialogHeader>
            <CheckInBody payload={payload} briefingSettled={briefingSettled} hrefPrefix={hrefPrefix} onNavigate={leave} onCompleted={item => setPayload(current=>current ? {...current,facts:applyRecapCompletion(current.facts,item)} : current)} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  stashCoachPromptSeed(
                    window.sessionStorage,
                    buildCheckInCoachQuestion({ kind, facts })
                  );
                  leave(digestActionHref("plan", hrefPrefix));
                }}
              >
                Ask coach
              </Button>
              <Button
                type="button"
                onClick={() =>
                  leave(digestActionHref(primaryCheckInAction(kind), hrefPrefix))
                }
              >
                Let’s go
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
