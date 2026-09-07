import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  DESTINATION_CONCEPTS,
  type DestinationConcept,
} from "@/features/ux-destinations/model";

export function DestinationChrome({
  concept,
  title,
  modes,
  mode,
  onModeChange,
  trailing,
  children,
}: {
  concept: DestinationConcept;
  title: string;
  modes?: readonly { id: string; label: string }[];
  mode?: string;
  onModeChange?: (id: string) => void;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const familyConcepts = DESTINATION_CONCEPTS.filter(
    (item) => item.family === concept.family
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/ux/destinations"
            className="flex min-h-11 items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Destinations
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:block">
            {concept.number} / {concept.name}
          </p>
          <nav aria-label={`${concept.family} concepts`}>
            <ul className="flex gap-1">
              {familyConcepts.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ux/destinations/${concept.family}/${item.slug}`}
                    aria-current={item.slug === concept.slug ? "page" : undefined}
                    className={`grid size-11 place-items-center rounded-full text-xs font-semibold ${
                      item.slug === concept.slug
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <div className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-semibold tracking-tight">
                {title}
              </h1>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                aria-expanded={helpOpen}
                aria-label={`Open ${title} help`}
                onClick={() => setHelpOpen((open) => !open)}
              >
                <CircleHelp aria-hidden className="size-4" />
              </button>
            </div>
            {trailing}
          </div>
          {modes && onModeChange && mode ? (
            <div className="mt-3 flex w-full items-center gap-2">
              <div
                role="group"
                aria-label={`${title} view mode`}
                className="inline-flex rounded-[10px] bg-muted p-0.5 text-xs font-medium"
              >
                {modes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={mode === item.id}
                    onClick={() => onModeChange(item.id)}
                    className={
                      mode === item.id
                        ? "min-h-8 rounded-[8px] bg-background px-3 text-foreground"
                        : "min-h-8 rounded-[8px] px-3 text-muted-foreground"
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {helpOpen ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {concept.thesis} Keeps: {concept.whatItKeeps}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConceptNote({
  concept,
}: {
  concept: DestinationConcept;
}) {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        The bet
      </p>
      <h2 className="mt-2 max-w-3xl font-display text-2xl font-semibold tracking-tight">
        {concept.thesis}
      </h2>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Navigation
          </dt>
          <dd className="mt-1 leading-relaxed">{concept.navigation}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Adds
          </dt>
          <dd className="mt-1 leading-relaxed">{concept.whatItAdds}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Keeps
          </dt>
          <dd className="mt-1 leading-relaxed">{concept.whatItKeeps}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Risk
          </dt>
          <dd className="mt-1 leading-relaxed">{concept.risk}</dd>
        </div>
      </dl>
    </section>
  );
}
