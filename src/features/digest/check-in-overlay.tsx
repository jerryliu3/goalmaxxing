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
  buildCoachCheckInActions,
  buildCheckInCoachQuestion,
  buildStructuredCheckInActions,
  checkInHeading,
  checkInRecapSummary,
  primaryCheckInAction,
  type CheckInAction,
} from "@/features/digest/check-in-actions";
import { canAutoShowDigestAfterOnboarding } from "@/features/digest/digest-eligibility";
import {
  DIGEST_OPEN_EVENT,
  digestActionHref,
  type DigestPayload,
} from "@/features/digest/digest-api";
import { getJson, postJson } from "@/lib/api/client";
import { stashCoachPromptSeed } from "@/lib/coach/coach-prompt-seed";
import { toLocalDateString } from "@/lib/dates/day";
import type { DigestWindowFacts } from "@/lib/digest/contract";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

/**
 * The period check-in starts as a small, non-recurring prompt. Opening it
 * separates facts, decisions, and coach output without mutating the plan.
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
    void postJson("/api/digest/ack", {}).catch(() => undefined);
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
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        {view === "prompt" ? (
          <>
            <DialogHeader>
              <DialogTitle>Your check-in is ready</DialogTitle>
              <DialogDescription>
                A quick look at what changed and what may need your attention.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Skip
              </Button>
              <Button type="button" onClick={() => setView("details")}>
                Open
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{checkInHeading(kind)}</DialogTitle>
              <DialogDescription>{checkInRecapSummary(facts)}</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="recap">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recap">Recap</TabsTrigger>
                <TabsTrigger value="decisions">Decisions</TabsTrigger>
                <TabsTrigger value="coach">Coach</TabsTrigger>
              </TabsList>
              <TabsContent value="recap" className="pt-2">
                <DigestFactsPanel recap={facts.recap} ahead={facts.ahead} />
              </TabsContent>
              <TabsContent value="decisions" className="pt-2">
                <CheckInActionList
                  actions={buildStructuredCheckInActions({ kind, facts })}
                  hrefPrefix={hrefPrefix}
                  onNavigate={leave}
                  emptyMessage="Nothing needs a decision right now."
                />
              </TabsContent>
              <TabsContent value="coach" className="space-y-3 pt-2">
                <p className="text-sm">
                  {suggestions?.motivation ??
                    (briefingSettled
                      ? "Start with what’s already on the calendar."
                      : "Reading your plan…")}
                </p>
                <CheckInActionList
                  actions={buildCoachCheckInActions(suggestions)}
                  hrefPrefix={hrefPrefix}
                  onNavigate={leave}
                />
              </TabsContent>
            </Tabs>
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

function DigestFactsPanel({
  recap,
  ahead,
}: {
  recap: DigestWindowFacts;
  ahead: DigestWindowFacts;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[recap, ahead].map((window) => (
        <div key={window.label} className="rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {window.label}
          </p>
          <p className="mt-2 text-lg font-semibold">
            {window.completed} of {window.placed} done
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {window.start === window.end
              ? window.start
              : `${window.start} – ${window.end}`}
          </p>
        </div>
      ))}
    </div>
  );
}

function CheckInActionList({
  actions,
  hrefPrefix,
  onNavigate,
  emptyMessage,
}: {
  actions: CheckInAction[];
  hrefPrefix: string;
  onNavigate: (href: string | null) => void;
  emptyMessage?: string;
}) {
  if (actions.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    ) : null;
  }

  return (
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
  );
}
