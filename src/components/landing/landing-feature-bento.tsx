import {
  ArrowRight,
  CalendarClock,
  Check,
  RotateCcw,
} from "lucide-react";
import { LandingCoachDemo } from "@/components/landing/landing-coach-demo";

function RecoveryCard() {
  return (
    <article className="overflow-hidden rounded-3xl border border-recover/30 bg-recover/10 p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-recover text-primary-foreground">
            <RotateCcw className="size-4" />
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
            Recover your rhythm
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A disrupted day does not ruin the plan. Automatically adjust unfinished
            sessions into dates that still work.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-recover/30 bg-background p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-xl border border-dashed border-border bg-page p-3">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground">
              <CalendarClock className="size-3" />
              Last week
            </div>
            <p className="mt-2 text-[10px] font-medium text-muted-foreground line-through">
              Tempo run
            </p>
            <p className="mt-1 text-[8px] text-muted-foreground">Incomplete</p>
          </div>
          <ArrowRight className="size-4 text-recover" />
          <div className="rounded-xl border border-gain/35 bg-gain/10 p-3">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-foreground">
              <Check className="size-3 text-gain" />
              Next opening
            </div>
            <p className="mt-2 text-[10px] font-medium text-foreground">
              Tempo run
            </p>
            <p className="mt-1 text-[8px] text-muted-foreground">Friday · 7:00 AM</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-recover/15 px-3 py-2">
          <span className="text-[9px] font-medium text-orange-950">
            2 sessions re-placed
          </span>
          <span className="text-[8px] text-orange-950">Ready to save</span>
        </div>
      </div>
    </article>
  );
}

export function LandingFeatureBento() {
  return (
    <section className="border-b bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            Adapt without starting over
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Support when the plan gets complicated.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <LandingCoachDemo />
          <RecoveryCard />
        </div>
      </div>
    </section>
  );
}
