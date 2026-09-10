import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useMonthGridEdgeVisibility } from "@/features/planner/use-month-grid-edge-visibility";

function EdgeProbe({
  revision,
  children,
}: {
  revision: string;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { firstRowVisible, lastRowVisible } = useMonthGridEdgeVisibility(
    viewportRef,
    revision
  );
  return (
    <div>
      <div ref={viewportRef} data-testid="viewport">
        {children}
      </div>
      <span data-testid="first">{String(firstRowVisible)}</span>
      <span data-testid="last">{String(lastRowVisible)}</span>
    </div>
  );
}

function stubViewportMetrics(
  viewport: HTMLElement,
  metrics: { scrollTop: number; clientHeight: number; scrollHeight: number }
) {
  Object.defineProperties(viewport, {
    scrollTop: { configurable: true, value: metrics.scrollTop },
    clientHeight: { configurable: true, value: metrics.clientHeight },
    scrollHeight: { configurable: true, value: metrics.scrollHeight },
  });
}

describe("useMonthGridEdgeVisibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps both edges visible when the month grid does not overflow", () => {
    render(
      <EdgeProbe revision="fit">
        <button data-day-cell="true" data-day="2026-08-01" />
      </EdgeProbe>
    );
    const viewport = screen.getByTestId("viewport");
    stubViewportMetrics(viewport, {
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 400,
    });
    fireEvent.scroll(viewport);

    expect(screen.getByTestId("first")).toHaveTextContent("true");
    expect(screen.getByTestId("last")).toHaveTextContent("true");
  });

  it("hides an edge after scrolling away from the calendar start or end", () => {
    render(
      <EdgeProbe revision="overflow">
        <button data-day-cell="true" data-day="2026-08-01" />
        <button data-day-cell="true" data-day="2026-08-31" />
      </EdgeProbe>
    );
    const viewport = screen.getByTestId("viewport");
    stubViewportMetrics(viewport, {
      scrollTop: 80,
      clientHeight: 400,
      scrollHeight: 1200,
    });
    fireEvent.scroll(viewport);

    expect(screen.getByTestId("first")).toHaveTextContent("false");
    expect(screen.getByTestId("last")).toHaveTextContent("false");
  });
});
