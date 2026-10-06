"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AppBarMock, ProfileStudyChrome } from "@/features/ux-profile/chrome";
import {
  AUDIENCE_LABEL,
  canSee,
  getProfileConcept,
  type Audience,
  type ProfileSection,
  type Viewer,
} from "@/features/ux-profile/model";
import { EditButton, ShowcasePicker } from "@/features/ux-profile/pickers";
import { PublicProfileView } from "@/features/ux-profile/public-profile-view";
import { PROFILE } from "@/features/ux-profile/seed";
import { useProfileDraft } from "@/features/ux-profile/use-profile-draft";

const concept = getProfileConcept("audience");

const AUDIENCE_OPTIONS = (Object.keys(AUDIENCE_LABEL) as Audience[]).map((value) => ({
  value,
  label: AUDIENCE_LABEL[value],
}));

const VIEWER_OPTIONS: { value: Viewer; label: string }[] = [
  { value: "owner", label: "Me" },
  { value: "friend", label: "A friend" },
  { value: "public", label: "Anyone" },
];

const SECTION_LABEL: Record<ProfileSection, string> = {
  bio: "About",
  showcase: "Showcase",
  goals: "Current goals",
};

export function AudienceConcept() {
  const { draft, pinNotice, actions } = useProfileDraft();
  const [viewer, setViewer] = useState<Viewer>("owner");
  const [editing, setEditing] = useState(false);

  const sections = Object.keys(SECTION_LABEL) as ProfileSection[];
  const visible = sections.filter((section) => canSee(draft.audience[section], viewer));

  const sectionAction = (section: ProfileSection) => (
    <div className="flex items-center gap-2">
      {section === "showcase" ? <EditButton label="Edit" onClick={() => setEditing(true)} /> : null}
      <SegmentedControl
        label={`${SECTION_LABEL[section]} audience`}
        options={AUDIENCE_OPTIONS}
        value={draft.audience[section]}
        onChange={(audience) => actions.setAudience(section, audience)}
      />
    </div>
  );

  return (
    <ProfileStudyChrome concept={concept}>
      <AppBarMock avatarActive avatarLabel="Your profile" onAvatarClick={() => setViewer("owner")} />

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Your profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Each section picks its own audience.</p>
          </div>
          <SegmentedControl label="View as" options={VIEWER_OPTIONS} value={viewer} onChange={setViewer} />
        </div>

        <p role="status" className="mt-5 rounded-[12px] border border-border/70 bg-card px-4 py-3 text-sm">
          {viewer === "owner" ? (
            "You see everything, including private goals and sections set to Only me."
          ) : (
            <>
              <span className="font-semibold">{viewer === "friend" ? "A friend" : "Anyone"} sees:</span>{" "}
              {visible.length > 0
                ? visible.map((section) => SECTION_LABEL[section]).join(", ")
                : "only your name and card"}
              .
            </>
          )}
        </p>

        <div className="mt-6">
          <PublicProfileView
            profile={PROFILE}
            draft={draft}
            viewer={viewer}
            owner={{ onBioChange: actions.setBio, sectionAction }}
          />
        </div>
      </div>

      <BottomSheet open={editing} onOpenChange={setEditing} title="Edit showcase">
        <ShowcasePicker
          catalog={PROFILE.catalog}
          pins={draft.pins}
          notice={pinNotice}
          onToggle={actions.togglePin}
        />
      </BottomSheet>
    </ProfileStudyChrome>
  );
}
