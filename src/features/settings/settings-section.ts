export const SETTINGS_SECTIONS = [
  "preferences",
  "appearance",
  "notifications",
  "integrations",
  "onboarding",
  "digest",
  "password",
  "report-issue",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const SETTINGS_GROUPS: Array<{
  key: "plan" | "connected" | "account";
  label: string;
  items: Array<{ key: SettingsSection; label: string; description: string }>;
}> = [
  {
    key: "plan",
    label: "Plan",
    items: [
      {
        key: "preferences",
        label: "Preferences",
        description: "Timezone, first day of the week, and activity privacy.",
      },
      {
        key: "appearance",
        label: "Appearance",
        description: "Choose how Goalmaxxing looks on this device.",
      },
      {
        key: "onboarding",
        label: "Onboarding guides",
        description: "Replay the app intro and page guides.",
      },
      {
        key: "digest",
        label: "Check-in",
        description: "Replay your daily, weekly, or monthly check-in, or turn auto-show off.",
      },
    ],
  },
  {
    key: "connected",
    label: "Connected",
    items: [
      {
        key: "notifications",
        label: "Notifications",
        description: "Configure push access and reminder schedules.",
      },
      {
        key: "integrations",
        label: "Integrations",
        description: "Connect an AI assistant to your goals and plans.",
      },
    ],
  },
  {
    key: "account",
    label: "Account",
    items: [
      {
        key: "password",
        label: "Change password",
        description: "Confirm your current password and choose a new one.",
      },
      {
        key: "report-issue",
        label: "Report an issue",
        description: "Send product bugs or UX friction details directly to support.",
      },
    ],
  },
];

export function resolveSettingsSection(
  value: string | null | undefined
): SettingsSection | null {
  if (!value) {
    return null;
  }
  return (SETTINGS_SECTIONS as readonly string[]).includes(value)
    ? (value as SettingsSection)
    : null;
}

const SETTINGS_SECTION_COPY = Object.fromEntries(
  SETTINGS_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item]))
) as Record<SettingsSection, (typeof SETTINGS_GROUPS)[number]["items"][number]>;

export function getSettingsSectionCopy(section: SettingsSection) {
  return SETTINGS_SECTION_COPY[section];
}
