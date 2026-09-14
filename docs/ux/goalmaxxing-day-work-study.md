# Day work study

Status: **Exploratory. Not a lock.** Production Checklist and the Spatial
Plan day list are unchanged.

Clickable study: `/ux/day-work`

## Why this pass exists

Clicking a checklist row today opens an unfold under the item:
title / date / time as input fields, instance chevrons, Lock, and Edit goal.
Two problems:

1. **The goal is missing.** Frequency, period progress, deadline, effort, and
   privacy never appear. You can reschedule a sitting without seeing what the
   commitment *is*.
2. **The view is a form.** Inputs are the base state. That fights the Tempo
   creation card, which treats a goal as a readable object and only asks for
   input when you are composing.

This study asks two questions:

- If we keep the checklist, what should opening a goal feel like?
- If we do not keep the checklist, what else could hold today’s work and still
  be easy to scan, complete, and change?

## Product facts the shells must show

Every inspect and replace concept is seeded with the same Thursday
(3 September 2026):

| Work | What you should be able to see |
|---|---|
| Tempo run | 3 days a week, until Dec 31, 7:30 AM, 1 of 3 this week, Health, steady |
| Launch notes | One sitting, due today, 11:00 AM, Career |
| Weekly reset | Once a week, no end date, any time |
| Review offer | One sitting, unplaced, private, heavy |
| Strength | 2 days a week, until Oct 15, unplaced from Tuesday |
| Deep work | Every day, 6:30 AM, done, locked |

Completing and opening stay separate. Editing is local and disposable — these
are interaction hypotheses, not planner mutations.

## Research (steal the decision, not the skin)

| Source | Decision we steal | What we reject |
|---|---|---|
| **Tempo creation card** | A goal has a face: cadence number, wash, title, horizon, effort. Inspect should look like the object you just made. | Rebuilding the whole stepped creator inside Checklist. |
| **Linear Peek** | Inspect without leaving the collection. The list remains. | Keyboard-only peek as the only entry. |
| **Things 3 / Superhuman** | Language as the control. Tap a phrase; the rest stays prose. | Making every fact a labeled input. |
| **Gazetteer lock** | Newsreader + stamp + paper for pride and editorial density. | Turning the day into a dashboard of chips. |
| **Relay (first principles)** | One commitment at full strength, with the rest of the day still shaped. | Hiding the day behind a single hero with no path. |

## Concepts

### Family 1 — Keep the checklist

| # | Name | Thesis |
|---|---|---|
| 00 | **Now** | Live control. Form unfold. Comparison only. |
| 01 | **Folio** | The row unfolds into a compact Tempo card. Facts are type; tap to edit. |
| 02 | **Phrase** | Opening writes one sentence. Tap a phrase to change only that phrase. |
| 03 | **Peek** | List stays compact. The living Tempo card arrives beside it (sheet on a phone). |

### Family 2 — Replace the checklist

| # | Name | Thesis |
|---|---|---|
| 04 | **Deck** | Today is a hand of Tempo cards with an honest spine of titles. |
| 05 | **Gazette** | Today is a newspaper spread. Articles expand; a stamp marks done. |
| 06 | **Stations** | The day is a timed path. Anytime work is an island, not a lesser row. |

## Visual bets

- **Read first.** Base inspect is prose or the Tempo object, never a fieldset.
- **Touch the fact.** Title, cadence, deadline, sitting, time, effort, and lock
  are tappable. Choices are chips. The control disappears when you are done.
- **Creation and inspect share a face.** Folio, Peek, and Deck reuse the Tempo
  card language (and Peek/Deck reuse the production `TempoGoalCard`).
- **Gazetteer for the non-card day.** Phrase, Gazette, and Stations use
  display type and stamp rust instead of inventing a third card system.
- **Complete is a mark.** Nest/stamp/station fill — not a primary button in
  the inspect chrome.

## Out of scope

Planner persistence, linked-goal graphs, quotas, regeneration, Duo, and
production `AppShell`. Do not import these shells into live Checklist.

## How to look

1. Open Tempo run. Confirm cadence, deadline, time, and period progress are
   visible without entering Edit goal.
2. Tap a fact, change it, watch it settle back into language.
3. Complete from the mark and confirm the inspect surface did not steal that
   action.
4. Walk Now → Folio → Phrase → Peek to compare inspect. Then Deck, Gazette,
   Stations to compare holding the day.
