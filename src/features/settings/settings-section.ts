export const SETTINGS_SECTIONS = [
  "preferences",
  "notifications",
  "integrations",
  "onboarding",
  "digest",
  "appearance",
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
        description: "Manage planner defaults for Plan.",
      },
      {
        key: "onboarding",
        label: "Onboarding guides",
        description: "Replay the app intro and page guides.",
      },
      {
        key: "digest",
        label: "Digest",
        description: "Replay the first-open briefing or turn auto-show off.",
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
        description: "Connect Apple Health or Health Connect and opt into auto-complete.",
      },
    ],
  },
  {
    key: "account",
    label: "Account",
    items: [
      {
        key: "appearance",
        label: "Appearance",
        description:
          "Choose a visual style for Goalmaxxing. Original is the default; more skins can be added here.",
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
