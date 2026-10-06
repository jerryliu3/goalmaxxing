"use client";

import { useId, type ReactNode } from "react";
import { MedalMark } from "@/features/achievements/medals";
import type { PersonalRecordAccent } from "@/features/achievements/types";
import { GAZETTEER, GAZETTEER_CATEGORY_COLORS } from "@cadence/shared/brand/gazetteer";
import type { ShowcaseItem } from "@/features/ux-profile/model";

const RECORD_ACCENT: Record<PersonalRecordAccent, string> = {
  stamp: GAZETTEER.stamp,
  gain: GAZETTEER.gain,
  copper: GAZETTEER.stampLight,
  sage: GAZETTEER.sage,
  ink: GAZETTEER.ink,
};

export type TileSize = "full" | "compact";

/** useId output contains characters that break `url(#…)` references. */
function useSvgId() {
  return `pm${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function TileFrame({
  label,
  size,
  children,
}: {
  label: string;
  size: TileSize;
  children: ReactNode;
}) {
  return (
    <article
      aria-label={label}
      className={`flex h-full flex-col items-center rounded-[14px] border border-border/80 bg-card text-center ${
        size === "full" ? "gap-2 px-3 pb-4 pt-5" : "gap-1 px-2 pb-2.5 pt-3"
      }`}
    >
      {children}
    </article>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </p>
  );
}

/** One pinned item: medal, finished-goal plaque, or personal record. */
export function ShowcaseTile({ item, size = "full" }: { item: ShowcaseItem; size?: TileSize }) {
  const full = size === "full";
  // The same medal can render twice on one page (Growth + profile); SVG gradient ids must not collide.
  const markId = useSvgId();

  if (item.kind === "medal") {
    return (
      <TileFrame label={item.title} size={size}>
        <MedalMark level={item.level} tier={item.tier} size={full ? 76 : 44} markId={markId} />
        <p className={`font-display font-semibold leading-tight ${full ? "text-base" : "text-xs"}`}>
          {item.title}
        </p>
        {full ? <p className="font-mono text-[11px] text-muted-foreground">{item.date}</p> : null}
      </TileFrame>
    );
  }

  if (item.kind === "record") {
    return (
      <TileFrame label={item.label} size={size}>
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: RECORD_ACCENT[item.accent] }}
        >
          {item.label}
        </p>
        <p className={`font-mono font-semibold tracking-tight ${full ? "mt-2 text-4xl" : "text-2xl"}`}>
          {item.value}
        </p>
        {full ? <p className="text-xs text-muted-foreground">{item.hint}</p> : null}
      </TileFrame>
    );
  }

  const color = GAZETTEER_CATEGORY_COLORS[item.category];
  return (
    <article
      aria-label={item.title}
      className={`relative flex h-full flex-col overflow-hidden rounded-[14px] border border-border/80 bg-card text-left ${
        full ? "gap-1.5 py-4 pl-5 pr-3" : "gap-1 py-2.5 pl-3.5 pr-2"
      }`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
      {full ? <Kicker>A goal you accomplished</Kicker> : null}
      <p className={`font-display font-semibold leading-tight ${full ? "text-lg" : "text-xs"}`}>
        {item.title}
      </p>
      {full && item.rewardText ? (
        <p className="text-xs" style={{ color: GAZETTEER.mutedDeep }}>
          Reward · {item.rewardText}
        </p>
      ) : null}
      <p className="mt-auto font-mono text-[10px] text-muted-foreground">{item.achievedOn}</p>
    </article>
  );
}

export function EmptyPinSlot({ size = "full", hint }: { size?: TileSize; hint: string }) {
  return (
    <div
      className={`grid h-full place-items-center rounded-[14px] border border-dashed border-border text-center text-xs text-muted-foreground ${
        size === "full" ? "min-h-36 p-4" : "min-h-20 p-2"
      }`}
    >
      {hint}
    </div>
  );
}

/** Small left-side mark used in picker rows. */
export function ShowcaseThumb({ item }: { item: ShowcaseItem }) {
  const markId = useSvgId();
  if (item.kind === "medal") {
    return <MedalMark level={item.level} tier={item.tier} size={36} markId={markId} />;
  }
  if (item.kind === "record") {
    return (
      <span
        className="grid size-9 place-items-center rounded-md font-mono text-xs font-semibold"
        style={{ background: "#efe4d0", color: RECORD_ACCENT[item.accent] }}
      >
        {item.value}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="block h-9 w-7 rounded-sm border border-border"
      style={{ borderLeft: `5px solid ${GAZETTEER_CATEGORY_COLORS[item.category]}`, background: GAZETTEER.paper }}
    />
  );
}

