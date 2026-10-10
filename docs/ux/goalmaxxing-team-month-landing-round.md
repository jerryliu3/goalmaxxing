# Team, mobile Month and mobile landing — focused second round

Source baseline: `origin/main` at d33e11e9. These are code prototypes, not a production adoption. They use in-memory fictional October 8, 2026 data; no API calls, account writes, messages, preferences or AI generation. Implementation does not imply a chosen product direction. No browser or suite verification has been run, following the repository verification gate.

## Team: a purpose that is unavailable in Duo

Duo already owns joint planning and comparison. Team therefore does not get a second calendar, checklist, leaderboard or chart dashboard. All three alternatives retain partner membership, incoming/outgoing invitations, accept/decline/cancel, Team XP, a bounded nudge note, partner detail, shared goals and a leave confirmation. Team XP is a sample of the canonical team value, not calculated from our fixture session count. Contribution counts are explicitly recorded sessions, not a new score. No private personal goals are exposed. Only your present/past work can be recorded.

| Option                 | Reason to visit                              | Distinct interaction                                                                                                                                      | Cost / limitation                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A Partnership brief    | Understand the partnership in under a minute | Choose one shared weekly focus; its finite recap connects recent work to the next contribution; send encouragement or inspect that goal                   | The focus choice is new team-owned weekly data; the rest derives from visible work. Needs relevant activity, not generic prompts. No invented prediction that someone is behind.                                                                             |
| B Shared-goal dossiers | Follow the thing you are doing together      | Each goal has contributions, next owner/date and a keepsake. The film adds an editing → ready → reviewed handoff, separate from scheduling or completion. | Shared team goals, not a gallery comparing personal goals. Handoff status and partner feedback need persistence and permissions before shipping. Historical archive fixture illustrates a future projection whose production availability must be confirmed. |
| C Weekly rendezvous    | Give and receive useful support              | One focus plus optional support request; publish, edit and acknowledge reading                                                                            | A new optional capability. Production would need team-owned note storage, weekly cadence, edit/acknowledgement semantics and visibility. No automatic session creation, scheduling agreement or completion credit.                                           |

Recommendation for discussion: A is the lightest shared-priority experience; B is concrete project coordination; C creates the strongest general reason to return. B is strongest for partners whose relationship revolves around a shared project. Do not combine all three into a crowded team dashboard before choosing a primary purpose.

### Review routes

- `/ux/focused/team` — A
- `/ux/focused/team?variant=b` — B
- `/ux/focused/team?variant=c` — C

Try every relationship scenario using the lab selector. In A, change the shared focus. In B, open the film, record your rough cut, mark it ready, then simulate Alex’s review and return to editing. A focus never moves sessions; a review never grants completion credit. Other-person actions are separated as prototype simulation controls. The team-goal entrance chooses a fixture rather than copying the production card-creation wizard. Dossiers reuse the actual goal-card renderer and completion hold primitive. The source-reconstructed baseline is available through Compare baseline; it is not a screenshot or a browser assessment of current main.

## Mobile Month: full horizon, one shared action model

Week remains untouched. The new Month fixture contains the entire October horizon, five Solo sessions on October 8, long session/goal titles, a one-off task, a linked child session, partner work, an empty day, September context and November work. It deliberately exercises both cross-week movement and a cross-month film move whose goal remains active in November. Running work ends in October and cannot be moved into November.

| Option                     | Month orientation                                                                                             | Readable detail                                         | Main cost                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| A Month map + day          | Every date fits; goal initials plus recorded/placed counts; Today and selected date have different treatments | One full-width day below                                | Titles need a tap; tiny initials are a supplementary cue, not the only accessible description.                      |
| B Readable calendar window | Full seven-column month, stable 120px columns, explicit sideways cue and selected-column reveal               | Up to three wrapped titles in each cell; full day below | Sideways browsing and taller rows. This is a deliberate calendar choice, not a claim that all horizontal UI is bad. |
| C Month chapters           | Every week in the month has a workload heading and seven date entrances                                       | Expand a chapter and select its day                     | Less continuous spatial geometry; expansion state. Not a replacement for the existing Week view.                    |

### Core interactions preserved in the local model

- Month previous/next, Today, selecting adjacent-month dates, and previous/next day in A/B.
- Solo, Partner, Duo; goal and title filters; meaningful empty results; all hidden draft moves remain in the save dock.
- Actual `useCompletionHold`/`CompletionProgressMark` through the shared study control, including removing a completion. Partner and future rows are read only. A staged session cannot be completed before its date edit is saved.
- Inspect a full title; stage a date within the active goal lifetime; review the source and destination; Save applies all draft moves; Undo discards only unsaved moves. Month navigation and filtering do not silently apply or discard them.
- Linked work is represented once, with a credit relationship annotation. Production cascade calculations are not reimplemented by this sample.
- A recoverable lifetime-goal miss has a quiet Review entrance below the work. Opening Review changes nothing; applying or letting go saves that one recovery decision immediately. Pending planner edits must first be saved/undone. This is a placement excerpt with other work unchanged, not a redesign of recovery’s optional auto-rebalance algorithm or cadence eligibility.

Recommendation for discussion: A is the strongest default to explore for phone Month because it preserves an actual month overview and gives work its own readable surface. B is useful if seeing titles in neighboring dates matters more than a fitted horizon. C is useful if weekly workload within the month is the main question.

### Review routes

- `/ux/focused/phone-agenda` — A (existing study route, now exclusively Month)
- `/ux/focused/phone-agenda?variant=b` — B
- `/ux/focused/phone-agenda?variant=c` — C

This shares a single local reducer across all alternatives and reuses the production shared `buildMonthCells` calendar utility. It does not replace the production planner or add duplicate planner mutations. Before adoption, wire the chosen presentation to the canonical planner session/projection, ownership, completion, linked-goal and recovery paths. Only visible presentation state belongs in these new components.
