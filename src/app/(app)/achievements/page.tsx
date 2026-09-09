"use client";

import { AchievementsShowcase } from "@/features/achievements/showcase";
import { AchievementsShowcaseStyles } from "@/features/achievements/showcase-presentation";
import { useAchievementsShowcase } from "@/features/achievements/use-achievements-showcase";

function AchievementsLoadingState() {
  return (
    <div className="ach-showcase-root -mx-4 rounded-[20px] px-4 py-10 text-[#a89880] sm:-mx-6 sm:px-6">
      <AchievementsShowcaseStyles />
      <p className="text-sm">Loading achievements...</p>
    </div>
  );
}

function AchievementsErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="ach-showcase-root -mx-4 rounded-[20px] px-4 py-10 sm:-mx-6 sm:px-6">
      <AchievementsShowcaseStyles />
      <p className="text-sm text-[#e8b4b4]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md border border-[#5a4a38] px-3 py-2 text-sm text-[#f8f1e3] transition hover:bg-[#2c241c]"
      >
        Try again
      </button>
    </div>
  );
}

export default function AchievementsPage() {
  const { loading, error, payload, reload } = useAchievementsShowcase();

  if (loading) {
    return <AchievementsLoadingState />;
  }

  if (error || !payload) {
    return (
      <AchievementsErrorState
        message={error ?? "Achievements could not be loaded."}
        onRetry={() => {
          void reload();
        }}
      />
    );
  }

  return <AchievementsShowcase payload={payload} />;
}
