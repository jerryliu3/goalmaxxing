"use client";

import type { PublicProfileCurrentGoal } from "@cadence/shared/social/public-profile";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { GoalProgressCard } from "@/features/goals/goal-progress-card";
import type { Goal } from "@/lib/goals/types";
import styles from "./folio.module.css";

export function hydratePublicCurrentGoal(dto: PublicProfileCurrentGoal): {
  goal: Goal;
  progress: ProgressContextSummary;
} {
  return {
    goal: {
      id: dto.id,
      owner_id: dto.ownerId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      color: dto.color,
      frequency_type: dto.frequencyType,
      recurrence_interval: dto.recurrenceInterval,
      difficulty: dto.difficulty ?? undefined,
      target_count: dto.targetCount,
      target_basis: dto.targetBasis,
      milestone_names: dto.milestoneNames,
      start_date: dto.startDate,
      end_date: dto.endDate,
      reward_text: dto.rewardText,
      default_local_time: dto.defaultLocalTime ?? undefined,
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: dto.createdAt,
      updated_at: dto.createdAt,
      is_private: false,
    },
    progress: dto.progress,
  };
}

export function CurrentGoalGrid({
  entries,
  onDetails,
}: {
  entries: Array<{ goal: Goal; progress: ProgressContextSummary }>;
  onDetails?: (goalId: string) => void;
}) {
  return (
    <div className={styles.currentGrid}>
      {entries.map(({ goal, progress }) => (
        <section key={goal.id} className={styles.currentGoal} aria-label={goal.title}>
          <GoalProgressCard goal={goal} progress={progress} />
          {onDetails ? (
            <button className={styles.goalDetails} type="button" onClick={() => onDetails(goal.id)}>
              Goal details <span aria-hidden="true">↗</span>
            </button>
          ) : null}
        </section>
      ))}
    </div>
  );
}
