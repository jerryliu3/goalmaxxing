# Checklist temporal context

Checklist presentation uses two independent dates:

- **`selectedDate`** (`viewDate`): lifecycle placement, exact-date checkbox state, and
  period-scoped checklist facts for the browsed day.
- **`asOfDate`** (`todayLocalDate`): progress summaries, lifetime counts, outcome
  badges, and shortfall labels from `/api/progress/context`.

Period checklist facts include every completion in the anchored period that contains
`selectedDate`, including dates after `selectedDate` within that period. That is
intentional: mid-period browsing can show period counts that reflect later
completions in the same period.

Presentation fields are typed in `ChecklistGoalPresentation` and built by
`projectChecklistGoalPresentation` from facts + summaries + `ChecklistTemporalContext`.

## Hide vs green temporal split

Target-achieved **hiding** (the "show completed goals" filter) uses the **browsed**
`selectedDate` as the hide cutoff — not `asOfDate`. A goal stays visible on the day
its target was achieved; it hides only after that achieved day has passed relative to
the browsed date. Period cadence goals reset hiding each new period.

**Green** state (`isGreen`, period counts) and lifetime **outcome** badges use
`asOfDate` progress summaries from `/api/progress/context`. Mid-period browsing can
therefore show green while the hide filter still shows the goal on the achieved day,
or hide a goal while counts reflect a later `asOfDate`.

Today derives hide ids exclusively from `shouldHideWhenCompletedFilterOff` on the
presentation map (`selectTargetAchievedGoalIdsFromPresentations`), not from a
parallel hook derivation path.
