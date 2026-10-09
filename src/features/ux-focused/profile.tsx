"use client";
import { useState } from "react";
import { ChevronRight, Settings, PencilLine } from "lucide-react";
import {
  PUBLIC_PROFILE_BIO_LIMIT,
  type PublicProfileShowcasePin,
} from "@cadence/shared/social/public-profile";
import { ProfileMembershipCard } from "@/features/social/profile-membership-card";
import { ShowcaseTile } from "@/features/social/public-profile/showcase-tile";
import {
  pinKey,
  togglePin,
} from "@/features/social/public-profile/profile-draft";
import { PlannerPreferencesSettings } from "@/features/settings/planner-preferences-settings";
import { SETTINGS_GROUPS } from "@/features/settings/settings-section";
import { IDENTITY, OVERALL_STATS, LEVEL } from "@/features/ux-profile/seed";
import { Notice, StudyDialog } from "@/features/ux-refresh/primitives";
import { Action, ProductHeader } from "./common";
import { PROFILE_BIO, PROFILE_CATALOG, PROFILE_PINS } from "./profile-sample";
import { FocusedPicker } from "./picker";
import { CopyRefinements } from "./copy";
import { ProfileGoals } from "./collection";

type ProfileSample = { bio: string; pins: PublicProfileShowcasePin[] };
const INITIAL: ProfileSample = { bio: PROFILE_BIO, pins: PROFILE_PINS };
const SETTINGS = { timezone: "America/New_York", weekStartsOn: 1 };
function ProfileObjects({
  bio,
  pins,
  baseline = false,
}: ProfileSample & { baseline?: boolean }) {
  const keys = new Set(pins.map(pinKey));
  const records = PROFILE_CATALOG.records
    .filter((item) => keys.has(pinKey(item)))
    .map((item) =>
      baseline && item.ref === "day-streak"
        ? { ...item, label: "Best streak" }
        : item,
    );
  const showcase = [...PROFILE_CATALOG.medals, ...PROFILE_CATALOG.goals].filter(
    (item) => keys.has(pinKey(item)),
  );
  return (
    <>
      <ProfileMembershipCard
        profile={IDENTITY}
        overallStats={OVERALL_STATS}
        currentLevel={LEVEL}
        bio={bio}
        records={records}
      />
      <section className="fc-section mt-6">
        <h3 className="type-heading">Showcase</h3>
        <div className="fc-showcase">
          {showcase.map((item) => (
            <ShowcaseTile key={pinKey(item)} item={item} size="compact" />
          ))}
          {!showcase.length && (
            <p className="fc-muted">
              Choose a medal or finished goal to show here.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
export function ProfileBaseline() {
  return (
    <div className="fc-product">
      <ProductHeader title="Profile" detail="Maya Chen / Your profile" />
      <ProfileObjects {...INITIAL} baseline />
      <ProfileGoals />
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.key} className="fc-section">
          <h3 className="type-eyebrow text-xs">{group.label}</h3>
          {group.items.map((item) => (
            <div className="fc-line" key={item.key}>
              <div className="fc-grow">
                <strong className="type-item">{item.label}</strong>
                <p className="fc-muted">{item.description}</p>
              </div>
              <ChevronRight size={16} aria-hidden />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
export function ProfileStudy() {
  const [saved, setSaved] = useState(INITIAL);
  const [draft, setDraft] = useState(INITIAL);
  const [panel, setPanel] = useState<
    "directory" | "calendar" | "privacy" | "bio" | "showcase" | "records" | null
  >(null);
  const [preferences, setPreferences] = useState(SETTINGS);
  const [preferencesDraft, setPreferencesDraft] = useState(SETTINGS);
  const [visible, setVisible] = useState(true);
  const [visibilityDraft, setVisibilityDraft] = useState(true);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const dirty =
    draft.bio !== saved.bio ||
    draft.pins.map(pinKey).join("|") !== saved.pins.map(pinKey).join("|");
  const settingDirty =
    panel === "calendar"
      ? preferences.timezone !== preferencesDraft.timezone ||
        preferences.weekStartsOn !== preferencesDraft.weekStartsOn
      : visible !== visibilityDraft;
  const title =
    panel === "directory"
      ? "Settings"
      : panel === "calendar"
        ? "Calendar preferences"
        : panel === "privacy"
          ? "Privacy"
          : panel === "bio"
            ? "Your introduction"
            : panel === "records"
              ? "Records on your card"
              : "Your showcase";
  const close = () => setPanel(null);
  function openSettings() {
    setPreferencesDraft(preferences);
    setVisibilityDraft(visible);
    setPanel("directory");
  }
  function selectPin(pin: PublicProfileShowcasePin) {
    const next = togglePin(draft.pins, pin);
    setDraft((previous) => ({ ...previous, pins: next.pins }));
    setNotice(next.notice);
  }
  return (
    <>
      <div className="fc-product">
        <ProductHeader title="Profile" detail="Maya Chen / Your profile">
          <Action variant="outline" onClick={() => setPanel("bio")}>
            <PencilLine size={16} />
            Edit profile
          </Action>
          <Action onClick={openSettings}>
            <Settings size={16} />
            Settings
          </Action>
        </ProductHeader>
        <ProfileObjects {...draft} />
        <div className="rf-actions mb-6">
          <Action
            variant="outline"
            onClick={() => {
              setNotice(null);
              setPanel("showcase");
            }}
          >
            Choose showcase
          </Action>
          <Action
            variant="outline"
            onClick={() => {
              setNotice(null);
              setPanel("records");
            }}
          >
            Choose card records
          </Action>
        </div>
        <ProfileGoals />
        {dirty && (
          <aside className="fc-draft" aria-label="Profile changes">
            <strong className="type-item">Unsaved profile changes</strong>
            <div className="rf-actions mt-3">
              <Action
                variant="outline"
                onClick={() => {
                  setDraft(saved);
                  setMessage("Sample profile changes undone.");
                }}
              >
                Undo profile changes
              </Action>
              <Action
                onClick={() => {
                  setSaved(draft);
                  setMessage(
                    "Sample profile saved. Your account was not changed.",
                  );
                }}
              >
                Save profile
              </Action>
            </div>
          </aside>
        )}
        <Notice>{message}</Notice>
        <StudyDialog
          open={panel !== null}
          onOpenChange={(open) => {
            if (!open) close();
          }}
          title={title}
          description={
            panel === "directory"
              ? "Go directly to the preference you want to change."
              : panel === "showcase" || panel === "records"
                ? "Choices preview on your profile; Save profile commits them in the sample."
                : panel === "bio"
                  ? "A short introduction for people visiting your profile."
                  : "Changes stay in this sample."
          }
          footer={
            panel === "calendar" || panel === "privacy" ? (
              <>
                <Action
                  variant="outline"
                  onClick={() => {
                    setPreferencesDraft(preferences);
                    setVisibilityDraft(visible);
                    setPanel("directory");
                  }}
                >
                  Cancel
                </Action>
                <Action
                  disabled={!settingDirty}
                  onClick={() => {
                    if (panel === "calendar") setPreferences(preferencesDraft);
                    else setVisible(visibilityDraft);
                    setMessage(
                      `${panel === "calendar" ? "Calendar preferences" : "Privacy preference"} saved in the sample.`,
                    );
                    setPanel("directory");
                  }}
                >
                  Save changes
                </Action>
              </>
            ) : (
              <Action onClick={close}>
                {panel === "directory" ? "Close" : "Done"}
              </Action>
            )
          }
        >
          {(panel === "calendar" || panel === "privacy") && (
            <Action
              variant="ghost"
              onClick={() => {
                setPreferencesDraft(preferences);
                setVisibilityDraft(visible);
                setPanel("directory");
              }}
            >
              ← Settings
            </Action>
          )}
          {panel === "directory" && (
            <>
              <button
                className="fc-goal-row"
                onClick={() => {
                  setPreferencesDraft(preferences);
                  setPanel("calendar");
                }}
              >
                <div className="fc-grow">
                  <strong className="type-item">Calendar</strong>
                  <p className="fc-muted">Timezone and first day of the week</p>
                </div>
                <ChevronRight size={18} aria-hidden />
              </button>
              <button
                className="fc-goal-row"
                onClick={() => {
                  setVisibilityDraft(visible);
                  setPanel("privacy");
                }}
              >
                <div className="fc-grow">
                  <strong className="type-item">Privacy</strong>
                  <p className="fc-muted">
                    Activity in feeds, leaderboards and your public profile
                  </p>
                </div>
                <ChevronRight size={18} aria-hidden />
              </button>
              <p className="fc-muted my-5">Other settings</p>
              <ul className="fc-list fc-settings-context">
                {SETTINGS_GROUPS.flatMap((group) => group.items)
                  .filter((item) => item.key !== "preferences")
                  .map((item) => (
                    <li key={item.key}>{item.label}</li>
                  ))}
              </ul>
            </>
          )}
          {panel === "calendar" && (
            <div className="mt-5">
              <PlannerPreferencesSettings
                value={preferencesDraft}
                onChange={setPreferencesDraft}
              />
            </div>
          )}
          {panel === "privacy" && (
            <div className="mt-5">
              <label className="fc-privacy">
                <input
                  type="checkbox"
                  checked={visibilityDraft}
                  onChange={(event) => setVisibilityDraft(event.target.checked)}
                />
                <span>
                  <strong className="type-item">Social activity enabled</strong>
                  <span className="fc-muted block">
                    Turn off to hide your activity from feeds, leaderboards and
                    your public profile.
                  </span>
                </span>
              </label>
            </div>
          )}
          {panel === "bio" && (
            <label className="rf-field">
              About you
              <textarea
                maxLength={PUBLIC_PROFILE_BIO_LIMIT}
                value={draft.bio}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    bio: event.target.value,
                  }))
                }
              />
              <span className="fc-muted">
                {draft.bio.length}/{PUBLIC_PROFILE_BIO_LIMIT}
              </span>
            </label>
          )}
          {(panel === "showcase" || panel === "records") && (
            <>
              <FocusedPicker
                key={panel}
                records={panel === "records"}
                pins={draft.pins}
                onToggle={selectPin}
              />
              {notice && <Notice>{notice}</Notice>}
            </>
          )}
        </StudyDialog>
      </div>
      <CopyRefinements />
    </>
  );
}
