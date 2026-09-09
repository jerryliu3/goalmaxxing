"use client";

import { AchievementsShowcase } from "@/features/achievements/showcase";
import { useAchievementsShowcase } from "@/features/achievements/use-achievements-showcase";

function AchievementsLoadingState() {
  return (
    <div className="ach-showcase-root -mx-4 rounded-[20px] px-4 py-10 sm:-mx-6 sm:px-6">
      <p className="ach-showcase-body text-sm">Loading achievements...</p>
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
      <p className="ach-showcase-error text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="ach-showcase-retry mt-4 rounded-md border px-3 py-2 text-sm transition"
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
