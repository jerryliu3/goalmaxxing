import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MedalDirectionPage } from "@/features/ux-medals/direction-page";
import { MedalsIndex } from "@/features/ux-medals/medals-index";
import { MEDAL_DIRECTIONS, RANK_NAMES, ROUND_THREE, ROUND_TWO } from "@/features/ux-medals/model";
import { premiumDetail, shapeMask } from "@/features/ux-medals/premium-forms";
import { LADDER, ladderFinish } from "@/features/ux-medals/premium-materials";
import { notchedCirclePath, wrapLines } from "@/features/ux-medals/svg-geometry";

afterEach(cleanup);

const medals = (root: Element, selector = "") =>
  Array.from(root.querySelectorAll<HTMLElement>(`.pm-medal${selector}`));

describe("medals study", () => {
  it("leads with Round 3 premium and keeps the Round 2 flat systems as references", () => {
    render(<MedalsIndex />);
    expect(ROUND_THREE.map((direction) => direction.slug)).toEqual(["machined", "prism"]);
    expect(ROUND_TWO.map((direction) => direction.slug)).toEqual(["tile", "token", "mark"]);

    expect(screen.getAllByRole("region")[0]).toHaveAccessibleName("Round 3 premium");
    const premium = screen.getByRole("region", { name: "Round 3 premium" });
    const flat = screen.getByRole("region", { name: "Round 2 (flat)" });
    for (const direction of ROUND_THREE) {
      expect(within(premium).getByRole("link", { name: `Open ${direction.name}` })).toHaveAttribute(
        "href",
        `/ux/medals/${direction.slug}`
      );
    }
    for (const direction of ROUND_TWO) {
      expect(within(flat).getByRole("link", { name: `Open ${direction.name}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole("link", { name: /seal|enamel/i })).toBeNull();

    const ladder = screen.getByRole("region", { name: "Material ladder" });
    for (const step of LADDER) {
      expect(within(ladder).getByRole("rowheader", { name: new RegExp(step.name) })).toBeInTheDocument();
    }

    const families = screen.getByRole("region", { name: "Mix per family" });
    for (const name of ["Levels", "Challenges", "Leaderboards", "Streaks", "Goal finishes", "Team"]) {
      expect(within(families).getAllByText(name).length).toBeGreaterThan(0);
    }
    expect(within(families).getAllByRole("rowheader", { name: /proposed mix, premium/i })).toHaveLength(2);
  });

  it("mounts the shared relief filters that engrave premium numerals", () => {
    render(<MedalsIndex />);
    expect(document.getElementById("pm-letter-recessed-text")).not.toBeNull();
    expect(document.getElementById("pm-letter-raised-text")).not.toBeNull();
  });

  it("strikes goal medals in the picked card's material", async () => {
    const user = userEvent.setup();
    render(<MedalsIndex />);
    const pairing = screen.getByRole("region", { name: "Side by side with the card" });
    const goalMaterials = () => medals(pairing, '[data-family="goal"]').map((medal) => medal.dataset.material);

    expect(within(pairing).getByRole("article", { name: "Defend the thesis. goal card" })).toBeInTheDocument();
    expect(within(pairing).getAllByText(/^“A week off the grid in Big Sur\.”$/).length).toBe(ROUND_THREE.length);
    expect(within(pairing).getByText("Goal card · Anodized alloy")).toBeInTheDocument();
    expect(goalMaterials().length).toBeGreaterThan(0);
    expect(new Set(goalMaterials())).toEqual(new Set(["alloy"]));

    await user.click(within(pairing).getByRole("button", { name: /Health · Glass/ }));
    expect(within(pairing).getByRole("article", { name: "Run the autumn half. goal card" })).toBeInTheDocument();
    expect(within(pairing).getByRole("button", { name: /Health · Glass/ })).toHaveAttribute("aria-pressed", "true");
    expect(new Set(goalMaterials())).toEqual(new Set(["glass"]));

    await user.click(within(pairing).getByRole("button", { name: /Personal · Chromatic/ }));
    expect(within(pairing).getByText("Goal card · Chromatic foil")).toBeInTheDocument();
    expect(new Set(goalMaterials())).toEqual(new Set(["chromatic"]));
  });

  it.each(ROUND_THREE.map((direction) => direction.slug))(
    "renders the %s ladder as materials and every family on velvet and paper",
    (slug) => {
      render(<MedalDirectionPage slug={slug} />);
      const variant = slug as "machined" | "prism";

      const ladder = screen.getByRole("region", { name: "Level ladder" });
      expect(medals(ladder).map((medal) => medal.dataset.material)).toEqual(["graphite", "steel", "sapphire", "gold", "blank"]);
      for (const step of LADDER) {
        expect(within(ladder).getByText(ladderFinish(variant, step.key).name)).toBeInTheDocument();
      }

      const hero = screen.getByRole("region", { name: "Selected medal" });
      const [heroMedal] = medals(hero);
      expect(heroMedal).toHaveAttribute("data-tilt", "true");
      expect(heroMedal).toHaveAttribute("data-material", "gold");
      expect(heroMedal).toHaveAttribute("data-detail", "hero");

      const shelves = screen.getByRole("region", { name: "Shelves" });
      for (const ground of ["Graphite velvet shelf", "Paper shelf"]) {
        const shelf = within(shelves).getByRole("figure", { name: ground });
        for (const family of ["goal", "streak", "challenge", "leaderboard", "team"]) {
          const sizes = medals(shelf, `[data-family="${family}"]`).map((medal) => medal.dataset.detail);
          expect(sizes).toEqual(["shelf", "small", "tiny"]);
        }
      }

      const system = screen.getByRole("region", { name: "The system" });
      for (const name of ["Goal finishes", "Streaks", "Challenges", "Leaderboards", "Team"]) {
        expect(within(system).getByRole("article", { name })).toBeInTheDocument();
      }
      expect(medals(system, '[data-material="blank"]').length).toBeGreaterThan(0);
      expect(screen.getByRole("region", { name: "Side by side with the card" })).toBeInTheDocument();
    }
  );

  it("plays the premium unlock with a light sweep and a rim catch-light", async () => {
    const user = userEvent.setup();
    render(<MedalDirectionPage slug="machined" />);
    const hero = screen.getByRole("region", { name: "Selected medal" });
    expect(hero.querySelector(".pm-sweep")).toBeNull();
    await user.click(screen.getByRole("button", { name: /play unlock/i }));
    expect(hero.querySelector('.pm-medal[data-unlocking="true"] .pm-sweep')).not.toBeNull();
    expect(hero.querySelector(".pm-catch")).not.toBeNull();
  });

  it.each(ROUND_TWO.map((direction) => direction.slug))(
    "shows every family of the flat %s system, earned and locked, and replays unlocks",
    async (slug) => {
      const user = userEvent.setup();
      render(<MedalDirectionPage slug={slug} />);
      const system = screen.getByRole("region", { name: "The system" });
      for (const name of ["Goal finishes", "Streaks", "Challenges", "Leaderboards", "Team"]) {
        expect(within(system).getByRole("article", { name })).toBeInTheDocument();
      }
      expect(within(system).getAllByText(/^Locked · /).length).toBeGreaterThan(0);
      await user.click(within(system).getByRole("button", { name: /replay family unlocks/i }));
      expect(system.querySelector(".md-unlock")).not.toBeNull();
      expect(screen.getByRole("region", { name: "Side by side with the card" })).toBeInTheDocument();
    }
  );

  it.each(MEDAL_DIRECTIONS.map((direction) => direction.slug))(
    "renders the %s ladder with every rank name",
    (slug) => {
      render(<MedalDirectionPage slug={slug} />);
      const ladder = screen.getByRole("region", { name: "Level ladder" });
      for (const name of RANK_NAMES[slug]) {
        expect(within(ladder).getByRole("button", { name: new RegExp(name, "i") })).toBeInTheDocument();
      }
      expect(screen.getByRole("heading", { level: 2, name: RANK_NAMES[slug][3] })).toBeInTheDocument();
    }
  );

  it.each(["machined", "token"] as const)("shows a locked rank honestly when selected (%s)", async (slug) => {
    const user = userEvent.setup();
    render(<MedalDirectionPage slug={slug} />);
    const capstone = new RegExp(`${RANK_NAMES[slug][4]}, level 10, locked`, "i");

    await user.click(screen.getByRole("button", { name: capstone }));
    expect(screen.getByRole("heading", { level: 2, name: RANK_NAMES[slug][4] })).toBeInTheDocument();
    expect(screen.getByText("Not yet earned")).toBeInTheDocument();
    expect(screen.getByText("What it takes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: capstone })).toHaveAttribute("aria-pressed", "true");
  });

  it("plays the unlock moment for earned and locked ranks without crashing", async () => {
    const user = userEvent.setup();
    for (const direction of MEDAL_DIRECTIONS) {
      const { unmount } = render(<MedalDirectionPage slug={direction.slug} />);
      await user.click(screen.getByRole("button", { name: /play unlock/i }));
      expect(document.querySelector(".md-unlock")).not.toBeNull();

      const capstone = RANK_NAMES[direction.slug][4]!;
      await user.click(screen.getByRole("button", { name: new RegExp(`${capstone}, level 10`, "i") }));
      expect(document.querySelector(".md-unlock")).toBeNull();
      await user.click(screen.getByRole("button", { name: /play unlock/i }));
      expect(screen.getByText(/preview — not earned yet/i)).toBeInTheDocument();
      unmount();
    }
  });

  it("toggles dark paper on the stage", async () => {
    const user = userEvent.setup();
    const { container } = render(<MedalDirectionPage slug="prism" />);
    const toggle = screen.getByRole("button", { name: "Dark paper" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".md-root")).toHaveAttribute("data-theme", "dark");
  });

  it("simplifies material by size and builds closed geometry", () => {
    expect([280, 96, 44, 20].map(premiumDetail)).toEqual(["hero", "shelf", "small", "tiny"]);
    expect(shapeMask("M 0 0 H 10 Z")).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(shapeMask("M 0 0 H 10 Z")).toBe(shapeMask("M 0 0 H 10 Z"));
    expect(notchedCirclePath(54, 8, 4.2)).toMatch(/^M .* Z$/);
    expect(wrapLines("Read twenty books this year.", 17)).toEqual(["Read twenty books", "this year."]);
    expect(wrapLines("one two three four five six", 7, 2)).toEqual(["one two", "three…"]);
  });
});
