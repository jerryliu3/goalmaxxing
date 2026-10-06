# Goal creation study

Route: `/ux/goal-creation` (index) and `/ux/goal-creation/{blank-card,stamp,say-it}`.
Uses the moderator-only UX lab gate. Exploratory, not a product lock. Nothing in
the lab writes data: every draft is local state and "Create goal" ends in a
summary.

## Why

Editing now happens on the goal card (#1118–#1125): the annotated card on wide
screens, the direct card on phones, quieter settings on the card's back, and a
save bar. Creation still runs the Tempo wizard — Start / Intention / Rhythm /
Schedule / Review, about ten decisions beside a passive preview, with controls
that differ from the edit card's. It never asks why the goal matters or what the
reward is, and it doesn't say that the rhythm (type, interval, basis) is the one
choice `update_goal` rejects later.

The study asks: if creating a goal *is* editing a card, what is left to ask?

## Shared rules

- One set of controls. Every concept renders the production `TempoGoalCard` and
  composes `AnnotatedCard` (≥860px) or `DirectCard`, `InlineFact` and `CardBack`
  through a local `CardEditorSession` (`use-draft-goal.ts`). Nothing is forked.
- The rhythm is asked with the production `TempoGoalRhythm`, under a plain
  "You can't change this later" note, and shown as a locked line on the card
  until Create.
- The reward is the existing `reward_text` — no schema change.
- The created card shows a prototype-only "Reward · sealed" mark, overlaid in
  the card's stage; `TempoGoalCard` is unchanged.

## Concepts

**A · Blank card.** Name it on a blank card (the input is set in the card's
title type, where the title prints), then a focused rhythm moment. The card then
fills with defaults — category guessed from the name, medium effort, starts
today, no deadline, any time — and becomes the edit card. The next empty thing
(deadline, time, then the back's Why and Reward) breathes softly, never gates,
and can be skipped. The turn-over button invites "why it matters + your reward".
The review step is gone: the card is the review. Reward: card back.

**B · Stamp by stamp.** One question at a time — name, rhythm, category,
effort, when, why, reward — with a rail of the card's regions. Each answer
stamps onto the region it fills; stamped regions become editable with the
edit card's own controls (callouts or direct controls; unstamped ones have
none yet). The last beat is a sealed envelope: "What's waiting for you at the
end?" with suggestions, then a wax seal lands on the card. Reward: final beat.

**C · Say it.** One sentence ("Run a half marathon by March, 3 runs a week,
then buy a new bike"). A deterministic stand-in parser (keywords and patterns,
no network) fills the card live and says what it read. Then tweak on the edit
card; the parsed rhythm is shown locked (asked if the sentence didn't say), and
the reward is confirmed in a chip — "We'll keep this sealed until you finish" —
that edits with the card back's own reward field. Reward: from the sentence.

## Comparison

| Flow | Steps | Decisions | Reward | Locked | Review |
| --- | --- | --- | --- | --- | --- |
| Today | 5 steps | ~10 | Not asked | Rhythm, unannounced | Read-only labelled card |
| A Blank card | 3 moments | 2 + defaults | Card back | Own moment | None — the card |
| B Stamp | 7 beats | 7 (2 skippable) | Sealed envelope | Rhythm beat | Stamped card |
| C Say it | 2 moments | 1 sentence + confirm | Parsed, chip | Locked line | None — the card |

## Production notes

- `CardBack` now takes an optional `lifecycle`; without it the archive/delete
  footer is hidden (a goal that doesn't exist yet). Editing passes it as before.
- `AnnotatedCard` always locks the start date; creation may want it editable.
- Creation-only hooks (pending facts on the direct card, nudges, stamp
  animations, back-row highlights) are styling on the workbench wrapper, keyed
  off the production components' existing attributes and class names. A ship
  would want explicit props on the card editor instead.
- The parser is a stand-in for the existing AI draft path (`tempo-goal-stack`);
  a real version would need the same "what we read" readback and should ask, not
  guess, the rhythm when unsure.

Functional coverage is included as code (`goal-creation.test.tsx`). Tests,
typecheck, lint and browser checks have not been run; verification remains
approval-gated by AGENTS.md.
