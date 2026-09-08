export const radius = {
  baseRem: 0.875,
  smRem: 0.5,
  mdRem: 0.6875,
  lgRem: 0.875,
  xlRem: 1.25,
} as const;

export const motionDurations = {
  fastMs: 120,
  standardMs: 200,
  rewardMs: 560,
} as const;

export const motionEasings = {
  standard: [0.2, 0.8, 0.2, 1] as const,
  emphasized: [0.16, 1, 0.3, 1] as const,
};

export type ThemeTokenName =
  | "background"
  | "foreground"
  | "card"
  | "cardForeground"
  | "popover"
  | "popoverForeground"
  | "primary"
  | "primaryForeground"
  | "secondary"
  | "secondaryForeground"
  | "muted"
  | "mutedForeground"
  | "accent"
  | "accentForeground"
  | "destructive"
  | "border"
  | "input"
  | "ring";

export const lightTheme: Record<ThemeTokenName, string> = {
  background: "#F8F7FB",
  foreground: "#312F38",
  card: "#FBFBFD",
  cardForeground: "#312F38",
  popover: "#FBFBFD",
  popoverForeground: "#312F38",
  primary: "#0F64BF",
  primaryForeground: "#FFFFFF",
  secondary: "#E4E4E7",
  secondaryForeground: "#3F3F46",
  muted: "#F0EEF4",
  mutedForeground: "#74717D",
  accent: "#E4ECF8",
  accentForeground: "#413F48",
  destructive: "#D94A3A",
  border: "#DDDBE3",
  input: "#DDDBE3",
  ring: "#0F64BF",
};

export const darkTheme: Record<ThemeTokenName, string> = {
  background: "#1F1D24",
  foreground: "#F3F2F6",
  card: "#2B2931",
  cardForeground: "#F3F2F6",
  popover: "#2B2931",
  popoverForeground: "#F3F2F6",
  primary: "#4687D8",
  primaryForeground: "#0B1F38",
  secondary: "#3F3F46",
  secondaryForeground: "#E4E4E7",
  muted: "#3A3742",
  mutedForeground: "#B6B3BE",
  accent: "#3E4B63",
  accentForeground: "#F3F2F6",
  destructive: "#F0715C",
  border: "#4A4754",
  input: "#4A4754",
  ring: "#4687D8",
};

export const cssTokenNames: Record<ThemeTokenName, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
};
