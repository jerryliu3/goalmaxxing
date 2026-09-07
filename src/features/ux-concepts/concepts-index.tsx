import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONCEPT_PARTNER_NAME,
  CONCEPT_TODAY_LABEL,
  CONCEPT_TODAY_WEEKDAY,
} from "@/features/ux-concepts/seed";
import { DESTINATION_FAMILIES } from "@/features/ux-concepts/destination-catalog";

const OPEN_QUESTIONS = [
  "Exact copy and default for Show unplanned on Day?",
  "Should team pairing also appear in You/settings, or only next to team goals?",
] as const;

const ARCHIVE = [
  {
    href: "/ux/concepts/today-home",
    letter: "A",
    title: "Today Home",
    role: "Checklist craft, not Home",
    note: "Steal the rows, “N left,” and Recover language into Day. Day is the checklist.",
  },
  {
    href: "/ux/concepts/spatial-plan",
    letter: "B",
    title: "Spatial Plan v1",
    role: "Archive",
    note: "Month grid with the list stacked under it. The composition v2 and v3 still treated the list as the calendar’s child.",
  },
  {
    href: "/ux/concepts/progress-pulse",
    letter: "C",
    title: "Progress Pulse",
    role: "Rejected as Home",
    note: "Pulse can still live under Progress as an earlier alternative.",
  },
] as const;

export function ConceptsIndex() {
  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_12%_-8%,rgba(191,219,254,0.7),transparent_55%),radial-gradient(700px_circle_at_92%_8%,rgba(219,234,254,0.75),transparent_52%)]" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Exploratory · leading hybrids · not production
        </p>
        <h1 className="mt-2 max-w-2xl text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-4xl">
          Home is locked. Destinations now have a leading hybrid.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          The three option groups were choose-between shells. These hybrids keep
          the missing product: mutable goal heatmaps, Duo as a platform field,
          challenges and boards, identity on You. Production{" "}
          <code className="text-foreground">AppShell</code> is unchanged. Visual
          brand stays at{" "}
          <Link href="/ux/brand" className="font-medium text-primary">
            /ux/brand
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/ux/concepts/progress">
              Open Progress
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/ux/concepts/community">
              Open Community
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/ux/concepts/you">
              Open You
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <section className="mt-10 rounded-2xl border bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Locked · Home
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Spatial Home v8
          </h2>
          <p className="mt-2 text-sm">
            Week, Month, and Day are Plan views. Day is the checklist. Solo/Duo
            is a platform field — Duo week is the shared board. The clickable
            shell may lag these locks.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {CONCEPT_TODAY_WEEKDAY} · {CONCEPT_TODAY_LABEL} · Tempo run ·
            Launch notes (task) · Review offer · Strength unplaced ·{" "}
            {CONCEPT_PARTNER_NAME} completed Yoga.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/ux/concepts/spatial-home"
              className="text-sm font-medium text-primary"
            >
              Open Spatial Home
            </Link>
            <Link
              href="/ux/concepts/patterns"
              className="text-sm font-medium text-primary"
            >
              Pattern library
            </Link>
          </div>
        </section>

        {DESTINATION_FAMILIES.map((family) => (
          <section
            key={family.family}
            className="mt-10 rounded-2xl border bg-card p-5 ring-1 ring-foreground/10"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {family.live}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {family.label}
            </h2>
            <p className="mt-1 text-sm">{family.lockNote}</p>
            <Link
              href={family.lock.href}
              className="mt-4 block rounded-xl border bg-background p-4 ring-1 ring-primary/20"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {family.lock.letter} · Leading
              </p>
              <h3 className="mt-1 font-semibold tracking-tight">
                {family.lock.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {family.lock.firstViewport}
              </p>
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Earlier alternatives
            </p>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {family.concepts.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border bg-background p-4 ring-1 ring-foreground/5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.letter}
                  </p>
                  <h3 className="mt-1 font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.firstViewport}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">
            Still open inside B
          </h2>
          <ol className="mt-3 space-y-2 text-sm">
            {OPEN_QUESTIONS.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="w-5 shrink-0 font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                {item}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Reference and archive
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {ARCHIVE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col rounded-2xl border bg-card p-5 ring-1 ring-foreground/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.letter} · {item.role}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
