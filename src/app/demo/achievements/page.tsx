"use client";

import { useEffect, useState } from "react";
import { AchievementsShowcase } from "@/features/achievements/showcase";
import { AchievementsShowcaseStyles } from "@/features/achievements/showcase-presentation";
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
      <div className="ach-showcase-root rounded-[20px] px-4 py-10 text-[#a89880] sm:px-6">
        <AchievementsShowcaseStyles />
        <p className="text-sm">Loading demo achievements...</p>
      </div>
    );
  }

  return <AchievementsShowcase payload={payload} />;
}
