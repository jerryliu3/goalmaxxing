import { describe, expect, it } from "vitest";
import { tabChromeClasses, tabGridClass } from "./tab-chrome";

describe("tabChromeClasses", () => {
  it("marks the destination with the selection roles, never primary", () => {
    const pillsPhone = tabChromeClasses("pills", true, "grid-cols-4");
    expect(pillsPhone.highlight).toContain("bg-selection");
    expect(pillsPhone.linkActive).toBe("text-selection-foreground");
    expect(tabChromeClasses("underline", true, "grid-cols-4").highlight).toContain(
      "border-selection-line"
    );
    for (const chrome of ["underline", "pills"] as const) {
      const desktop = tabChromeClasses(chrome, false, "grid-cols-4");
      expect(desktop.highlight).toContain("bg-selection-line");
      expect(desktop.linkActive).toBe("text-foreground");
      for (const mobile of [true, false]) {
        const { highlight, linkActive } = tabChromeClasses(chrome, mobile, "grid-cols-4");
        expect(`${highlight} ${linkActive}`).not.toMatch(/primary/);
      }
    }
  });

  it("frames the whole tab on the phone bar, in every chrome", () => {
    for (const chrome of ["underline", "pills"] as const) {
      const highlight = tabChromeClasses(chrome, true, "grid-cols-4").highlight.split(" ");
      expect(highlight).toContain("inset-0");
      expect(highlight.some((name) => /^inset-[xy]-|^top-|^bottom-/.test(name))).toBe(false);
    }
  });

  it("keeps the desktop underline under the label", () => {
    expect(tabChromeClasses("underline", false, "grid-cols-4").highlight).toContain("bottom-0 h-0.5");
  });

  it("never lets a phone tab shrink below its label", () => {
    expect(tabGridClass(4, { fitLabels: true })).toBe("grid-cols-[repeat(4,minmax(min-content,1fr))]");
    expect(tabGridClass(4)).toBe("grid-cols-4");
  });
});
