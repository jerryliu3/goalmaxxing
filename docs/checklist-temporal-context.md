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
