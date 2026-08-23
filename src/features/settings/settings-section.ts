export const SETTINGS_SECTIONS = [
  "preferences",
  "notifications",
  "integrations",
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
    value === "report-issue"
  ) {
    return value;
  }
  return null;
}
