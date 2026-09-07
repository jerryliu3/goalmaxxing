# Goalmaxxing first-principles interface study

Status: **divergent exploration, not a product lock.**

Clickable study: `/ux/first-principles`

This work does not replace the existing application directions or prototypes.
It asks an earlier question: if planning, completion, recovery, progress, and
social accountability were the only fixed inputs, what interface systems might
we invent?

## Honest answer about the earlier three directions

Today Home, Spatial Plan, and Progress Pulse were useful information-
architecture forks. They varied the primary object and first question:

- What should I complete today?
- Where does work sit in time?
- How am I doing?

They did **not** fully explore the primitive layer. All three largely retained
rows, pills, small completion controls, destination tabs, sheets, cards, and
familiar calendar/list boundaries. That made them practical and comparable,
but it constrained the search space before we had tested whether those
primitives were right.

The new study varies the interaction grammar itself. It does not assume:

- an item is a pill, card, or row;
- completion is a checkbox;
- calendar and checklist are separate screens;
- navigation is a bottom tab bar;
- social is a destination;
- progress is a dashboard or heatmap;
- mobile is a stack and desktop is a wider stack.

## Product behavior that remains fixed

The concepts may radically change representation, but they must preserve:

1. **Time placement.** Work can be placed on exact dates, moved, left
   unplanned, and recovered later.
2. **Draft integrity.** Planner changes have an explicit saved state, undo,
   and a non-drag alternative.
3. **Truthful completion.** Completion is date-specific, reversible where the
   product allows it, and distinct from simply moving an item.
4. **Goals and tasks.** Recurring goals and one-time tasks remain different
   domain objects even if they share a surface.
5. **Calm recovery.** Missed or unplanned work is a replanning condition, not
   failure, debt, or a threatened streak.
6. **Useful people.** Partner, team, challenges, and leaderboards can help
   action, but the product does not need an ambient activity feed.
7. **History.** Users can inspect aggregate and per-goal evidence, including
   completions on unscheduled days.
8. **Agency and access.** Gestures always have named button, keyboard, and
   screen-reader equivalents. Reduced motion keeps state changes legible.

## Axes varied independently

The concepts deliberately separate choices that are often bundled:

- **Primary object:** goal body, time current, active commitment, living page.
- **Navigation:** zoom, scale/scrub, context doors, page-edge index.
- **Completion:** circumference fill, threshold crossing, press-and-hold ring,
  physical stamp.
- **Calendar:** concentric scales, continuous current, route map, month folio.
- **Social presence:** neighboring orbit, parallel current, companion door,
  margin annotation.
- **Progress:** settled bodies, completed shore, trace, accumulated stamps.
- **Desktop:** expanded spatial field, wider current, stage plus context,
  two-page spread.

## Direction 01 — Orbit

**Thesis:** Goals exert gravity; the calendar is a navigable field around now.

Items are circular bodies rather than pills. The selected body moves to the
center and its circumference becomes a large completion action. Pulling back
changes temporal scale from now to week to month without changing destination.
Partner activity appears as a neighboring orbit. Recovery swings an unplaced
body into another date arc.

This direction tests direct spatial manipulation and whether progress can be
embedded into the same object instead of sent to a dashboard.

Primary risk: exact dates and dense schedules can become harder to scan.

## Direction 02 — Tide

**Thesis:** Time is a current; work lands, moves, and clears across one
continuous surface.

Work is a rectangular time band. It crosses a live “now” line, can be moved
upstream or downstream, and completes by sweeping across a shore. Day, week,
and month are scales of the same current, not tabs to different products.
Unplanned work waits in an eddy. Partner activity is a neighboring current.

This direction tests whether calendar and checklist can become one continuous
temporal interaction.

Primary risk: flexible work has no natural duration or vertical position.

## Direction 03 — Relay

**Thesis:** Show one commitment at full strength, then hand off to the next.

The active commitment owns the stage. A large press-and-hold ring is the
completion control. A compact route indicates what came before and what comes
next. Calendar, people, and progress arrive through context doors around the
stable stage instead of persistent destination tabs.

This direction tests a focus-first system that is neither checklist-first nor
status-first: the core object is the commitment currently in hand.

Primary risk: focus can conceal the shape of a busy day and make rapid batch
editing slower.

## Direction 04 — Fieldbook

