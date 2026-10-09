import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { TabNav } from "@/components/navigation/tab-nav";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    transitionTypes,
    ...props
  }: ComponentProps<"a"> & {
    href: string;
    transitionTypes?: string[];
  }) => (
    <a
      href={href}
      data-transition-types={transitionTypes?.join(",")}
      {...props}
    >
      {children}
    </a>
  ),
}));

describe("TabNav", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockPathname = "/";
  });

  it("renders four app tabs and marks the active tab", () => {
    mockPathname = "/social";
    const { container } = render(<TabNav />);

    expect(screen.getByRole("link", { name: /Growth/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Agenda$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Community/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Goals$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Community/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /Growth/i })).toHaveAttribute(
      "data-onboarding",
      "nav.growth"
    );
    expect(screen.getByRole("link", { name: /^Agenda$/i })).toHaveAttribute(
      "data-onboarding",
      "nav.calendar"
    );
    expect(screen.getByRole("link", { name: /Community/i })).toHaveAttribute(
      "data-onboarding",
      "nav.social"
    );
    expect(screen.queryByRole("link", { name: /^Profile$/i })).toBeNull();
    // Desktop keeps the label in ink; the rule under it takes the selection line.
    expect(screen.getByRole("link", { name: /Community/i })).toHaveClass(
      "text-foreground"
    );
    const highlights = container.querySelectorAll("[data-motion='tab-nav-highlight']");
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveClass("bg-selection-line");
  });

  it("keeps one indicator mounted on a fixed local baseline after scrolling and changing tabs", () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(48);
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(6);
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
      return Array.from(this.parentElement?.children ?? []).indexOf(this) * 108;
    });
    mockPathname = "/calendar";
    const { container, rerender } = render(<TabNav />);
    const indicator = container.querySelector("[data-motion='tab-nav-highlight']")!;
    const track = indicator.parentElement!;
    expect(track.style.top).toBe("6px");
    fireEvent.scroll(window, { target: { scrollY: 900 } });
    fireEvent.click(screen.getByRole("link", { name: "Goals" }));
    mockPathname = "/goals";
    rerender(<TabNav />);
    expect(container.querySelector("[data-motion='tab-nav-highlight']")).toBe(indicator);
    expect(track.style.top).toBe("6px");
    expect(track.style.height).toBe("48px");
  });

  it("routes the planner tab to calendar path", () => {
    render(<TabNav />);

    expect(screen.getByRole("link", { name: /^Agenda$/i })).toHaveAttribute(
      "href",
      "/calendar"
    );
  });

  it("uses the four-column grid class when four tabs are present", () => {
    const { container } = render(<TabNav />);
    const tabList = container.querySelector("ul");
    expect(tabList).toHaveClass("grid-cols-4");
  });

  it("sizes phone tabs so none is narrower than its label", () => {
    const { container } = render(<TabNav mobile />);
    expect(container.querySelector("ul")).toHaveClass("grid-cols-[repeat(4,minmax(min-content,1fr))]");
  });

  it("keeps the mobile nav bar 50% transparent so content shows through", () => {
    const { container } = render(<TabNav mobile />);
    const tabList = container.querySelector("ul");
    expect(tabList).toHaveClass("bg-background/50");
    expect(tabList).toHaveClass("supports-[backdrop-filter]:bg-background/50");
    expect(tabList).not.toHaveClass("bg-background/10");
    expect(tabList).not.toHaveClass("bg-background/20");
    expect(tabList).not.toHaveClass("bg-background/25");
  });

  it("marks tab navigation with directional transition types", () => {
    mockPathname = "/calendar";
    render(<TabNav />);

    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "data-transition-types",
      "nav-forward"
    );
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute(
      "data-transition-types"
    );
    expect(screen.getByRole("link", { name: "Growth" })).toHaveAttribute(
      "data-transition-types",
      "nav-forward"
    );
  });

  it("updates the planner highlight immediately on click even if the route lags", () => {
    mockPathname = "/growth";
    render(<TabNav mobile />);

    fireEvent.click(screen.getByRole("link", { name: "Agenda" }));

    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Growth" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("follows the real route once pathname catches up after an optimistic click", () => {
    mockPathname = "/growth";
    const { rerender } = render(<TabNav mobile />);

    fireEvent.click(screen.getByRole("link", { name: "Agenda" }));
    mockPathname = "/calendar";
    rerender(<TabNav mobile />);

    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute(
      "aria-current",
      "page"
    );

    mockPathname = "/social";
    rerender(<TabNav mobile />);

    expect(screen.getByRole("link", { name: "Community" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Agenda" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("clears a stale optimistic highlight after leaving and returning without a tab click", () => {
    mockPathname = "/calendar";
    const { rerender } = render(<TabNav />);

    fireEvent.click(screen.getByRole("link", { name: "Goals" }));
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "aria-current",
      "page"
    );

    mockPathname = "/goals";
    rerender(<TabNav />);
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "aria-current",
      "page"
    );

    mockPathname = "/calendar";
    rerender(<TabNav />);
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Goals" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("highlights planner under a demo href prefix", () => {
    mockPathname = "/demo/calendar";
    render(<TabNav hrefPrefix="/demo" />);

    expect(screen.getByRole("link", { name: /^Agenda$/i })).toHaveAttribute(
      "href",
      "/demo/calendar"
    );
    expect(screen.getByRole("link", { name: /^Agenda$/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /Growth/i })).toHaveAttribute(
      "href",
      "/demo/growth"
    );
    expect(screen.getByRole("link", { name: /Growth/i })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("uses underline chrome when Gazetteer is selected", () => {
    mockPathname = "/social";
    render(
      <UiStyleProvider initialStyleId="gazetteer">
        <TabNav />
      </UiStyleProvider>
    );

    expect(screen.getByRole("link", { name: /Community/i })).toHaveClass("text-foreground");
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toHaveClass(
      "border-b"
    );
  });
});
