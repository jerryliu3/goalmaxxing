"use client";

import { useState } from "react";
import {
  Action,
  AppNav,
  Heading,
  Notice,
  Panel,
  SettingRow,
  StudyDialog,
} from "../primitives";

type PreferenceSection = "Calendar" | "Privacy" | "Appearance";
export function PreferencesForm({
  formId,
  section,
  onSave,
}: {
  formId: string;
  section: PreferenceSection;
  onSave: () => void;
}) {
  const [timezone, setTimezone] = useState("America/New_York");
  const [weekStart, setWeekStart] = useState("Monday");
  const [social, setSocial] = useState(true);
  const [appearance, setAppearance] = useState("Current theme");
  return (
    <form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {section === "Calendar" ? (
        <>
          <label className="rf-field">
            Timezone
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              <option>America/New_York</option>
              <option>America/Los_Angeles</option>
              <option>Europe/London</option>
            </select>
          </label>
          <label className="rf-field">
            Week starts on
            <select
              value={weekStart}
              onChange={(event) => setWeekStart(event.target.value)}
            >
              <option>Monday</option>
              <option>Sunday</option>
            </select>
          </label>
          <p className="rf-muted">
            Dates and weekly summaries follow these preferences.
          </p>
        </>
      ) : section === "Privacy" ? (
        <>
          <label className="rf-check-row my-6">
            <input
              type="checkbox"
              checked={social}
              onChange={(event) => setSocial(event.target.checked)}
            />
            <span>Social activity enabled</span>
          </label>
          <p className="rf-muted">
            When off, your activity is hidden from the feed, leaderboards and
            your public profile. This sample does not change your real
            visibility.
          </p>
        </>
      ) : (
        <>
          <label className="rf-field">
            Appearance
            <select
              value={appearance}
              onChange={(event) => setAppearance(event.target.value)}
            >
              <option>Current theme</option>
              <option>Original</option>
              <option>Gazetteer</option>
              <option>Undertow</option>
            </select>
          </label>
          <p className="rf-muted">
            Choose the look that feels right for you. Use Preview theme above
            the study to see the actual themes without saving a preference.
          </p>
        </>
      )}
    </form>
  );
}

function SettingsDirectory({
  onSelect,
}: {
  onSelect: (section: PreferenceSection) => void;
}) {
  return (
    <Panel label="Settings directory">
      <p className="type-eyebrow rf-muted mb-3">Your settings</p>
      <SettingRow
        title="Calendar"
        detail="Timezone · first day of week"
        onClick={() => onSelect("Calendar")}
      />
      <SettingRow
        title="Privacy"
        detail="Social activity and profile visibility"
        onClick={() => onSelect("Privacy")}
      />
      <SettingRow
        title="Appearance"
        detail="Your preferred theme"
        onClick={() => onSelect("Appearance")}
      />
    </Panel>
  );
}

export function PreferencesConcept({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [section, setSection] = useState<PreferenceSection | null>(null);
  const [saved, setSaved] = useState("");
  return (
    <>
      {!embedded && <AppNav profile />}
      <div className={embedded ? "" : "rf-canvas"}>
        {!embedded && (
          <Heading eyebrow="Profile / Settings" title="Make it yours." />
        )}
        <SettingsDirectory onSelect={setSection} />
        <div className="mt-4">
          <Notice>{saved}</Notice>
        </div>
        <StudyDialog
          open={section !== null}
          onOpenChange={(open) => {
            if (!open) setSection(null);
          }}
          title={section ?? "Settings"}
          description={
            section === "Privacy"
              ? "Choose whether your social activity is visible."
              : section === "Appearance"
                ? "A small choice, without a full-height empty drawer."
                : "How dates appear in your agenda."
          }
          footer={
            <>
              <Action variant="outline" onClick={() => setSection(null)}>
                Cancel
              </Action>
              <Action form="directory-preferences" type="submit">
                Save preferences
              </Action>
            </>
          }
        >
          {section && (
            <PreferencesForm
              key={section}
              section={section}
              formId="directory-preferences"
              onSave={() => {
                setSaved(
                  `${section} sample saved. No account preference changed.`,
                );
                setSection(null);
              }}
            />
          )}
        </StudyDialog>
      </div>
    </>
  );
}
