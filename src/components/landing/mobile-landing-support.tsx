"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./mobile-landing.module.css";

export function MobileLandingSupport({
  canProposeMove,
  onProposeMove,
}: {
  canProposeMove: boolean;
  onProposeMove: () => void;
}) {
  return (
    <>
      <section className={styles.chapter}>
        <p className="type-eyebrow text-xs text-primary">
          Support, with you in control
        </p>
        <h2 className="mt-3 type-hero text-[2rem] leading-[1.1]">
          Keep the right people close.
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          A trusted partner can see shared work and encourage you through Duo.
          Your private goals stay private.
        </p>
        <div className={styles.supportProof}>
          <p className="type-item">Alex · Example partner</p>
          <p className="mt-2 text-sm text-muted-foreground">
            “Keep going, one session at a time.”
          </p>
        </div>
        <div className={styles.supportProof}>
          <p className="type-heading">
            AI Coach{" "}
            <span className="ml-2 text-sm text-muted-foreground">Beta</span>
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Example suggestion: “Friday has room for Thursday’s run. Review that
            move before saving.”
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={onProposeMove}
            disabled={!canProposeMove}
          >
            Try this example suggestion
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Try the suggested move above. Save only when it works for you.
          </p>
        </div>
      </section>
      <section className={styles.chapter} id="mobile-why-goalmaxxing">
        <p className="type-eyebrow text-xs text-primary">Why Goalmaxxing</p>
        <h2 className="mt-3 type-hero text-[2rem] leading-[1.1]">
          More than another daily checkbox.
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Real goals span weeks and months. A useful system connects the work
          you do today to the goal you chose, with room to change the plan.
        </p>
        <div className="mt-6 divide-y divide-border">
          {[
            [
              "Choose the right kind of goal",
              "Recurring rhythms, total targets, and fixed milestones. Add a deadline, difficulty, and a reward that means something to you.",
            ],
            [
              "Work your way",
              "Month, Week, Day, and Goal View help place work and inspect sessions. A focused list keeps completion readable.",
            ],
            [
              "Understand your progress",
              "Completion history, goal progress, and earned medals show the work you recorded.",
            ],
            [
              "Review missed work deliberately",
              "Eligible missed sessions can be reviewed and accepted, edited, or let go. Recovery starts when you choose Review.",
            ],
            [
              "Share on your terms",
              "Keep private goals private. Explore Duo, team goals, challenges, and leaderboards when you want shared accountability.",
            ],
          ].map(([title, copy]) => (
            <details key={title} className={styles.details}>
              <summary className="type-heading text-base">{title}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {copy}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className={`${styles.chapter} text-center`}>
        <h2 className="type-hero text-[2rem] leading-[1.1]">
          Make room for your next goal.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Start with one intention. Shape the plan around your life.
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/signup">
            Create account <ArrowRight className="size-4" />
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/calendar">Go to app</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/demo" target="_blank" rel="noopener noreferrer">
              Try demo
            </Link>
          </Button>
        </div>
        <a
          href="#mobile-why-goalmaxxing"
          className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
        >
          Read why this was built
        </a>
      </section>
    </>
  );
}
