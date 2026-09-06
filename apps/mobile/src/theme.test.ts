import { describe, expect, it, vi } from "vitest";
import { GAZETTEER, gazetteerLightTheme } from "@cadence/shared/brand/gazetteer";

vi.mock("react-native", () => ({
  Platform: { select: (value: { default: unknown }) => value.default },
  useColorScheme: () => "light",
}));

import { useTheme } from "./theme";

describe("mobile Gazetteer theme", () => {
  it("uses paper, walnut, and stamp rust in light mode", () => {
    const theme = useTheme();
    expect(theme.colors).toEqual(gazetteerLightTheme);
    expect(theme.colors.primary).toBe(GAZETTEER.stamp);
    expect(theme.colors.background).toBe(GAZETTEER.page);
    expect(theme.radius.md).toBe(12);
  });
});
