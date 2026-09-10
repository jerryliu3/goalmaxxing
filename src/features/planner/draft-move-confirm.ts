export function resolveStagedDraftMove(
  entry: {
    draftGhost?: boolean;
    draftDiffKind: "moved_from" | "moved_to" | "new" | null;
    draftDiffFromDate: string | null;
    draftDiffToDate: string | null;
  },
  day: string
) {
  if (!day) {
    return null;
  }
  if (entry.draftGhost && entry.draftDiffKind !== "moved_from") {
    return null;
  }
  if (entry.draftDiffKind === "moved_to" && entry.draftDiffFromDate) {
    return {
      sourceDate: entry.draftDiffFromDate,
      scheduledDate: day,
    };
  }
  if (entry.draftDiffKind === "moved_from" && entry.draftDiffToDate) {
    return {
      sourceDate: day,
      scheduledDate: entry.draftDiffToDate,
    };
  }
  return null;
}

export function canConfirmDraftMove(entry: {
  draftGhost?: boolean;
  draftDiffKind: "moved_from" | "moved_to" | "new" | null;
  draftDiffFromDate: string | null;
  draftDiffToDate?: string | null;
}) {
  if (entry.draftDiffKind === "moved_from" && Boolean(entry.draftDiffToDate)) {
    return true;
  }
  return (
    !entry.draftGhost &&
    entry.draftDiffKind === "moved_to" &&
    Boolean(entry.draftDiffFromDate)
  );
}

export function canCancelDraftMove(entry: {
  draftGhost?: boolean;
  draftDiffKind: "moved_from" | "moved_to" | "new" | null;
  draftDiffFromDate: string | null;
  draftDiffToDate?: string | null;
}) {
  return canConfirmDraftMove(entry);
}
