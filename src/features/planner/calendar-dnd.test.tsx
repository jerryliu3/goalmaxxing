import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SortableContext } from "@dnd-kit/sortable";
import {
  PlannerDndProvider,
  PlannerDraggableEntry,
  PlannerDroppableDay,
  plannerEntryDragId,
} from "./calendar-dnd";

describe("calendar dnd primitives", () => {
  it("renders draggable and droppable wrappers", () => {
    const onStart = vi.fn();
    const onOver = vi.fn();
    const onEnd = vi.fn();
    const onCancel = vi.fn();

    render(
      <PlannerDndProvider
        getEntryLabel={(entryKey) => entryKey}
        getDayLabel={(day) => day}
        onEntryDragStart={onStart}
        onEntryDragOverTarget={onOver}
        onEntryDragEnd={onEnd}
        onEntryDragCancel={onCancel}
      >
        <PlannerDroppableDay day="2026-08-06">
          {({ setNodeRef }) => <div ref={setNodeRef}>Drop day</div>}
        </PlannerDroppableDay>
        <SortableContext items={[plannerEntryDragId("goal-1:unit-1")]}>
          <PlannerDraggableEntry entryKey="goal-1:unit-1">
          {({ setNodeRef, attributes, listeners }) => (
            <button
              ref={setNodeRef}
              type="button"
              {...attributes}
              {...listeners}
            >
              Drag me
            </button>
          )}
          </PlannerDraggableEntry>
        </SortableContext>
      </PlannerDndProvider>
    );

    expect(screen.getByText("Drop day")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drag me" })).toBeInTheDocument();
  });
});

