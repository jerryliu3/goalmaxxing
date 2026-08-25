import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StaticJourneyPoster } from "@/components/journey/static-journey-poster.web";

afterEach(() => {
  cleanup();
});

describe("StaticJourneyPoster", () => {
  it("renders the poster image when sources are provided", () => {
    render(
      <StaticJourneyPoster
        mobileSrc="/journey/mobile.webp"
        desktopSrc="/journey/desktop.webp"
        visible
      />
    );

    const posterImage = document.querySelector("[data-journey-layer='poster'] img");
    expect(posterImage).toHaveAttribute("src", "/journey/desktop.webp");
    expect(document.querySelector("[data-journey-layer='poster']")).toBeInTheDocument();
  });

  it("removes the poster layer when the image fails to load", () => {
    render(
      <StaticJourneyPoster
        mobileSrc="/journey/mobile.webp"
        desktopSrc="/journey/desktop.webp"
        visible
      />
    );

    const posterImage = document.querySelector(
      "[data-journey-layer='poster'] img"
    ) as HTMLImageElement;
    fireEvent.error(posterImage);

    expect(document.querySelector("[data-journey-layer='poster']")).not.toBeInTheDocument();
  });

  it("retries rendering when poster sources change after a failure", () => {
    const { rerender } = render(
      <StaticJourneyPoster
        mobileSrc="/journey/mobile.webp"
        desktopSrc="/journey/desktop.webp"
        visible
      />
    );

    const posterImage = document.querySelector(
      "[data-journey-layer='poster'] img"
    ) as HTMLImageElement;
    fireEvent.error(posterImage);
    expect(document.querySelector("[data-journey-layer='poster']")).not.toBeInTheDocument();

    rerender(
      <StaticJourneyPoster
        mobileSrc="/journey/mobile-v2.webp"
        desktopSrc="/journey/desktop-v2.webp"
        visible
      />
    );

    expect(
      document.querySelector("[data-journey-layer='poster'] img")
    ).toHaveAttribute("src", "/journey/desktop-v2.webp");
  });
});
