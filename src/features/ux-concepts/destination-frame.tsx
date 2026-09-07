"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  CoachButton,
  ConceptAppTabs,
  ConceptExploreBar,
  ConceptSheets,
  DesktopKeyHint,
  DuoModeToggle,
  FabNewGoal,
} from "@/features/ux-concepts/concept-primitives";
import type {
  DestinationConcept,
  DestinationFamily,
} from "@/features/ux-concepts/destination-catalog";
import type { ConceptSession, ConceptHomeTab } from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const FIVE_TABS = ["plan", "checklist", "progress", "community", "you"] as const;

const FAMILY_HREF: Record<DestinationFamily, string> = {
  progress: "/ux/concepts/progress",
  community: "/ux/concepts/community",
  you: "/ux/concepts/you",
};

export function DestinationFrame({
  family,
  concept,
  siblings,
  session,
  kicker,
  heading,
  subtitle,
  aside,
  extraHeader,
  showSiblings = true,
  children,
}: {
  family: DestinationFamily;
  concept: DestinationConcept;
  siblings: readonly DestinationConcept[];
  session: ConceptSession;
  kicker: string;
  heading: string;
  subtitle: string;
  aside: ReactNode;
  extraHeader?: ReactNode;
  showSiblings?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const tabs = FIVE_TABS;

  const onTabChange = (tab: ConceptHomeTab) => {
    if (tab === "plan" || tab === "checklist") {
      router.push("/ux/concepts/spatial-home");
      return;
    }
    if (tab === family) {
      return;
    }
    if (tab === "progress" || tab === "community" || tab === "you") {
      router.push(FAMILY_HREF[tab]);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ConceptExploreBar
        locked
        direction="B"
        title={`${concept.letter} · ${concept.title}`}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="px-4 pb-2 pt-5 md:px-0 md:pt-0">
            {showSiblings ? (
              <SiblingToggle siblings={siblings} current={concept.href} />
            ) : null}
            <div className={cn("flex items-start justify-between gap-3", showSiblings && "mt-4")}>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {kicker}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                {extraHeader}
              </div>
              <div className="flex flex-col items-end gap-2">
                <DuoModeToggle mode={session.duoMode} onChange={session.setDuoMode} />
                <CoachButton onClick={() => session.setCoachOpen(true)} />
                <DesktopKeyHint />
              </div>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 md:px-0 md:pb-8">
            {children}
          </main>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto flex justify-end">
              <FabNewGoal onClick={() => session.setNewGoalOpen(true)} />
            </div>
            <div className="pointer-events-auto mt-3">
              <ConceptAppTabs
                tabs={[...tabs]}
                active={family}
                onChange={onTabChange}
              />
            </div>
          </div>
        </div>
        <aside className="hidden w-[24rem] shrink-0 md:flex md:flex-col md:gap-4">
          <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/10">
            {aside}
          </div>
          <ConceptAppTabs
            tabs={[...tabs]}
            active={family}
            onChange={onTabChange}
          />
          <Button type="button" onClick={() => session.setNewGoalOpen(true)}>
            New goal
          </Button>
        </aside>
      </div>
      <ConceptSheets session={session} />
    </div>
  );
}

function SiblingToggle({
  siblings,
  current,
}: {
  siblings: readonly DestinationConcept[];
  current: string;
}) {
  return (
    <div
      role="group"
      aria-label="Concept alternatives"
      className="inline-flex max-w-full flex-wrap rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {siblings.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.href === current ? "page" : undefined}
          className={cn(
            "min-h-8 rounded-full px-3 leading-8 touch-manipulation",
            item.href === current
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}

export function DestinationFamilyIndex({
  title,
  live,
  question,
  concepts,
}: {
  title: string;
  live: string;
  question: string;
  concepts: readonly DestinationConcept[];
}) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Exploratory · {live} · not production
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold leading-[1.1] tracking-tight">
          {title}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">{question}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Three directions. Same Thursday seed. Same pattern library. Production
          chrome is unchanged.{" "}
          <Link href="/ux/concepts" className="font-medium text-primary">
            Gallery
          </Link>
        </p>
        <ol className="mt-8 space-y-4">
          {concepts.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-2xl border bg-card p-5 ring-1 ring-foreground/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.letter}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm">{item.bet}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.firstViewport}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
