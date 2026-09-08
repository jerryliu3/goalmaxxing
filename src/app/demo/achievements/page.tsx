"use client";

import { useEffect, useState } from "react";
import { AchievementsShowcase } from "@/features/achievements/showcase";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";

export default function DemoAchievementsPage() {
  const [payload, setPayload] = useState<AchievementsShowcasePayload | null>(null);

  useEffect(() => {
    void fetch("/api/xp/achievements")
      .then((response) => (response.ok ? response.json() : null))
      .then((next: AchievementsShowcasePayload | null) => {
        if (next) {
          setPayload(next);
        }
      });
  }, []);

  if (!payload) {
    return <p className="text-sm text-muted-foreground">Loading demo achievements...</p>;
  }

  return <AchievementsShowcase payload={payload} />;
}
