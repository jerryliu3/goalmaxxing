# Motion in context

The moderator-gated `/ux/motion` route puts seven selected concepts into local
sample journeys using the current quest/Tempo cards and yearly folio. It is a
code UX prototype, not a production launch. Production `AppShell`, completion
mutations, task writes, milestone rules, and credit calculation are unchanged.

## Daily work

Hold the Tempo run completion square (or activate it with Enter/Space). The
sample receipt credits parents that are not listed in the day's plan. Each
parent floats below the source in order, receives a pulse, and shows its exact
before/after count and outcome. Afterward, inspect the retained results.

The same completion now plays the original reward study: a deep stamp drops
onto the source goal from above, larger/slower sparks lift away, and the
sample XP count eases from 320 to 344 while the top bar fills. This is visual
sample state only; it does not call the application's XP profile or reward
mutation.

The sample outcome control covers two achieved parents, progress without
achievement, no new linked credit, and recording failure. This is playback of
explicit sample results, not a new recursive credit implementation. A real
integration must use the canonical mutation's credited goals and outcomes;
completion of a source does not prove every ancestor is achieved. Skip and
reduced motion retain the same results. Parents are not fetched from a real
account or exposed across ownership boundaries.

Expand the run to see the weekly clasp in the existing `WorkQuestCard`, beside
its `TempoGoalCard`. The clasp closes at 3/3 while the recurring goal remains
active. It represents the actual sample weekly target, separate from the
material card's lifetime/presentation assembly behavior.

Add a one-time task. A perforation separates the written task and its row
settles below the composer. Sample data is committed before the effect starts;
the input clears and retains focus. The sample tasks can be completed through
the existing completion control. Reset sample restores the initial state.

## Milestones and library

Select First draft and complete it, then select Publish and complete it. Flags
remain on achieved milestones and unfurl only when newly earned. Merely
selecting a milestone, or having a planned date, does not complete it. Choosing
Publish first still leaves First draft unfinished and the goal active.

The final milestone marks the finite goal achieved. Its chapter gathers into
pages and the cover of the current year's folio closes around it. The resulting
book is the existing `FolioBook`, and the resting library is the existing
`FolioShelf` with its real reader interaction. Open the 2026 volume to inspect
the new goal. The sample uses `buildGoalFolios` to group outcomes; it does not
create a conflicting one-book-per-goal collection. The annual count goes from
one goal / 30 completions to two goals / 33 completions.

This is proposed placement for finite-goal achievement feedback. Before a
production cutover, resolve the real completion receipt's achievement event
and deduplication rather than detecting it from a mounted card or animation.
Routine recurring-session completion must never trigger book binding.

## Scope decisions

Included: completion stamp and XP flight, linked parent reveal/cascade,
expanded quest weekly clasp, task tear-off, persistent milestone flags, and
goal-achievement binding. Deferred:
goal footprints, evidence tally, and medal formation because their production
placement is unsettled. Skipped: day bookmark, cadence trace, tracing paper,
history transfer, return thread, and record plate.

All state lives in the route's client subtree; there are no account/API writes,
new persistence schemas, feature flags, notification prompts, or route changes
outside the UX hub. The route inherits the existing moderator gate and no-index
metadata. Timers are bounded and cleaned up on reset/unmount. Still motion
also respects the system preference. Tabs preserve each sample journey's state.

## Coverage and review

Written coverage checks cascade order and duplicate activation, partial parent
credit, failure/retry, no-credit receipts, skip/still outcomes, repeated task
capture and keyboard completion, distinct milestone completion, and only
filing an achieved goal into the existing annual volume. Tests, typecheck,
lint, builds, browser checks, and CI were not run, per the requested workflow.
Source self-review is not a claim of browser-verified layout or timing.

Candidate production order after visual selection: milestone flags and task
capture first; weekly clasp once its fit alongside the material face is
approved; stamp/XP after the reward target and timing are agreed; cascade and
book binding after the real credited/achieved event contracts and small-screen
interruption behavior have been reviewed.
