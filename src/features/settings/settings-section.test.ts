import { describe, expect, it } from "vitest";
import {
  getSettingsSectionCopy,
  resolveSettingsSection,
  SETTINGS_GROUPS,
} from "@/features/settings/settings-section";

describe("resolveSettingsSection", () => {
  it("keeps known settings panels", () => {
    expect(resolveSettingsSection("preferences")).toBe("preferences");
    expect(resolveSettingsSection("notifications")).toBe("notifications");
    expect(resolveSettingsSection("integrations")).toBe("integrations");
    expect(resolveSettingsSection("onboarding")).toBe("onboarding");
    expect(resolveSettingsSection("appearance")).toBe("appearance");
    expect(resolveSettingsSection("report-issue")).toBe("report-issue");
  });

  it("treats missing or unknown values as a closed panel", () => {
    expect(resolveSettingsSection(undefined)).toBeNull();
    expect(resolveSettingsSection("profile")).toBeNull();
    expect(resolveSettingsSection("unknown")).toBeNull();
  });

  it("groups existing controls into Plan, Connected, and Account", () => {
    expect(SETTINGS_GROUPS.map((group) => group.label)).toEqual([
      "Plan",
      "Connected",
      "Account",
    ]);
    expect(SETTINGS_GROUPS.flatMap((group) => group.items.map((item) => item.key))).toEqual([
      "preferences",
      "onboarding",
      "notifications",
      "integrations",
      "appearance",
      "report-issue",
    ]);
    expect(getSettingsSectionCopy("appearance")).toEqual({
      key: "appearance",
      label: "Appearance",
      description:
        "Choose a visual style for Goalmaxxing. Original is the default; more skins can be added here.",
    });
  });
});
