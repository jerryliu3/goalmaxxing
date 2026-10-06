"use client";

import { useState } from "react";
import { SidePanel } from "@/components/ui/bottom-sheet";
import { AppBarMock, ProfileStudyChrome, SettingsRows } from "@/features/ux-profile/chrome";
import { GrowthMock } from "@/features/ux-profile/growth-mock";
import { getProfileConcept } from "@/features/ux-profile/model";
import { PublicProfileView } from "@/features/ux-profile/public-profile-view";
import { PROFILE } from "@/features/ux-profile/seed";
import { useProfileDraft } from "@/features/ux-profile/use-profile-draft";

const concept = getProfileConcept("pin-from-growth");

export function PinFromGrowthConcept() {
  const { draft, pinNotice, actions } = useProfileDraft();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menu = menuOpen ? (
    <ul
      role="menu"
      aria-label="Account"
      className="absolute right-2 top-full z-20 mt-2 w-52 overflow-hidden rounded-[12px] border border-border bg-card py-1 text-sm shadow-lg"
    >
      <li role="none">
        <a
          role="menuitem"
          href="#public-page"
          className="block px-4 py-2.5 hover:bg-muted"
          onClick={() => setMenuOpen(false)}
        >
          View my profile
        </a>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          className="block w-full px-4 py-2.5 text-left hover:bg-muted"
          onClick={() => {
            setMenuOpen(false);
            setSettingsOpen(true);
          }}
        >
          Settings
        </button>
      </li>
      <li role="none">
        <button
          type="button"
          role="menuitem"
          className="block w-full px-4 py-2.5 text-left text-primary hover:bg-muted"
          onClick={() => setMenuOpen(false)}
        >
          Sign out
        </button>
      </li>
    </ul>
  ) : null;

  return (
    <ProfileStudyChrome concept={concept}>
      <AppBarMock
        active="Growth"
        avatarLabel="Account menu"
        onAvatarClick={() => setMenuOpen((open) => !open)}
        avatarMenu={menu}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Curate where it lives
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Growth</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Tap the pin on any medal, record, or finished goal. Three make your profile; stats never
            leave this tab.
          </p>
          <div className="mt-6">
            <GrowthMock pins={draft.pins} notice={pinNotice} onTogglePin={actions.togglePin} />
          </div>
        </div>

        <aside id="public-page" aria-label="Your public page" className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Result · what visitors see
          </p>
          <div className="mt-4 rounded-[20px] border border-border/80 bg-background p-4 sm:p-5">
            <PublicProfileView profile={PROFILE} draft={draft} viewer="public" />
          </div>
        </aside>
      </div>

      <SidePanel open={settingsOpen} onOpenChange={setSettingsOpen} title="Settings">
        <SettingsRows />
      </SidePanel>
    </ProfileStudyChrome>
  );
}
