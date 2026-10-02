import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureTaskSlip, TaskCaptureSlip } from "./task-capture-slip";

afterEach(cleanup);

describe("task capture slip", () => {
  it("carries the submitted text and the input's actual geometry and type", () => {
    const input = document.createElement("input");
    input.value = "Send the project notes";
    input.style.fontFamily = "serif";
    input.style.fontSize = "16px";
    input.style.paddingLeft = "12px";
    input.getBoundingClientRect = () => ({ top: 50, left: 24, width: 320, height: 32 } as DOMRect);
    document.body.append(input);
    const capture = captureTaskSlip(input, "task-1", input.value);
    input.value = "";
    expect(capture).toMatchObject({
      title: "Send the project notes",
      origin: { top: 50, left: 24, width: 320, height: 32 },
      fontFamily: "serif", fontSize: 16, paddingLeft: 12,
    });
    input.remove();
  });

  it("reveals the saved row immediately when no destination remains", () => {
    const onDone = vi.fn();
    render(<TaskCaptureSlip
      capture={{ taskId: "task-1", title: "Send notes", origin: { top: 50, left: 24, width: 320, height: 32 }, fontFamily: "serif", fontSize: 16, fontWeight: "400", paddingLeft: 0 }}
      targetRef={createRef<HTMLSpanElement>()}
      onDone={onDone}
    />);
    expect(onDone).toHaveBeenCalled();
    expect(document.querySelector("[data-task-capture-slip]")).toBeNull();
  });
});
