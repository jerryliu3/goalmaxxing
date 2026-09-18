"use client";

import type { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { ReassemblingCard } from "./card-material/reassembling-card";
import { ArrowUpRight } from "lucide-react";
import { getCategoryLabel } from "@/lib/goals/category";
import { resolveTempoCardMaterial } from "./card-material/tempo-card-material";
import { TempoCardSurface } from "./card-material/tempo-card-surface";
import type { GoalCreationFields } from "./goal-creation-model";
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
  renderLettering = text => text,
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
  /** Prefer leaving this on; hosts with competing swipes still work because card pointer events stop bubbling. */
  rotatable?: boolean;
  assembly?: { completed: number; target: number };
  visibility?: TempoCardVisibility;
  renderLettering?: (text: ReactNode, size: "display" | "title" | "supporting") => ReactNode;
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
    <article
      className="tempo-card"
      data-empty={!visibility.category}
      data-effort={visibility.difficulty ? effort : undefined}
      data-material={material}
      style={{ "--goal-color": goalColor } as CSSProperties}
      aria-label={context === "history" ? `${fields.title} goal card` : "Goal card preview"}
    >
      <div className="tempo-card-meta">
        <span>
          {context === "history"
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
      <div className="tempo-card-target">
        <strong>
          {renderLettering(hasCount ? String(isTask ? 1 : count).padStart(2, "0") : "—", "display")}
        </strong>
        {hasCount && <span>{renderLettering(unit, "supporting")}</span>}
      </div>
      <h2>{renderLettering(fields.title.trim() || "Something worth starting.", "title")}</h2>
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

  if (!material) {
    return card;
  }

  return (
    <TempoCardSurface
      material={material}
      goalColor={goalColor}
      label={fields.title.trim() || "Goal card"}
      rotatable={rotatable}
      solid={!assembly}
    >
      {assembly ? <ReassemblingCard key={assembly.target} completed={assembly.completed} target={assembly.target} still={still}>{card}</ReassemblingCard> : card}
    </TempoCardSurface>
  );
}
