"use client";

import { ArrowUpRight, BookOpen } from "lucide-react";
import { useAppRouter } from "@/lib/navigation/use-app-router";
import { AchievementsShowcase } from "@/features/achievements/showcase";
import { useAchievementsShowcase } from "@/features/achievements/use-achievements-showcase";
import { useXpProfile } from "@/components/xp/xp-profile-provider";
import { Button } from "@/components/ui/button";

export function ProgressAchievementsSection() {
  const router = useAppRouter();
  const { profile } = useXpProfile();
  const { loading, error, payload, reload } = useAchievementsShowcase();

  if (!profile) {
    return null;
  }

  return (
    <section
      id="progress-achievements"
      data-testid="progress-achievements"
      className="scroll-mt-24"
    >
      {loading ? (
        <div className="ach-showcase-root rounded-[20px] px-4 py-10">
          <p className="ach-showcase-body text-sm">Loading achievements...</p>
        </div>
      ) : error || !payload ? (
        <div className="ach-showcase-root rounded-[20px] px-4 py-10">
          <p className="ach-showcase-error text-sm">
            {error ?? "Achievements could not be loaded."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              void reload();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <AchievementsShowcase payload={payload} />
      )}
      <button
        type="button"
        onClick={() => router.push("/insights/folios")}
        className="mt-5 flex w-full items-center gap-4 rounded-xl border border-border/70 bg-card/50 px-5 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <BookOpen className="size-5 text-muted-foreground" strokeWidth={1.4} aria-hidden="true" />
        <span className="flex-1"><span className="block font-display text-xl">View past goals</span><span className="mt-0.5 block text-sm text-muted-foreground">Open your living folio.</span></span>
        <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </button>
    </section>
  );
}
