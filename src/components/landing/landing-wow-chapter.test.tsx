import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingWowChapter } from "@/components/landing/landing-wow-chapter";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

afterEach(cleanup);

describe("LandingWowChapter", () => {
  it("draws a trail behind You and fills heatmap stats instead of a line chart", () => {
    render(<LandingWowChapter progress={0.64} />);

    expect(screen.getByTestId("landing-wow-chapter")).toBeInTheDocument();
    expect(screen.getByTestId("wow-climb-trail")).toBeInTheDocument();
    expect(screen.getByTestId("wow-insights-heatmap")).toBeInTheDocument();
    expect(screen.getByText("Total Activities")).toBeInTheDocument();
    expect(screen.queryByText("This week")).not.toBeInTheDocument();
    expect(screen.queryByText("30-day completion")).not.toBeInTheDocument();
  });

  it("shows the August calendar immediately, before later product beats", () => {
    render(<LandingWowChapter progress={0} />);

    expect(screen.getByText("The journey")).toBeInTheDocument();
    expect(screen.getByText("August plan")).toBeInTheDocument();
    expect(screen.queryByText("Deep work")).not.toBeInTheDocument();
    expect(screen.queryByText(/Keep scrolling/i)).not.toBeInTheDocument();
  });

  it("lets August plan goals appear before later product beats", () => {
    render(<LandingWowChapter progress={0.07} />);

    expect(screen.getByText("August plan")).toBeInTheDocument();
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    expect(screen.queryByText("This week")).not.toBeInTheDocument();
  });

  it("anchors the product card at the top so taller scenes grow downward", () => {
    render(<LandingWowChapter progress={0} />);
    const slot = screen.getByTestId("wow-product-slot");
    expect(slot.className).toMatch(/top-/);
    expect(slot.className).not.toMatch(/pb-\[22%\]/);
  });

  it("celebrates first place only after You has finished moving", () => {
    const { rerender } = render(<LandingWowChapter progress={0.85} />);
    expect(screen.queryByTestId("wow-you-confetti")).not.toBeInTheDocument();

    rerender(<LandingWowChapter progress={1} />);
    expect(screen.getByTestId("wow-you-trophy")).toBeInTheDocument();
    expect(screen.getByTestId("wow-you-confetti")).toBeInTheDocument();
  });
});
