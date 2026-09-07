export const SETTINGS_SECTIONS = [
  "preferences",
  "notifications",
  "integrations",
  "onboarding",
  "appearance",
  "report-issue",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const SETTINGS_GROUPS: Array<{
  key: "plan" | "connected" | "account";
  label: string;
  items: Array<{ key: SettingsSection; label: string }>;
}> = [
  {
    key: "plan",
    label: "Plan",
    items: [
      { key: "preferences", label: "Preferences" },
      { key: "onboarding", label: "Onboarding guides" },
    ],
  },
  {
    key: "connected",
    label: "Connected",
    items: [
      { key: "notifications", label: "Notifications" },
      { key: "integrations", label: "Integrations" },
    ],
  },
  {
    key: "account",
    label: "Account",
    items: [
      { key: "appearance", label: "Appearance" },
      { key: "report-issue", label: "Report an issue" },
    ],
  },
];

export function resolveSettingsSection(
  value: string | null | undefined
): SettingsSection | null {
  if (
    value === "preferences" ||
    value === "notifications" ||
    value === "integrations" ||
    value === "onboarding" ||
    value === "appearance" ||
    value === "report-issue"
  ) {
    return value;
  }
  return null;
}
