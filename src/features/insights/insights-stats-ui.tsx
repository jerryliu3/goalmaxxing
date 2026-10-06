"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { TooltipIcon } from "@/components/ui/tooltip-icon";
import type { InsightsCountTrend, InsightsRateTrend } from "@/lib/insights/types";

function formatSigned(value: number, digits = 0) {
  const abs = Math.abs(value);
  const rounded = digits > 0 ? abs.toFixed(digits) : Math.round(abs).toString();
  return `${value >= 0 ? "+" : "-"}${rounded}`;
}

export function InsightsLabelWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span>{label}</span>
      <TooltipIcon content={tooltip} label={`${label} definition`} />
    </span>
  );
}

export function CountTrendInline({
  trend,
  compareLabel,
}: {
  trend: InsightsCountTrend;
  compareLabel: string;
}) {
  const direction = trend.delta === 0 ? "flat" : trend.delta > 0 ? "up" : "down";
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      {direction === "up" ? <ArrowUpRight className="size-3" /> : null}
      {direction === "down" ? <ArrowDownRight className="size-3" /> : null}
      {direction === "flat" ? <Minus className="size-3" /> : null}
      <span>
        {formatSigned(trend.delta)}
        {trend.deltaPercent !== null ? ` (${formatSigned(trend.deltaPercent, 1)}%)` : ""} vs{" "}
        {compareLabel}
      </span>
    </span>
  );
}

export function RateTrendInline({
  trend,
  compareLabel,
}: {
  trend: InsightsRateTrend;
  compareLabel: string;
}) {
  const direction =
    trend.deltaPercentPoints === 0 ? "flat" : trend.deltaPercentPoints > 0 ? "up" : "down";
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      {direction === "up" ? <ArrowUpRight className="size-3" /> : null}
      {direction === "down" ? <ArrowDownRight className="size-3" /> : null}
      {direction === "flat" ? <Minus className="size-3" /> : null}
      <span>
        {formatSigned(trend.deltaPercentPoints, 1)} pts vs {compareLabel}
      </span>
    </span>
  );
}

export function InsightsStatStrip({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-border bg-border shadow-[inset_0_1px_0_color-mix(in_srgb,white_35%,transparent),0_14px_28px_-18px_color-mix(in_srgb,var(--foreground)_28%,transparent)]">
      {children}
    </ul>
  );
}

export function InsightsStatPlaque({
  label,
  value,
  tooltip,
  hint,
}: {
  label: string;
  value: string;
  tooltip?: string;
  hint?: ReactNode;
}) {
  return (
    <li className="bg-card px-3 py-3">
      <p className="type-eyebrow text-[10px] text-muted-foreground">
        {tooltip ? (
          <InsightsLabelWithTooltip label={label} tooltip={tooltip} />
        ) : (
          label
        )}
      </p>
      <p className="mt-1 type-stat text-2xl tracking-tight">{value}</p>
      {hint}
    </li>
  );
}
