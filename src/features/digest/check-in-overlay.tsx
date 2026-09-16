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
  buildCheckInActions,
  checkInHeading,
  checkInRecapSummary,
  primaryCheckInAction,
  type CheckInAction,
} from "@/features/digest/check-in-actions";
import { buildCheckInCoachQuestion } from "@/features/digest/check-in-coach-handoff";
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
 * The period check-in: one screen that says how the last window went, what the
 * coach makes of it, and the short list of decisions worth making now. It never
 * mutates the plan — every row is a jump into the surface that owns the change.
 */
export function CheckInOverlay({
  hrefPrefix = "",
}: {
  hrefPrefix?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const [payload, setPayload] = useState<DigestPayload | null>(null);
  const [briefingSettled, setBriefingSettled] = useState(false);
  const generateStartedRef = useRef(false);

  useEffect(() => {
    const handleOpenRequest = () => {
      setForced(true);
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

  useEffect(() => {
    if (!open || !payload || payload.suggestions || generateStartedRef.current) {
      return;
    }
    generateStartedRef.current = true;
    let cancelled = false;
    void postJson<{ facts?: DigestPayload["facts"]; suggestions: DigestPayload["suggestions"] }>(
      "/api/digest/generate",
      {}
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
      generateStartedRef.current = false;
    };
  }, [open, payload]);

  const close = (acknowledge: boolean) => {
    setOpen(false);
    setForced(false);
    generateStartedRef.current = false;
    setBriefingSettled(false);
    if (acknowledge) {
      void postJson("/api/digest/ack", {}).catch(() => undefined);
    }
  };

  const leave = (href: string | null) => {
    close(true);
    if (href) {
      router.push(href);
    }
  };

  const facts = payload?.facts;
  const kind = payload?.kind ?? "daily";

  return (
    <Dialog
      open={open && Boolean(facts)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{checkInHeading(kind)}</DialogTitle>
          <DialogDescription>
            {facts ? checkInRecapSummary(facts) : "Pulling your plan together."}
          </DialogDescription>
        </DialogHeader>
        {facts ? (
          <div className="space-y-4">
            <p className="text-sm">
              {payload?.suggestions?.motivation ??
                (briefingSettled
                  ? "Start with what’s already on the calendar."
                  : "Reading your plan…")}
            </p>
            <CheckInActionList
              actions={buildCheckInActions({
                kind,
                facts,
                suggestions: payload?.suggestions ?? null,
              })}
              hrefPrefix={hrefPrefix}
              onNavigate={leave}
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(true)}>
            Skip
          </Button>
          {facts ? (
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
          ) : null}
          <Button
            type="button"
            onClick={() => leave(digestActionHref(primaryCheckInAction(kind), hrefPrefix))}
          >
            Let’s go
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckInActionList({
  actions,
  hrefPrefix,
  onNavigate,
}: {
  actions: CheckInAction[];
  hrefPrefix: string;
  onNavigate: (href: string | null) => void;
}) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing needs a decision right now.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Worth deciding
      </p>
      <ul className="space-y-2">
        {actions.map((entry) => {
          const href = digestActionHref(entry.action, hrefPrefix);
          return (
            <li key={entry.id} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{entry.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p>
              {href ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0"
                  onClick={() => onNavigate(href)}
                >
                  Open
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
