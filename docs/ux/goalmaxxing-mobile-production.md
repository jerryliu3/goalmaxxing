# Portrait mobile Month and landing

Month A (month map + readable day) and Landing A (editorial journey) are now
applied to production portrait phones below 768 CSS pixels. Landscape and
larger viewports use the existing presentations. Week is unchanged.

## Application Month

The seven-column map replaces horizontal scrolling in portrait. Dates keep the
existing selection, today, accessible labels, and drop targets. Goal-color marks
show up to three placements; the numeric count includes every visible placement
except moved-from ghosts. The check count includes credited entries and separate
completion markers, including partner markers in the selected Duo scope.

A date opens the existing focused-day pane below the map. Full goal/session names,
hold completion, linked-goal details, tasks, draggable rows, session editing,
recovery, and draft Save/Undo remain on their existing paths. Completion is not
added to date cells. Expanded-row control is hidden while work is summarized.

Rotation changes CSS presentation. It does not remount cells, navigation,
selection, or draft state. Landscape restores the full pills and expansion
control. The existing calendar morph frame and reduced-motion behavior remain.

## Public landing

Portrait phones see a readable commitment card followed by four chapters:
Shape → Plan → Adapt → Record. The example has one source of local state across
its card, month, selected-day detail, staged move, and progress.

The goal uses the production `TempoGoalCard`, the calendar uses the shared month
builder, and recording uses the production hold-completion control. The fixed
October 2026 example is labelled; it neither reads nor writes account data.
A target changes placement density. Moving a session creates a review with
Undo/Save; recording is allowed only for past/present example dates without a
pending move. Records remain visible if a lighter target removes their placement.
Coach is labelled Beta and its example suggestion enters the same move review.

The existing header/style picker, account/app/demo routes, contact, privacy, and
terms remain available. Desktop/landscape retain the current landing. Both
presentations remain mounted so rotating away and back preserves the example.

## Coverage and verification

Added summary-count/ghost/overlay coverage, example seed and eligibility coverage,
interactive target/move/hold coverage, and browser scenarios for bounds and state
continuity through rotation. Existing landing browser cases target the preserved
desktop/landscape presentation; the new scenario targets portrait.

No tests, browser verification, typecheck, lint, builds, or CI were run. Follow
`AGENTS.md`: verification requires explicit approval after the PR stack exists.
