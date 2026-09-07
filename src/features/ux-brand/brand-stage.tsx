import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_ATMOSPHERES,
  BRAND_FINALISTS,
  BRAND_KITS,
  BRAND_MIXES,
  BRAND_ROUND_ONE,
  BRAND_STUDIES,
  type BrandSlug,
} from "@/features/ux-brand/catalog";

export function BrandExploreBar({ current }: { current?: BrandSlug }) {
  return (
    <div className="border-b border-current/15 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="font-semibold">Visual language</span>
          <span className="mx-1.5 opacity-50">·</span>
          Unlisted · not in sitemap · Spatial Plan IA is unchanged
        </p>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link className="underline-offset-4 hover:underline" href="/ux/brand">
            Gallery
          </Link>
          <Link className="opacity-70 underline-offset-4 hover:underline" href="/ux/concepts">
            UX concepts
          </Link>
        </nav>
      </div>
      <nav
        aria-label="Studies"
        className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-90"
      >
        <span className="font-semibold uppercase tracking-[0.14em] opacity-50">
          Studies
        </span>
        {BRAND_STUDIES.map((direction) => (
          <Link
            key={direction.slug}
            href={direction.href}
            aria-current={direction.slug === current ? "page" : undefined}
            className={cn(
              "underline-offset-4 hover:underline",
              direction.slug === current && "font-semibold"
            )}
          >
            {direction.name}
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Atmospheres"
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-90"
      >
        <span className="font-semibold uppercase tracking-[0.14em] opacity-50">
          Atmospheres
        </span>
        {BRAND_ATMOSPHERES.map((direction) => (
          <Link
            key={direction.slug}
            href={direction.href}
            aria-current={direction.slug === current ? "page" : undefined}
            className={cn(
              "underline-offset-4 hover:underline",
              direction.slug === current && "font-semibold"
            )}
          >
            {direction.name}
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Applied kit"
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-90"
      >
        <span className="font-semibold uppercase tracking-[0.14em] opacity-50">
          Applied kit
        </span>
        {BRAND_KITS.map((direction) => (
          <Link
            key={direction.slug}
            href={direction.href}
            aria-current={direction.slug === current ? "page" : undefined}
            className={cn(
              "underline-offset-4 hover:underline",
              direction.slug === current && "font-semibold"
            )}
          >
            {direction.name}
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Finalists"
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-90"
      >
        <span className="font-semibold uppercase tracking-[0.14em] opacity-50">
          Finalists
        </span>
        {BRAND_FINALISTS.map((direction) => (
          <Link
            key={direction.slug}
            href={direction.href}
            aria-current={direction.slug === current ? "page" : undefined}
            className={cn(
              "underline-offset-4 hover:underline",
              direction.slug === current && "font-semibold"
            )}
          >
            {direction.name}
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Round one"
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-90"
      >
        <span className="font-semibold uppercase tracking-[0.14em] opacity-50">
          Round 1
        </span>
        {BRAND_ROUND_ONE.map((direction) => (
          <Link
            key={direction.slug}
            href={direction.href}
            aria-current={direction.slug === current ? "page" : undefined}
            className={cn(
              "underline-offset-4 hover:underline",
              direction.slug === current && "font-semibold"
            )}
          >
            {direction.name}
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Mixes"
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-90"
      >
        <span className="font-semibold uppercase tracking-[0.14em] opacity-50">
          Mixes
        </span>
        {BRAND_MIXES.map((direction) => (
          <Link
            key={direction.slug}
            href={direction.href}
            aria-current={direction.slug === current ? "page" : undefined}
            className={cn(
              "underline-offset-4 hover:underline",
              direction.slug === current && "font-semibold"
            )}
          >
            {direction.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function BrandPhone({
  children,
  className,
  style,
  label,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  label: string;
}) {
  return (
    <figure className={cn("mx-auto w-full max-w-[390px]", className)} style={style}>
      <div className="overflow-hidden rounded-[2rem] border border-current/20 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between px-6 py-2 text-[11px] tracking-wide">
          <span>9:41</span>
          <span className="h-3 w-20 rounded-full bg-current/20" />
          <span>5G</span>
        </div>
        {children}
      </div>
      <figcaption className="mt-3 text-center text-xs opacity-70">{label}</figcaption>
    </figure>
  );
}

export function BrandSpecGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  );
}

export function BrandSpec({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">
        {title}
      </h3>
      {children}
    </section>
  );
}
