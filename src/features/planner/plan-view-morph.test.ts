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

  it("publishes an anchor selector that resolves against the live tree", () => {
    const root = mount(`<ol>${WEEK_ROW("2026-09-14")}${WEEK_ROW("2026-09-15")}</ol>`);

    const anchor = capturePlanScene(root, "week").anchor;

    expect(anchor).not.toBeNull();
    expect(root.querySelector(anchor!.selector)).toBeInstanceOf(HTMLElement);
  });
});

describe("animatePlanScene", () => {
  it("restores the real view and removes its overlay when cancelled", () => {
    const root = mount(`<div data-plan-view="week"><ol>${WEEK_ROW("2026-09-14")}</ol></div>`);
    const content = root.firstElementChild as HTMLElement;
    const from = capturePlanScene(root, "week");
    const to = capturePlanScene(root, "day");

    const run = animatePlanScene(root, content, from, to, () => {});
    expect(root.querySelector("[data-plan-morph-overlay]")).toBeInstanceOf(HTMLElement);
    expect(content.style.visibility).toBe("hidden");

    run.cancel();

    expect(root.querySelector("[data-plan-morph-overlay]")).toBeNull();
    expect(content.style.visibility).toBe("");
    expect(content.hasAttribute("inert")).toBe(false);
  });
});
