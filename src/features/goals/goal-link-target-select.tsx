"use client";

import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLinkedGoalDeadlineLabel,
  getLinkedGoalRecurrenceLabel,
} from "@/lib/goals/linked-goal-labels";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

interface GoalLinkTargetSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filteredLinkTargets: Goal[];
  keyPrefix?: string;
  showLabel?: boolean;
  showHelperText?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
}

export function GoalLinkTargetSelect({
  value,
  onValueChange,
  open,
  onOpenChange,
  searchQuery,
  onSearchQueryChange,
  filteredLinkTargets,
  keyPrefix = "",
  showLabel = true,
  showHelperText = true,
  triggerClassName,
  disabled = false,
}: GoalLinkTargetSelectProps) {
  return (
    <div className="space-y-2">
      {showLabel ? (
        <Label className="inline-flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" />
          Also counts toward...
        </Label>
      ) : null}
      <Select
        value={value}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={onOpenChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <div className="sticky top-0 z-10 border-b bg-popover p-1.5">
            <Input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Choose a goal"
              className="h-8"
              disabled={disabled}
              onKeyDown={(event) => event.stopPropagation()}
            />
          </div>
          <SelectItem value="none">None</SelectItem>
          {filteredLinkTargets.map((goal) => (
            <SelectItem
              key={keyPrefix ? `${keyPrefix}-${goal.id}` : goal.id}
              value={goal.id}
            >
              <span className="flex items-center gap-2">
                <span className="max-w-[170px] truncate">{goal.title}</span>
                <Badge variant="secondary">{getLinkedGoalRecurrenceLabel(goal)}</Badge>
                <Badge variant="outline">{getLinkedGoalDeadlineLabel(goal)}</Badge>
              </span>
            </SelectItem>
          ))}
          {filteredLinkTargets.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No goals match your search.</p>
          ) : null}
        </SelectContent>
      </Select>
      {showHelperText ? (
        <p className="text-xs text-muted-foreground">
          Completing this goal also counts toward the linked goal for that day.
        </p>
      ) : null}
    </div>
  );
}
