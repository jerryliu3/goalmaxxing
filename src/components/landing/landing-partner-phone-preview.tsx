"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export const PARTNER_PHONE_NOTIFICATION_DELAY_MS = 550;

export function shouldShowPartnerPhone(
  mode: "solo" | "partner" | "duo",
  isWeekView: boolean
) {
  return mode === "partner" && isWeekView;
}

export function shouldShowPartnerPhoneNotification(
  mode: "solo" | "partner" | "duo",
  phase:
    | "week-completing"
    | "week-completed"
    | "opening-month-menu"
    | "selecting-month"
    | string
) {
  if (mode !== "partner") {
    return false;
  }
  return (
    phase === "week-completed" ||
    phase === "opening-month-menu" ||
    phase === "selecting-month"
  );
}

export function LandingPartnerPhonePreview({
  notificationEligible,
  reducedMotion,
  nudgeMessage,
}: {
  notificationEligible: boolean;
  reducedMotion: boolean;
  nudgeMessage: string;
}) {
  const [notificationVisible, setNotificationVisible] = useState(false);

  useEffect(() => {
    if (!notificationEligible) {
      setNotificationVisible(false);
      return;
    }

    if (reducedMotion) {
      setNotificationVisible(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationVisible(true);
    }, PARTNER_PHONE_NOTIFICATION_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [notificationEligible, reducedMotion]);

  return (
    <div
      data-demo-partner-phone
      className="pointer-events-none mx-auto w-full max-w-[min(20rem,82%)]"
      aria-hidden="true"
    >
      <p className="mb-1.5 text-center text-[10px] font-medium text-muted-foreground">
        Alex&apos;s phone
      </p>
      <div className="overflow-hidden rounded-t-[1.75rem] border border-b-0 border-stone-300/90 bg-stone-900 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)]">
        <div className="relative h-[10.75rem] overflow-hidden bg-stone-950 sm:h-[11.25rem]">
          <div className="absolute inset-x-3 top-2 z-20 flex items-center justify-between px-1 text-[8px] font-semibold text-white/90">
            <span>9:41</span>
            <div className="flex items-center gap-0.5">
              <span className="inline-block h-2 w-3 rounded-[1px] border border-white/80" />
              <span className="inline-block size-2 rounded-full border border-white/80" />
            </div>
          </div>

          <div className="absolute top-2 left-1/2 z-20 h-4 w-[4.5rem] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/10" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(147,197,253,0.95),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(196,181,253,0.9),transparent_38%),linear-gradient(160deg,#1e3a8a_0%,#312e81_48%,#4c1d95_100%)]" />

          <div className="absolute inset-x-4 top-14 flex flex-col gap-2.5 opacity-90">
            <div className="grid grid-cols-4 gap-3">
              {["Calendar", "Notes", "Photos", "Music"].map((label) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="size-9 rounded-[0.65rem] bg-white/18 shadow-inner ring-1 ring-white/25 backdrop-blur-sm" />
                  <span className="w-full truncate text-center text-[6px] font-medium text-white/75">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 opacity-85">
              {["Mail", "Maps", "Health", "Wallet"].map((label) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="size-9 rounded-[0.65rem] bg-white/14 shadow-inner ring-1 ring-white/20 backdrop-blur-sm" />
                  <span className="w-full truncate text-center text-[6px] font-medium text-white/65">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-x-3 top-9 z-30">
            <AnimatePresence initial={false}>
              {notificationVisible ? (
                <motion.div
                  key="partner-nudge-notification"
                  data-demo-partner-phone-notification
                  data-testid="partner-phone-notification"
                  initial={
                    reducedMotion
                      ? false
                      : { y: -72, opacity: 0, scale: 0.94 }
                  }
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={
                    reducedMotion
                      ? undefined
                      : { y: -72, opacity: 0, scale: 0.96 }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 32, mass: 0.75 }
                  }
                  className="flex items-start gap-2.5 rounded-2xl border border-white/35 bg-white/82 p-2.5 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] backdrop-blur-md"
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-[10px] font-bold text-white">
                    G
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[8px] font-semibold text-stone-900">
                        Goalmaxxing
                      </p>
                      <p className="shrink-0 text-[7px] text-stone-500">now</p>
                    </div>
                    <p className="mt-0.5 text-[8px] font-semibold text-stone-900">
                      Nudge from your partner
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[7.5px] leading-snug text-stone-600">
                      {nudgeMessage}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
