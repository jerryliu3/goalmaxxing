"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { ReassemblingCard } from "./card-material/reassembling-card";
import { ArrowUpRight } from "lucide-react";
import { getCategoryLabel } from "@/lib/goals/category";
import { resolveTempoCardMaterial } from "./card-material/tempo-card-material";
import { renderSolidLettering } from "./card-material/solid-lettering";
import { goalColorStyle } from "./card-material/goal-color-style";
import { TempoCardSurface } from "./card-material/tempo-card-surface";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type { TempoCardVisibility } from "./tempo-creation-progress";
import "./tempo-goal-creation.css";

export function TempoGoalCard({
  fields,
  context = "creation",
  achieved = false,
  isTask = false,
  taskSchedule,
  surface = "material",
  rotatable = true,
  assembly,
  flat = false,
  renderLettering = renderSolidLettering,
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
  context?: "creation" | "history";
  achieved?: boolean;
  isTask?: boolean;
  taskSchedule?: { date: string; time: string };
  /** `plain` leaves the surface unstyled for material exploration studies. */
  surface?: "material" | "plain";
  /** Gallery grids pass false so the card stays still; drag hosts keep the default. */
  rotatable?: boolean;
  /** Paint static gallery shards as one clipped face. Full shards own rotation. */
  flat?: boolean;
  assembly?: { completed: number; target: number; preview?: boolean };
  visibility?: TempoCardVisibility;
  renderLettering?: (
    text: ReactNode,
    size: "display" | "title" | "supporting",
  ) => ReactNode;
}) {
  const still = Boolean(useReducedMotion());
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
  // The material expresses difficulty, so it appears with the same disclosure as the
  // effort bars. Tasks carry no difficulty and read as the neutral glass finish.
  const material =
    surface === "plain" || !visibility.difficulty
      ? undefined
      : resolveTempoCardMaterial(isTask ? "easy" : fields.difficulty);
  const goalColor = visibility.category ? fields.color : "#b99060";
  const card = (
    <div className="tempo-card-frame">
      <article
        className="tempo-card"
        data-tempo-goal-card=""
        data-empty={!visibility.category}
        data-effort={visibility.difficulty ? effort : undefined}
        data-material={material}
        style={goalColorStyle(goalColor)}
        aria-label={
          context === "history"
            ? `${fields.title} ${isTask ? "task" : "goal"} card`
            : "Goal card preview"
        }
      >
        <div className="tempo-card-meta">
          <span>
            {isTask && context === "history"
              ? achieved ? "Task completed" : "One time task"
              : context === "history"
              ? achieved
                ? "A goal you accomplished"
                : "A goal you showed up for"
              : "Your commitment, taking shape"}
          </span>
          {visibility.schedule && fields.is_private && <span>Private</span>}
          <ArrowUpRight
            className="tempo-card-arrow"
            size={26}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        {hasCount || !isTask ? <div className="tempo-card-target">
          <strong>
            {renderLettering(
              hasCount ? String(isTask ? 1 : count).padStart(2, "0") : "—",
              "display",
            )}
          </strong>
          {hasCount && <span>{renderLettering(unit, "supporting")}</span>}
        </div> : null}
        <h2>
          {renderLettering(
            <>
              {fields.title.trim() || "Something worth starting."}
              {/* Marks where the title's last word ends, for callouts that point at it. */}
              <span className="tempo-card-title-end" aria-hidden="true" />
            </>,
            "title",
          )}
        </h2>
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
                    data-level={level}
                  />
                ))}
              </span>
            </div>
          )}
        </div>
        {/* Fixed corners: dates stacked bottom-left, time bottom-right. Every line is
            reserved even when empty, so filling one in never shifts the face. */}
        <div className="tempo-card-meta tempo-card-dates">
          {/* Label and date columns are shared, so the two dates always line up. */}
          <span className="tempo-card-date-range">
            <span className="tempo-card-date-line">
              {isTask ? (
                <span className="tempo-card-date-only">{taskSchedule?.date}</span>
              ) : (
                <>
                  <span>From</span>
                  <span>{fields.start_date}</span>
                </>
              )}
            </span>
            <span className="tempo-card-date-line">
              {visibility.schedule && !isTask && fields.end_date ? (
                <>
                  <span>Until</span>
                  <span>{fields.end_date}</span>
                </>
              ) : null}
            </span>
          </span>
          <span className="tempo-card-time">
            {visibility.schedule ? (isTask ? taskSchedule?.time || "Any time" : fields.default_local_time) : ""}
          </span>
        </div>
      </article>
    </div>
  );

  if (!material) {
    return card;
  }

  return (
    <TempoCardSurface
      material={material}
      goalColor={goalColor}
      label={fields.title.trim() || "Goal card"}
      rotatable={rotatable && !(assembly && flat)}
      solid={!assembly && !flat}
    >
      {assembly ? (
        <ReassemblingCard
          key={assembly.target}
          completed={assembly.completed}
          target={assembly.target}
          still={still || flat}
          flat={flat}
          preview={assembly.preview}
        >
          {card}
        </ReassemblingCard>
      ) : (
        card
      )}
    </TempoCardSurface>
  );
}
