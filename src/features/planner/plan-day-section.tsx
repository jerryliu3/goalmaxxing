"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
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
  revealKey,
  onOpenChange,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  revealKey?: string | null;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { if (revealKey) setOpen(true); }, [revealKey]);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      data-plan-day-section={title}
    >
      <CollapsibleTrigger
        className="flex w-full items-center justify-between gap-2 py-2 text-left type-heading text-base touch-manipulation"
        aria-expanded={open}
        aria-label={typeof count === "number" ? `${title} ${count}` : title}
      >
        <span className="flex min-w-0 items-center gap-2">
          {title}
          {typeof count === "number" ? (
            <span className="font-mono text-muted-foreground">{count}</span>
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
