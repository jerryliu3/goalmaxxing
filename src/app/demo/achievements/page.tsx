"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GlobalAchievementsCard,
  type GlobalAchievementItem,
} from "@/features/achievements/global-achievements-card";

interface AchievementsPayload {
  achievedGoals: Array<{
    goalId: string;
    title: string;
    rewardText: string | null;
    achievedOn: string | null;
  }>;
  globalAchievements: Array<{
    id: string;
    title: string | null;
    level: number | null;
    description: string | null;
    unlockedAt: string;
    revokedAt: string | null;
  }>;
}

export default function DemoAchievementsPage() {
  const [payload, setPayload] = useState<AchievementsPayload | null>(null);

  useEffect(() => {
    void fetch("/api/xp/achievements")
      .then((response) => (response.ok ? response.json() : null))
      .then((next: AchievementsPayload | null) => {
        if (next) {
          setPayload(next);
        }
      });
  }, []);

  const globalAchievements: GlobalAchievementItem[] = (
    payload?.globalAchievements ?? []
  ).map((achievement) => ({
    id: achievement.id,
    title: achievement.title,
    level: achievement.level,
    description: achievement.description,
    unlockedAt: achievement.unlockedAt,
    revokedAt: achievement.revokedAt,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(payload?.achievedGoals ?? []).length === 0 ? (
            <p className="text-muted-foreground">No completed goals in this demo snapshot yet.</p>
          ) : (
            payload?.achievedGoals.map((goal) => (
              <p key={goal.goalId}>{goal.title}</p>
            ))
          )}
        </CardContent>
      </Card>
      <GlobalAchievementsCard achievements={globalAchievements} />
    </div>
  );
}
