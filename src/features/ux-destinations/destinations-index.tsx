import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  DESTINATION_CONCEPTS,
  type DestinationFamily,
} from "@/features/ux-destinations/model";

export function DestinationsIndex() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="px-5 pb-12 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Goalmaxxing / Destination study
            </p>
            <Link
              href="/ux/achievements"
              className="text-xs font-semibold text-muted-foreground"
            >
              Achievements study
            </Link>
          </div>
          <h1 className="mt-10 max-w-4xl font-display text-[clamp(2.4rem,7vw,5.5rem)] font-semibold leading-[0.9] tracking-tight">
            Progress and Community, at Plan quality.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Progress stays one page. Wide screens keep goals beside the map;
            narrow screens put the heatmap first. Community stays Team, then a
            challenge rail and a wide board carousel.
          </p>
        </div>
      </section>
      <FamilyBlock
        family="progress"
        kicker="Progress"
        title="Show the evidence without a dump."
        body="Atlas/Pins is the lock: wide list beside the map, narrow heatmap then a goal rail, runway for long milestone lists. Quiet dots vs numbered cells is a mark-style choice. Ribbon is saved, not locked."
      />
      <FamilyBlock
        family="community"
        kicker="Community"
        title="A club, not a stack of cards."
        body="Club is the lock: challenge cards in a rail, board seasons as almost full-width posters you still snap between. Ranks opens the field on joined tiles. Stage keeps the thumbnail-rail alternative. Presence is the denser one-composition take."
      />
    </main>
  );
}

function FamilyBlock({
  family,
  kicker,
  title,
  body,
}: {
  family: DestinationFamily;
  kicker: string;
  title: string;
  body: string;
}) {
  const concepts = DESTINATION_CONCEPTS.filter((item) => item.family === family);
  return (
    <section className="border-t border-border px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {kicker}
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {concepts.map((concept) => (
            <li key={concept.slug}>
              <Link
                href={`/ux/destinations/${concept.family}/${concept.slug}`}
                aria-label={`Open ${concept.name}`}
                className="group flex h-full flex-col rounded-[12px] border border-border p-5 transition hover:border-foreground/30"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {concept.number}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  {concept.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {concept.thesis}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
                  Open
                  <ArrowUpRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
