import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Progress } from "./progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { tabChromeClasses } from "@/components/navigation/tab-chrome";

describe("action and state color roles", () => {
  it("keeps actions primary and pairs secondary surfaces with secondary ink", () => {
    render(<><Button>Create goal</Button><Button variant="secondary" aria-pressed>Monthly</Button><Progress value={40} aria-label="Level progress" /></>);
    expect(screen.getByRole("button", { name: "Create goal" })).toHaveClass("bg-primary", "text-primary-foreground");
    expect(screen.getByRole("button", { name: "Monthly" })).toHaveClass("bg-secondary", "text-secondary-foreground");
    const progress = screen.getByRole("progressbar", { name: "Level progress" });
    expect(progress).toHaveAttribute("aria-valuenow", "40");
    expect(progress.querySelector('[data-slot="progress-indicator"]')).toHaveClass("bg-secondary");
  });

  it.each([false, true])("pairs active navigation surfaces on mobile=%s", (mobile) => {
    const pills = tabChromeClasses("pills", mobile, "grid-cols-3");
    expect(pills.highlight).toContain("bg-selection");
    expect(pills.linkActive).toBe("text-selection-foreground");
    const underline = tabChromeClasses("underline", mobile, "grid-cols-3");
    expect(underline.highlight).toContain("bg-selection");
    expect(underline.linkActive).toBe(mobile ? "text-selection-foreground" : "text-foreground");
  });

  it("keeps tab state and content in sync with the secondary active treatment", () => {
    render(<Tabs defaultValue="recap"><TabsList><TabsTrigger value="recap">Recap</TabsTrigger><TabsTrigger value="next">Next</TabsTrigger></TabsList><TabsContent value="recap">Completed work</TabsContent><TabsContent value="next">Upcoming work</TabsContent></Tabs>);
    const next = screen.getByRole("tab", { name: "Next" });
    fireEvent.mouseDown(next, { button: 0, ctrlKey: false });
    expect(next).toHaveAttribute("aria-selected", "true");
    expect(next).toHaveClass("data-[state=active]:bg-selection", "data-[state=active]:text-selection-foreground");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Upcoming work");
  });
});
