import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native-svg", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("svg", props),
  Rect: (props: Record<string, unknown>) =>
    React.createElement("rect", props),
}));

import { NestCompletionMark } from "./nest-completion-mark";

describe("NestCompletionMark", () => {
  it("draws an empty frame until the inner square settles in", () => {
    let root!: ReactTestRenderer;
    act(() => {
      root = create(<NestCompletionMark done={false} color="#9a4f2c" />);
    });
    expect(root.root.findAll((node) => String(node.type) === "rect")).toHaveLength(
      1
    );

    act(() => {
      root.update(<NestCompletionMark done color="#9a4f2c" />);
    });
    expect(root.root.findAll((node) => String(node.type) === "rect")).toHaveLength(
      2
    );
  });
});
