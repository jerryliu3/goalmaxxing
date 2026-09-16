import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  BRAND_ATMOSPHERES,
  BRAND_FINALISTS,
  BRAND_KITS,
  BRAND_MIXES,
  BRAND_ROUND_ONE,
  BRAND_STUDIES,
} from "@/features/ux-brand/catalog";
import { BrandExploreBar } from "@/features/ux-brand/brand-stage";

function DirectionCard({
  letter,
  epithet,
  screenshot,
  name,
  feeling,
  motif,
  href,
  mix,
  card,
}: {
  letter: string;
  epithet: string;
  screenshot?: boolean;
  name: string;
  feeling: string;
  motif: string;
  href: string;
  mix?: string;
  card: { bg: string; fg: string; accent: string; type: string };
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[260px] flex-col justify-between overflow-hidden rounded-3xl p-6"
      style={{
        background: card.bg,
        color: card.fg,
        fontFamily: card.type,
      }}
    >
      <div>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: card.accent }}
        >
          {letter} · {mix ?? epithet}
          {screenshot ? " · screenshot lineage" : ""}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{name}</h2>
        <p className="mt-2 max-w-sm text-sm opacity-80">{feeling}</p>
      </div>
      <p className="mt-6 text-sm opacity-75">{motif}</p>
      <span
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: card.accent }}
      >
        Open {name}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function BrandIndex() {
  return (
    <div className="min-h-dvh bg-[#f6f4f0] text-zinc-900">
      <BrandExploreBar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Unlisted · direct link only · noindex · not production
        </p>
        <h1 className="mt-2 max-w-3xl text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-4xl">
          Visual language gallery for Goalmaxxing.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-600">
          Share this URL. It is not linked from the marketing site or sitemap.
          Spatial Plan stays the information architecture. Gazetteer is the
          preserved leading visual lock and Col is the runner-up. The new
          Atmospheres round deliberately steps outside that family without
          replacing the lock. Production chrome is unchanged.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-zinc-500">
          Lock notes in{" "}
          <code className="text-zinc-800">docs/ux/brand-lock-gazetteer-col.md</code>
          . Contour and Folio are unchanged from round 1.
        </p>

        <Link href="/ux/brand/card-materials" className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-300 bg-white/60 p-5">
          <span><span className="block text-xs uppercase tracking-wide text-zinc-500">Material study · eight directions</span><span className="mt-1 block text-xl font-medium">Goal cards you want to hold</span><span className="mt-1 block text-sm text-zinc-600">Refined glass, ceramic, and foil, plus three new premium finishes. Explore the same Tempo card in each.</span></span>
          <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
        </Link>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Studies
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500">
            Toggle a second color on Gazetteer paper and on the live blue app.
            Today and the selected row change. Identity (rust or blue) stays
            put. Not a lock.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {BRAND_STUDIES.map((direction) => (
              <DirectionCard key={direction.slug} {...direction} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">
            Atmospheres · complete worlds
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500">
            Nine independent systems across minimal, water, future, cyberpunk,
            workshop, mountain, nature, solar, and aviation. Each page carries
            one idea through type, palette, material, geometry, background,
            navigation, and completion. They are alternatives for exploration,
            not additions to the Gazetteer recipe. Current shortlist, not a
            lock: Atelier, Summit Night, Riverstone.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BRAND_ATMOSPHERES.map((direction) => (
              <DirectionCard key={direction.slug} {...direction} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">Applied kit</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Gazetteer (Newsreader) and Col (Figtree on Col furniture). Nest is
            the completion mark. Soft paper is the corner lock; Square and
            Pills stay as a comparison. Not a restyle of every concept
            destination yet.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {BRAND_KITS.map((direction) => (
              <DirectionCard key={direction.slug} {...direction} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">Type experiments</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Sans restyles of Gazetteer and Col. Kept for the record; not the
            lock. Nest and the other inner/outer marks still switch on these
            pages.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {BRAND_FINALISTS.map((direction) => (
              <DirectionCard key={direction.slug} {...direction} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">Round 1</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Five original poles. Forge is the only screenshot-lineage dark serif.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {BRAND_ROUND_ONE.map((direction) => (
              <DirectionCard key={direction.slug} {...direction} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">
            Mixes of Contour, Folio, and Dawn Ridge
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Archive of the eight mixes. Original Gazetteer is the vibe lock
            (Nest on the Thursday list). Original Col keeps the cairn stack as
            the historical object.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {BRAND_MIXES.map((direction) => (
              <DirectionCard key={direction.slug} {...direction} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
