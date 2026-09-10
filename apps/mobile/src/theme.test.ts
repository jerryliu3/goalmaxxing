import { describe, expect, it, vi } from "vitest";
import { GAZETTEER, gazetteerLightTheme } from "@cadence/shared/brand/gazetteer";

vi.mock("react-native", () => ({
  Platform: { select: (value: { default: unknown }) => value.default },
}));
vi.mock("expo-font", () => ({
  useFonts: () => [false],
}));
vi.mock("@expo-google-fonts/newsreader", () => ({
  Newsreader_600SemiBold: 1,
}));
vi.mock("@expo-google-fonts/source-sans-3", () => ({
  SourceSans3_400Regular: 1,
  SourceSans3_600SemiBold: 1,
}));
vi.mock("@expo-google-fonts/ibm-plex-mono", () => ({
  IBMPlexMono_500Medium: 1,
}));

import { gazetteerFallbackFonts, gazetteerLoadedFonts } from "./ui/gazetteer-fonts";

describe("mobile Gazetteer theme", () => {
  it("keeps paper, walnut, stamp rust, and Gazetteer type names", () => {
    expect(gazetteerLightTheme.primary).toBe(GAZETTEER.stamp);
    expect(gazetteerLightTheme.background).toBe(GAZETTEER.page);
    expect(gazetteerLoadedFonts.display).toBe("Newsreader_600SemiBold");
    expect(gazetteerLoadedFonts.sans).toBe("SourceSans3_400Regular");
    expect(gazetteerLoadedFonts.mono).toBe("IBMPlexMono_500Medium");
    expect(gazetteerFallbackFonts.display).toBe("serif");
  });
});
