"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoachCheckIn } from "@cadence/shared/coach/use-check-in";
import { digestPayloadSchema, type DigestPayload } from "@cadence/shared/coach/check-in";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { checkInHeading, primaryCheckInAction } from "./check-in-actions";
import { CheckInBody } from "./check-in-body";
import { useCheckInOffer } from "./use-check-in-offer";
import { DIGEST_OPEN_EVENT, digestActionHref } from "./digest-api";
import { getJson, postJson } from "@/lib/api/client";

const client = { getJson, postJson };
/** Check-in remains available when coaching is disabled, using the same lifecycle. */
export function CheckInOverlay({ hrefPrefix = "" }: { hrefPrefix?: string }) {
  const router = useRouter();
  const offer = useCheckInOffer(true);
  const briefing = useCoachCheckIn(client);
  const closeBriefing = briefing.close;
  const [forced, setForced] = useState(false);
  const [replayPayload, setReplayPayload] = useState<DigestPayload | null>(null);
  const [view, setView] = useState<"prompt" | "details">("prompt");
  useEffect(() => {
    let disposed = false;
    const replay = () => {
      void getJson("/api/digest").then(async data => {
        const next = digestPayloadSchema.parse(data);
        if (disposed) return;
        if (!next.acknowledged) await postJson("/api/digest/ack", { referenceId: next.id, localDate: next.localDate });
        if (disposed) return;
        closeBriefing(); setReplayPayload(next); setView("prompt"); setForced(true);
      }).catch(() => undefined);
    };
    window.addEventListener(DIGEST_OPEN_EVENT, replay);
    return () => { disposed = true; window.removeEventListener(DIGEST_OPEN_EVENT, replay); };
  }, [closeBriefing]);
  const close = () => { offer.dismiss(); briefing.close(); setReplayPayload(null); setForced(false); setView("prompt"); };
  const leave = (href: string | null) => { close(); if (href) router.push(href); };
  const payload = briefing.payload ?? replayPayload ?? offer.payload;
  if (!payload) return null;
  const { kind } = payload;

  return (
    <Dialog
      open={forced || Boolean(offer.payload)}
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
              <Button type="button" onClick={() => { setView("details"); void briefing.open(); }}>
                Open
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{checkInHeading(kind)}</DialogTitle>
            </DialogHeader>
            <CheckInBody payload={payload} briefingSettled={!briefing.generating} hrefPrefix={hrefPrefix} onNavigate={leave} onCompleted={() => void briefing.refresh().catch(() => undefined)} />
            {briefing.error && <div role="alert" className="text-sm text-destructive"><p>{briefing.error}</p><Button variant="ghost" size="sm" onClick={() => void briefing.refresh(true).catch(() => undefined)}>Refresh check-in</Button></div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Close
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
