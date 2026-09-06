"use client";

import { ArrowDownLeft } from "lucide-react";

export function LandingTryMeHint() {
  return (
    <span
      data-testid="landing-try-me"
      className="pointer-events-none absolute -top-3 -right-2 z-20 inline-flex items-center gap-1 rounded-full border border-border bg-primary px-2 py-0.5 text-[9px] font-semibold tracking-wide text-primary-foreground uppercase shadow-[0_8px_20px_-8px_rgba(154,79,44,0.8)]"
    >
      <ArrowDownLeft className="size-3" />
      Try me
    </span>
  );
}
