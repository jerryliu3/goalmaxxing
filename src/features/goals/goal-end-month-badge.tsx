import { Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface GoalEndMonthBadgeProps {
  endDate: string | null;
}

export function GoalEndMonthBadge({ endDate }: GoalEndMonthBadgeProps) {
  const dateLabel = endDate ? format(parseISO(endDate), "MMM d, yyyy") : "No date";
  return (
    <Badge
      variant="outline"
      className="h-5 gap-1 rounded-md border-border bg-secondary px-1.5 font-medium text-[11px] text-foreground"
      title="Goal end date"
      aria-label={endDate ? `Goal end date ${dateLabel}` : "No goal end date"}
    >
      <Calendar className="size-3" aria-hidden="true" />
      <span>{dateLabel}</span>
    </Badge>
  );
}
