import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MaterialPreview } from "./material-preview";
import { MATERIALS, MATERIAL_SAMPLES } from "./materials";

beforeEach(() => {
  // jsdom has no native PointerEvent; preserve the fields used by pointer capture.
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number; pointerType: string; isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init); this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse"; this.isPrimary = init.isPrimary ?? true;
    }
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("captures dragging beyond the card, turns past 180°, holds the pose, and resets", () => {
  render(<MaterialPreview material={MATERIALS.find(item => item.id === "foil")!} fields={MATERIAL_SAMPLES[0].fields} still={false} history={false} />);
  const card = screen.getByRole("group", { name: "Foil Print card rotation" });
  const stage = card.closest<HTMLElement>("[data-material]")!;
  const capture = vi.spyOn(card, "setPointerCapture");
  fireEvent.pointerDown(card, { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
  expect(capture).toHaveBeenCalledWith(1);
  fireEvent.pointerMove(stage, { pointerId: 1, clientX: 450, clientY: 380 });
  expect(parseFloat(stage.style.getPropertyValue("--ry"))).toBeGreaterThan(180);
  expect(parseFloat(stage.style.getPropertyValue("--rx"))).toBeLessThan(-180);
  fireEvent.pointerUp(stage, { pointerId: 1 });
  const held = stage.style.getPropertyValue("--ry");
  fireEvent.pointerMove(stage, { pointerId: 1, clientX: 120, clientY: 120 });
  expect(stage.style.getPropertyValue("--ry")).toBe(held);
  expect(stage).toHaveAttribute("data-inspecting", "true");
  fireEvent.click(screen.getByRole("button", { name: "Reset Foil Print" }));
  expect(stage).toHaveAttribute("data-inspecting", "false");
});

it("repaints the lettering extrusion as the card turns", () => {
  render(<MaterialPreview material={MATERIALS.find(item => item.id === "ceramic")!} fields={MATERIAL_SAMPLES[0].fields} still={false} history={false} />);
  const card = screen.getByRole("group", { name: "Ceramic Relief card rotation" });
  const stage = card.closest<HTMLElement>("[data-material]")!;
  expect(stage).toHaveAttribute("data-emboss-scope");
  const resting = parseFloat(stage.style.getPropertyValue("--emboss-x"));
  expect(Math.abs(resting)).toBeGreaterThan(0.3);
  fireEvent.pointerDown(card, { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(stage, { pointerId: 1, clientX: 160, clientY: 100 });
  expect(parseFloat(stage.style.getPropertyValue("--emboss-x"))).toBeGreaterThan(resting + 0.5);
});

it("releases an active drag and blocks rotation when still mode is enabled", () => {
  const props = { material: MATERIALS.find(item => item.id === "pearl")!, fields: MATERIAL_SAMPLES[0].fields, history: false };
  const { rerender } = render(<MaterialPreview {...props} still={false} />);
  const card = screen.getByRole("group", { name: "Pearl Reserve card rotation" });
  const stage = card.closest<HTMLElement>("[data-material]")!;
  vi.spyOn(card, "hasPointerCapture").mockReturnValue(true);
  const release = vi.spyOn(card, "releasePointerCapture");
  fireEvent.pointerDown(card, { pointerId: 2, button: 0, clientX: 100, clientY: 100 });
  rerender(<MaterialPreview {...props} still />);
  expect(release).toHaveBeenCalledWith(2);
  expect(stage).not.toHaveAttribute("data-dragging");
  fireEvent.pointerMove(stage, { pointerId: 2, clientX: 500, clientY: 100 });
  expect(stage.style.getPropertyValue("--ry")).toBe("0deg");
  expect(screen.getByRole("button", { name: "Reset Pearl Reserve" })).toBeDisabled();
});
