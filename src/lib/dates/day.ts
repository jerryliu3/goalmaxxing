import { format } from "date-fns";
import { resolveSelectedDateState } from "@cadence/shared/dates/day";

export { resolveSelectedDateState };
export type { SelectedDateState } from "@cadence/shared/dates/day";

export function toLocalDateString(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}
