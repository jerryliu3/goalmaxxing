import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "@/components/landing/landing-page";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

afterEach(cleanup);

function primaryCtaLinks() {
  return [
    ...screen.getAllByRole("link", { name: "Create account" }),
    screen.getByRole("link", { name: /go to app/i }),
  ];
}

describe("LandingPage", () => {
  it("places the climb chapter after Inside Goalmaxxing", () => {
    render(<LandingPage />);

    expect(screen.getByText("Inside Goalmaxxing")).toBeInTheDocument();
    expect(screen.getByTestId("landing-wow-chapter")).toBeInTheDocument();
    expect(screen.getByText("Intuitive goal setup")).toBeInTheDocument();
    expect(screen.getAllByTestId("landing-try-me").length).toBeGreaterThan(0);
  });

  it("does not create a page scroll container that would unstick the climb", () => {
    const { container } = render(<LandingPage />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).not.toMatch(/overflow-x-hidden/);
    expect(root.className).toMatch(/overflow-x-clip/);
  });

  it("keeps filled stamp-rust CTAs instead of outline grey", () => {
    render(<LandingPage />);

    for (const link of primaryCtaLinks()) {
      expect(link.className).toContain("bg-primary");
      expect(link.className).toContain("text-primary-foreground");
      expect(link.className).not.toContain("dark:bg-input");
    }
  });
});
