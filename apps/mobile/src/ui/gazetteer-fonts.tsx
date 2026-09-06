import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
} from "@expo-google-fonts/source-sans-3";
import { useFonts } from "expo-font";
import { createContext, useContext, type ReactNode } from "react";
import { Platform } from "react-native";

export const gazetteerFallbackFonts = Platform.select({
  ios: {
    display: "Georgia",
    sans: "System",
    sansMedium: "System",
    mono: "Menlo",
  },
  default: {
    display: "serif",
    sans: "sans-serif",
    sansMedium: "sans-serif",
    mono: "monospace",
  },
});

export const gazetteerLoadedFonts = {
  display: "Newsreader_600SemiBold",
  sans: "SourceSans3_400Regular",
  sansMedium: "SourceSans3_600SemiBold",
  mono: "IBMPlexMono_500Medium",
} as const;

const GazetteerFontContext = createContext(gazetteerFallbackFonts);

export function GazetteerFontProvider({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    Newsreader_600SemiBold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    IBMPlexMono_500Medium,
  });
  return (
    <GazetteerFontContext.Provider
      value={loaded ? gazetteerLoadedFonts : gazetteerFallbackFonts}
    >
      {children}
    </GazetteerFontContext.Provider>
  );
}

export function useGazetteerFonts() {
  return useContext(GazetteerFontContext);
}
