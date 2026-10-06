import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RECOVERY_CONCEPTS } from "@/features/ux-recovery/concepts";
import { formatDay } from "@/features/ux-recovery/dates";
import { recoveryPrompt, suggest, type RecoveryPlan, type RecoverySeed } from "@/features/ux-recovery/model";
import { ReviewEntry } from "@/features/ux-recovery/primitives";
import { RECOVERY_SEED, TODAY } from "@/features/ux-recovery/seed";
import "@/features/ux-recovery/recovery.css";

const RULES = [
  ["Ask first", "Nothing about recovery shows until you press “N sessions slipped · Review”. Before that the calendar looks as it always does."],
  ["Every decision saves at once, and stays undoable", "Accept, Edit + Apply, or Let it go writes right away. The row stays as a confirmation — “Moved to Thu Oct 8 ✓” or “Let go ✓” — with its own Undo, here and in the summary."],
  ["Just the missed, unless you auto-rebalance", "Only the slipped session moves. One switch, Auto-rebalance, proposes new dates for every goal at once — later sessions respaced too — in the summary. Nothing saves until Apply rebalance."],
  ["Past periods stay quiet", "Last week’s weekly miss, yesterday’s daily miss: no row, no warning. Only in-period and lifetime misses come back."],
  ["Honest fit", "Inside the window, one per goal per day, at most 3 sessions a day, rest days last, never in the past. If nothing fits, the row says why."],
] as const;

export function RecoveryIndex() {
  const plan = suggest(RECOVERY_SEED, TODAY);
  const prompt = recoveryPrompt(plan, TODAY);

  return (
    <main className="rc-root">
      <section className="px-5 pb-10 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--rc-rule)] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Goalmaxxing / Recovery study</p>
            <Link href="/ux" className="text-xs font-semibold text-[color:var(--rc-deep)]">
              UX labs
            </Link>
          </div>
          <h1 className="mt-10 max-w-4xl font-display text-[clamp(2.4rem,7vw,5rem)] font-semibold leading-[0.92] tracking-tight">
            A missed day isn’t a missed week.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--rc-deep)]">
            Recovery today is a button in Planner settings that moves everything at once, often onto today,
            and sometimes says nothing fits when it does. This study makes recovery a review you ask for: a
            suggested day for each slipped session, your call on every one, saved as you go.
          </p>
          <p className="mt-4 text-sm text-[color:var(--rc-muted)]">
            Study only · seeded data · today is {formatDay(TODAY)}.
          </p>
        </div>
      </section>

      <section className="border-t border-[color:var(--rc-rule)] px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          <div className="rc-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-muted)]">
              Entry 1 · top of Agenda
            </p>
            <p className="mt-3 font-display text-xl font-semibold">Wednesday, October 7</p>
            <div className="mt-2">
              <ReviewEntry prompt={prompt} href="/ux/recovery/goal-by-goal" />
            </div>
            <p className="mt-2 text-xs text-[color:var(--rc-muted)]">
              Replaces “Recover missed activities” in Planner settings. One button; nothing else changes on the
              calendar until it’s pressed. Disappears when nothing slipped.
            </p>
          </div>
          <div className="rc-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-muted)]">
              Entry 2 · check-in Next tab
            </p>
            <div className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-[color:var(--rc-page)] px-3 py-2 text-sm">
              <span>
                <span className="font-semibold">{prompt.text}</span>
                <span className="block text-xs text-[color:var(--rc-muted)]">{prompt.fit} can still fit this plan</span>
              </span>
              <Link href="/ux/recovery/goal-by-goal" className="font-semibold underline-offset-4 hover:underline">
                Review
              </Link>
            </div>
            <p className="mt-2 text-xs text-[color:var(--rc-muted)]">
              Deep-links into the same review instead of dropping you on the calendar.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--rc-rule)] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Two ways to review</h2>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--rc-deep)]">
            Round 3. Goal by goal leads: one goal at a time, confirmations you can undo, and a recap of every
            change at the end. In Goal View runs the same rows inside Goal View’s lanes. Focused list is retired.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {RECOVERY_CONCEPTS.map((concept) => (
              <li key={concept.slug}>
                <Link
                  href={`/ux/recovery/${concept.slug}`}
                  aria-label={`Open ${concept.name}`}
                  className="rc-card group flex h-full flex-col p-5 transition hover:border-[color:var(--rc-deep)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rc-muted)]">
                    {concept.number}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{concept.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--rc-deep)]">{concept.thesis}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
                    Open
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[color:var(--rc-rule)] px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Rules every concept shares</h2>
            <dl className="mt-4 space-y-4 text-sm">
              {RULES.map(([term, detail]) => (
                <div key={term}>
                  <dt className="font-semibold">{term}</dt>
                  <dd className="mt-0.5 leading-relaxed text-[color:var(--rc-deep)]">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">The seeded week</h2>
            <ul className="mt-4 divide-y divide-[color:var(--rc-rule)] text-sm">
              {seedStory(RECOVERY_SEED, plan).map((line) => (
                <li key={line.goal} className="py-2.5">
                  <p className="font-semibold">{line.goal}</p>
                  <p className="text-[color:var(--rc-deep)]">{line.story}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

/** One line per goal: what the default suggestion does with its misses. */
function seedStory(seed: RecoverySeed, plan: RecoveryPlan) {
  return seed.goals.map((goal) => {
    const rows = plan.rows.filter((row) => row.goalId === goal.id);
    const quiet = seed.sessions.filter(
      (session) =>
        session.goalId === goal.id &&
        session.status === "missed" &&
        !rows.some((row) => row.sessionId === session.id)
    );
    const parts = rows.map((row) =>
      row.date
        ? `Missed ${formatDay(row.missedDate)} → suggested ${formatDay(row.date)}.`
        : `Missed ${formatDay(row.missedDate)} → ${row.reason}`
    );
    for (const session of quiet) {
      parts.push(`Missed ${formatDay(session.date)} — past period, silently excluded.`);
    }
    return { goal: `${goal.title} · ${goal.target}`, story: parts.join(" ") || "On plan." };
  });
}
