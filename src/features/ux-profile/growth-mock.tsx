"use client";

import type { ReactNode } from "react";
import type { ShowcaseItem } from "@/features/ux-profile/model";
import { PinCounter, PinToggle } from "@/features/ux-profile/pickers";
import { GROWTH_STATS, MEDALS, PLAQUES, RECORDS } from "@/features/ux-profile/seed";
import { ShowcaseTile } from "@/features/ux-profile/showcase-tiles";

/**
 * Growth with a pin on every proud object. Stats stay here and are not pinnable;
 * finished plaques live in Goals · Past and carry the same pin.
 */
export function GrowthMock({
  pins,
  notice,
  onTogglePin,
}: {
  pins: readonly string[];
  notice: string | null;
  onTogglePin: (id: string) => void;
}) {
  const grid = (items: readonly ShowcaseItem[], columns: string) => (
    <ul className={`grid gap-3 ${columns}`}>
      {items.map((item) => {
        const pinned = pins.includes(item.id);
        return (
          <li key={item.id} className="relative">
            <div className={`h-full rounded-[14px] ${pinned ? "ring-2 ring-primary" : ""}`}>
              <ShowcaseTile item={item} />
            </div>
            <div className="absolute right-2 top-2">
              <PinToggle item={item} pinned={pinned} onToggle={onTogglePin} compact />
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-7">
      <div className="sticky top-2 z-10 rounded-full border border-border/70 bg-card/95 px-4 py-2 backdrop-blur">
        <PinCounter count={pins.length} notice={notice} />
      </div>

      <Block title="Stats" tag="Growth · stays here">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GROWTH_STATS.map((stat) => (
            <div key={stat.label} className="rounded-[14px] border border-border/70 bg-card px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-1 font-mono text-2xl font-semibold">{stat.value}</dd>
              <dd className="text-[11px] text-muted-foreground">{stat.hint}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="Medals" tag="Growth">
        {grid(MEDALS, "grid-cols-2 sm:grid-cols-4")}
      </Block>

      <Block title="Personal records" tag="Growth">
        {grid(RECORDS, "grid-cols-3")}
      </Block>

      <Block title="Past goals" tag="Goals tab">
        {grid(PLAQUES, "sm:grid-cols-2")}
      </Block>
    </div>
  );
}

function Block({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{tag}</span>
      </div>
      {children}
    </section>
  );
}
