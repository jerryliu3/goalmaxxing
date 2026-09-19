import { applicationTheme } from "@cadence/shared/brand";
import { motionDurations } from "@cadence/shared/tokens";
import { useColorScheme } from "react-native";
import { useGazetteerFonts } from "./ui/gazetteer-fonts";

export function useTheme() {
  const scheme = useColorScheme();
  const fonts = useGazetteerFonts();
  const theme = applicationTheme("gazetteer", scheme === "dark" ? "dark" : "light");
  return {
    colors: theme.colors,
    radius: { sm: theme.geometry.radiusPx - 4, md: theme.geometry.radiusPx, lg: theme.geometry.radiusPx + 4 },
    motionDurations,
    fonts,
  };
}
