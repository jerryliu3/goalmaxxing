import type { SampleReceipt } from "./seed";

export interface CompletionState {
  phase: "idle" | "saving" | "cascade" | "settled" | "error";
  receipt: SampleReceipt | null;
  activeIndex: number;
}

export const INITIAL_COMPLETION: CompletionState = { phase: "idle", receipt: null, activeIndex: 0 };
export const SAMPLE_SAVE_MS = 300;
export const PARENT_REVEAL_MS = 1700;

type CompletionAction =
  | { type: "begin" }
  | { type: "recorded"; receipt: SampleReceipt; still: boolean }
  | { type: "failed" }
  | { type: "next" }
  | { type: "finish" };

export function completionReducer(state: CompletionState, action: CompletionAction): CompletionState {
  switch (action.type) {
    case "begin":
      return state.phase === "idle" || state.phase === "error"
        ? { ...INITIAL_COMPLETION, phase: "saving" } : state;
    case "recorded":
      return state.phase === "saving" ? {
        phase: action.still || action.receipt.linked.length === 0 ? "settled" : "cascade",
        receipt: action.receipt, activeIndex: 0,
      } : state;
    case "failed":
      return state.phase === "saving" ? { ...INITIAL_COMPLETION, phase: "error" } : state;
    case "next":
      if (state.phase !== "cascade" || !state.receipt) return state;
      return state.activeIndex + 1 < state.receipt.linked.length
        ? { ...state, activeIndex: state.activeIndex + 1 }
        : { ...state, phase: "settled" };
    case "finish":
      return state.phase === "cascade" ? { ...state, phase: "settled" } : state;
  }
}
