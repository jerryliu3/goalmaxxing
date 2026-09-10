import { describe, expect, it } from "vitest";
import {
  canCancelDraftMove,
  canConfirmDraftMove,
  resolveStagedDraftMove,
} from "@/features/planner/draft-move-confirm";

describe("canConfirmDraftMove", () => {
  it("allows destination and source rows from a staged session move", () => {
    const destination = {
      draftDiffKind: "moved_to" as const,
      draftDiffFromDate: "2026-08-20",
      draftDiffToDate: "2026-08-12",
    };
    const source = {
      draftDiffKind: "moved_from" as const,
      draftDiffFromDate: "2026-08-20",
      draftDiffToDate: "2026-08-12",
      draftGhost: true,
    };
    expect(canConfirmDraftMove(destination)).toBe(true);
    expect(canCancelDraftMove(destination)).toBe(true);
    expect(canConfirmDraftMove(source)).toBe(true);
    expect(canCancelDraftMove(source)).toBe(true);
    expect(resolveStagedDraftMove(destination, "2026-08-12")).toEqual({
      sourceDate: "2026-08-20",
      scheduledDate: "2026-08-12",
    });
    expect(resolveStagedDraftMove(source, "2026-08-20")).toEqual({
      sourceDate: "2026-08-20",
      scheduledDate: "2026-08-12",
    });
  });

  it("rejects destination ghosts, new placements, and incomplete diffs", () => {
    expect(
      canCancelDraftMove({
        draftGhost: true,
        draftDiffKind: "moved_to",
        draftDiffFromDate: "2026-08-20",
        draftDiffToDate: "2026-08-12",
      })
    ).toBe(false);
    expect(
      canConfirmDraftMove({
        draftDiffKind: "new",
        draftDiffFromDate: null,
        draftDiffToDate: "2026-08-12",
      })
    ).toBe(false);
    expect(
      canConfirmDraftMove({
        draftDiffKind: "moved_to",
        draftDiffFromDate: null,
        draftDiffToDate: "2026-08-12",
      })
    ).toBe(false);
    expect(
      canConfirmDraftMove({
        draftDiffKind: "moved_from",
        draftDiffFromDate: "2026-08-20",
        draftDiffToDate: null,
      })
    ).toBe(false);
  });
});
