import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { BrandIndex } from "@/features/ux-brand/brand-index";
import { ForgeConcept } from "@/features/ux-brand/forge-concept";
import { ContourConcept } from "@/features/ux-brand/contour-concept";
import { FolioConcept } from "@/features/ux-brand/folio-concept";
import { DawnConcept } from "@/features/ux-brand/dawn-concept";
import { WaypathConcept } from "@/features/ux-brand/waypath-concept";
import {
  ColConcept,
  FieldNotesConcept,
  GazetteerConcept,
} from "@/features/ux-brand/mixes-paper";
import { AlpenglowConcept } from "@/features/ux-brand/mixes-ridge";
import { GazetteerSansConcept, ColSansConcept } from "@/features/ux-brand/finalists";
import { ColKit, GazetteerKit } from "@/features/ux-brand/applied-kit";
import {
  AeroConcept,
  GlasslineConcept,
  IonConcept,
} from "@/features/ux-brand/atmosphere-modern";
import {
  NeonPassConcept,
  SummitNightConcept,
} from "@/features/ux-brand/atmosphere-night";
import {
  AtelierConcept,
  HarborConcept,
  HeliosConcept,
  RiverstoneConcept,
} from "@/features/ux-brand/atmosphere-organic";
import { HueContrastStudy } from "@/features/ux-brand/hue-contrast";
import {
  BRAND_ATMOSPHERES,
  BRAND_FINALISTS,
  BRAND_KITS,
  BRAND_MIXES,
  BRAND_ROUND_ONE,
  BRAND_STUDIES,
} from "@/features/ux-brand/catalog";

afterEach(cleanup);

