"use client";

import { ArrowDownLeft } from "lucide-react";

export function LandingTryMeHint() {
  return (
    <span
      data-testid="landing-try-me"
      className="pointer-events-none absolute -top-3 -right-2 z-20 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-600 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)]"
    >
      <ArrowDownLeft className="size-3" />
      Try me
    </span>
  );
}
