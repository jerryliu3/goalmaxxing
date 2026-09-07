"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_TODAY_ROWS,
  type BrandSlug,
} from "@/features/ux-brand/catalog";
import {
  BrandExploreBar,
  BrandPhone,
  BrandSpec,
  BrandSpecGrid,
} from "@/features/ux-brand/brand-stage";

export function useBrandCompletions() {
  const [tempoDone, setTempoDone] = useState(false);

  function isDone(id: string) {
    if (id === "tempo-run") {
      return tempoDone;
    }
    return BRAND_TODAY_ROWS.find((row) => row.id === id)?.state === "done";
  }

  function toggle(id: string) {
    if (id === "tempo-run") {
      setTempoDone((value) => !value);
    }
  }

  return { isDone, toggle };
}

export type StackVariant =
  | "ticks"
  | "cairn"
  | "blaze"
  | "coins"
  | "chips"
  | "notch"
  | "segments";

const STACK_LABEL: Record<StackVariant, { idle: string; done: string }> = {
  ticks: { idle: "one ink tick", done: "two stacked ink ticks" },
  cairn: { idle: "one stone", done: "two stacked stones" },
  blaze: { idle: "one trail blaze", done: "two stacked blazes" },
  coins: { idle: "one disc", done: "two stacked discs" },
  chips: { idle: "one chip", done: "two stacked chips" },
  notch: { idle: "one peak", done: "a second peak stacked on the ridge" },
  segments: { idle: "one rise", done: "two stacked rise segments" },
};

export function StackMark({
  done,
  variant,
  className,
}: {
  done: boolean;
  variant: StackVariant;
  className?: string;
}) {
  const label = done ? STACK_LABEL[variant].done : STACK_LABEL[variant].idle;
  return (
    <span
      className={cn("relative grid h-8 w-7 shrink-0 place-items-end", className)}
      aria-hidden="true"
      title={label}
    >
      {variant === "ticks" ? (
        <>
          <span className="absolute bottom-1 left-2 h-4 w-[2px] rotate-[-12deg] bg-current" />
          {done ? (
            <span className="absolute bottom-1 left-3.5 h-5 w-[2px] rotate-[8deg] bg-current" />
          ) : null}
        </>
      ) : null}
      {variant === "cairn" ? (
        <span className="flex w-full flex-col items-center justify-end gap-0.5">
          {done ? <span className="h-2 w-3.5 rounded-[1px] bg-current/80" /> : null}
          <span className="h-2.5 w-5 rounded-[1px] bg-current" />
        </span>
      ) : null}
      {variant === "blaze" ? (
        <span className="flex w-full flex-col items-center justify-end gap-0.5">
          {done ? (
            <span className="h-2 w-4 -skew-x-12 rounded-[1px] bg-current/75" />
          ) : null}
          <span className="h-2.5 w-5 -skew-x-12 rounded-[1px] bg-current" />
        </span>
      ) : null}
      {variant === "coins" ? (
        <span className="relative h-6 w-6">
          <span className="absolute bottom-0 left-0 size-5 rounded-full border-2 border-current bg-transparent" />
          {done ? (
            <span className="absolute bottom-1.5 left-1.5 size-5 rounded-full border-2 border-current bg-current/20" />
          ) : null}
        </span>
      ) : null}
      {variant === "chips" ? (
        <span className="flex w-full flex-col items-center justify-end gap-0.5">
          {done ? (
            <span className="h-1.5 w-5 rotate-[-8deg] rounded-[1px] bg-current/70" />
          ) : null}
          <span className="h-2 w-6 rotate-[4deg] rounded-[1px] bg-current" />
        </span>
      ) : null}
      {variant === "notch" ? (
        <svg viewBox="0 0 28 24" className="h-6 w-7">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={done ? "2,20 8,14 14,18 20,6 26,12" : "2,20 10,16 18,18 26,14"}
          />
        </svg>
      ) : null}
      {variant === "segments" ? (
        <span className="flex h-6 w-4 flex-col-reverse overflow-hidden rounded-[2px] bg-current/15">
          <span className="h-2.5 w-full bg-current" />
          {done ? <span className="h-2 w-full bg-current/70" /> : null}
        </span>
      ) : null}
    </span>
  );
}

export function MixShell({
  current,
  pageClassName,
  kicker,
  kickerClassName,
  title,
  titleClassName,
  thesis,
  type,
  color,
  feeling,
  specimens,
  tools,
  phoneLabel,
  phoneClassName,
  children,
}: {
  current: BrandSlug;
  pageClassName: string;
  kicker: string;
  kickerClassName?: string;
  title: string;
  titleClassName?: string;
  thesis: string;
  type: string;
  color: string;
  feeling: string;
  specimens: ReactNode;
  tools?: ReactNode;
  phoneLabel: string;
  phoneClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-h-dvh", pageClassName)}>
      <BrandExploreBar current={current} />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:py-12">
        <div className="max-w-xl">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.18em]",
              kickerClassName
            )}
          >
            {kicker}
          </p>
          <h1 className={cn("mt-3 text-4xl font-semibold tracking-tight sm:text-5xl", titleClassName)}>
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed opacity-80">{thesis}</p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className={cn("text-[11px] uppercase tracking-[0.16em]", kickerClassName)}>
                Type
              </dt>
              <dd>{type}</dd>
            </div>
            <div>
              <dt className={cn("text-[11px] uppercase tracking-[0.16em]", kickerClassName)}>
                Color
              </dt>
              <dd>{color}</dd>
            </div>
            <div>
              <dt className={cn("text-[11px] uppercase tracking-[0.16em]", kickerClassName)}>
                Completion
              </dt>
              <dd>{feeling}</dd>
            </div>
          </dl>
          {tools}
          <BrandSpecGrid>{specimens}</BrandSpecGrid>
        </div>
        <BrandPhone label={phoneLabel} className={phoneClassName}>
          {children}
        </BrandPhone>
      </main>
    </div>
  );
}

export function MixSpec({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return <BrandSpec title={title}>{children}</BrandSpec>;
}

export function RidgeSilhouette({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 160"
      className={cn("absolute inset-x-0 bottom-0 w-full", className)}
    >
      <path
        d="M0 88 C70 70 110 96 170 78 C230 62 280 98 390 72 L390 160 L0 160 Z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M0 112 C80 98 140 124 210 108 C280 94 330 122 390 110 L390 160 L0 160 Z"
        fill="currentColor"
        opacity="0.4"
      />
      <path
        d="M0 132 C90 122 160 140 240 128 C310 118 350 134 390 126 L390 160 L0 160 Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}
