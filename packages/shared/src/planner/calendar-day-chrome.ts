import { GAZETTEER, GAZETTEER_HEATMAP_SCALE } from "../brand/gazetteer";

export interface MonthDayChromeInput {
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPastInMonth: boolean;
}

export type MonthDayChromeKind =
  | "today"
  | "selected"
  | "adjacent"
  | "past-in-month"
  | "default";

export function resolveMonthDayChromeKind(input: MonthDayChromeInput): MonthDayChromeKind {
  if (input.isToday) {
    return "today";
  }
  if (input.isSelected) {
    return "selected";
  }
  if (!input.inMonth) {
    return "adjacent";
  }
  if (input.isPastInMonth) {
    return "past-in-month";
  }
  return "default";
}

export interface GazetteerMonthDayChromePalette {
  page: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  border: string;
  muted: string;
  todayFill: string;
  todayForeground: string;
  adjacentFill: string;
  adjacentForeground: string;
}

export interface MonthDayChromeStyle {
  backgroundColor: string;
  borderColor: string;
  numberColor: string;
  selectedRing: boolean;
}

export function buildGazetteerMonthDayChromePalette(
  colors: {
    page: string;
    foreground: string;
    mutedForeground: string;
    primary: string;
    border: string;
    muted: string;
  },
  scheme: "light" | "dark"
): GazetteerMonthDayChromePalette {
  return {
    page: colors.page,
    foreground: colors.foreground,
    mutedForeground: colors.mutedForeground,
    primary: colors.primary,
    border: colors.border,
    muted: colors.muted,
    todayFill: GAZETTEER_HEATMAP_SCALE[1],
    todayForeground: GAZETTEER.ink,
    adjacentFill: scheme === "dark" ? "#52525b" : "#d4d4d8",
    adjacentForeground: scheme === "dark" ? GAZETTEER.page : GAZETTEER.mutedDeep,
  };
}

export function resolveGazetteerMonthDayChromeStyle(
  input: MonthDayChromeInput,
  palette: GazetteerMonthDayChromePalette
): MonthDayChromeStyle {
  const kind = resolveMonthDayChromeKind(input);
  const selectedRing = input.isSelected && (kind === "today" || kind === "selected");

  switch (kind) {
    case "today":
      return {
        backgroundColor: palette.todayFill,
        borderColor: palette.todayFill,
        numberColor: palette.todayForeground,
        selectedRing,
      };
    case "selected":
      return {
        backgroundColor: palette.page,
        borderColor: palette.primary,
        numberColor: palette.primary,
        selectedRing: true,
      };
    case "adjacent":
      return {
        backgroundColor: palette.adjacentFill,
        borderColor: palette.adjacentFill,
        numberColor: palette.adjacentForeground,
        selectedRing: false,
      };
    case "past-in-month":
      return {
        backgroundColor: palette.muted,
        borderColor: palette.border,
        numberColor: palette.foreground,
        selectedRing: false,
      };
    default:
      return {
        backgroundColor: palette.page,
        borderColor: palette.border,
        numberColor: palette.foreground,
        selectedRing: false,
      };
  }
}

export function planHiddenItemCountLabel(hiddenCount: number) {
  return hiddenCount > 0 ? `+${hiddenCount} more` : null;
}
