"use client";

import { useState } from "react";
import { Eye, PencilLine } from "lucide-react";
import { BottomSheet, SidePanel } from "@/components/ui/bottom-sheet";
import { AppBarMock, ProfileStudyChrome, SettingsRows } from "@/features/ux-profile/chrome";
import { BIO_LIMIT, getProfileConcept } from "@/features/ux-profile/model";
import { FeaturedGoalPicker, ShowcasePicker } from "@/features/ux-profile/pickers";
import { PublicProfileView } from "@/features/ux-profile/public-profile-view";
import { PROFILE } from "@/features/ux-profile/seed";
import { useProfileDraft } from "@/features/ux-profile/use-profile-draft";

const concept = getProfileConcept("settings-card");

export function SettingsCardConcept() {
  const { draft, pinNotice, actions } = useProfileDraft();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <ProfileStudyChrome concept={concept}>
      <AppBarMock avatarActive avatarLabel="Settings" onAvatarClick={() => undefined} />

      <div className="mx-auto mt-8 max-w-xl space-y-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>

        <section
          aria-label="Your public profile"
          className="rounded-[18px] border border-border/80 bg-card p-5 shadow-[0_1px_0_rgb(0_0_0/0.03)]"
        >
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Your public profile
            </h2>
            <p className="text-[11px] text-muted-foreground">What visitors see</p>
          </div>
          <PublicProfileView profile={PROFILE} draft={draft} viewer="public" variant="compact" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold"
            >
              <Eye aria-hidden className="size-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background"
            >
              <PencilLine aria-hidden className="size-4" />
              Edit showcase
            </button>
          </div>
        </section>

        <SettingsRows />
      </div>

      <BottomSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Preview · what others see"
        description="The same page a visitor gets at your link."
      >
        <PublicProfileView profile={PROFILE} draft={draft} viewer="public" />
      </BottomSheet>

      <SidePanel open={editOpen} onOpenChange={setEditOpen} title="Edit showcase">
        <div className="space-y-8">
          <label className="block space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Bio
            </span>
            <textarea
              rows={2}
              maxLength={BIO_LIMIT}
              value={draft.bio}
              onChange={(event) => actions.setBio(event.target.value)}
              className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <ShowcasePicker
            catalog={PROFILE.catalog}
            pins={draft.pins}
            notice={pinNotice}
            onToggle={actions.togglePin}
          />
          <section aria-label="Featured goals" className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Featured goals
            </h4>
            <FeaturedGoalPicker
              goals={PROFILE.goals}
              featuredIds={draft.featuredGoalIds}
              onToggle={actions.toggleFeaturedGoal}
            />
          </section>
        </div>
      </SidePanel>
    </ProfileStudyChrome>
  );
}
