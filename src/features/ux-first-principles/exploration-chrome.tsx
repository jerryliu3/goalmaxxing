import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  FIRST_PRINCIPLES_CONCEPTS,
  type FirstPrinciplesConcept,
} from "@/features/ux-first-principles/model";

export function ExplorationChrome({
  concept,
  children,
}: {
  concept: FirstPrinciplesConcept;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#f1efe9] text-[#171714]">
      <header className="relative z-50 border-b border-black/10 bg-[#f7f5ef]/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[94rem] items-center justify-between gap-4">
          <Link
            href="/ux/first-principles"
            className="flex min-h-11 items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft aria-hidden className="size-4" />
            First principles
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.2em] text-black/50 sm:block">
            {concept.number} / {concept.name}
          </p>
          <nav aria-label="First-principles concepts">
            <ul className="flex items-center gap-1">
              {FIRST_PRINCIPLES_CONCEPTS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ux/first-principles/${item.slug}`}
                    aria-label={`Open ${item.name}`}
                    aria-current={item.slug === concept.slug ? "page" : undefined}
                    className={`grid size-11 place-items-center rounded-full text-xs font-semibold transition ${
                      item.slug === concept.slug
                        ? "bg-black text-white"
                        : "text-black/55 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    {item.number}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

export function ConceptBrief({
  concept,
  children,
}: {
  concept: FirstPrinciplesConcept;
  children?: ReactNode;
}) {
  return (
    <section className="border-t border-current/15 px-5 py-8 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-55">
            The bet
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            {concept.thesis}
          </h2>
          {children}
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <BriefItem term="Object" detail={concept.object} />
          <BriefItem term="Navigation" detail={concept.navigation} />
          <BriefItem term="Complete" detail={concept.completion} />
          <BriefItem term="Calendar" detail={concept.calendar} />
          <BriefItem term="Primary risk" detail={concept.risk} />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-50">
              Lineage
            </dt>
            <dd className="mt-1 leading-relaxed">{concept.references.join(" · ")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function BriefItem({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-50">
        {term}
      </dt>
      <dd className="mt-1 leading-relaxed">{detail}</dd>
    </div>
  );
}

export function ExploreLink({
  href,
  children,
  tone = "dark",
}: {
  href: string;
  children: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
        tone === "dark"
          ? "bg-black text-white hover:bg-black/80"
          : "bg-white text-black hover:bg-white/85"
      }`}
    >
      {children}
      <ArrowUpRight aria-hidden className="size-4" />
    </Link>
  );
}
