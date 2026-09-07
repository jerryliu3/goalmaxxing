"use client";

import { cn } from "@/lib/utils";

export const NEST_MARKS = [
  {
    id: "sleeve",
    name: "Sleeve",
    idle: "empty holder",
    done: "pencil nested in the holder",
  },
  {
    id: "page",
    name: "Page",
    idle: "blank paper",
    done: "handwritten check over the paper",
  },
  {
    id: "nest",
    name: "Nest",
    idle: "empty frame",
    done: "inner square nested in the frame",
  },
  {
    id: "pass",
    name: "Pass",
    idle: "empty window",
    done: "peak nested in the pass",
  },
  {
    id: "compass",
    name: "Compass",
    idle: "empty rose",
    done: "needle nested in the rose",
  },
  {
    id: "seal",
    name: "Seal",
    idle: "empty ring",
    done: "wax nested in the ring",
  },
  {
    id: "ribbon",
    name: "Ribbon",
    idle: "open page",
    done: "bookmark nested in the page",
  },
  {
    id: "inset",
    name: "Inset",
    idle: "empty diamond",
    done: "blaze nested in the diamond",
  },
] as const;

export type NestMarkId = (typeof NEST_MARKS)[number]["id"];

export function nestMarkMeta(id: NestMarkId) {
  return NEST_MARKS.find((mark) => mark.id === id) ?? NEST_MARKS[0];
}

function SleeveGlyph({ done }: { done: boolean }) {
  return (
    <>
      {done ? (
        <>
          <rect x="12" y="3.5" width="4" height="13.5" rx="0.8" fill="currentColor" />
          <path d="M12 17h4l-2 4.8z" fill="currentColor" />
        </>
      ) : null}
      <path
        d="M8 6.5v11.2c0 2.6 2.5 4.3 6 4.3s6-1.7 6-4.3V6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </>
  );
}

function PageGlyph({ done }: { done: boolean }) {
  return (
    <>
      <rect
        x="6"
        y="4"
        width="16"
        height="20"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      {done ? (
        <path
          d="M9.4 14.1c.7 1.4 1.8 3.2 2.6 4.2 2.4-4.8 5.6-8.8 6.8-10.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </>
  );
}

function NestGlyph({ done }: { done: boolean }) {
  return (
    <>
      <rect
        x="4.5"
        y="4.5"
        width="19"
        height="19"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      {done ? <rect x="8.6" y="8.6" width="10.8" height="10.8" rx="2.4" fill="currentColor" /> : null}
    </>
  );
}

function PassGlyph({ done }: { done: boolean }) {
  return (
    <>
      <path
        d="M6.2 22.5V11.2C6.2 7.1 9.5 4.8 14 4.8s7.8 2.3 7.8 6.4v11.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {done ? <path d="M9.2 19.2 14 10.4l4.8 8.8z" fill="currentColor" /> : null}
    </>
  );
}

function CompassGlyph({ done }: { done: boolean }) {
  return (
    <>
      <circle cx="14" cy="14" r="9.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14 4.2v2.4M14 21.4v2.4M4.2 14h2.4M21.4 14h2.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {done ? (
        <>
          <path d="M14 6.6 16.1 14.2 14 13.3 11.9 14.2z" fill="currentColor" />
          <path d="M14 21.4 16.1 13.8 14 14.7 11.9 13.8z" fill="currentColor" opacity="0.4" />
        </>
      ) : null}
    </>
  );
}

function SealGlyph({ done }: { done: boolean }) {
  return (
    <>
      {done ? (
        <path
          d="M14 8.8c1.5 0 2.7 1.5 2.5 3 .9-.2 2.2.8 1.7 1.9 1 .4 1.1 1.9.2 2.5.4 1.2-.7 2.3-1.8 2.1-.2 1.1-1.7 1.7-2.6.8-.9 1-2.2.8-3 .1-1.1.4-2.3-.6-2.1-1.7-.9-.2-1.4-1.5-.6-2.2-.6-1 .1-2.2 1.3-2.2C9.5 12.2 11 8.8 14 8.8Z"
          fill="currentColor"
        />
      ) : null}
      <circle cx="14" cy="14" r="9.6" fill="none" stroke="currentColor" strokeWidth="2.35" />
    </>
  );
}

function RibbonGlyph({ done }: { done: boolean }) {
  return (
    <>
      {done ? (
        <path d="M11.6 4.5v12.2l2.4-1.8 2.4 1.8V4.5z" fill="currentColor" />
      ) : null}
      <rect
        x="6.2"
        y="4.5"
        width="15.6"
        height="19"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
      />
    </>
  );
}

function InsetGlyph({ done }: { done: boolean }) {
  return (
    <>
      <path
        d="M14 3.6 24.4 14 14 24.4 3.6 14z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {done ? <path d="M10.4 15.6h7.2L14 10.2z" fill="currentColor" /> : null}
    </>
  );
}

const GLYPH = {
  sleeve: SleeveGlyph,
  page: PageGlyph,
  nest: NestGlyph,
  pass: PassGlyph,
  compass: CompassGlyph,
  seal: SealGlyph,
  ribbon: RibbonGlyph,
  inset: InsetGlyph,
} as const;

export function NestMark({
  done,
  variant,
  className,
}: {
  done: boolean;
  variant: NestMarkId;
  className?: string;
}) {
  const meta = nestMarkMeta(variant);
  const Glyph = GLYPH[variant];
  return (
    <span
      className={cn("relative grid h-8 w-8 shrink-0 place-items-center", className)}
      aria-hidden="true"
      title={done ? meta.done : meta.idle}
    >
      <svg viewBox="0 0 28 28" className="h-7 w-7">
        <Glyph done={done} />
      </svg>
    </span>
  );
}

export function NestMarkPicker({
  value,
  onChange,
  className,
}: {
  value: NestMarkId;
  onChange: (id: NestMarkId) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("mt-6", className)}>
      <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
        Completion mark
      </legend>
      <p className="mt-1 text-sm opacity-70">
        Idle is the outer vessel. Done is the inner object settling into it —
        not a second object stacked on top.
      </p>
      <div
        role="radiogroup"
        aria-label="Completion mark"
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {NEST_MARKS.map((mark) => {
          const selected = mark.id === value;
          return (
            <button
              key={mark.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={mark.name}
              onClick={() => onChange(mark.id)}
              className={cn(
                "rounded-xl border px-2 py-2 text-left transition-colors",
                selected
                  ? "border-current bg-current/8"
                  : "border-current/20 hover:border-current/45"
              )}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
                {mark.name}
              </span>
              <span className="mt-1.5 flex items-center gap-2">
                <NestMark done={false} variant={mark.id} />
                <NestMark done variant={mark.id} />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
