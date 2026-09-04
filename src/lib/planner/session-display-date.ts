export function resolveUncreditedDisplayDate(
  persistedScheduledDate: string | null | undefined
): string | null {
  return persistedScheduledDate ?? null;
}

export function resolveCreditedDisplayDate({
  scheduledDate,
  creditedCompletionDate,
}: {
  scheduledDate: string | null | undefined;
  creditedCompletionDate: string | null | undefined;
}): string | null {
  return scheduledDate ?? creditedCompletionDate ?? null;
}

export function resolveWorkUnitDisplayDate({
  creditState,
  persistedScheduledDate,
  previewScheduledDate,
  creditedCompletionDate,
}: {
  creditState: string;
  persistedScheduledDate?: string | null;
  previewScheduledDate?: string | null;
  creditedCompletionDate?: string | null;
}): string | null {
  if (creditState !== "uncredited") {
    return resolveCreditedDisplayDate({
      scheduledDate: previewScheduledDate,
      creditedCompletionDate,
    });
  }
  return resolveUncreditedDisplayDate(persistedScheduledDate);
}
