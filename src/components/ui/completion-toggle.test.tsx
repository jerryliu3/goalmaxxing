import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UiStyleProvider } from "@/components/brand/ui-style-provider";
import { CompletionToggle, COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";

const originalVibrate = Object.getOwnPropertyDescriptor(
  window.navigator,
  "vibrate"
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalVibrate) {
    Object.defineProperty(window.navigator, "vibrate", originalVibrate);
  } else {
    Reflect.deleteProperty(window.navigator, "vibrate");
  }
});

describe("CompletionToggle", () => {
  it("exposes completion state and forwards clicks", () => {
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
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("commits after a pointer hold and fills the inner mark", () => {
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
    expect(toggle).not.toHaveClass("bg-primary/15");
    expect(toggle).not.toHaveClass("scale-95");
    expect(onClick).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onClick).toHaveBeenCalledOnce();
    expect(toggle).toHaveAttribute("data-visual-completed", "true");

    vi.useRealTimers();
  });

    it("commits on a pointer click without waiting for the hold", () => {
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
      expect(onClick).toHaveBeenCalledOnce();
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
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onClick).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("data-holding", "false");
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

  it("uses the Nest mark when Gazetteer is selected", () => {
    render(
      <UiStyleProvider initialStyleId="gazetteer">
        <CompletionToggle completed aria-label="Mark session not done" />
      </UiStyleProvider>
    );

    expect(
      screen.getByRole("button", { name: "Mark session not done" }).querySelector(
        '[data-completion-mark="nest"]'
      )
    ).toHaveAttribute("data-completed", "true");
  });

  it("uses best-effort haptic feedback when supported", () => {
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

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark session done",
      })
    );

    expect(vibrate).toHaveBeenCalledWith(8);
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
    const { rerender } = render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    fireEvent.click(toggle);
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
  });

  it("clears optimistic state when the click handler settles", async () => {
    let resolveMutation!: () => void;
    const mutation = new Promise<void>((resolve) => {
      resolveMutation = resolve;
    });

    render(
      <CompletionToggle
        completed={false}
        aria-label="Mark session done"
        onClick={() => mutation}
      />
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("data-visual-completed", "true");

    await act(async () => {
      resolveMutation();
      await mutation;
    });

    expect(toggle).toHaveAttribute("data-visual-completed", "false");
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
    fireEvent.click(toggle);
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
    render(
      <CompletionToggle
        completed
        aria-label="Mark session not done"
      />
    );

    const toggle = screen.getByRole("button", {
      name: "Mark session not done",
    });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("data-visual-completed", "false");
  });

  it("suppresses haptics when the user requests reduced motion", () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Mark session done" }));

    expect(vibrate).not.toHaveBeenCalled();
  });
});