describe("visual language gallery", () => {
  it("lists atmospheres and the preserved archive as unlisted shareable directions", () => {
    render(<BrandIndex />);
    expect(
      screen.getByRole("heading", {
        name: /visual language gallery for goalmaxxing/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/direct link only/i)).toBeInTheDocument();
    expect(screen.getByText(/contour and folio are unchanged/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /atmospheres · complete worlds/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Studies" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Applied kit" })).toBeInTheDocument();
    expect(screen.getByText(/docs\/ux\/brand-lock-gazetteer-col.md/)).toBeInTheDocument();
    for (const direction of [
      ...BRAND_STUDIES,
      ...BRAND_ATMOSPHERES,
      ...BRAND_KITS,
      ...BRAND_FINALISTS,
      ...BRAND_ROUND_ONE,
      ...BRAND_MIXES,
    ]) {
      const matching = screen.getAllByRole("link", {
        name: new RegExp(`open ${direction.name}`, "i"),
      });
      expect(
        matching.some((link) => link.getAttribute("href") === direction.href)
      ).toBe(true);
    }
  });

  it("renders every atmosphere as a distinct interactive world", async () => {
    const user = userEvent.setup();
    const atmospheres = [
      [GlasslineConcept, "Glassline"],
      [HarborConcept, "Harbor"],
      [IonConcept, "Ion"],
      [NeonPassConcept, "Neon Pass"],
      [AtelierConcept, "Atelier"],
      [SummitNightConcept, "Summit Night"],
      [RiverstoneConcept, "Riverstone"],
      [HeliosConcept, "Helios"],
      [AeroConcept, "Aero"],
    ] as const;

    for (const [Concept, name] of atmospheres) {
      render(<Concept />);
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /tempo run/i }));
      cleanup();
    }
  });

  it("keeps the Kumar reel lineage only on Forge", () => {
    render(<ForgeConcept />);
    expect(screen.getByRole("heading", { name: "Forge" })).toBeInTheDocument();
    expect(screen.getByText(/screenshot lineage/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ascent/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/green is banned/i)).toBeInTheDocument();
  });

  it("renders Contour, Folio, Dawn Ridge, and Waypath without the reel language", () => {
    render(<ContourConcept />);
    expect(screen.getByRole("heading", { name: "Contour" })).toBeInTheDocument();
    expect(screen.queryByText(/kumar/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/elevation/i).length).toBeGreaterThan(0);

    cleanup();
    render(<FolioConcept />);
    expect(screen.getByRole("heading", { name: "Folio" })).toBeInTheDocument();
    expect(screen.queryByText(/kumar/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/chapter/i).length).toBeGreaterThan(0);

    cleanup();
    render(<DawnConcept />);
    expect(screen.getByRole("heading", { name: "Dawn Ridge" })).toBeInTheDocument();
    expect(screen.queryByText(/kumar/i)).not.toBeInTheDocument();
    expect(screen.getByText(/landing energy/i)).toBeInTheDocument();

    cleanup();
    render(<WaypathConcept />);
    expect(screen.getByRole("heading", { name: "Waypath" })).toBeInTheDocument();
    expect(screen.queryByText(/kumar/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/cairn/i).length).toBeGreaterThan(0);
  });

  it("lets Tempo run toggle so completion styling can be inspected", async () => {
    const user = userEvent.setup();
    render(<ForgeConcept />);
    const tempo = screen.getAllByRole("button", { name: /tempo run/i })[0];
    expect(tempo).toBeDefined();
    await user.click(tempo);
    expect(screen.getAllByText("Tempo run").length).toBeGreaterThan(0);
  });

  it("stacks a second object on mix completion instead of filling a circle", async () => {
    const user = userEvent.setup();
    render(<FieldNotesConcept />);
    expect(screen.getByRole("heading", { name: "Field Notes" })).toBeInTheDocument();
    expect(screen.getByText(/stacks a second tick/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /tempo run/i })[0]);

    cleanup();
    render(<AlpenglowConcept />);
    expect(screen.getByRole("heading", { name: "Alpenglow" })).toBeInTheDocument();
    expect(screen.getByText(/stacks a peach stone/i)).toBeInTheDocument();

    cleanup();
    render(<ColConcept />);
    expect(screen.getByRole("heading", { name: "Col" })).toBeInTheDocument();
    expect(screen.getByText(/without the winding cartoon path/i)).toBeInTheDocument();
  });

  it("nests an inner object on Gazetteer Sans and Col Sans instead of stacking", async () => {
    const user = userEvent.setup();
    render(<GazetteerSansConcept />);
    expect(screen.getByRole("heading", { name: "Gazetteer Sans" })).toBeInTheDocument();
    expect(screen.getByText(/handwritten check over the paper/i)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Sleeve" }));
    expect(screen.getByText(/pencil nested in the holder/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /tempo run/i })[0]);

    cleanup();
    render(<ColSansConcept />);
    expect(screen.getByRole("heading", { name: "Col Sans" })).toBeInTheDocument();
    expect(screen.getByText(/peak nested in the pass/i)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Compass" }));
    expect(screen.getByText(/needle nested in the rose/i)).toBeInTheDocument();
  });

  it("uses Nest on the Gazetteer lock page and on the Gazetteer applied kit", async () => {
    const user = userEvent.setup();
    render(<GazetteerConcept />);
    expect(screen.getByRole("heading", { name: "Gazetteer" })).toBeInTheDocument();
    expect(screen.getByText(/nests an inner square/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /tempo run/i })[0]);

    cleanup();
    render(<GazetteerKit />);
    expect(screen.getByRole("heading", { name: "Gazetteer kit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nest" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(screen.getByRole("button", { name: "Rectangular stack" }));
    expect(screen.getByRole("button", { name: "Rectangular stack" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(screen.getAllByRole("button", { name: /tempo run/i })[0]);
  });

  it("locks Soft paper corners on the Gazetteer kit and still lets Square and Pills compare", async () => {
    const user = userEvent.setup();
    render(<GazetteerKit />);
    expect(screen.getByRole("button", { name: "Soft paper" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText(/lock\. same gazetteer type/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Square" }));
    expect(screen.getByRole("button", { name: "Square" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText(/newspaper signal/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pills" }));
    expect(screen.getByRole("button", { name: "Pills" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText(/consumer-app geometry/i)).toBeInTheDocument();
  });

  it("lets Gazetteer and live phones switch a second hue for today and the selected row", async () => {
    const user = userEvent.setup();
    render(<HueContrastStudy />);
    expect(screen.getByRole("heading", { name: "Hue contrast" })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "As locked" })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("radio", { name: "As shipped" })
    ).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: "Prussian" }));
    expect(screen.getByRole("radio", { name: "Prussian" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText(/identity stays rust\. selection is prussian/i)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Brass" }));
    expect(screen.getByRole("radio", { name: "Brass" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText(/identity stays blue\. selection is brass/i)).toBeInTheDocument();

    const selectedRows = screen.getAllByRole("button", { name: /launch notes/i });
    expect(selectedRows).toHaveLength(2);
    for (const row of selectedRows) {
      expect(row).toHaveAttribute("aria-current", "true");
    }

    await user.click(screen.getAllByRole("button", { name: /tempo run/i })[0]);
  });

  it("renders the Col kit with Figtree furniture and Nest as the default mark", () => {
    render(<ColKit />);
    expect(screen.getByRole("heading", { name: "Col kit" })).toBeInTheDocument();
    expect(screen.getByText(/figtree on col furniture/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nest" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
