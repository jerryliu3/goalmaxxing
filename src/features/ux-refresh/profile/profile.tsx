"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  GoalArtifact,
  Heading,
  Panel,
  Segments,
  StudyDialog,
} from "../primitives";
import { Settings, PencilLine } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileMembershipCard } from "@/features/social/profile-membership-card";
import { MedalMark } from "@/features/achievements/medals";
import {
  PROFILE,
  IDENTITY,
  OVERALL_STATS,
  LEVEL,
} from "@/features/ux-profile/seed";
import { INITIAL_LOG, SAMPLE_GOALS } from "../sample";
import { PreferencesConcept } from "./settings";

export function ProfileConcept({ variant }: { variant: number }) {
  const [tab, setTab] = useState("Profile");
  const [allGoals, setAllGoals] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(
    "Training for a fall half. Learning a little every day.",
  );
  const [draftBio, setDraftBio] = useState(bio);
  const identity = (
    <div className="rf-membership">
      <div className="rf-row">
        <UserAvatar
          avatarUrl={IDENTITY.avatarUrl}
          displayName={IDENTITY.displayName}
          username={IDENTITY.username}
          size="lg"
        />
        <p className="type-eyebrow rf-muted">Member since January 2026</p>
      </div>
      <div>
        <p className="rf-muted">@mayaruns · Level 8</p>
        <h3 className="type-title">Maya Chen</h3>
        <p className="mt-3">{bio}</p>
      </div>
    </div>
  );
  const profile = (
    <div className="rf-stack">
      {variant === 1 ? (
        <ProfileMembershipCard
          profile={PROFILE.identity}
          overallStats={OVERALL_STATS}
          currentLevel={LEVEL}
        />
      ) : (
        identity
      )}
      <Panel>
        <div className="rf-row">
          <h3 className="type-heading">About</h3>
          <Action
            variant="ghost"
            onClick={() => {
              setDraftBio(bio);
              setEditing(true);
            }}
          >
            <PencilLine aria-hidden size={16} />
            Edit bio
          </Action>
        </div>
        <p className="mt-3">{bio || "Add a line about yourself."}</p>
      </Panel>
      <Panel>
        <h3 className="type-heading">Showcase</h3>
        <div className="rf-pin-slots">
          <div className="rf-pin-slot">
            <MedalMark level={8} size={60} />
            Level 8
          </div>
          <div className="rf-pin-slot">
            <span className="type-stat text-3xl">21 days</span>Best day streak
          </div>
          <div className="rf-pin-slot">
            Run a half marathon<small>Finished Aug 23</small>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="rf-row">
          <h3 className="type-heading">Working on</h3>
          <Action
            variant="ghost"
            aria-expanded={allGoals}
            onClick={() => setAllGoals(!allGoals)}
          >
            {allGoals ? "Show preview" : "View all 3 goals"}
          </Action>
        </div>
        <div className="rf-art-grid mt-5">
          {SAMPLE_GOALS.slice(0, allGoals ? 3 : 2).map((goal) => (
            <GoalArtifact
              key={goal.id}
              id={goal.id}
              completed={INITIAL_LOG[goal.id].length}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
  return (
    <>
      <AppNav profile />
      <div className="rf-canvas">
        <Heading
          eyebrow="Your profile"
          title={tab === "Settings" ? "Your settings." : "A little about you."}
        >
          <div className="rf-actions">
            <Action
              variant="outline"
              onClick={() => {
                setDraftBio(bio);
                setEditing(true);
              }}
            >
              <PencilLine aria-hidden size={16} />
              Edit profile
            </Action>
            <Action
              variant={tab === "Settings" ? "default" : "outline"}
              onClick={() =>
                setTab(tab === "Settings" ? "Profile" : "Settings")
              }
            >
              <Settings aria-hidden size={16} />
              {tab === "Settings" ? "Back to profile" : "Settings"}
            </Action>
          </div>
        </Heading>
        {variant === 1 && (
          <div className="mb-6">
            <Segments
              label="Profile sections"
              values={["Profile", "Settings"]}
              value={tab}
              onChange={setTab}
            />
          </div>
        )}
        {variant === 0 && tab === "Profile" ? (
          <div className="rf-split rf-split-equal">
            {profile}
            <PreferencesConcept embedded />
          </div>
        ) : tab === "Settings" ? (
          <PreferencesConcept embedded />
        ) : (
          profile
        )}
        <StudyDialog
          open={editing}
          onOpenChange={setEditing}
          title="Edit profile"
          description="A short introduction for the people visiting your profile."
          footer={
            <>
              <Action variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Action>
              <Action
                onClick={() => {
                  setBio(draftBio.trim());
                  setEditing(false);
                }}
              >
                Save sample bio
              </Action>
            </>
          }
        >
          <label className="rf-field">
            About you
            <textarea
              maxLength={240}
              value={draftBio}
              onChange={(event) => setDraftBio(event.target.value)}
            />
          </label>
          <p className="rf-muted">
            {draftBio.length} / 240 characters. This only changes the sample.
          </p>
        </StudyDialog>
      </div>
    </>
  );
}
