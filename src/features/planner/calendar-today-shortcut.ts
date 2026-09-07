export function shouldShowPlanTodayShortcut(
  focusedDay: string,
  calendarToday: string
) {
  return focusedDay !== calendarToday;
}
