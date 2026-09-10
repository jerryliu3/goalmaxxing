"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function PlanDaySection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between gap-2 py-2 text-left font-sans text-base font-medium touch-manipulation"
        aria-expanded={open}
        aria-label={typeof count === "number" ? `${title} ${count}` : title}
      >
        <span className="flex min-w-0 items-center gap-2">
          {title}
          {typeof count === "number" ? (
            <span className="text-muted-foreground">{count}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-[var(--motion-duration-fast)]",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
