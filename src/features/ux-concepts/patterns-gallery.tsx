"use client";

import Link from "next/link";
import {
  ConceptSheets,
  GoalRow,
  RecoverBanner,
  WorkPill,
} from "@/features/ux-concepts/concept-primitives";
import {
  APPLICATION_ATOMS,
  APPLICATION_COLOR,
  APPLICATION_PRINCIPLES,
} from "@/features/ux-concepts/pattern-library";
import { conceptItems } from "@/features/ux-concepts/seed";
import { useConceptSession } from "@/features/ux-concepts/use-concept-session";

export function PatternsGallery() {
  const session = useConceptSession("plan");
  const tempo = conceptItems.find((item) => item.id === "tempo-run");
  const launch = conceptItems.find((item) => item.id === "launch-notes");
  const strength = conceptItems.find((item) => item.id === "strength");

  return (
    <div className="min-h-dvh bg-slate-50">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Pattern library · exploratory
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold leading-[1.1] tracking-tight">
          Patterns that should hold everywhere
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Home IA is Spatial Plan (B). This page is the cross-app craft we
          agreed on while building it. Visual brand leading lock is Gazetteer
          (Nest completion, Soft paper corners; Col is the runner-up) at{" "}
          <Link href="/ux/brand" className="font-medium text-primary">
            /ux/brand
          </Link>
          . Applied kits:{" "}
          <Link href="/ux/brand/kit-gazetteer" className="font-medium text-primary">
            Gazetteer kit
          </Link>
          {" · "}
          <Link href="/ux/brand/kit-col" className="font-medium text-primary">
            Col kit
          </Link>
          . Production chrome is unchanged.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/ux/concepts/spatial-home" className="font-medium text-primary">
            Spatial Home
          </Link>
          {" · "}
          <Link href="/ux/concepts" className="font-medium text-primary">
            Gallery
          </Link>
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Principles</h2>
          <ol className="mt-4 space-y-4">
            {APPLICATION_PRINCIPLES.map((item, index) => (
              <li key={item.title}>
                <p className="text-sm font-semibold">
                  {index + 1}. {item.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Atoms</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {APPLICATION_ATOMS.map((item) => (
              <li key={item.name}>
                <span className="font-medium">{item.name}.</span>{" "}
                <span className="text-muted-foreground">{item.use}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Work pill
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan week only. Drag later. Tap opens Day.
          </p>
          <div className="mt-4 flex max-w-md flex-col gap-1.5">
            {tempo ? (
              <WorkPill
                item={tempo}
                completed={session.isComplete(tempo.id)}
                onClick={() => session.setSelectedItemId(tempo.id)}
              />
            ) : null}
            {launch ? (
              <WorkPill
                item={launch}
                completed={session.isComplete(launch.id)}
                onClick={() => session.setSelectedItemId(launch.id)}
              />
            ) : null}
            {strength ? (
              <WorkPill
                item={strength}
                completed={false}
                unplaced={!session.recovered}
                onClick={() => session.setRecoverOpen(true)}
              />
            ) : null}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Work row
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Day is the checklist. Complete lives here. Show unplanned for items never placed.
          </p>
          <div className="mt-2 max-w-md">
            {tempo ? (
              <GoalRow
                item={tempo}
                completed={session.isComplete(tempo.id)}
                onToggle={() => session.toggleComplete(tempo.id)}
                onOpen={() => session.setSelectedItemId(tempo.id)}
              />
            ) : null}
            {launch ? (
              <GoalRow
                item={launch}
                completed={session.isComplete(launch.id)}
                onToggle={() => session.toggleComplete(launch.id)}
                onOpen={() => session.setSelectedItemId(launch.id)}
              />
            ) : null}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recover banner
          </h2>
          <div className="mt-4 max-w-md">
            <RecoverBanner
              recovered={session.recovered}
              onOpen={() => session.setRecoverOpen(true)}
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Color meaning</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {APPLICATION_COLOR.map((item) => (
              <li key={item.name}>
                <span className="font-medium">{item.name}.</span>{" "}
                <span className="text-muted-foreground">{item.use}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Not yet applied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Progress, Community, and You now have leading hybrids at{" "}
            <Link href="/ux/concepts/progress" className="font-medium text-primary">
              /ux/concepts/progress
            </Link>
            ,{" "}
            <Link href="/ux/concepts/community" className="font-medium text-primary">
              /ux/concepts/community
            </Link>
            , and{" "}
            <Link href="/ux/concepts/you" className="font-medium text-primary">
              /ux/concepts/you
            </Link>
            . The earlier three-way shells remain as alternatives.
          </p>
        </section>
      </main>
      <ConceptSheets session={session} />
    </div>
  );
}
