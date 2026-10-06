"use client";

import { useState } from "react";
import { PencilLine } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AppBarMock, ProfileStudyChrome, SettingsRows } from "@/features/ux-profile/chrome";
import { currentGoals, getProfileConcept, type ProfileSection } from "@/features/ux-profile/model";
import { EditButton, FeaturedGoalPicker, ShowcasePicker } from "@/features/ux-profile/pickers";
import { PublicProfileView } from "@/features/ux-profile/public-profile-view";
import { PROFILE } from "@/features/ux-profile/seed";
import { useProfileEditSession } from "@/features/ux-profile/use-profile-edit-session";

const concept = getProfileConcept("settings-preview");

type Picker = "pins" | "goals" | null;

/**
 * E: Settings opens with your full public profile, the same PublicProfileView
 * a visitor gets. "Edit profile" in the box's header turns that box into the
 * editor in place (owner render + the card's editor mode); Done keeps the
 * edits, Cancel discards them. Settings rows follow; no stats.
 */
export function SettingsPreviewConcept() {
  const { profile, draft, pinNotice, actions, editing, canFinish, session, cardEditor } =
    useProfileEditSession(PROFILE);
  const [picker, setPicker] = useState<Picker>(null);

  const finish = (commit: boolean) => {
    setPicker(null);
    if (commit) session.done();
    else session.cancel();
  };

  const sectionAction = (section: ProfileSection) =>
    section === "goals" ? <EditButton label="Choose goals" onClick={() => setPicker("goals")} /> : null;

  return (
    <ProfileStudyChrome concept={concept}>
      <AppBarMock avatarActive avatarLabel="Settings" onAvatarClick={() => undefined} />

      <div className="mx-auto mt-8 max-w-3xl space-y-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>

        <section
          aria-label="Your public profile"
          className={`rounded-[18px] border bg-card p-5 shadow-[0_1px_0_rgb(0_0_0/0.03)] sm:p-6 ${
            editing ? "border-dashed border-primary/60" : "border-border/80"
          }`}
        >
          {editing ? (
            <div className="sticky top-2 z-10 -mx-2 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-primary/40 bg-card/95 px-3 py-2.5 backdrop-blur">
              <p role="status" className="min-w-0 flex-1 text-sm">
                Editing — changes are visible to everyone when you press Done
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => finish(false)}
                  className="inline-flex min-h-9 items-center rounded-full border border-border px-3.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => finish(true)}
                  disabled={!canFinish}
                  className="inline-flex min-h-9 items-center rounded-full bg-foreground px-4 text-xs font-semibold text-background disabled:opacity-50"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Your Goalmaxxing profile</h2>
              <button
                type="button"
                onClick={session.start}
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background"
              >
                <PencilLine aria-hidden className="size-3.5" />
                Edit profile
              </button>
            </div>
          )}

          <PublicProfileView
            profile={profile}
            draft={draft}
            viewer={editing ? "owner" : "public"}
            owner={{
              onBioChange: actions.setBio,
              onEditPins: () => setPicker("pins"),
              sectionAction,
              cardEditor,
            }}
            copyLink
          />
          {editing && !canFinish ? (
            <p role="alert" className="mt-4 text-xs font-semibold text-primary">
              Usernames are 3–32 lowercase letters, numbers or underscores.
            </p>
          ) : null}
        </section>

        <SettingsRows />
      </div>

      <BottomSheet
        open={picker === "pins"}
        onOpenChange={(next) => setPicker(next ? "pins" : null)}
        title="Edit showcase"
        description="Pick up to three from Growth and Past goals."
      >
        <ShowcasePicker catalog={profile.catalog} pins={draft.pins} notice={pinNotice} onToggle={actions.togglePin} />
      </BottomSheet>
      <BottomSheet
        open={picker === "goals"}
        onOpenChange={(next) => setPicker(next ? "goals" : null)}
        title="Featured goals"
        description="Private goals never appear on your profile."
      >
        <FeaturedGoalPicker
          entries={currentGoals(profile, "owner")}
          featuredIds={draft.featuredGoalIds}
          onToggle={actions.toggleFeaturedGoal}
        />
      </BottomSheet>
    </ProfileStudyChrome>
  );
}
