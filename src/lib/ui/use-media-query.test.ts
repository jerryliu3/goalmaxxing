import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "@/lib/ui/use-media-query";

function MatchProbe({
  query,
  defaultValue,
  snapshots,
}: {
  query: string;
  defaultValue?: boolean;
  snapshots: boolean[];
}) {
  snapshots.push(
    useMediaQuery(query, defaultValue === undefined ? {} : { defaultValue })
  );
  return null;
}

describe("useMediaQuery", () => {
  it("keeps the default value on first paint, then reads matchMedia after mount", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQueryList = {
      matches: true,
      media: "(min-width: 720px)",
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    };
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mediaQueryList)
    );

    const snapshots: boolean[] = [];
    render(
      <MatchProbe query="(min-width: 720px)" snapshots={snapshots} />
    );

    expect(snapshots[0]).toBe(false);
    expect(snapshots.at(-1)).toBe(true);

    vi.unstubAllGlobals();
  });

  it("updates when the media query changes", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQueryList = {
      matches: false,
      media: "(min-width: 720px)",
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    };
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mediaQueryList)
    );

    const snapshots: boolean[] = [];
    render(
      <MatchProbe query="(min-width: 720px)" snapshots={snapshots} />
    );

    expect(snapshots.at(-1)).toBe(false);

    mediaQueryList.matches = true;
    act(() => {
      for (const listener of listeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(snapshots.at(-1)).toBe(true);

    vi.unstubAllGlobals();
  });
});
