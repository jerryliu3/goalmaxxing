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
    { id: "past-goals", content: <p>Goal library</p> },
  ];
}

describe("ProgressSectionStack", () => {
  afterEach(cleanup);

  it("can combine completion history and past goals", () => {
    render(<ProgressSectionStack sections={sections().filter((section) => section.id !== "week")} view="all" />);
    expect(screen.getByText("Completion ledger")).toBeInTheDocument();
    expect(screen.getByText("Goal library")).toBeInTheDocument();
    expect(screen.queryByText("Week rhythm")).toBeNull();
  });

  it("renders only the active view in canonical order", () => {
    render(<ProgressSectionStack sections={sections()} view="current" />);

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(["Completion history", "This week"]);
    expect(screen.queryByText("Goal library")).toBeNull();
  });

  it("reports every section it can show, not just the active view", () => {
    const onSectionsChange = vi.fn();

    render(
      <ProgressSectionStack
        sections={sections()}
        view="current"
        onSectionsChange={onSectionsChange}
      />
    );

    expect(onSectionsChange).toHaveBeenCalledWith(["week", "history", "past-goals"]);
  });

  it("reports once while the section set is unchanged", () => {
    const onSectionsChange = vi.fn();
    const { rerender } = render(
      <ProgressSectionStack
        sections={sections()}
        view="current"
        onSectionsChange={onSectionsChange}
      />
    );

    // A fresh array each render must not re-fire the report.
    rerender(
      <ProgressSectionStack
        sections={sections()}
        view="current"
        onSectionsChange={onSectionsChange}
      />
    );

    expect(onSectionsChange).toHaveBeenCalledTimes(1);
  });

  it("drops element ids on an unanchored lane", () => {
    render(
      <ProgressSectionStack sections={sections()} view="current" anchored={false} />
    );

    expect(screen.queryByTestId("progress-section-history")).toBeNull();
    expect(screen.getByText("Completion ledger")).toBeInTheDocument();
  });
});
