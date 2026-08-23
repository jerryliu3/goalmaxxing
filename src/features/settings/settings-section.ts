export const SETTINGS_SECTIONS = [
  "preferences",
  "notifications",
  "integrations",
  "onboarding",
  "report-issue",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export function resolveSettingsSection(
  value: string | null | undefined
): SettingsSection | null {
  if (
    value === "preferences" ||
    value === "notifications" ||
    value === "integrations" ||
    value === "onboarding" ||
    value === "report-issue"
  ) {
    return value;
  }
  return null;
}
