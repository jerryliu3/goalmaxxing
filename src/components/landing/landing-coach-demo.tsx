"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageSquareText, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type CoachPhase = "idle" | "sent" | "typing" | "replied";

export function LandingCoachDemo() {
  const reducedMotion = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<CoachPhase>(reducedMotion ? "replied" : "idle");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reducedMotion) {
      return;
    }
    const sendId = window.setTimeout(() => setPhase("sent"), 350);
    const typingId = window.setTimeout(() => setPhase("typing"), 900);
    const replyId = window.setTimeout(() => setPhase("replied"), 1600);
    return () => {
      window.clearTimeout(sendId);
      window.clearTimeout(typingId);
      window.clearTimeout(replyId);
    };
  }, [inView, reducedMotion]);

  const showUser = reducedMotion || phase !== "idle";
  const showTyping = !reducedMotion && phase === "typing";
  const showCoach = reducedMotion || phase === "replied";

  return (
    <div ref={ref}>
      <article className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 shadow-sm sm:p-7">
        <div className="absolute -top-20 -right-16 size-52 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight">AI Coach</h3>
                <p className="text-[10px] text-muted-foreground">
                  Guidance grounded in your monthly plan
                </p>
              </div>
            </div>
            <span className="rounded-full border border-violet-300 bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-800">
              Beta
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {showUser ? (
              <motion.div
                data-testid="landing-coach-user"
                initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-xs leading-relaxed text-white shadow-sm"
              >
                Help me build a 4-week running routine around my launch schedule.
              </motion.div>
            ) : (
              <div className="h-12" />
            )}
            {showTyping ? (
              <div
                data-testid="landing-coach-typing"
                className="flex max-w-[40%] items-center gap-1 rounded-2xl rounded-tl-sm border bg-white px-3 py-3 shadow-sm"
              >
                <span className="size-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-violet-400" />
              </div>
            ) : null}
            {showCoach ? (
              <motion.div
                data-testid="landing-coach-reply"
                initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="max-w-[94%] rounded-2xl rounded-tl-sm border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <MessageSquareText className="size-3.5 text-violet-700" />
                  <p className="text-[10px] font-semibold text-violet-900">
                    Coach proposal
                  </p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-700">
                  Start with three weekly runs, keep Monday as recovery, and protect
                  Thursday for launch work.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-2.5">
                    <p className="text-[9px] font-semibold text-violet-900">
                      Editable goal draft
                    </p>
                    <p className="mt-1 text-[9px] text-violet-700">
                      Run 3× weekly · 4 weeks
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2.5">
                    <p className="text-[9px] font-semibold text-blue-900">
                      Schedule change
                    </p>
                    <p className="mt-1 text-[9px] text-blue-700">
                      Set Monday as a rest day
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                  <span className="text-[9px] text-muted-foreground">
                    2 draft changes · Nothing applied yet
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-[9px] font-semibold text-white">
                    Review proposal
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}
