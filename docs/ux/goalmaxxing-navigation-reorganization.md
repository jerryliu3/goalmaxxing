# Application destinations and Goal View

The web application uses Agenda, Goals, Achievements, and Community. App entry and the Agenda navigation link open Day at today. Explicit date/view deep links remain available; remembered view preferences never select the default.

Agenda has Day, Week, Month, and Goal View. Goal View shows goal lanes of each goal's upcoming sessions. A Calendar switch spreads the same lanes over a Time Weave-style date axis, and the same session cards slide between the two. Scheduling edits and completion on those cards keep the canonical draft and Save/Undo path and their existing persistence. Date and session clicks open the existing day inspector. Details are in `goalmaxxing-goal-view-study.md`.

Goals stacks Current Goals, Progress tracker, and Past Goals. Current Goals includes a dashed New goal card using the same creation dialog/route and demo callback. Current and past collections use the existing lifetime progress selectors; the tracker uses the existing history surface and its cached data. Achievements shows awards first, followed by Goal library. The past collection intentionally appears in both destinations. Its Completed/Ended/Archived semantics are unchanged. Profile/settings remains an avatar action.

Goal View is URL-owned by `lens=goals` on `/calendar`. Its Calendar option is local presentation state and is off on a fresh open. The axis extends in both directions, starts at the current week, and virtualizes date columns. Context is read in rolling windows of exactly 90 days (21 before the anchor and 68 after). Only one Goal View window is retained in memory and session storage; old windows and pending cache fills are evicted. Browsing reads the saved schedule and does not generate a plan. Existing draft limits, ownership, linked-goal rules, and planner mutation invalidation remain canonical.

Production imports no Time Weave study state, sample dates, or prototype theme overrides. The old preview dialog and timeline mutation plumbing are removed. The current Coach provider, page context, icon/text header launcher, and existing caching/request deduplication from main are preserved.

Functional coverage is written for the card/calendar transition, read-only overview inspection, canonical creation action, vertical section ordering, past collection redundancy, ownership, navigation defaults, and bounded paging/cache eviction. Tests, typecheck, lint, browser checks, and CI remain behind the repository's explicit verification gate.
