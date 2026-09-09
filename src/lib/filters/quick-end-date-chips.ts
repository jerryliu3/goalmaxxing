import { addMonths, format, parseISO } from "date-fns";
import { NO_END_DATE_FILTER } from "@/lib/goals/list-view";

export function buildQuickEndDateChipOptions(referenceMonth: string) {
  const referenceDate = parseISO(`${referenceMonth}-01`);
  return [
    { key: "all-end-dates", label: "All End Dates", value: null as string | null },
    { key: "this-month", label: "This month", value: referenceMonth },
    {
      key: "next-month",
      label: "Next month",
      value: format(addMonths(referenceDate, 1), "yyyy-MM"),
    },
    {
      key: "year-end",
      label: "Year end",
      value: `${referenceMonth.slice(0, 4)}-12`,
    },
    { key: "no-end-date", label: "No end date", value: NO_END_DATE_FILTER },
  ];
}
