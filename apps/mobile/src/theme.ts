import {
  gazetteerDarkTheme,
  gazetteerLightTheme,
  GAZETTEER_RADIUS_PX,
} from "@cadence/shared/brand/gazetteer";
import { motionDurations } from "@cadence/shared/tokens";
import { Platform, useColorScheme } from "react-native";

const fonts = Platform.select({
  ios: {
    display: "Georgia",
    sans: "System",
    mono: "Menlo",
  },
  default: {
    display: "serif",
    sans: "sans-serif",
    mono: "monospace",
  },
});

const themes = {
  light: {
    colors: gazetteerLightTheme,
    radius: GAZETTEER_RADIUS_PX,
    motionDurations,
    fonts,
  },
  dark: {
    colors: gazetteerDarkTheme,
    radius: GAZETTEER_RADIUS_PX,
    motionDurations,
    fonts,
  },
} as const;

export function useTheme() {
  const scheme = useColorScheme();
  return themes[scheme === "dark" ? "dark" : "light"];
}
