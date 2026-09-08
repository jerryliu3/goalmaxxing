# Achievements destination study

Status: **exploratory concepts only — no lock.** Production `/achievements`
remains the two-card list (global XP awards + achieved goals).

Clickable study: `/ux/achievements`  
Worktree: `.worktrees/achievements-ux` on branch `ux/achievements-study`

## Why this pass exists

Live Achievements is a bounded data dump: scrollable rows inside cards. It
carries the product facts (XP level awards from `user_awards`, finished goals
with reward text) but nothing says *trophy, pride, collection*. Progress and
Community already got destination-quality concepts; Achievements still reads
like a settings subsection hung off the XP chip.

This study asks: **what if the page felt like a place you would show someone?**

## Research (steal the decision, not the skin)

| Source | Decision we steal | What we reject |
|---|---|---|
| **Duolingo Awards (2023)** | Split *Personal Records* (early wins / bests) from *Awards* (long-horizon milestones). Day-one unlocks matter for retention. | Owl green, chests, guilt streaks, chunky 3D buttons. |
| **Apple Fitness rings** | One glance of *completion* before any inventory. Rings close; detail waits. | Watch-sport skin; fifteen activity states. |
| **Strava** | Pride from a chromatic object and local wins — not a global badge dump. | Becoming a GPS app; orange identity. |
| **Letterboxd / Polarsteps** | Editorial frames and “I can hold the journey” — awards as hung objects / chapters. | Cinema-lobby acid green as default. |
| **Habitica / raw PBL** | — | RPG HP punishment, inflationary badges, leaderboard-as-default. |
| **UI Achievements pattern** | Distinct iconography; show earned *and* remaining; social proof only when peer-local. | Fake unlocks; vanity badges for opening the app. |

Goalmaxxing already forbids streak-punishment ethics. Gazetteer stamp / sage /
gain / copper carry tier and category — not purple-glow game UI.

## What it must keep

- Global XP awards (level unlocks from `xp_rewards` / `user_awards`)
- Goal achievements (outcome = achieved, date, optional reward text)
- Revoked / locked future awards as honest state (no fake unlocks)
- Bounded snapshot honesty when the API truncates

## Concepts

| # | Name | Thesis | Research root |
|---|---|---|---|
| A1 | **Case** | Lit trophy case: pedestal hero, medal shelves, goal plaques. | Customizable trophy display / status object |
| A2 | **Vault** | Sealed compartments — locked dark, unlocked lit and tactile. | Precious unlock; progress as claimed capacity |
| A3 | **Gallery** | Snap-scroll framed posters + certificate rail. | Letterboxd / Polarsteps “hung” journey |
| A4 | **Records** | Personal Records band above an Awards grid. | Duolingo 2023 Records / Awards split |
| A5 | **Rings** | Three completion rings first; inventory second. | Apple Fitness glance-then-detail |

None is locked. Judge craft (graphics, color, iconography) and how proud the
first viewport feels.

## Visual bets

- More mark than chrome: each award needs a drawable object (medal, seal,
  frame, ring), not a title + badge row.
- Color carries tier and category (Gazetteer stamp / sage / gain / copper).
- One composition first: featured unlock, vault fill, poster stage, records
  band, or rings — before the inventory dump.
- Motion is presence (shelf light, vault unseal, poster snap, ring settle) —
  not confetti spam.
- Locked slots stay visible so the set articulates what is still possible.

## Out of scope

Production Achievements ship, XP formula changes, new reward types, and
replacing Progress Atlas/Pins or Community Club locks.