**Thesis:** Planning, doing, people, and history are annotations on one living
page.

The calendar is a month folio facing a dated log. Items are lines of writing,
not containers. Completion applies a conspicuous stamp that remains as
evidence. Unplanned work lives visibly in the margin. Partner and team context
are annotations beside relevant work. A page-edge index provides direct access
without a conventional app tab bar.

This direction tests whether one durable, legible artifact can replace layers
of application chrome.

Primary risk: the analog metaphor may resist high-volume planning and advanced
filters.

## Contemporary reference lessons

These are lessons, not visual recipes:

- **Tiimo** (Apple’s 2025 iPhone App of the Year) makes time visible, supports a
  pinch between summary and detailed timeline, and uses gentle contextual cues
  rather than demanding repeated app navigation.
- **Flighty** demonstrates one-object hierarchy and context-sensitive “smart
  states”: the most useful information changes as the moment changes, while
  deeper data remains available.
- **Gentler Streak** treats rest and recovery as valid states and avoids
  turning continuity into guilt.
- **Superlist** shows how one flexible content grammar can unify tasks, notes,
  and collaboration without making every capability a separate product.
- **Partiful** behaves as social utility rather than social media: small,
  contextual interactions support real activity without requiring a feed.
- **Apple Design Award interaction work** such as Feather, Taobao, and iA
  Writer demonstrates direct manipulation, spatial comparison, and focused
  platform-specific controls.

Sources:

- [Apple 2025 App Store Awards](https://www.apple.com/newsroom/2025/12/apple-unveils-the-winners-of-the-2025-app-store-awards/)
- [Apple Design Awards 2025](https://developer.apple.com/design/awards/2025/)
- [Apple Design Awards 2023 — Flighty](https://developer.apple.com/design/awards/2023/)
- [Tiimo product](https://www.tiimoapp.com/product)
- [Partiful on building social utility](https://partiful.com/blog/post/bts-building-boops-dms)
- [Superlist mobile interaction guide](https://help.superlist.com/en/articles/40689-get-to-know-superlist-for-mobile)

## Fair comparison

Every concept uses the same seeded Thursday:

- Tempo run at 07:30;
- Launch notes at 11:00;
- Review offer flexible and unplanned;
- Strength missed Tuesday and waiting for recovery;
- Deep work already complete;
- seven of ten completions this week;
- Maya completed Yoga at 08:12.

Test each concept on phone and desktop. Do not ask which one looks most novel.
Ask:

1. Is the next action understandable without instruction?
2. Can a user complete and reverse completion confidently?
3. Can they place and move exact-date work without losing draft/save truth?
4. Is unplanned work recoverable without shame?
5. Does partner context help without becoming a feed?
6. Can someone inspect the week and longer history?
7. Do gesture, keyboard, reduced-motion, and screen-reader paths have parity?
8. Does desktop recompose around the concept’s object?

No direction should be selected until the interactions, not screenshots, have
been compared against this rubric.

## What this study does not do

- It does **not** unlock production `AppShell` or replace Spatial Plan.
- It does **not** restyle `/ux/concepts`. Those sketches remain the IA lock
  gallery.
- It does **not** apply Gazetteer, Nest, or Col as visual systems.
- It does **not** invent new completion or planner APIs. Seeded Thursday data
  is enough to argue the interaction.

## Accidental traps a concept can still violate

Even a radical interface is invalid if it:

- Completes work by moving it, or moves work by completing it.
- Makes unplanned items invisible until they become scheduled.
- Turns recovery into a missed-streak threat.
- Makes the partner lane editable.
- Hides exact dates behind a gesture with no menu or keyboard equivalent.
- Treats tasks and recurring goals as the same object.
- Requires a feed to make social presence useful.
- Stretches a phone layout and calls it desktop.

## Deferred, not discarded

A fifth system — **intent-assembled UI** (the current screen is generated for
this moment, as in Liquid / GenUI work) — was not prototyped. Goalmaxxing
needs a stable daily object a person can reopen tomorrow. Generative layout
is a later overlay, not a replacement for a durable calendar, completion
mark, and recovery path.

## Files

- Clickable gallery: `src/app/ux/first-principles/` and
  `src/features/ux-first-principles/`
- Isolated worktree: `.worktrees/first-principles` on
  `ux/first-principles-lab`
- Local preview: `http://localhost:3012/ux/first-principles`
