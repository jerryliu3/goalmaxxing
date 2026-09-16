"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { getCategoryLabel } from "@/lib/goals/category";
import type { GoalCreationFields } from "./goal-creation-model";
import type { TempoCardVisibility } from "./tempo-creation-progress";
import "./tempo-goal-creation.css";

export function TempoGoalCard({
  fields,
  context = "creation",
  achieved = false,
  density = "full",
  isTask = false,
  taskSchedule,
  titleContent,
  kickerEnd,
  visibility = {
    category: true,
    rhythm: true,
    interval: true,
    count: true,
    schedule: true,
    difficulty: true,
  },
}: {
  fields: GoalCreationFields;
  context?: "creation" | "history" | "inspect";
  achieved?: boolean;
  density?: "full" | "compact";
  isTask?: boolean;
  taskSchedule?: { date: string; time: string };
  titleContent?: ReactNode;
  kickerEnd?: ReactNode;
  visibility?: TempoCardVisibility;
}) {
  const milestones = fields.frequency_type === "fixed_milestones";
  const count = Number(fields.target_count) || 1;
  const hasCount = visibility.rhythm && (isTask || visibility.count);
  const daily =
    !milestones &&
    fields.recurrence_interval === "daily" &&
    fields.target_basis === "period";
  const unit = isTask ? (
    <>task</>
  ) : milestones ? (
    <>{count === 1 ? "milestone" : "milestones"}</>
  ) : fields.target_basis === "lifetime" ? (
    <>
      {count === 1 ? "completion" : "completions"}
      <br />
      in total
    </>
  ) : daily ? (
    <>
      every
      <br />
      day
    </>
  ) : (
    <>
      {count === 1 ? "day" : "days"}
      <br />
      {fields.recurrence_interval === "weekly" ? "a week" : "a month"}
    </>
  );
  const effort =
    fields.difficulty === "easy" ? 1 : fields.difficulty === "medium" ? 2 : 3;
  const kicker =
    context === "inspect"
      ? "Your commitment, as it stands"
      : context === "history"
        ? achieved
          ? "A goal you accomplished"
          : "A goal you showed up for"
        : "Your commitment, taking shape";
  return (
    <article
      className="tempo-card"
      data-empty={!visibility.category}
      data-density={density}
      data-effort={visibility.difficulty ? effort : undefined}
      style={
        {
          "--goal-color": visibility.category ? fields.color : "#b99060",
        } as CSSProperties
      }
      aria-label={
        context === "creation" ? "Goal card preview" : `${fields.title} goal card`
      }
    >
      <div className="tempo-card-meta">
        <span>{kicker}</span>
        {visibility.schedule && fields.is_private && <span>Private</span>}
        {kickerEnd ?? (
          <ArrowUpRight
            className="tempo-card-arrow"
            size={26}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="tempo-card-target">
        <strong>
          {hasCount ? String(isTask ? 1 : count).padStart(2, "0") : "—"}
        </strong>
        {hasCount && <span>{unit}</span>}
      </div>
      <h2>{titleContent ?? (fields.title.trim() || "Something worth starting.")}</h2>
      <div className="tempo-card-period-row">
        <span className="tempo-card-period">
          {visibility.category && !isTask
            ? getCategoryLabel(
                fields.category_selection,
                fields.custom_category,
              )
            : ""}
        </span>
        {visibility.difficulty && !isTask && (
          <div className="tempo-card-effort">
            <span className="tempo-effort-bars" aria-hidden="true">
              {[1, 2, 3].map((level) => (
                <i
                  key={level}
                  data-active={level <= effort}
                  style={{ height: 6 + level * 6 }}
                />
              ))}
            </span>
          </div>
        )}
      </div>
      <div className="tempo-card-meta tempo-card-dates">
        <span>{isTask ? taskSchedule?.date : `From ${fields.start_date}`}</span>
        {visibility.schedule && (
          <span>
            {isTask
              ? taskSchedule?.time || "Any time"
              : fields.end_date
                ? `Until ${fields.end_date}`
                : context === "inspect"
                  ? "No end date"
                  : ""}
          </span>
        )}
      </div>
      {visibility.schedule && !isTask && fields.default_local_time && (
        <div className="tempo-card-meta">
          <span>{fields.default_local_time}</span>
        </div>
      )}
    </article>
  );
}
