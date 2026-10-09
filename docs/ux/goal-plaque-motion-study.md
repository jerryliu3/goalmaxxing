# Plaque motion: intention to keepsake

Prototype: `/ux/brand/plaque-motion`, under the existing moderator-only UX lab
layout and noindex metadata. Built above PR #963. This is an exploration, not a
production lock or an earning-system change. No API calls, database writes, XP
grants, or live completion mutations occur.

## Direction

Start with one connected visual story, with Grand and Quiet intensity choices.
The card itself is the object that travels through the story. Avoid a separate
concept round unless the motion feels wrong: the major open decisions are
timing, intensity, and what actually earns the object.

Use the real `TempoGoalCard`, material finishes, lettering, deterministic
`buildRewardPieces` partitions, ghost treatment, and `FolioBook`. All choreography
lives in the study. No production components are changed.

## 1. Review: the promise

| Beat | Duration | Visible behavior |
| --- | --- | --- |
| Whole | 320 ms | Hold the finished material as an aspirational preview. |
| Etch | 480 ms | Seams divide it into exactly N pieces. |
| Release | 850 ms | Pieces ease a short distance apart and dissolve. |
| Ghost | Until next action | Empty outlines remain, with the exact count in readable text. |

Enter this sequence on first arrival at Review, before the create/save mutation.
This reconciles “finalized” with the proposed review-step behavior: creation
confirmation should not repeat it. In production, returning to Review should
retain the outline, with an optional explicit replay.

An edit at any point cancels the reveal and updates the empty partition. Unchanged
polygons retain their identity; changed outlines enter/exit over 300 ms. No full
explosion for each keystroke. For this finite sample, changing the number changes
the total-completion target and the plaque partition together.

**Count pieces, not cracks.** N pieces need not have N interior lines. One piece
has no interior crack. The study uses #963’s 1–20 range; the shared partitioner
supports one piece per unit through 24, grouping above that. Never display a
false exact one-piece-per-completion promise for a grouped target.

**Production update (Oct 2026): the ghost has no seams.** Feedback: the seam map
on the empty card read as cracks. In production the ghost is the whole empty
dashed card; seams appear only on the material itself (the Etch beat and earned
pieces), never as outlines showing where missing pieces go. The study keeps its
outlines as a reference.

## 2. Final completion: the keepsake

| Beat | Duration | Visible behavior |
| --- | --- | --- |
| Lift | 720 ms | Almost-complete plaque moves from its measured position into a foreground ceremony. |
| Gather | 1,050 ms | Last piece enters; existing pieces settle together. |
| Seal | 420 ms | Replace fragments with one seamless, unclipped material face; a single light pulse. |
| Celebrate | User controlled | Congratulations, real count, optional personal reward; three one-shot firework bursts in Grand. |
| Keep | 1,500 ms | Book appears and opens, plaque shrinks into its page, cover closes. |
| Kept | User controlled | Book and a readable confirmation remain. |

Grand adds a category-colored atmosphere and fireworks. Quiet uses the same
plaque, seal, reward copy, and book choreography without the atmosphere or bursts.
Reduced motion shows the earned plaque immediately, then the book immediately on
Keep; there is no travel, rotation, pulse, or particle motion. Close and Escape
are available throughout; Skip advances the current animation to its result.
Dialog focus is contained and returns to the completion trigger on dismissal.
No sound, continuous idle animation, canvas, or new animation dependency.

The prototype button simulates an already-confirmed final completion. In
production, the completion must already be saved before the ceremony begins.
“Keep in my book” acknowledges the presentation; closing early cannot lose the
completion, reward, or book entry. Do not make users race an automatic timer to
read their reward.

## Existing behavior and production gaps

- PR #963 edits a local `plaqueTarget`; persistence is explicitly deferred.
  It also clamps finite targets to 20 in the preview. Therefore its current
  displayed number cannot be treated as an authoritative promise to earn a
  production reward.
- `ReassemblingCard` already animates new credited pieces in place and replaces
  them with a seamless face once settled. It does not lift into an earned-goal
  ceremony. `XpRewardProvider.celebrate` is currently a no-op; it is not a
  suitable canonical goal-award trigger.
- Period goals use successful periods and a presentation-only soft-horizon
  target. A weekly goal with three days per week does not earn one piece per
  checked-off day today. Decide whether the new promise means raw completions,
  successful periods, or a separately saved reward milestone. Use the matching
  noun throughout creation, progress, and celebration.
- The past-goal folio only contains goals whose canonical summary is terminal.
  A recurring goal can earn a plaque and remain active. Choose a home for those
  earned plaques without forcing the goal into Past or silently archiving it.
  This prototype deliberately uses a finite lifetime-total goal.
- Personal reward text is a reminder chosen by the user, not an automatic
  redemption or XP grant. Only show real reward/XP information returned by the
  owning system. Omit that row when no reward exists.

## Proposed production segments after selecting the motion

1. **Canonical earning contract.** Settle units and ongoing-goal behavior. If an
   editable reward milestone is needed, persist and validate it once at the
   canonical write boundary; align preview, progress, and award eligibility.
   Define how edits to an already-progressed goal affect an earned award.
2. **Review choreography.** Extend the shared material/fragment renderer and
   the existing creation review. Preserve stable geometry, truthful counts,
   single-piece behavior, immediate input response, and reduced motion.
3. **Confirmed earned event and ceremony.** Trigger only on the owning system’s
   confirmed unearned-to-earned transition. Deduplicate by durable award/event
   identity; initial hydration, refetch, failed writes, and repeated responses
   must not replay it. Handle linked-goal cascades as an ordered queue, never
   competing dialogs. Undo removes/reconciles state through the existing domain
   path and must not create a second award through presentation state.
4. **Collection handoff.** Mount once at the shell, preserve caller focus and
   context, and animate toward the actual owning collection. Persist the earned
   result independently of animation. Keep an explicit replay in goal details
   if replay is wanted; do not attach a new award to replay.

The longer rare ceremony is an intentional study of an exception to the current
700 ms ordinary XP-flight budget. It is not permission to extend routine
completion animations. A production implementation should also consolidate the
study’s clipped face copies into the shared renderer rather than creating a
second production rendering path.

## Coverage and review

Component coverage is written for review phase order, mid-animation target edits,
1/20 bounds, ceremony phase order, user-held congratulations, skip, close, absent
reward copy, and OS reduced motion. Tests, typecheck, lint, browser checks, and CI
have not been run, following the repository’s explicit verification gate.

Once verification is authorized, inspect 1/12/20 pieces, all three real finishes,
rapid edits/replay, mobile bounds, final seam removal, focus restoration, book
landing, and reduced motion. The study is code-complete, not visually verified.
