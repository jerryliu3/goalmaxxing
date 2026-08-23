import {
  ArrowRight,
  CalendarClock,
  Check,
  RotateCcw,
} from "lucide-react";
import { LandingCoachDemo } from "@/components/landing/landing-coach-demo";

function RecoveryCard() {
  return (
    <article className="overflow-hidden rounded-3xl border border-orange-200 bg-orange-50/55 p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-orange-600 text-white">
            <RotateCcw className="size-4" />
          </span>
          <h3 className="mt-4 text-xl font-semibold tracking-tight">
            Recover your rhythm
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A disrupted day does not ruin the plan. Automatically adjust unfinished
            sessions into dates that still work.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-orange-200 bg-white p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500">
              <CalendarClock className="size-3" />
              Last week
            </div>
            <p className="mt-2 text-[10px] font-medium text-slate-700 line-through">
              Tempo run
            </p>
            <p className="mt-1 text-[8px] text-slate-500">Incomplete</p>
          </div>
          <ArrowRight className="size-4 text-orange-600" />
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700">
              <Check className="size-3" />
              Next opening
            </div>
            <p className="mt-2 text-[10px] font-medium text-emerald-950">
              Tempo run
            </p>
            <p className="mt-1 text-[8px] text-emerald-700">Friday · 7:00 AM</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-orange-100/70 px-3 py-2">
          <span className="text-[9px] font-medium text-orange-900">
            2 sessions re-placed
          </span>
          <span className="text-[8px] text-orange-700">Ready to save</span>
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
          <p className="text-xs font-semibold tracking-[0.16em] text-violet-700 uppercase">
            Adapt without starting over
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
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
