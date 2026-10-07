import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProgressSectionStack,
  type ProgressOverviewSectionContent,
} from "@/features/insights/progress-overview/progress-section-stack";

function sections(): ProgressOverviewSectionContent[] {
  return [
    { id: "week", content: <p>Week rhythm</p> },
    { id: "history", content: <p>Completion ledger</p> },
  ];
}

describe("ProgressSectionStack", () => {
  afterEach(cleanup);

  it("can render only completion history", () => {
    render(<ProgressSectionStack sections={sections().filter((section) => section.id !== "week")} />);
    expect(screen.getByText("Completion ledger")).toBeInTheDocument();
    expect(screen.queryByText("Week rhythm")).toBeNull();
  });

  it("raises only framed sections onto a panel", () => {
    render(
      <ProgressSectionStack
        sections={[
          { id: "history", content: <p>Completion ledger</p>, framed: true },
          { id: "week", content: <p>Week rhythm</p> },
        ]}
      />
    );

    expect(screen.getByText("Completion ledger").parentElement).toHaveClass("bg-card", "rounded-2xl");
    expect(screen.getByText("Week rhythm").parentElement).not.toHaveClass("bg-card");
  });

  it("renders the tracker and week rhythm in canonical order", () => {
    render(<ProgressSectionStack sections={sections()} />);

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(["Progress tracker", "This week"]);
    expect(screen.queryByText("Goal library")).toBeNull();
  });

  it("reports the sections it can show", () => {
    const onSectionsChange = vi.fn();

    render(
      <ProgressSectionStack
        sections={sections()}
        onSectionsChange={onSectionsChange}
      />
    );

    expect(onSectionsChange).toHaveBeenCalledWith(["week", "history"]);
  });

  it("reports once while the section set is unchanged", () => {
    const onSectionsChange = vi.fn();
    const { rerender } = render(
      <ProgressSectionStack
        sections={sections()}
        onSectionsChange={onSectionsChange}
      />
    );

    // A fresh array each render must not re-fire the report.
    rerender(
      <ProgressSectionStack
        sections={sections()}
        onSectionsChange={onSectionsChange}
      />
    );

    expect(onSectionsChange).toHaveBeenCalledTimes(1);
  });

  it("drops element ids on an unanchored lane", () => {
    render(
      <ProgressSectionStack sections={sections()} anchored={false} />
    );

    expect(screen.queryByTestId("progress-section-history")).toBeNull();
    expect(screen.getByText("Completion ledger")).toBeInTheDocument();
  });
});
