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
import { canAutoShowDigestAfterOnboarding } from "@/features/digest/digest-eligibility";
import {
  DIGEST_OPEN_EVENT,
  digestActionHref,
  type DigestPayload,
} from "@/features/digest/digest-api";
import { getJson, postJson } from "@/lib/api/client";
import { toLocalDateString } from "@/lib/dates/day";
import type { DigestFacts } from "@/lib/digest/contract";

type OverlayStep = "recap" | "ahead" | "suggestions";

export function DigestOverlay({
  hrefPrefix = "",
}: {
  hrefPrefix?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);
  const [step, setStep] = useState<OverlayStep>("recap");
  const [payload, setPayload] = useState<DigestPayload | null>(null);
  const [generateSettled, setGenerateSettled] = useState(false);
  const generateStartedRef = useRef(false);

  useEffect(() => {
    const handleOpenRequest = () => {
      setForced(true);
      setStep("recap");
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
          setGenerateSettled(true);
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
    setStep("recap");
    generateStartedRef.current = false;
    setGenerateSettled(false);
    if (acknowledge) {
      void postJson("/api/digest/ack", {}).catch(() => undefined);
    }
  };

  const facts = payload?.facts;
  const heading = payload?.kind === "weekly" ? "Weekly digest" : "Daily digest";

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
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            {step === "recap"
              ? "How it went."
              : step === "ahead"
                ? "What’s ahead."
                : "A short suggestion, then back to the plan."}
          </DialogDescription>
        </DialogHeader>
        {facts ? (
          <DigestStepBody
            step={step}
            facts={facts}
            suggestions={payload?.suggestions ?? null}
            generateSettled={generateSettled}
            hrefPrefix={hrefPrefix}
            onNavigate={(href) => {
              close(true);
              router.push(href);
            }}
          />
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(true)}>
            Skip
          </Button>
          {step === "recap" ? (
            <Button type="button" onClick={() => setStep("ahead")}>
              Continue
            </Button>
          ) : null}
          {step === "ahead" ? (
            <Button type="button" onClick={() => setStep("suggestions")}>
              Continue
            </Button>
          ) : null}
          {step === "suggestions" ? (
            <Button type="button" onClick={() => close(true)}>
              Let’s go
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DigestStepBody({
  step,
  facts,
  suggestions,
  generateSettled,
  hrefPrefix,
  onNavigate,
}: {
  step: OverlayStep;
  facts: DigestFacts;
  suggestions: DigestPayload["suggestions"];
  generateSettled: boolean;
  hrefPrefix: string;
  onNavigate: (href: string) => void;
}) {
  if (step === "suggestions") {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          {suggestions?.motivation ??
            (generateSettled
              ? "Start with what’s already on the calendar."
              : "Writing a short note…")}
        </p>
        {(suggestions?.suggestions ?? []).map((suggestion) => {
          const href = digestActionHref(suggestion.action, hrefPrefix);
          return (
            <div key={suggestion.title} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{suggestion.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{suggestion.body}</p>
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
            </div>
          );
        })}
      </div>
    );
  }

  const windowFacts = step === "recap" ? facts.recap : facts.ahead;
  return (
    <div className="space-y-3">
      <p className="text-2xl font-semibold tracking-tight">
        {windowFacts.completed} of {windowFacts.placed}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {windowFacts.label.toLowerCase()}
        </span>
      </p>
      {windowFacts.placed === 0 ? (
        <p className="text-sm text-muted-foreground">
          {step === "recap"
            ? "Nothing to recap yet."
            : "Nothing is placed here yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {windowFacts.items.map((item) => (
            <li key={`${item.title}:${item.date}`} className="text-sm">
              {item.title}
              <span className="ml-2 text-muted-foreground">
                {item.state === "completed" ? "done" : "open"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
