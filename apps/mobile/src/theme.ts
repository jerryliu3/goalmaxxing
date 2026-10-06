import { GAZETTEER_THEME } from "@cadence/shared/brand";
import { GAZETTEER_RADIUS_PX } from "@cadence/shared/brand/gazetteer";
import { motionDurations } from "@cadence/shared/tokens";
import { useColorScheme } from "react-native";
import { useGazetteerFonts } from "./ui/gazetteer-fonts";

export function useTheme() {
  const scheme = useColorScheme();
  const fonts = useGazetteerFonts();
  const colors =
    scheme === "dark" ? GAZETTEER_THEME.darkColors : GAZETTEER_THEME.colors;
  return {
    colors,
    radius: GAZETTEER_RADIUS_PX,
    motionDurations,
    fonts,
  };
}
