"use client";

import { useState } from "react";
import { PencilLine } from "lucide-react";
import {
  PUBLIC_PROFILE_PIN_LIMIT,
  PUBLIC_PROFILE_RECORD_LIMIT,
  type PublicProfileBundle,
} from "@cadence/shared/social/public-profile";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import type { useProfileEditSession } from "@/features/settings/use-profile-edit-session";
import { FeaturedGoalPicker, ShowcasePicker } from "@/features/social/public-profile/profile-pickers";
import { PublicProfileView } from "@/features/social/public-profile/public-profile-view";
import { cn } from "@/lib/utils";

type Picker = "pins" | "records" | "goals" | null;

/**
 * Settings opens with the same profile a visitor sees. Edit profile turns the
 * box into the editor in place; Done publishes, Cancel discards. No stats.
 */
export function SettingsProfileBox({
  bundle,
  session,
}: {
  bundle: PublicProfileBundle | null;
  session: ReturnType<typeof useProfileEditSession>;
}) {
  const [picker, setPicker] = useState<Picker>(null);
  const { editing, draft } = session;

  const finish = (commit: boolean) => {
    setPicker(null);
    if (commit) void session.done();
    else session.cancel();
  };

  return (
    <section
      aria-label="Your Goalmaxxing profile"
      className={cn(
        "rounded-[18px] border bg-card p-5 sm:p-6",
        editing ? "border-dashed border-primary/60" : "border-border/80"
      )}
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
              disabled={session.saving}
              className="inline-flex min-h-9 items-center rounded-full border border-border px-3.5 text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => finish(true)}
              disabled={!session.canFinish}
              className="inline-flex min-h-9 items-center rounded-full bg-foreground px-4 text-xs font-semibold text-background disabled:opacity-50"
            >
              {session.saving ? "Saving…" : "Done"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="type-eyebrow text-[11px] text-muted-foreground">Public profile</h2>
          <button
            type="button"
            onClick={session.start}
            disabled={!bundle}
            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background disabled:opacity-50"
          >
            <PencilLine aria-hidden className="size-3.5" />
            Edit profile
          </button>
        </div>
      )}

      {bundle ? (
        <PublicProfileView
          bundle={bundle}
          copyLink
          owner={
            draft
              ? {
                  draft,
                  cardEditor: session.cardEditor,
                  onBioChange: session.actions.setBio,
                  onEditRecords: () => setPicker("records"),
                  onEditPins: () => setPicker("pins"),
                  onChooseGoals: () => setPicker("goals"),
                }
              : undefined
          }
        />
      ) : (
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      )}
      {editing && !session.usernameValid ? (
        <p role="alert" className="mt-4 text-xs font-semibold text-primary">
          Usernames are 3–32 lowercase letters, numbers or underscores.
        </p>
      ) : null}

      {bundle?.showcaseCatalog && draft ? (
        <BottomSheet
          open={picker === "pins"}
          onOpenChange={(next) => setPicker(next ? "pins" : null)}
          title="Edit showcase"
          description="Pick up to three medals or finished goals."
        >
          <ShowcasePicker
            catalog={bundle.showcaseCatalog}
            sections={["medals", "goals"]}
            limit={PUBLIC_PROFILE_PIN_LIMIT}
            pins={draft.pins}
            notice={session.pinNotice}
            onToggle={session.actions.togglePin}
          />
        </BottomSheet>
      ) : null}
      {bundle?.showcaseCatalog && draft ? (
        <BottomSheet
          open={picker === "records"}
          onOpenChange={(next) => setPicker(next ? "records" : null)}
          title="Card records"
          description="Pick up to three records to show on your card."
        >
          <ShowcasePicker
            catalog={bundle.showcaseCatalog}
            sections={["records"]}
            limit={PUBLIC_PROFILE_RECORD_LIMIT}
            pins={draft.pins}
            notice={session.pinNotice}
            onToggle={session.actions.togglePin}
          />
        </BottomSheet>
      ) : null}
      {bundle && draft ? (
        <BottomSheet
          open={picker === "goals"}
          onOpenChange={(next) => setPicker(next ? "goals" : null)}
          title="Featured goals"
          description="Private goals never appear on your profile."
        >
          <FeaturedGoalPicker
            goals={bundle.currentGoals}
            featuredIds={draft.featuredGoalIds}
            onToggle={session.actions.toggleFeaturedGoal}
          />
        </BottomSheet>
      ) : null}
    </section>
  );
}
