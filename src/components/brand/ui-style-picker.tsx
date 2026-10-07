"use client";

import { useUiStyle } from "@/components/brand/ui-style-provider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function UiStylePicker({
  id = "ui-style",
  showLabel = true,
  size = "default",
  className,
}: {
  id?: string;
  showLabel?: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  const { styleId, options, setStyleId } = useUiStyle();

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel ? (
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          Visual style
        </Label>
      ) : null}
      <Select value={styleId} onValueChange={setStyleId}>
        <SelectTrigger
          id={id}
          size={size}
          aria-label="Visual style"
          className={showLabel ? "w-full" : "w-[9.5rem]"}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              {style.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
