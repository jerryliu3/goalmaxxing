"use client";

import type { CSSProperties } from "react";

export function TempoGoalChoices<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: readonly { value: T; label: string; color?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="tempo-choices" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          style={
            option.color
              ? ({ "--goal-color": option.color } as CSSProperties)
              : undefined
          }
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
