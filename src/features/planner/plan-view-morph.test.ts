import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animatePlanScene, capturePlanScene, mountPlanHandoff, PLAN_MORPH_MONTH_DURATION_MS } from "@/features/planner/plan-view-morph";

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
  it("preserves outgoing scroll offsets and measures only the live destination", () => {
    const root = mount(`
      <div data-plan-view="month">
        <div data-calendar-month-vertical-viewport="true">
          <button data-day-cell="true" data-day="2026-09-06">
            <span data-plan-day-number="true">6</span>
          </button>
        </div>
      </div>`);
    const viewport = root.querySelector<HTMLElement>('[data-calendar-month-vertical-viewport]')!;
    viewport.scrollTop = 144;
    viewport.scrollLeft = 90;

    const handoff = mountPlanHandoff(root)!;
    const copy = handoff.querySelector<HTMLElement>('[data-calendar-month-vertical-viewport]')!;
    expect(copy.scrollTop).toBe(144);
    expect(copy.scrollLeft).toBe(90);

    const day = viewport.querySelector<HTMLElement>('[data-day-cell]')!;
    day.dataset.day = "2026-09-07";
    day.querySelector('[data-plan-day-number]')!.textContent = "7";
    const scene = capturePlanScene(root, "month");
    expect([...scene.days.keys()]).toEqual(["2026-09-07"]);
    expect(scene.labels.get("date:2026-09-07")?.text).toBe("7");
  });

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
  it.each([["week", "month"], ["month", "week"]] as const)(
    "keeps opaque frame backgrounds below the moving cells from %s to %s",
    (fromMode, toMode) => {
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(performance, "now").mockReturnValue(0);
      vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
        frames.push(callback);
        return frames.length;
      });
      const root = mount(`<div data-plan-view="${fromMode}">
        <div style="background: white"><ol>${WEEK_ROW("2026-09-14")}</ol></div>
      </div>`);
      const content = root.firstElementChild as HTMLElement;
      const from = capturePlanScene(root, fromMode);
      const to = capturePlanScene(root, toMode);
      const onFinish = vi.fn();
      animatePlanScene(root, content, from, to, onFinish);
      const layer = root.querySelector<HTMLElement>('[data-plan-morph-layer]')!;

      for (const backdrop of [from.residue, to.residue]) {
        expect(backdrop.parentElement).toBe(layer.parentElement);
        expect(backdrop.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
      frames.shift()!(PLAN_MORPH_MONTH_DURATION_MS * 0.95);
      expect(to.residue.style.opacity).toBe("1");
      expect(layer.isConnected).toBe(true);
      expect(content.style.opacity).toBe("0");
      frames.shift()!(PLAN_MORPH_MONTH_DURATION_MS);
      expect(root.querySelector('[data-plan-morph-overlay]')).toBeNull();
      expect(content.style.opacity).toBe("");
      expect(content.hasAttribute("inert")).toBe(false);
      expect(onFinish).toHaveBeenCalledOnce();
    }
  );

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


function rect(left: number, top: number, width = 120, height = 40) {
  return {
    x: left, y: top, left, top, width, height,
    right: left + width, bottom: top + height, toJSON: () => ({}),
  } as DOMRect;
}

function place(el: Element, box: DOMRect) {
  (el as HTMLElement).getBoundingClientRect = () => box;
}

const GOAL_VIEW = `
  <div data-plan-view="goals">
    <div data-plan-scroll-clip="true" aria-label="Get stronger dates">
      <article data-planner-entry-key="gym:1" data-day="2026-09-14">
        <strong data-testid="completion-title">Gym</strong>
      </article>
      <article data-planner-entry-key="gym:2" data-day="2026-09-16">
        <strong data-testid="completion-title">Gym</strong>
      </article>
    </div>
  </div>`;

