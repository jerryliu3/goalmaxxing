import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DuoLanes } from "@/features/social/duo/duo-lanes";

const viewer = { id: "viewer" as const, label: "Mine", readOnly: false };
const partner = {
  id: "partner" as const,
  label: "Alex",
  userId: "22222222-2222-4222-8222-222222222222",
  readOnly: true,
};

describe("DuoLanes", () => {
  it("owns lane headers outside the me scope", () => {
    render(
      <DuoLanes
        scope="partner"
        viewer={viewer}
        partner={partner}
        renderLane={(subject) => <p>{subject.id} lane</p>}
      />
    );
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("View only")).toBeInTheDocument();
    expect(screen.queryByText("Mine")).not.toBeInTheDocument();
  });

  it("hides headers in the viewer-only scope", () => {
    render(
      <DuoLanes
        scope="me"
        viewer={viewer}
        partner={partner}
        renderLane={() => <p>content</p>}
      />
    );
    expect(screen.queryByText("Mine")).not.toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("uses a swipeable lane rail when both lanes are visible", () => {
    render(
      <DuoLanes
        scope="both"
        viewer={viewer}
        partner={partner}
        renderLane={(subject) => <p>{subject.label} content</p>}
      />
    );

    expect(screen.getByTestId("duo-lanes-scroll")).toBeInTheDocument();
    expect(screen.getByText("Mine content")).toBeInTheDocument();
    expect(screen.getByText("Alex content")).toBeInTheDocument();
  });

  it("lines lanes up on a shared subgrid when asked", () => {
    render(
      <DuoLanes
        scope="both"
        viewer={viewer}
        partner={partner}
        alignRows={4}
        renderLane={(subject) => <p>{subject.label} content</p>}
      />
    );

    const lane = screen.getByText("Mine content").closest("section")!;
    expect(lane).toHaveAttribute("data-duo-aligned", "true");
    expect(lane).toHaveClass("md:grid-rows-subgrid", "md:row-span-(--duo-rows)");
    expect(lane.style.getPropertyValue("--duo-rows")).toBe("5");
  });

  it("does not align a single lane", () => {
    render(
      <DuoLanes scope="me" viewer={viewer} partner={partner} alignRows={4} renderLane={() => <p>content</p>} />
    );
    expect(screen.getByText("content").closest("section")).not.toHaveAttribute("data-duo-aligned");
  });
});
