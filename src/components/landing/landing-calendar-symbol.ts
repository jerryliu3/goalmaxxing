/** Short visual labels for the existing illustrated planner, not goal categories. */
export function landingCalendarSymbol(label: string): string {
  if (/run/i.test(label)) return "🏃";
  if (/strength/i.test(label)) return "🏋️";
  if (/read/i.test(label)) return "📖";
  if (/work|launch|ship/i.test(label)) return "💻";
  if (/review|budget/i.test(label)) return "📝";
  return "✦";
}
