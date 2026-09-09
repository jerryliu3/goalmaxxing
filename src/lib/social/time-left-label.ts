export function formatTimeLeftLabel(
  endsAt: string | null | undefined,
  now: Date = new Date()
): string | null {
  if (!endsAt) {
    return null;
  }
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) {
    return null;
  }
  const msLeft = end.getTime() - now.getTime();
  if (msLeft <= 0) {
    return null;
  }

  const hoursLeft = msLeft / (1000 * 60 * 60);
  if (hoursLeft < 24) {
    const hours = Math.max(1, Math.ceil(hoursLeft));
    return hours === 1 ? "1 hour left" : `${hours} hours left`;
  }

  const daysLeft = Math.ceil(hoursLeft / 24);
  return daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
}
