"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, Settings } from "lucide-react";
import { BottomSheet, SidePanel } from "@/components/ui/bottom-sheet";
import { AppBarMock, ProfileStudyChrome, SettingsRows } from "@/features/ux-profile/chrome";
import { currentGoals, getProfileConcept, type ProfileSection } from "@/features/ux-profile/model";
import { EditButton, FeaturedGoalPicker, ShowcasePicker } from "@/features/ux-profile/pickers";
import { PublicProfileView } from "@/features/ux-profile/public-profile-view";
import { PROFILE } from "@/features/ux-profile/seed";
import { useProfileDraft } from "@/features/ux-profile/use-profile-draft";

const concept = getProfileConcept("owner-page");

type Editor = "showcase" | "goals" | null;

export function OwnerPageConcept() {
  const { draft, pinNotice, actions } = useProfileDraft();
  const [preview, setPreview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);

  const sectionAction = (section: ProfileSection) =>
    section === "showcase" ? (
      <EditButton label="Edit showcase" onClick={() => setEditor("showcase")} />
    ) : section === "goals" ? (
      <EditButton label="Choose goals" onClick={() => setEditor("goals")} />
    ) : null;

  return (
    <ProfileStudyChrome concept={concept}>
      <AppBarMock avatarActive avatarLabel="Your profile" onAvatarClick={() => setPreview(false)} />

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Your profile</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={preview}
              onClick={() => setPreview((value) => !value)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
                preview ? "border-foreground bg-foreground text-background" : "border-border bg-card"
              }`}
            >
              <Eye aria-hidden className="size-4" />
              Preview as visitor
            </button>
            <button
              type="button"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
              className="grid size-10 place-items-center rounded-full border border-border bg-card"
            >
              <Settings aria-hidden className="size-4" />
            </button>
          </div>
        </div>

        {preview ? (
          <div
            role="status"
            className="mt-5 flex items-center justify-between gap-3 rounded-[12px] bg-foreground px-4 py-3 text-sm text-background"
          >
            <span>
              <span className="font-semibold">This is what others see.</span> Edit controls and empty
              slots are hidden.
            </span>
            <button type="button" className="shrink-0 font-semibold underline" onClick={() => setPreview(false)}>
              Exit preview
            </button>
          </div>
        ) : null}

        <div className="mt-6">
          <PublicProfileView
            profile={PROFILE}
            draft={draft}
            viewer={preview ? "public" : "owner"}
            owner={{ onBioChange: actions.setBio, sectionAction }}
          />
        </div>

        {preview ? null : (
          <Link
            href="/achievements"
            className="mt-8 flex items-center justify-between gap-4 rounded-[14px] border border-dashed border-border px-5 py-4"
          >
            <span className="text-sm text-muted-foreground">
              Score, stats, heatmap and every medal live in Growth. This page shows only what you pin.
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
              See your Growth
              <ArrowRight aria-hidden className="size-4" />
            </span>
          </Link>
        )}
      </div>

      <BottomSheet
        open={editor === "showcase"}
        onOpenChange={(open) => setEditor(open ? "showcase" : null)}
        title="Edit showcase"
        description="Pick up to three things from Growth and Past goals."
      >
        <ShowcasePicker
          catalog={PROFILE.catalog}
          pins={draft.pins}
          notice={pinNotice}
          onToggle={actions.togglePin}
        />
      </BottomSheet>
      <BottomSheet
        open={editor === "goals"}
        onOpenChange={(open) => setEditor(open ? "goals" : null)}
        title="Featured goals"
        description="Private goals never appear on your profile."
      >
        <FeaturedGoalPicker
          entries={currentGoals(PROFILE, "owner")}
          featuredIds={draft.featuredGoalIds}
          onToggle={actions.toggleFeaturedGoal}
        />
      </BottomSheet>
      <SidePanel open={settingsOpen} onOpenChange={setSettingsOpen} title="Settings">
        <SettingsRows />
      </SidePanel>
    </ProfileStudyChrome>
  );
}