describe("goal view morph scenes", () => {
  it("carries only tiles that are inside their scrolling rail", () => {
    const root = mount(GOAL_VIEW);
    const [onScreen, scrolledAway] = Array.from(
      root.querySelectorAll<HTMLElement>("[data-planner-entry-key]")
    );
    place(root.querySelector("[data-plan-scroll-clip]")!, rect(0, 0, 400, 120));
    place(root, rect(0, 0, 400, 120));
    place(onScreen, rect(20, 20));
    place(scrolledAway, rect(520, 20));

    const scene = capturePlanScene(root, "goals");

    expect([...scene.items.keys()]).toEqual(["2026-09-14:gym:1"]);
    expect(scene.days.size).toBe(0);
  });

  it("pairs a tile with the calendar pill that shares its day and entry key", () => {
    const calendar = mount(`
      <div data-plan-view="week" data-testid="plan-calendar-split-calendar">
        <ol>
          <li data-calendar-week-row="true" data-day="2026-09-14">
            <button data-day-cell="true" data-day="2026-09-14"></button>
            <div data-planner-entry-key="gym:1"><span data-testid="completion-title">Gym</span></div>
          </li>
        </ol>
      </div>`);
    const goals = mount(GOAL_VIEW);
    place(goals.querySelector("[data-plan-scroll-clip]")!, rect(0, 0, 400, 120));
    goals.querySelectorAll("[data-planner-entry-key]").forEach((tile) => place(tile, rect(20, 20)));

    const from = capturePlanScene(calendar, "week");
    const to = capturePlanScene(goals, "goals");

    expect([...from.items.keys()]).toEqual(["2026-09-14:gym:1"]);
    expect(to.items.has("2026-09-14:gym:1")).toBe(true);
  });

  it("builds an overlay between a calendar view and Goal View when no dates are shared", () => {
    const calendar = mount(`
      <div data-plan-view="week">${WEEK_ROW("2026-09-15")}</div>`);
    const content = calendar.firstElementChild as HTMLElement;
    const goals = mount(GOAL_VIEW);
    const to = capturePlanScene(goals, "goals");
    const from = capturePlanScene(calendar, "week");

    const run = animatePlanScene(calendar, content, from, to, () => {});
    const overlay = calendar.querySelector("[data-plan-morph-overlay]");

    expect(overlay).not.toBeNull();
    expect(overlay!.querySelector('[data-plan-view="week"]')).not.toBeNull();
    expect(overlay!.querySelector('[data-plan-view="goals"]')).not.toBeNull();
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

describe("view switch hand-offs", () => {
  function weekScene(mode: "week" | "day", treatment: "quiet" | "strike", mark = "") {
    const root = mount(`<div data-plan-view="${mode}">
      <div data-testid="plan-calendar-split-calendar"><ol><li data-calendar-week-row="true" data-day="2026-09-14">
        <button data-day-cell="true" data-day="2026-09-14"></button>
        <div data-planner-entry-key="goal-1:cadence:0">
          ${mark}
          <span data-testid="completion-title" data-completed="false" data-completion-treatment="${treatment}">Read</span>
        </div>
      </li></ol></div></div>`);
    return { root, scene: capturePlanScene(root, mode === "day" ? "week" : mode) };
  }
  const glyphs = (root: Element) =>
    [...root.querySelectorAll<HTMLElement>("[data-plan-morph-overlay] div")].filter(
      (node) => node.style.width === "max-content" && node.textContent === "Read"
    );

  it("draws an open title as one glyph even when the two views' treatments differ", () => {
    const from = weekScene("week", "quiet");
    const to = weekScene("day", "strike");
    expect([...from.scene.items.values()][0].completionTreatment).toBeUndefined();
    const run = animatePlanScene(from.root, from.root.firstElementChild as HTMLElement, from.scene, to.scene, () => {});
    expect(glyphs(from.root)).toHaveLength(1);
    run.cancel();
  });

  it("carries the completion mark as its own gliding piece, hidden inside the row clones", () => {
    const circle = `<svg data-completion-mark="circle" aria-hidden="true"></svg>`;
    const from = weekScene("week", "quiet", circle);
    const to = weekScene("day", "quiet", circle);
    const run = animatePlanScene(from.root, from.root.firstElementChild as HTMLElement, from.scene, to.scene, () => {});
    const marks = [...from.root.querySelectorAll<HTMLElement>("[data-plan-morph-overlay] [data-completion-mark]")];
    const carried = marks.filter((mark) => mark.style.visibility === "visible");
    expect(carried).toHaveLength(2);
    carried.forEach((mark) => expect(mark.style.transform).toMatch(/scale\(/));
    expect(marks.some((mark) => mark.style.visibility === "hidden")).toBe(true);
    run.cancel();
  });

  it("still flies sessions to wide Goal View's lanes", () => {
    const from = weekScene("week", "quiet");
    const goals = mount(GOAL_VIEW.replace('<div data-plan-scroll-clip="true"', '<div data-lane-body=""></div><div data-plan-scroll-clip="true"'));
    place(goals.querySelector("[data-plan-scroll-clip]")!, rect(0, 0, 400, 120));
    goals.querySelectorAll("[data-planner-entry-key]").forEach((tile) => place(tile, rect(20, 20)));
    const to = capturePlanScene(goals, "goals");
    expect(to.lanes).toBe(true);
    const run = animatePlanScene(from.root, from.root.firstElementChild as HTMLElement, from.scene, to, () => {});
    // The week session travels as its own surrogate rather than inside a fading copy.
    expect(glyphs(from.root)).toHaveLength(1);
    run.cancel();
  });

  it("cross-fades whole views with the phone's Goal View list, rather than flying sessions", () => {
    const from = weekScene("week", "quiet");
    const goals = mount(GOAL_VIEW);
    place(goals.querySelector("[data-plan-scroll-clip]")!, rect(0, 0, 400, 120));
    goals.querySelectorAll("[data-planner-entry-key]").forEach((tile) => place(tile, rect(20, 20)));
    const to = capturePlanScene(goals, "goals");
    const run = animatePlanScene(from.root, from.root.firstElementChild as HTMLElement, from.scene, to, () => {});
    const overlay = from.root.querySelector("[data-plan-morph-overlay]")!;
    expect(glyphs(from.root)).toHaveLength(0);
    // Each view's own sessions stay in its cross-fading copy.
    expect(overlay.querySelector<HTMLElement>('[data-plan-view="week"] [data-planner-entry-key]')!.style.visibility).toBe("");
    expect(overlay.querySelector<HTMLElement>('[data-plan-view="goals"] [data-planner-entry-key]')!.style.visibility).toBe("");
    run.cancel();
  });
});
