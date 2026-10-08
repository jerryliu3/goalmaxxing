import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { MilestoneFlag } from "@/features/goals/milestone-flag";
import { CompletionToggle, COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";

const originalVibrate = Object.getOwnPropertyDescriptor(
  window.navigator,
  "vibrate"
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (originalVibrate) {
    Object.defineProperty(window.navigator, "vibrate", originalVibrate);
  } else {
    Reflect.deleteProperty(window.navigator, "vibrate");
  }
});

describe("CompletionToggle", () => {
  function commitByHold(toggle: HTMLElement) {
    fireEvent.pointerDown(toggle);
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
  }

  it("exposes completion state and does not commit on click", () => {
    const onClick = vi.fn();

    render(
      <CompletionToggle
        completed
        aria-label="Mark session not done"
        onClick={onClick}
      />
    );

    const toggle = screen.getByRole("button", {
      name: "Mark session not done",
    });
    expect(toggle).toHaveAttribute("data-completed", "true");
    expect(toggle).toHaveClass("rounded-full");
    expect(toggle.querySelector('[data-completion-mark="circle"]')).toHaveAttribute(
      "data-completed",
      "true"
    );

    fireEvent.click(toggle);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("traces the circle during a hold and fills only after committing", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
        onClick={onClick}
      />
    );
    const toggle = screen.getByRole("button", { name: "Mark session done" });
    const mark = toggle.querySelector("[data-completion-mark='circle']");
    expect(mark).toHaveAttribute("data-fill-progress", "0");

    fireEvent.pointerDown(toggle);
    expect(toggle).toHaveAttribute("data-holding", "true");
    expect(mark).toHaveAttribute("data-fill-progress", "1");
    expect(mark).toHaveAttribute("data-pressed", "true");
    expect(mark?.querySelector("[data-completion-fill]")).toHaveStyle({ transform: "scale(0)" });
    expect(mark?.querySelector("[data-completion-ring]")).toHaveStyle({ strokeDashoffset: "0" });
    expect(toggle).not.toHaveClass("bg-primary/15");
    expect(toggle).not.toHaveClass("scale-95");
    expect(onClick).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onClick).toHaveBeenCalledOnce();
    expect(toggle).toHaveAttribute("data-visual-completed", "true");
    expect(mark?.querySelector("[data-completion-fill]")).toHaveStyle({ transform: "scale(1)" });

    vi.useRealTimers();
  });

  it("uses the normal incomplete control and hold animation before earning a milestone flag", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <CompletionToggle
        completed={false}
        chrome="plain"
        size="sm"
        completedMark="check"
        renderMark={complete => <MilestoneFlag compact complete={complete} number={1} />}
        aria-label="Mark session done"
        onClick={onClick}
      />
    );
    const toggle = screen.getByRole("button", { name: "Mark session done" });
    expect(toggle.querySelector("[data-milestone-flag]")).toBeNull();
    expect(toggle.querySelector("[data-completion-mark]")).toHaveAttribute("data-completed", "false");

    fireEvent.pointerDown(toggle);
    expect(toggle.querySelector("[data-completion-mark]")).toHaveAttribute("data-pressed", "true");
    expect(toggle.querySelector("[data-milestone-flag]")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onClick).toHaveBeenCalledOnce();
    expect(toggle.querySelector("[data-milestone-flag]")).toHaveAttribute("data-milestone-flag", "earned");
  });

  it("shows an earned milestone flag and restores the completion control when undone", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <CompletionToggle
        completed
        completedMark="check"
        renderMark={complete => <MilestoneFlag compact complete={complete} number={2} />}
        aria-label="Mark session not done"
        onClick={onClick}
      />
    );
    const toggle = screen.getByRole("button", { name: "Mark session not done" });
    expect(toggle.querySelector("[data-milestone-flag]")).toHaveAttribute("data-milestone-flag", "earned");

    fireEvent.pointerDown(toggle);
    expect(toggle.querySelector("[data-milestone-flag]")).toBeNull();
    expect(toggle.querySelector("[data-completion-mark]")).toHaveAttribute("data-pressed", "true");
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onClick).toHaveBeenCalledOnce();
    expect(toggle.querySelector("[data-milestone-flag]")).toBeNull();
    expect(toggle.querySelector("[data-completion-mark]")).toHaveAttribute("data-completed", "false");
  });

  it("keeps the originating button available to a deferred hold callback", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
        onClick={onClick}
      />
    );
    const toggle = screen.getByRole("button", { name: "Mark session done" });

    commitByHold(toggle);

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick.mock.calls[0]?.[0].currentTarget).toBe(toggle);
  });

    it("does not commit on a pointer click without waiting for the hold", () => {
      const onClick = vi.fn();
      render(
        <CompletionToggle
          completed={false}
          aria-label="Mark session done"
          onClick={onClick}
        />
      );
      const toggle = screen.getByRole("button", { name: "Mark session done" });
      fireEvent.pointerDown(toggle);
      expect(toggle).toHaveAttribute("data-holding", "true");
      expect(toggle.querySelector("[data-completion-mark='circle']")).toHaveAttribute(
        "data-pressed",
        "true"
      );
      fireEvent.pointerUp(toggle);
      fireEvent.click(toggle, { detail: 1 });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("cancels a hold that is released early", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
        onClick={onClick}
      />
    );
    const toggle = screen.getByRole("button", { name: "Mark session done" });
    fireEvent.pointerDown(toggle);
    fireEvent.pointerUp(toggle);
    expect(toggle).toHaveAttribute("data-holding", "false");
    expect(toggle).toHaveAttribute("data-fill-transition", "true");
    expect(toggle.querySelector("[data-completion-mark='circle']")).toHaveAttribute(
      "data-fill-progress",
      "0"
    );
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onClick).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("data-fill-transition", "false");
    vi.useRealTimers();
  });

  it("hides circular button chrome in plain mode", () => {
    render(
      <CompletionToggle
        completed
        chrome="plain"
        aria-label="Mark session not done"
      />
    );

    const toggle = screen.getByRole("button", {
      name: "Mark session not done",
    });
    expect(toggle).toHaveClass("border-0");
    expect(toggle).not.toHaveClass("rounded-full");
    expect(toggle).toHaveClass("size-8");
    expect(toggle.querySelector("[data-completion-mark]")).toHaveClass("size-8");
  });

  it("uses the former button size for the visible mark in plain sm chrome", () => {
    render(
      <CompletionToggle
        completed={false}
        size="sm"
        chrome="plain"
        aria-label="Mark session done"
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    expect(toggle).toHaveClass("size-6");
    expect(toggle.querySelector("[data-completion-mark]")).toHaveClass("size-6");
  });

  it("does not let pointer holds bubble to a parent drag listener", () => {
    const onParentPointerDown = vi.fn();
    render(
      <div onPointerDown={onParentPointerDown}>
        <CompletionToggle completed={false} aria-label="Mark session done" />
      </div>
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Mark session done" }));
    expect(onParentPointerDown).not.toHaveBeenCalled();
  });

  it("does not let mouse or touch starts bubble to a parent drag listener", () => {
    const onParentMouseDown = vi.fn();
    const onParentTouchStart = vi.fn();
    render(
      <div onMouseDown={onParentMouseDown} onTouchStart={onParentTouchStart}>
        <CompletionToggle completed={false} aria-label="Mark session done" />
      </div>
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    fireEvent.mouseDown(toggle);
    fireEvent.touchStart(toggle);
    expect(onParentMouseDown).not.toHaveBeenCalled();
    expect(onParentTouchStart).not.toHaveBeenCalled();
  });

  it("does not let clicks bubble to parent row handlers", () => {
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <CompletionToggle completed={false} aria-label="Mark session done" />
      </div>
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    fireEvent.click(toggle, { detail: 1 });
    fireEvent.click(toggle);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("does not let a completed hold click bubble to parent row handlers", () => {
    vi.useFakeTimers();
    const onParentClick = vi.fn();
    const onClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <CompletionToggle
          completed={false}
          aria-label="Mark session done"
          onClick={onClick}
        />
      </div>
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    fireEvent.pointerDown(toggle);
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    fireEvent.pointerUp(toggle);
    fireEvent.click(toggle, { detail: 1 });
    expect(onClick).toHaveBeenCalledOnce();
    expect(onParentClick).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("uses the circular hold control in Gazetteer too", () => {
    render(
      <UiStyleProvider initialStyleId="gazetteer">
        <CompletionToggle completed aria-label="Mark session not done" />
      </UiStyleProvider>
    );

    expect(
      screen.getByRole("button", { name: "Mark session not done" }).querySelector(
        '[data-completion-mark="circle"]'
      )
    ).toHaveAttribute("data-completed", "true");
  });

  it("uses best-effort haptic feedback when supported", () => {
    vi.useFakeTimers();
    const vibrate = vi.fn(() => true);
    Object.defineProperty(window.navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
      />
    );

    commitByHold(screen.getByRole("button", { name: "Mark session done" }));

    expect(vibrate).toHaveBeenCalledWith(8);
    vi.useRealTimers();
  });

  it("does not fire interaction feedback while disabled", () => {
    const vibrate = vi.fn(() => true);
    const onClick = vi.fn();
    Object.defineProperty(window.navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
        disabled
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark session done" }));

    expect(vibrate).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps optimistic completed state visible until canonical completion catches up", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    commitByHold(toggle);
    expect(toggle).toHaveAttribute("data-visual-completed", "true");

    rerender(
      <CompletionToggle
        completed
        aria-label="Mark session done"
      />
    );
    expect(toggle).toHaveAttribute("data-visual-completed", "true");

    rerender(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
      />
    );
    expect(toggle).toHaveAttribute("data-visual-completed", "false");
    vi.useRealTimers();
  });

  it("keeps visual-completed true after the click handler settles until completed becomes true", async () => {
    vi.useFakeTimers();
    let resolveMutation!: () => void;
    const mutation = new Promise<void>((resolve) => {
      resolveMutation = resolve;
    });

    const { rerender } = render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
        onClick={() => mutation}
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    commitByHold(toggle);
    expect(toggle).toHaveAttribute("data-visual-completed", "true");
    vi.useRealTimers();

    await act(async () => {
      resolveMutation();
      await mutation;
    });

    expect(toggle).toHaveAttribute("data-visual-completed", "true");

    rerender(
      <CompletionToggle
        completed
        aria-label="Mark session done"
        onClick={() => mutation}
      />
    );
    expect(toggle).toHaveAttribute("data-visual-completed", "true");
  });

  it("clears optimistic state when the click handler rejects", async () => {
    vi.useFakeTimers();
    let rejectMutation!: (reason?: unknown) => void;
    const mutation = new Promise<void>((_, reject) => {
      rejectMutation = reject;
    });

    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
        onClick={() => mutation}
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    commitByHold(toggle);
    expect(toggle).toHaveAttribute("data-visual-completed", "true");
    vi.useRealTimers();

    await act(async () => {
      rejectMutation(new Error("failed"));
      await mutation.catch(() => undefined);
    });

    expect(toggle).toHaveAttribute("data-visual-completed", "false");
  });

  it("marks pending without disabling the button", () => {
    render(
      <CompletionToggle
        completed={false}
        pending
        aria-label="Mark session done"
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    expect(toggle).toHaveAttribute("aria-busy", "true");
    expect(toggle).not.toBeDisabled();
  });

  it("clears optimistic state with a long fallback timer", () => {
    vi.useFakeTimers();

    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    commitByHold(toggle);
    expect(toggle).toHaveAttribute("data-visual-completed", "true");

    act(() => {
      vi.advanceTimersByTime(7_900);
    });
    expect(toggle).toHaveAttribute("data-visual-completed", "true");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(toggle).toHaveAttribute("data-visual-completed", "false");

    vi.useRealTimers();
  });

  it("optimistically clears the checkmark when unchecking", () => {
    vi.useFakeTimers();
    render(
      <CompletionToggle
        completed
        aria-label="Mark session not done"
      />
    );

    const toggle = screen.getByRole("button", {
      name: "Mark session not done",
    });
    commitByHold(toggle);
    expect(toggle).toHaveAttribute("data-visual-completed", "false");
    vi.useRealTimers();
  });

  it("suppresses haptics when the user requests reduced motion", () => {
    vi.useFakeTimers();
    const vibrate = vi.fn(() => true);
    Object.defineProperty(window.navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    );

    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
      />
    );
    commitByHold(screen.getByRole("button", { name: "Mark session done" }));

    expect(vibrate).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
