"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { RECOVERY_CONCEPTS, type RecoveryConcept } from "@/features/ux-recovery/concepts";
import "@/features/ux-recovery/recovery.css";

export function RecoveryChrome({ concept, children }: { concept: RecoveryConcept; children: ReactNode }) {
  return (
    <div className="rc-root">
      <header className="border-b border-[color:var(--rc-rule)] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/ux/recovery" className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <ArrowLeft aria-hidden className="size-4" />
            Recovery
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.18em] text-[color:var(--rc-muted)] sm:block">
            {concept.number} / {concept.name}
          </p>
          <nav aria-label="Recovery concepts">
            <ul className="flex gap-1">
              {RECOVERY_CONCEPTS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ux/recovery/${item.slug}`}
                    aria-label={`Open ${item.name}`}
                    aria-current={item.slug === concept.slug ? "page" : undefined}
                    className={`grid size-10 place-items-center rounded-full text-xs font-semibold transition sm:size-11 ${
                      item.slug === concept.slug
                        ? "bg-[color:var(--rc-ink)] text-[color:var(--rc-paper)]"
                        : "text-[color:var(--rc-muted)] hover:bg-black/5"
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
      <ConceptBrief concept={concept} />
    </div>
  );
}

/** Mock Agenda header so every concept starts from the production entry point. */
export function AgendaHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-[color:var(--rc-rule)] pb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--rc-muted)]">
        Agenda · Wednesday, October 7
      </p>
      {children}
    </div>
  );
}

function ConceptBrief({ concept }: { concept: RecoveryConcept }) {
  const items = [
    ["Review", concept.review],
    ["Edit a day", concept.edit],
    ["Risk", concept.risk],
  ] as const;
  return (
    <section className="border-t border-[color:var(--rc-rule)] px-5 py-10 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--rc-muted)]">
            The bet · {concept.number}
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {concept.thesis}
          </h2>
        </div>
        <dl className="grid gap-4 text-sm">
          {items.map(([term, detail]) => (
            <div key={term}>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--rc-muted)]">{term}</dt>
              <dd className="mt-1 leading-relaxed text-[color:var(--rc-deep)]">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
