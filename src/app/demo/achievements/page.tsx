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
    return (
      <div className="ach-showcase-root rounded-[20px] px-4 py-10 sm:px-6">
        <p className="ach-showcase-body text-sm">Loading demo achievements...</p>
      </div>
    );
  }

  return <AchievementsShowcase payload={payload} />;
}
