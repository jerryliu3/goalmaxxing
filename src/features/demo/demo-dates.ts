const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function addDaysIso(date: string, days: number) {
  const match = ISO_DATE.exec(date);
  if (!match) {
    throw new RangeError(`Invalid ISO date: ${date}`);
  }
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days);
  const next = new Date(utc);
  const year = next.getUTCFullYear();
  const month = String(next.getUTCMonth() + 1).padStart(2, "0");
  const day = String(next.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekdayUtc(date: string) {
  const match = ISO_DATE.exec(date);
  if (!match) {
    throw new RangeError(`Invalid ISO date: ${date}`);
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  ).getUTCDay();
}

export function eachDateInclusive(start: string, end: string) {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return dates;
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function isoDateTime(date: string, hour = 12) {
  return `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}
