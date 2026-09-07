import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CommunityClubConcept, CommunityRanksConcept, CommunityStageConcept } from "@/features/ux-destinations/community-club";
import { DestinationsIndex } from "@/features/ux-destinations/destinations-index";
import { ProgressAtlasConcept } from "@/features/ux-destinations/progress-atlas";
import { ProgressPinsConcept } from "@/features/ux-destinations/progress-pins";

afterEach(cleanup);

describe("progress and community destination study", () => {
  it("lists heatmap-first Progress concepts and one-page Community concepts", () => {
    render(<DestinationsIndex />);
    expect(screen.getByRole("link", { name: "Open Atlas" })).toHaveAttribute(
      "href",
      "/ux/destinations/progress/atlas"
    );
    expect(screen.getByRole("link", { name: "Open Pins" })).toHaveAttribute(
      "href",
      "/ux/destinations/progress/pins"
    );
    expect(screen.getByRole("link", { name: "Open Ribbon" })).toHaveAttribute(
      "href",
      "/ux/destinations/progress/ribbon"
    );
    expect(screen.getByRole("link", { name: "Open Club" })).toHaveAttribute(
      "href",
      "/ux/destinations/community/club"
    );
    expect(screen.getByRole("link", { name: "Open Ranks" })).toHaveAttribute(
      "href",
      "/ux/destinations/community/ranks"
    );
    expect(screen.getByRole("link", { name: "Open Stage" })).toHaveAttribute(
      "href",
      "/ux/destinations/community/stage"
    );
    expect(screen.getByRole("link", { name: "Open Presence" })).toHaveAttribute(
      "href",
      "/ux/destinations/community/presence"
    );
    expect(screen.queryByRole("link", { name: "Open Instrument" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Rooms" })).not.toBeInTheDocument();
  });

  it("keeps Atlas as a responsive ledger and opens a ten-stop Thesis runway", async () => {
    const user = userEvent.setup();
    render(<ProgressAtlasConcept />);

    expect(screen.getByText("Completion by weekday")).toBeInTheDocument();
    expect(
      screen.getByText(/milestone names stay parked with their goal/i)
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /thesis/i })[0]!);
    expect(screen.getByRole("heading", { name: "Thesis" })).toBeInTheDocument();
    expect(screen.getByText("Sep 1")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
    expect(
      screen.getByText(/log or remove a milestone for Thesis/i)
    ).toBeInTheDocument();
  });

  it("treats a heatmap pin as a milestone place", async () => {
    const user = userEvent.setup();
    render(<ProgressPinsConcept />);

    await user.click(screen.getByRole("button", { name: /proposal milestone/i }));
    expect(screen.getByRole("heading", { name: "Thesis" })).toBeInTheDocument();
  });

  it("shows Club as one page with peek tiles and Plan-handoff goals", async () => {
    const user = userEvent.setup();
    render(<CommunityClubConcept />);

    expect(screen.getByRole("heading", { name: "Maya" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Challenges" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Boards" })).toBeInTheDocument();
    expect(screen.getByText(/stage-size posters/i)).toBeInTheDocument();
    expect(screen.getByText("September Distance")).toBeInTheDocument();
    expect(screen.getByText("Fall 2026")).toBeInTheDocument();
    expect(screen.getByText("Summer 2026")).toBeInTheDocument();
    expect(screen.getByText(/you are 14th/i)).toBeInTheDocument();
    expect(screen.queryByText("1. Alex")).not.toBeInTheDocument();
    expect(screen.queryByText(/jordan wants to pair/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /team settings/i }));
    expect(screen.getByText(/jordan wants to pair/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /tempo run/i }));
    expect(screen.getByText(/would open tempo run on plan/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /september distance/i }));
    expect(screen.getByText("1. Alex")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /leave challenge/i }).length).toBeGreaterThan(
      0
    );
  });

  it("opens ranked people on joined Ranks tiles without an extra click", () => {
    render(<CommunityRanksConcept />);
    expect(screen.getAllByText("1. Alex").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /join challenge/i }).length).toBeGreaterThan(
      0
    );
  });

  it("stages one board and swaps from the thumbnail rail", async () => {
    const user = userEvent.setup();
    render(<CommunityStageConcept />);

    expect(screen.getByRole("heading", { name: "Fall 2026" })).toBeInTheDocument();
    expect(screen.getAllByText("1. Alex").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /endurance group/i }));
    expect(
      screen.getByText(/ranked people stay hidden until you join/i)
    ).toBeInTheDocument();
  });
});
