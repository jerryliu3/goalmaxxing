"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import {
  Action,
  AppNav,
  GoalArtifact,
  Heading,
  Notice,
  Panel,
  Segments,
  StudyDialog,
} from "./primitives";
import { SAMPLE_GOALS } from "./sample";
import { PinPicker } from "./profile/picker";
import { PreferencesForm } from "./profile/settings";

export function CardsConcept({ variant }: { variant: number }) {
  const [fill, setFill] = useState("Half filled");
  const amount = fill === "Empty" ? 0 : fill === "Complete" ? 1 : 0.5;
  return (
    <>
      <AppNav active="Goals" />
      <div className="rf-canvas">
        <Heading eyebrow="Current intentions" title="Readable at every stage.">
          <Segments
            label="Sample fill"
            values={["Empty", "Half filled", "Complete"]}
            value={fill}
            onChange={setFill}
          />
        </Heading>
        <div className="rf-art-grid">
          {SAMPLE_GOALS.map((goal) => (
            <GoalArtifact
              key={goal.id}
              id={goal.id}
              completed={Math.round(goal.target * amount)}
              plate={variant === 1}
            />
          ))}
        </div>
        <p className="rf-muted mt-6">
          The material changes with progress. Your goal's name and completion
          count have a stable home.
        </p>
      </div>
    </>
  );
}

export function DialogsConcept({ variant }: { variant: number }) {
  const [dialog, setDialog] = useState<"Preferences" | "Showcase" | null>(null);
  const [message, setMessage] = useState("No sample changes yet.");
  return (
    <>
      <AppNav profile />
      <div className="rf-canvas">
        <Heading
          eyebrow="Utility surfaces"
          title="A familiar place to make a choice."
        />
        <div className="rf-split rf-split-equal">
          <Panel>
            <h3 className="type-heading">Calendar preferences</h3>
            <p className="rf-muted my-4">
              A short form with one clear save boundary.
            </p>
            <Action onClick={() => setDialog("Preferences")}>
              Open Preferences
            </Action>
          </Panel>
          <Panel>
            <h3 className="type-heading">Profile showcase</h3>
            <p className="rf-muted my-4">
              A longer picker with a stable count and Done action.
            </p>
            <Action variant="outline" onClick={() => setDialog("Showcase")}>
              Open Showcase
            </Action>
          </Panel>
        </div>
        <div className="mt-6">
          <Notice>{message}</Notice>
        </div>
        <StudyDialog
          open={dialog !== null}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          side={variant === 1}
          title={
            dialog === "Showcase"
              ? "Choose your showcase"
              : "Calendar preferences"
          }
          description={
            dialog === "Showcase"
              ? "Choose up to three things to show on your profile."
              : "Choose how dates appear in your agenda."
          }
          footer={
            dialog === "Showcase" ? (
              <Action form="dialog-pins" type="submit">
                Done
              </Action>
            ) : (
              <>
                <Action variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Action>
                <Action form="dialog-preferences" type="submit">
                  Save preferences
                </Action>
              </>
            )
          }
        >
          {dialog === "Showcase" ? (
            <PinPicker
              formId="dialog-pins"
              onDone={() => {
                setMessage(
                  "Sample showcase updated. Your account was not changed.",
                );
                setDialog(null);
              }}
            />
          ) : (
            <PreferencesForm
              formId="dialog-preferences"
              section="Calendar"
              onSave={() => {
                setMessage(
                  "Sample preferences saved. Your account was not changed.",
                );
                setDialog(null);
              }}
            />
          )}
        </StudyDialog>
      </div>
    </>
  );
}

