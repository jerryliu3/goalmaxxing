"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { PROFILE_CONCEPTS, type ProfileConcept } from "@/features/ux-profile/model";
import { IDENTITY } from "@/features/ux-profile/seed";

const APP_TABS = ["Agenda", "Goals", "Growth", "Community"] as const;
export type AppTab = (typeof APP_TABS)[number];

export function ProfileStudyChrome({
  concept,
  children,
}: {
  concept: ProfileConcept;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/60 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/ux/profile" className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <ArrowLeft aria-hidden className="size-4" />
            Profile study
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.18em] opacity-70 sm:block">
            {concept.letter} / {concept.name}
          </p>
          <nav aria-label="Profile concepts">
            <ul className="flex gap-1">
              {PROFILE_CONCEPTS.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ux/profile/${item.slug}`}
                    aria-current={item.slug === concept.slug ? "page" : undefined}
                    className={`grid size-10 place-items-center rounded-full text-xs font-semibold transition ${
                      item.slug === concept.slug ? "bg-foreground text-background" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {item.letter}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-6">
        {children}
        <ConceptNote concept={concept} />
      </div>
    </div>
  );
}

function ConceptNote({ concept }: { concept: ProfileConcept }) {
  const rows = [
    ["Avatar", concept.avatar],
    ["Curation", concept.curation],
    ["Risk", concept.risk],
  ] as const;
  return (
    <section className="mt-14 border-t border-border/60 pt-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">The bet</p>
      <h2 className="mt-2 max-w-3xl font-display text-2xl font-semibold tracking-tight">{concept.thesis}</h2>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">{label}</dt>
            <dd className="mt-1 leading-relaxed opacity-90">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Mock of the proposed header: four tabs plus the avatar button (not a tab). */
export function AppBarMock({
  active,
  avatarActive = false,
  avatarLabel,
  onAvatarClick,
  avatarMenu,
}: {
  active?: AppTab;
  avatarActive?: boolean;
  avatarLabel: string;
  onAvatarClick: () => void;
  avatarMenu?: ReactNode;
}) {
  return (
    <div className="relative flex items-center justify-between gap-3 rounded-[14px] border border-border/70 bg-card px-3 py-2">
      <span className="hidden font-display text-sm font-semibold sm:inline">Goalmaxxing</span>
      <ul className="flex gap-0.5 text-xs sm:gap-1 sm:text-sm" aria-label="App tabs (mock)">
        {APP_TABS.map((tab) => (
          <li
            key={tab}
            aria-current={tab === active ? "page" : undefined}
            className={`rounded-full px-2 py-1 sm:px-3 ${
              tab === active ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
          >
            {tab}
          </li>
        ))}
      </ul>
      <div className={`rounded-full ${avatarActive ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}>
        <UserAvatar
          avatarUrl={IDENTITY.avatarUrl}
          displayName={IDENTITY.displayName}
          username={IDENTITY.username}
          size="sm"
          onClick={onAvatarClick}
          buttonLabel={avatarLabel}
        />
      </div>
      {avatarMenu}
    </div>
  );
}

const SETTINGS_GROUPS = [
  { label: "Plan", items: ["Preferences", "Onboarding", "Check-in"] },
  { label: "Privacy", items: ["Profile visibility", "Blocked people"] },
  { label: "Connected", items: ["Notifications", "Integrations"] },
  { label: "Account", items: ["Name, handle & photo", "Appearance", "Report issue"] },
] as const;

/** Today's settings rows, minus the profile and stats blocks that move out. */
export function SettingsRows() {
  return (
    <div className="space-y-6">
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h4 className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {group.label}
          </h4>
          <ul className="mt-2 divide-y divide-border/70 rounded-[14px] border border-border/70 bg-card">
            {group.items.map((item) => (
              <li key={item} className="flex min-h-12 items-center justify-between px-4 text-sm">
                {item}
                <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="px-1 text-sm font-semibold text-primary">Sign out</p>
    </div>
  );
}
