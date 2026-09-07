"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useUiStyle } from "@/components/brand/ui-style-provider";
import { NestCompletionMark } from "@/components/ui/nest-completion-mark";
import { cn } from "@/lib/utils";

export function StyleCompletionMark({
  done,
  className,
  label,
}: {
  done: boolean;
  className?: string;
  label?: string;
}) {
  const { style } = useUiStyle();

  if (style.completionMark === "nest") {
    return <NestCompletionMark done={done} className={className} label={label} />;
  }

  if (done) {
    return (
      <CheckCircle2
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? "img" : undefined}
        data-completion-mark="circle"
        data-completed="true"
        className={cn("text-primary", className)}
      />
    );
  }

  return (
    <Circle
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      data-completion-mark="circle"
      data-completed="false"
      className={cn("text-muted-foreground", className)}
    />
  );
}
