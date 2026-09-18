# Goal card reward transformations

Exploratory route: `/ux/brand/card-rewards`. Linked from the material study and
brand gallery, behind the existing UX lab access boundary. No production goal
writes, reward eligibility, or achievement persistence changes.

Use the actual Tempo goal card, material styles, solid body, and pose/lighting
hook. Keep the comparison brief: one goal, finish, reward, and credited-unit
counter control every treatment.

- **Illuminate:** brightness increases; the selected finish stays colored.
- **Transmute:** grey becomes the selected finish's color. No intermediate hue
  or material switching.
- **Illuminate + Transmute:** brightness and saturation increase together.
- **Reassemble:** a faint outline receives newly earned fragments thrown in from
  alternating directions. Landed pieces remain in place and carry the same
  extruded solid body as the finished card, so a tilt shows thickness on each
  shard. After the final piece lands, replace the entire fragment/outline layer
  with the unclipped material card and solid body; no seams or cracks remain.
  Reduced motion fuses immediately. The empty ghost shell stays a flat outline.

Reassemble uses one piece per credited unit up to 24 pieces. Above that cap,
piece `i` (one-based) arrives at `ceil(i * target / pieceCount)`. Groups differ
by at most one completion and the final threshold always equals the target.
Deterministic polygon partitions and a scattered acquisition order keep the
shape stable without resembling a left-to-right fill. The cap is a study choice.

At completion the filters are neutral, preserving the material exactly. Still
mode and OS reduced motion show the same states without animated transitions.

Finite samples take their target from the comparison. The open-ended sample
keeps its three-days-per-week cadence and earns a reward after the selected
number of successful weeks, accumulated without a streak. The study simulates
credited units; production eligibility remains owned by the goal domain.

Functional coverage is included as code. Tests, typecheck, lint, browser checks,
and CI have not been run; verification remains approval-gated by AGENTS.md.


## Application placement: quest and library

Reassemble now decorates the production material card in the expanded Plan quest.
It uses canonical overall credited units for milestone and lifetime-target goals,
not the selected day's completion or cadence hit rate. The same presentation is
used in the Goal Library's Current collection, including upcoming and unscheduled
goals. Plan's Goals link opens Current; Past keeps the existing yearly folios.
Canonical terminal status moves goals out of Current, and rewards remain readable
in the past-goal reader.

Saved fragments appear immediately when opening a card and keep their extruded
thickness while incomplete. New confirmed credits animate into place; undo
removes the corresponding pieces. The 24-piece cap and rounded thresholds are
shared with the study. After the final landing all fragment layers disappear,
leaving PR #950's material face and solid body unchanged.

Ongoing cadence cards use a presentation-only artificial shard target: count
full periods from start through the goal's end date (or start + ≈62 days when
open-ended), take 90% rounded, and clamp to 1–20 successful periods. Credited
successful periods drive the shards; domain achievement is unchanged. Configurable
reward milestones for ongoing goals remain deferred.
