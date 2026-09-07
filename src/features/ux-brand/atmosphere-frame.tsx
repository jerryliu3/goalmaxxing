"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { BrandSlug } from "@/features/ux-brand/catalog";
import {
  BrandExploreBar,
  BrandPhone,
  BrandSpec,
  BrandSpecGrid,
} from "@/features/ux-brand/brand-stage";

export function useTempoCompletion() {
  const [tempoDone, setTempoDone] = useState(false);

  return {
    isDone(row: { id: string; state: "open" | "done" }) {
      return row.id === "tempo-run" ? tempoDone : row.state === "done";
    },
    toggle(rowId: string) {
      if (rowId === "tempo-run") {
        setTempoDone((value) => !value);
      }
    },
  };
}

export function AtmosphereFrame({
  current,
  className,
  kicker,
  kickerClassName,
  title,
  titleClassName,
  intro,
  type,
  color,
  feeling,
  detailClassName,
  signature,
  material,
  phoneLabel,
  phoneClassName,
  phoneStyle,
  children,
}: {
  current: BrandSlug;
  className: string;
  kicker: string;
  kickerClassName: string;
  title: string;
  titleClassName: string;
  intro: ReactNode;
  type: ReactNode;
  color: ReactNode;
  feeling: ReactNode;
  detailClassName: string;
  signature: ReactNode;
  material: ReactNode;
  phoneLabel: string;
  phoneClassName?: string;
  phoneStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <BrandExploreBar current={current} />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:py-12">
        <div className="max-w-xl">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${kickerClassName}`}
          >
            {kicker}
          </p>
          <h1 className={titleClassName}>{title}</h1>
          <p className="mt-4 text-sm leading-relaxed opacity-75">{intro}</p>
          <dl className="mt-7 grid gap-4 text-sm">
            <div>
              <dt
                className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${detailClassName}`}
              >
                Type
              </dt>
              <dd className="mt-1">{type}</dd>
            </div>
            <div>
              <dt
                className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${detailClassName}`}
              >
                Color + material
              </dt>
              <dd className="mt-1">{color}</dd>
            </div>
            <div>
              <dt
                className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${detailClassName}`}
              >
                Feeling in the UI
              </dt>
              <dd className="mt-1">{feeling}</dd>
            </div>
          </dl>
          <div className="mt-7">
            <BrandSpecGrid>
              <BrandSpec title="Signature object">{signature}</BrandSpec>
              <BrandSpec title="Material sample">{material}</BrandSpec>
            </BrandSpecGrid>
          </div>
        </div>
        <BrandPhone
          label={phoneLabel}
          className={phoneClassName}
          style={phoneStyle}
        >
          {children}
        </BrandPhone>
      </main>
    </div>
  );
}
