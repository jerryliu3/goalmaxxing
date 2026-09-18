import { describe, expect, it } from "vitest";
import { completionReducer, INITIAL_COMPLETION } from "./completion-model";
import { sampleReceipt } from "./seed";

describe("motion study receipt playback", () => {
  const saving = completionReducer(INITIAL_COMPLETION, { type: "begin" });
  it("reveals only the credited parents in order, without replaying a recorded action", () => {
    const receipt = sampleReceipt("cascade");
    const first = completionReducer(saving, { type: "recorded", receipt, still: false });
    expect(first.phase).toBe("cascade");
    expect(first.receipt?.linked[first.activeIndex].title).toBe("Train for a 10K");
    expect(completionReducer(first, { type: "begin" })).toBe(first);
    const next = completionReducer(first, { type: "next" });
    expect(next.receipt?.linked[next.activeIndex].title).toBe("Build my running base");
    expect(completionReducer(next, { type: "next" }).phase).toBe("settled");
  });
  it("does not confuse added progress with achieving the parent", () => {
    const state = completionReducer(saving, { type: "recorded", receipt: sampleReceipt("progress"), still: false });
    expect(state.receipt?.linked.every(parent => !parent.achieved && parent.after < parent.target)).toBe(true);
    expect(completionReducer(state, { type: "next" }).activeIndex).toBe(1);
  });
  it("records a non-crediting completion without opening a parent", () => {
    const state = completionReducer(saving, { type: "recorded", receipt: sampleReceipt("no-credit"), still: false });
    expect(state.phase).toBe("settled");
    expect(state.receipt?.linked).toEqual([]);
  });
  it("failure credits nothing and permits a retry", () => {
    const failure = completionReducer(saving, { type: "failed" });
    expect(failure.receipt).toBeNull();
    expect(completionReducer(failure, { type: "begin" }).phase).toBe("saving");
  });
  it("still mode and skip retain every result without running the cascade", () => {
    const receipt = sampleReceipt("cascade");
    expect(completionReducer(saving, { type: "recorded", receipt, still: true })).toMatchObject({ phase: "settled", receipt });
    const animated = completionReducer(saving, { type: "recorded", receipt, still: false });
    expect(completionReducer(animated, { type: "finish" })).toMatchObject({ phase: "settled", receipt });
  });
});
