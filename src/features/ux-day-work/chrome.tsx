"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import {
  DAY_WORK_CONCEPTS,
  type DayWorkConcept,
} from "@/features/ux-day-work/model";

export function DayWorkChrome({
  concept,
  children,
}: {
  concept: DayWorkConcept;
  children: ReactNode;
}) {
  return (
    <div className="dw-root">
      <header className="border-b px-4 py-3 md:px-6" style={{ borderColor: "var(--dw-rule)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/ux/day-work"
            className="flex min-h-11 items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Day work
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.18em] text-[color:var(--dw-muted)] sm:block">
            {concept.number} / {concept.name}
          </p>
          <nav aria-label="Day work concepts">
            <ul className="flex flex-wrap justify-end gap-1">
              {DAY_WORK_CONCEPTS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ux/day-work/${item.slug}`}
                    aria-label={`Open ${item.name}`}
                    aria-current={item.slug === concept.slug ? "page" : undefined}
                    className={`grid size-10 place-items-center rounded-full text-[11px] font-semibold transition sm:size-11 sm:text-xs ${
                      item.slug === concept.slug
                        ? "bg-[color:var(--dw-ink)] text-[color:var(--dw-paper)]"
                        : "text-[color:var(--dw-muted)] hover:bg-black/5"
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
  concept: DayWorkConcept;
  children?: ReactNode;
}) {
  return (
    <section className="border-t px-5 py-10 md:px-8" style={{ borderColor: "var(--dw-rule)" }}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--dw-muted)]">
            {concept.family === "inspect" ? "Inspect the goal" : "Replace the list"} ·{" "}
            {concept.number}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight">
            {concept.thesis}
          </h2>
          {children}
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <BriefItem term="Object" detail={concept.object} />
          <BriefItem term="Open" detail={concept.open} />
          <BriefItem term="Edit" detail={concept.edit} />
          <BriefItem term="Complete" detail={concept.complete} />
          <BriefItem term="Steal" detail={concept.steal} />
          <BriefItem term="Risk" detail={concept.risk} />
        </dl>
      </div>
    </section>
  );
}

function BriefItem({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--dw-muted)]">
        {term}
      </dt>
      <dd className="mt-1 leading-relaxed text-[color:var(--dw-deep)]">{detail}</dd>
    </div>
  );
}
