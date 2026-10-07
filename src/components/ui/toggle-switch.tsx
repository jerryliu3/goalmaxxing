"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A labelled on/off switch: the whole pill is the control. */
export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  title,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={title}
      onClick={() => onChange(!checked)}
      className="group inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-2.5 text-[13px] font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
    >
      <span
        aria-hidden
        className={cn(
          "relative h-[18px] w-8 rounded-full transition-colors duration-300 motion-reduce:transition-none",
          checked ? "bg-foreground" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-3.5 rounded-full bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            checked && "translate-x-3.5"
          )}
        />
      </span>
      {children}
    </button>
  );
}
