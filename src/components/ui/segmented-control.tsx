"use client";

import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Neutral pill track with a raised thumb that slides to the selected option.
 * Selection reads through elevation and ink, never a brand-colored fill.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  thumbTestId,
  className,
}: {
  label: string;
  options: ReadonlyArray<SegmentedControlOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  thumbTestId?: string;
  className?: string;
}) {
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative isolate inline-grid shrink-0 rounded-full bg-muted p-0.5 text-xs sm:text-[13px]", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        data-testid={thumbTestId}
        className="pointer-events-none absolute inset-y-0.5 left-0.5 rounded-full bg-background shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${selectedIndex * 100}%)` }}
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 h-8 whitespace-nowrap rounded-full px-3 transition-colors sm:px-4",
              selected ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
