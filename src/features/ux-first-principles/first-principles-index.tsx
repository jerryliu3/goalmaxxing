import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import {
  FIRST_PRINCIPLES_CONCEPTS,
  type FirstPrinciplesConceptSlug,
} from "@/features/ux-first-principles/model";

const PALETTE: Record<
  FirstPrinciplesConceptSlug,
  { background: string; foreground: string; accent: string; action: string }
> = {
  orbit: {
    background: "bg-[#12151c]",
    foreground: "text-[#f4f0e6]",
    accent: "bg-[#ff6e4a]",
    action: "bg-[#f4f0e6] text-[#12151c]",
  },
  tide: {
    background: "bg-[#d9f4ef]",
    foreground: "text-[#123a37]",
    accent: "bg-[#087f78]",
    action: "bg-[#123a37] text-[#d9f4ef]",
  },
  relay: {
    background: "bg-[#f6e5d2]",
    foreground: "text-[#3f2417]",
    accent: "bg-[#d95034]",
    action: "bg-[#3f2417] text-[#f6e5d2]",
  },
  fieldbook: {
    background: "bg-[#efe5cc]",
    foreground: "text-[#312b22]",
    accent: "bg-[#b8322a]",
    action: "bg-[#312b22] text-[#efe5cc]",
  },
};

export function FirstPrinciplesIndex() {
  return (
    <main className="min-h-dvh bg-[#f3f0e8] text-[#181815]">
      <section className="px-5 pb-16 pt-8 sm:px-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-[94rem]">
          <div className="flex items-center justify-between border-b border-black/15 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
              Goalmaxxing / Unconstrained study
            </p>
            <Link
              href="/ux/destinations"
              className="text-xs font-semibold text-black/50 hover:text-black"
            >
              Progress & Community
            </Link>
          </div>
          <div className="grid gap-8 pt-10 lg:grid-cols-[1.5fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm font-medium text-black/55">
                No pill, tab, card, checkbox, or dashboard is sacred.
              </p>
              <h1 className="mt-4 max-w-5xl text-[clamp(3.1rem,9vw,8.5rem)] font-semibold leading-[0.86] tracking-[-0.075em]">
                Start with behavior.
                <br />
                Invent the interface.
              </h1>
            </div>
            <div className="max-w-lg pb-2">
              <p className="text-lg leading-relaxed text-black/70">
                Four interaction systems preserve planning, completion, recovery,
                progress, and people while changing the object, navigation,
                gesture, and representation of time.
              </p>
              <a
                href="#concepts"
                className="mt-7 inline-flex min-h-11 items-center gap-2 border-b border-black pb-1 text-sm font-semibold"
              >
                Enter the study
                <ArrowDown aria-hidden className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="concepts" aria-labelledby="concepts-title">
        <h2 id="concepts-title" className="sr-only">
          First-principles interface concepts
        </h2>
        {FIRST_PRINCIPLES_CONCEPTS.map((concept, index) => {
          const palette = PALETTE[concept.slug];
          return (
            <article
              key={concept.slug}
              className={`${palette.background} ${palette.foreground} px-5 py-14 sm:px-8 md:py-20`}
            >
              <div className="mx-auto grid max-w-[94rem] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                  <div className="flex items-baseline gap-4">
                    <span className="text-sm font-semibold opacity-50">
                      {concept.number}
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
                      {concept.object}
                    </p>
                  </div>
                  <h3 className="mt-4 text-6xl font-semibold tracking-[-0.06em] sm:text-7xl">
                    {concept.name}
                  </h3>
                  <p className="mt-5 max-w-xl text-xl leading-relaxed opacity-75">
                    {concept.thesis}
                  </p>
                  <dl className="mt-8 grid max-w-xl gap-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] opacity-50">
                        Move through it
                      </dt>
                      <dd className="mt-1 leading-relaxed">{concept.navigation}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] opacity-50">
                        Mark complete
                      </dt>
                      <dd className="mt-1 leading-relaxed">{concept.completion}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/ux/first-principles/${concept.slug}`}
                    className={`mt-9 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold ${palette.action}`}
                  >
                    Open {concept.name}
                    <ArrowUpRight aria-hidden className="size-4" />
                  </Link>
                </div>
                <ConceptDiagram slug={concept.slug} accent={palette.accent} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto grid max-w-[94rem] gap-8 border-t border-black/15 pt-8 lg:grid-cols-[0.8fr_1.2fr]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">
            Compare the behavior
          </p>
          <div>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              Use the same Thursday. Ask which system makes action, planning,
              recovery, and companionship feel inevitable.
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed text-black/65">
              Judge comprehension before novelty: next action without
              instruction, completion without fear, exact-date planning,
              unplanned recovery, social usefulness without a feed, keyboard
              and screen-reader parity, and a real desktop recomposition.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ConceptDiagram({
  slug,
  accent,
}: {
  slug: FirstPrinciplesConceptSlug;
  accent: string;
}) {
  if (slug === "orbit") {
    return (
      <div
        aria-hidden
        className="relative mx-auto aspect-square w-full max-w-[34rem] rounded-full border border-current/20"
      >
        <div className="absolute inset-[14%] rounded-full border border-current/20" />
        <div className="absolute inset-[31%] rounded-full border border-current/20" />
        <div className={`absolute left-[42%] top-[38%] size-[22%] rounded-full ${accent}`} />
        <div className="absolute left-[14%] top-[22%] size-[13%] rounded-full border-2 border-current" />
        <div className="absolute bottom-[13%] right-[24%] size-[16%] rounded-full border border-current/70" />
      </div>
    );
  }
  if (slug === "tide") {
    return (
      <div
        aria-hidden
        className="relative mx-auto h-[26rem] w-full max-w-[38rem] overflow-hidden border-y border-current/20"
      >
        {[18, 34, 50, 66, 82].map((top) => (
          <div
            key={top}
            className="absolute inset-x-0 border-t border-current/15"
            style={{ top: `${top}%` }}
          />
        ))}
        <div className={`absolute left-[8%] top-[28%] h-[18%] w-[54%] ${accent}`} />
        <div className="absolute right-[9%] top-[53%] h-[15%] w-[42%] border-2 border-current" />
        <div className="absolute inset-y-0 left-[68%] border-l-2 border-current/60" />
      </div>
    );
  }
  if (slug === "relay") {
    return (
      <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[34rem]">
        <div className="absolute inset-[8%] rounded-full border border-current/20" />
        <div className="absolute inset-[20%] rounded-full border border-current/30" />
        <div className={`absolute inset-[32%] rounded-full ${accent}`} />
        <div className="absolute inset-x-[35%] bottom-[2%] h-2 rounded-full bg-current/20" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className="relative mx-auto grid aspect-[1.35] w-full max-w-[42rem] grid-cols-2 overflow-hidden border border-current/30 bg-white/10"
    >
      <div className="border-r border-current/25 p-[10%]">
        <div className="grid h-full grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, index) => (
            <span
              key={index}
              className={index === 16 ? accent : "border border-current/15"}
            />
          ))}
        </div>
      </div>
      <div className="space-y-[11%] p-[12%]">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="border-b border-current/25 pb-[6%]">
            {index === 1 ? (
              <span className={`ml-auto block size-8 rotate-[-9deg] rounded-full ${accent}`} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
