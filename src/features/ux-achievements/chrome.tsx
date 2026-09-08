"use client";

import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ACHIEVEMENT_CONCEPTS,
  type AchievementConcept,
} from "@/features/ux-achievements/model";

export function AchievementChrome({
  concept,
  stageClassName,
  children,
}: {
  concept: AchievementConcept;
  stageClassName?: string;
  children: ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className={stageClassName ?? "min-h-dvh bg-background text-foreground"}>
      <header className="border-b border-border/60 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/ux/achievements"
            className="flex min-h-11 items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Achievements
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.18em] opacity-70 sm:block">
            {concept.number} / {concept.name}
          </p>
          <nav aria-label="Achievement concepts">
            <ul className="flex flex-wrap justify-end gap-1">
              {ACHIEVEMENT_CONCEPTS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ux/achievements/${item.slug}`}
                    aria-current={item.slug === concept.slug ? "page" : undefined}
                    className={`grid size-10 place-items-center rounded-full text-[11px] font-semibold transition sm:size-11 sm:text-xs ${
                      item.slug === concept.slug
                        ? "bg-foreground text-background"
                        : "opacity-60 hover:opacity-100"
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

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg font-semibold tracking-tight">
              Achievements
            </h1>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md border border-border/70 opacity-70 hover:opacity-100"
              aria-expanded={helpOpen}
              aria-label="Open Achievements help"
              onClick={() => setHelpOpen((open) => !open)}
            >
              <CircleHelp aria-hidden className="size-4" />
            </button>
          </div>
          <p className="text-xs uppercase tracking-[0.16em] opacity-60">
            Study · not shipped
          </p>
        </div>
        {helpOpen ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-70">
            {concept.thesis} Research: {concept.research} Keeps: {concept.whatItKeeps}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function ConceptNote({ concept }: { concept: AchievementConcept }) {
  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
        The bet
      </p>
      <h2 className="mt-2 max-w-3xl font-display text-2xl font-semibold tracking-tight">
        {concept.thesis}
      </h2>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
            Research
          </dt>
          <dd className="mt-1 leading-relaxed opacity-90">{concept.research}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
            Navigation
          </dt>
          <dd className="mt-1 leading-relaxed opacity-90">{concept.navigation}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
            Adds
          </dt>
          <dd className="mt-1 leading-relaxed opacity-90">{concept.whatItAdds}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
            Risk
          </dt>
          <dd className="mt-1 leading-relaxed opacity-90">{concept.risk}</dd>
        </div>
      </dl>
    </section>
  );
}
