# Application navigation and continuous Goal View

The web application uses Planner, Goals, Achieved, and Community. App entry and the Planner navigation link always open Today. Explicit date/view deep links remain available. No remembered view preference selects a default.

Planner has Day, Week, Month, and Goal View. Goal View is the production adaptation of the Time Weave study: goals in rows and a continuous civil-date axis, initially aligned to the user's current week. It is not constrained to one week. Date navigation and scrolling browse the saved schedule; they do not generate a new plan. Goals owns the current/upcoming card collection, creation, and goal library. Achieved owns completion history, awards, and completed/ended/archived goals. Profile/settings is an avatar action.

Goal View is URL-owned by `lens=goals` on the existing `/calendar` route. Selecting the main Planner link clears this lens and opens Today. Date headers use the existing day inspector. Sessions use the existing editor, completion intent, planner drag provider, draft commands, and Save/Undo paths. Partner ownership and linked-goal rules remain canonical.

The axis extends in both directions and virtualizes date columns. Planner context is fetched in rolling windows of exactly 90 days (21 before the anchor and 68 after), within the existing 366-day contract. Only one Goal View window is retained in memory and session storage; old windows and their pending cache fills are evicted. Normal mutation invalidation is preserved. Scroll position stays independent of the loaded snapshot. Existing planner draft-range limits still apply: save an existing draft before moving more than twelve months away. Empty future dates represent no saved sessions, not a generated schedule.

Time Weave's study route remains exploratory and uses sample state. Production imports no study reducers, sample dates, or prototype theme overrides. It respects the current application appearance and reduced motion settings.

Functional coverage is written for tab/lens navigation, current-week alignment, growing/virtualized date ranges, canonical action bindings, ownership restrictions, and bounded context paging. Checks remain subject to the repository's explicit verification gate.