const COPY = [
  [
    "Update rest weekdays used by planner default policy.",
    "Choose the weekdays you normally keep free.",
  ],
  [
    "Show suppressed linked goals",
    "Include goals hidden because their work counts toward another goal",
  ],
  [
    "Tap a goal to open it on Plan. No editor lives here.",
    "No shared goals yet. Choose which goals you want to work on together.",
  ],
  [
    "Original is default; more skins can be added here.",
    "Choose the look that feels right for you.",
  ],
  [
    "Numerator: completion events in the current month.",
    "Completions logged this month, including unscheduled days.",
  ],
  [
    "Replay opens whichever check-in today is owed, so testing the monthly one means being on the first of a month.",
    "Replay today's check-in. Monthly on the first, weekly on your week-start day, daily otherwise.",
  ],
] as const;
export function CopyConcept() {
  const [mode, setMode] = useState("Proposed");
  const [open, setOpen] = useState(false);
  return (
    <div className="rf-canvas">
      <Heading
        eyebrow="Small words, less friction"
        title="Explain the outcome."
      >
        <Segments
          label="Copy comparison"
          values={["Proposed", "Side by side"]}
          value={mode}
          onChange={setMode}
        />
      </Heading>
      <Panel>
        {COPY.map(([before, after]) => (
          <div className="rf-copy-row" key={before}>
            {mode === "Side by side" && (
              <p className="rf-muted">
                <small>Current</small>
                {before}
              </p>
            )}
            <p>
              <small>Proposed</small>
              {after}
            </p>
          </div>
        ))}
      </Panel>
      <Action className="mt-6" onClick={() => setOpen(true)}>
        Preview check-in availability
      </Action>
      <StudyDialog
        open={open}
        onOpenChange={setOpen}
        title="Check-in"
        description="A recap of what happened and a look at what's next."
      >
        <p className="rf-muted mt-6">
          Check-in is not available in this environment. Your agenda and
          completion history are still available.
        </p>
        <p className="mt-6">
          When available, you can replay today's check-in here and choose
          whether to show the opening prompt.
        </p>
      </StudyDialog>
    </div>
  );
}

export function ScopeConcept() {
  const [scope, setScope] = useState("Solo");
  const [menu, setMenu] = useState(false);
  const [profile, setProfile] = useState(false);
  return (
    <div>
      <header className="rf-app-nav">
        <span className="type-wordmark">Goalmaxxing</span>
        <div className="rf-actions">
          <label className="rf-muted">
            Viewing{" "}
            <select
              aria-label="Viewing scope"
              className="rf-select ml-2"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <option>Solo</option>
              <option>Partner</option>
              <option>Duo</option>
            </select>
          </label>
          <Action
            variant="outline"
            aria-expanded={menu}
            aria-label="Open identity menu"
            onClick={() => setMenu(!menu)}
          >
            <UserRound aria-hidden size={18} />
            Maya
          </Action>
        </div>
      </header>
      {menu && (
        <div className="rf-canvas">
          <Panel>
            <p className="type-heading">Maya Chen</p>
            <p className="rf-muted mb-4">@mayaruns</p>
            <div className="rf-actions">
              <Action
                onClick={() => {
                  setProfile(true);
                  setMenu(false);
                }}
              >
                Profile
              </Action>
              <Action variant="outline" asChild>
                <Link href="/ux/refresh/preferences">Settings</Link>
              </Action>
            </div>
          </Panel>
        </div>
      )}
      <div className="rf-canvas">
        <Heading
          eyebrow={`${scope} view`}
          title={
            profile
              ? "Your profile"
              : scope === "Duo"
                ? "A week together."
                : scope === "Partner"
                  ? "Alex's week."
                  : "Your week."
          }
        />
        <Panel>
          <p className="type-heading text-xl">
            {profile
              ? "Identity stays yours in every viewing scope."
              : scope === "Duo"
                ? "Maya · 5 sessions / Alex · 4 sessions"
                : scope === "Partner"
                  ? "Alex · 4 sessions"
                  : "Maya · 5 sessions"}
          </p>
          <p className="rf-muted my-4">
            Viewing scope affects whose activity you inspect. Your avatar always
            opens your own profile and account settings.
          </p>
          <Action variant="outline" asChild>
            <Link href="/ux/refresh/profile-location">
              Explore the owner profile
              <ArrowRight aria-hidden size={16} />
            </Link>
          </Action>
        </Panel>
      </div>
    </div>
  );
}
