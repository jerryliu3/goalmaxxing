import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animatePlanScene, capturePlanScene } from "@/features/planner/plan-view-morph";

// jsdom reports every rect as zero-sized, which the capture treats as hidden.
// Give each element a distinct non-zero box so scenes have real geometry.
beforeEach(() => {
  let seq = 0;
  const boxes = new WeakMap<Element, DOMRect>();
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
    this: Element
  ) {
    const cached = boxes.get(this);
    if (cached) {
      return cached;
    }
    const top = seq++ * 24;
    const rect = {
      x: 0,
      y: top,
      left: 0,
      top,
      right: 240,
      bottom: top + 20,
      width: 240,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect;
    boxes.set(this, rect);
    return rect;
  });
  // jsdom has no Range.getClientRects; report the selected element's own box.
  Range.prototype.getClientRects = function (this: Range) {
    const node = this.startContainer;
    const el = node instanceof Element ? node : node.parentElement;
    const rect = el?.getBoundingClientRect();
    return Object.assign(rect ? [rect] : [], { item: (i: number) => (rect && i === 0 ? rect : null) }) as unknown as DOMRectList;
  };
});

function mount(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

const WEEK_ROW = (day: string) => `
  <li data-calendar-week-row="true" data-day="${day}">
    <button data-day-cell="true" data-day="${day}">
      <span data-plan-weekday="true" style="letter-spacing: 0.12em; text-transform: uppercase; font-size: 11px">Mon</span>
      <span data-plan-day-number="true" style="font-family: Newsreader; font-size: 18px">${day.slice(8, 10)}</span>
    </button>
  </li>`;

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("capturePlanScene", () => {
  it("carries continuous-grid dividers, tile corners, and date typography into the morph", () => {
    const root = mount(`
      <button data-day-cell="true" data-day="2026-09-06"
        style="border-width: 0 1px 1px 0; border-style: solid; border-radius: 0">
        <span data-plan-day-number="true" style="font-size: 18px; font-weight: 500">6</span>
        <div data-planner-entry-key="run" style="border-radius: 10px">
          <span data-testid="completion-title" data-completion-treatment="quiet">Run</span>
        </div>
      </button>`);

    const scene = capturePlanScene(root, "month");
    expect(scene.days.get("2026-09-06")).toMatchObject({
      radius: 0,
      borderWidths: "0px 1px 1px 0px",
    });
    expect(scene.items.get("2026-09-06:run")?.radius).toBe(10);
    expect(scene.labels.get("date:2026-09-06")).toMatchObject({
      text: "6",
      type: { size: 18, weight: "500" },
    });
  });

  it("captures letter spacing and casing, which the CSS font shorthand omits", () => {
    const root = mount(`<ol>${WEEK_ROW("2026-09-14")}</ol>`);

    const label = capturePlanScene(root, "week").labels.get("weekday:1");

    expect(label?.type?.letterSpacing).toBe("0.12em");
    // jsdom does not compute text-transform, so assert the field is carried rather
    // than its value: dropping it renders "Mon" where the view paints "MON".
    expect(label?.type).toHaveProperty("textTransform");
    expect(label?.text).toBe("Mon");
  });

  it("reads the day view's own number and weekday so week<->day has real endpoints", () => {
    const root = mount(`
      <div data-testid="plan-day-pane" data-plan-day="2026-09-14">
        <span data-plan-weekday="true">Mon</span>
        <span data-plan-day-number="true">14</span>
      </div>`);

    const scene = capturePlanScene(root, "day");

    expect(scene.labels.has("date:2026-09-14")).toBe(true);
    expect(scene.labels.has("weekday:1")).toBe(true);
    expect(scene.days.has("2026-09-14")).toBe(true);
  });

  it("associates month weekday headers with a date so labels can travel with their day", () => {
    const root = mount(`
      <div data-calendar-weekday-grid="true">
        <span data-plan-weekday-index="1" data-plan-weekday-date="2026-09-14">Mon</span>
      </div>`);

    expect(capturePlanScene(root, "month").labels.get("weekday:1")?.day).toBe("2026-09-14");
  });


});

describe("animatePlanScene", () => {
  it("positions surrogates before yielding, so none flash at the stage origin", () => {
    const root = mount(`<div data-plan-view="week"><ol>${WEEK_ROW("2026-09-14")}</ol></div>`);
    const content = root.firstElementChild as HTMLElement;
    const from = capturePlanScene(root, "week");

    const run = animatePlanScene(root, content, from, capturePlanScene(root, "day"), () => {});
    const painted = Array.from(
      root.querySelectorAll<HTMLElement>("[data-plan-morph-overlay] [style*='translate']")
    );

    expect(painted.length).toBeGreaterThan(0);
    run.cancel();
  });

  it("holds the clip constant so no edge sweeps across the tiles", () => {
    const root = mount(`<div data-plan-view="week"><ol>${WEEK_ROW("2026-09-14")}</ol></div>`);
    const content = root.firstElementChild as HTMLElement;

    const run = animatePlanScene(
      root,
      content,
      capturePlanScene(root, "week"),
      capturePlanScene(root, "day"),
      () => {}
    );
    // The root must not clip the overlay: its height animates, and hiding overflow
    // dragged that shrinking edge up through the morph.
    expect(root.style.overflow).toBe("");
    run.cancel();
  });

  it("restores the real view and removes its overlay when cancelled", () => {
    const root = mount(`<div data-plan-view="week"><ol>${WEEK_ROW("2026-09-14")}</ol></div>`);
    const content = root.firstElementChild as HTMLElement;
    const from = capturePlanScene(root, "week");
    const to = capturePlanScene(root, "day");

    const run = animatePlanScene(root, content, from, to, () => {});
    expect(root.querySelector("[data-plan-morph-overlay]")).toBeInstanceOf(HTMLElement);
    expect(content.style.opacity).toBe("0");

    run.cancel();

    expect(root.querySelector("[data-plan-morph-overlay]")).toBeNull();
    expect(content.style.opacity).toBe("");
    expect(content.hasAttribute("inert")).toBe(false);
  });
});

describe("morph surrogates", () => {
  const RINGED_PANE = `
    <div data-testid="plan-day-pane" data-plan-day="2026-09-14" style="box-shadow: 0 0 0 2px rgb(180 83 9)">
      <span data-plan-weekday="true">Mon</span>
      <span data-plan-day-number="true">14</span>
    </div>`;

  it("does not lend the selected pane's ring to projected dates", () => {
    const root = mount(`<div>${RINGED_PANE}</div>`);
    const content = root.firstElementChild as HTMLElement;
    const day = capturePlanScene(root, "day");
    // A week scene whose dates are absent from day view, so they must be projected.
    const week = capturePlanScene(mount(`<ol>${WEEK_ROW("2026-09-15")}</ol>`), "week");

    const run = animatePlanScene(root, content, week, day, () => {});
    const rings = Array.from(
      root.querySelectorAll<HTMLElement>("[data-plan-morph-overlay] [data-morph-key]")
    ).filter((node) => node.style.boxShadow && node.style.boxShadow !== "none");

    // Only the pane's own mark may carry it.
    expect(rings.length).toBeLessThanOrEqual(1);
    run.cancel();
  });

  it("bounds carried item text so month pills stay truncated mid-morph", () => {
    const html = `
      <div data-testid="plan-calendar-split-calendar">
        <ol>
          <li data-calendar-week-row="true" data-day="2026-09-14">
            <button data-day-cell="true" data-day="2026-09-14"></button>
            <div data-planner-entry-key="goal-1:cadence:0">
              <span data-testid="completion-title">A very long scheduled goal title</span>
            </div>
          </li>
        </ol>
      </div>`;
    const root = mount(`<div>${html}</div>`);
    const content = root.firstElementChild as HTMLElement;
    const scene = capturePlanScene(root, "week");

    const run = animatePlanScene(root, content, scene, capturePlanScene(root, "month"), () => {});
    const text = root.querySelector<HTMLElement>(
      "[data-plan-morph-overlay] [style*='nowrap']"
    );

    expect(text).toBeInstanceOf(HTMLElement);
    // Its container clips it rather than letting the title run past the tile.
    expect(text!.parentElement!.style.overflow).toBe("hidden");
    run.cancel();
  });
});


describe("completed title treatments during view changes", () => {
  function scene(treatment: "quiet" | "strike", mode: "month" | "week" | "day") {
    const root = mount(`<div data-plan-view="${mode}">
      <div data-testid="plan-calendar-split-calendar"><ol><li data-calendar-week-row="true" data-day="2026-09-14">
        <button data-day-cell="true" data-day="2026-09-14"></button>
        <div data-planner-entry-key="goal-1:cadence:0">
          <span data-testid="completion-title" data-completed="true" data-completion-treatment="${treatment}">Read</span>
          <svg aria-label="Completed"></svg>
        </div>
      </li></ol></div></div>`);
    return { root, scene: capturePlanScene(root, mode) };
  }

  it("carries quiet titles and checkmarks between month and week", () => {
    const from = scene("quiet", "month");
    const to = scene("quiet", "week");
    expect([...from.scene.items.values()][0]).toMatchObject({ completed: true, completionTreatment: "quiet" });
    const run = animatePlanScene(from.root, from.root.firstElementChild as HTMLElement, from.scene, to.scene, () => {});
    const overlay = from.root.querySelector("[data-plan-morph-overlay]")!;
    expect(overlay.querySelector('[data-completion-treatment="quiet"]')).not.toBeNull();
    expect(overlay.querySelector('[data-completion-treatment="strike"]')).toBeNull();
    expect(overlay.querySelector('[aria-label="Completed"]')).not.toBeNull();
    run.cancel();
  });

  it.each([["quiet", "strike"], ["strike", "quiet"]] as const)(
    "preserves both endpoints when %s titles become %s",
    (first, second) => {
      const from = scene(first, "week");
      const to = scene(second, "week");
      const run = animatePlanScene(from.root, from.root.firstElementChild as HTMLElement, from.scene, to.scene, () => {});
      const titles = from.root.querySelectorAll('[data-plan-morph-overlay] .gm-completion-title');
      expect(Array.from(titles, title => (title as HTMLElement).dataset.completionTreatment).sort()).toEqual(["quiet", "strike"]);
      run.cancel();
    }
  );
});
