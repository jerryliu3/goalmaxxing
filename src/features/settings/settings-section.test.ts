import { describe, expect, it } from "vitest";
import { resolveSettingsSection } from "@/features/settings/settings-section";

describe("resolveSettingsSection", () => {
  it("keeps known settings panels", () => {
    expect(resolveSettingsSection("preferences")).toBe("preferences");
    expect(resolveSettingsSection("notifications")).toBe("notifications");
    expect(resolveSettingsSection("integrations")).toBe("integrations");
    expect(resolveSettingsSection("report-issue")).toBe("report-issue");
  });

  it("treats missing or unknown values as a closed panel", () => {
    expect(resolveSettingsSection(undefined)).toBeNull();
    expect(resolveSettingsSection("profile")).toBeNull();
    expect(resolveSettingsSection("unknown")).toBeNull();
  });
});
