# Goalmaxxing — Create, Remember, Grow

Status: **interactive exploration, September 12, 2026**. This study deepens
Tempo, Weave, and Script without changing production UX or existing study locks.
Entry: `/ux/journeys`. Canonical source: `src/features/ux-journeys/`.

The user confirmed that time of day should be optional under scheduling.
Categories are required in the prototype. Start date defaults to the user's
local today, with a change control under scheduling. No time-spent or duration
model is introduced.

## Nine explorations, three coherent families

| Family | Create            | Remember       | Grow     | Central design bet                                                                     |
| ------ | ----------------- | -------------- | -------- | -------------------------------------------------------------------------------------- |
| Tempo  | Commitment studio | Victory ledger | Momentum | Make a commitment tangible, then keep a legible receipt of the work.                   |
| Weave  | Rhythm loom       | Woven history  | Rhythm   | Let people recognize the pattern they are building and the work already woven into it. |
| Script | Living brief      | Chapters       | Form     | Turn intention into explicit language, and progress into a story grounded in records.  |

These are three presentations of the same configuration contract, six history
surfaces, and one score hypothesis. Holding capabilities and calculation constant
makes the visual comparison useful. They are not nine unrelated new products.

### Tempo: commitment, receipt, instrument

Creation has an editorial pace: a single question, a compact set of choices,
and a live commitment receipt. Large target numerals make a weekly count or
lifetime target concrete. The receipt changes with the form and remains visible
through review. The orange object connects the creation invitation to the dialog.

Victory ledger gives completed work a positive mark and keeps the name readable.
It avoids a strikethrough that visually cancels the thing someone worked toward.
The goal achievement seal is quieter than a trophy screen but more meaningful
than simply fading the row. In dense calendar views, exact names live in the
inspection record.

Momentum is a number, a segmented scale, and an explicit trend. This is the most
instrument-like score treatment. A forecast shows the effect of a changed rhythm;
a permanent record underneath makes clear what will not decay.

**Strength:** the clearest entry point and most scannable score.
**Tradeoff:** the setup has some ceremony; the score can become the thing people
optimize if the surrounding language overemphasizes its number.

### Weave: thread, pattern, continuity

Creation keeps an emerging thread beside the choices. Its pattern becomes denser
as the target changes; the caption explicitly says it is illustrative. It does
not silently promise particular weekdays or generate a rigid schedule.

Woven history turns completed sessions into knots in the goal's lane. The lane
continues to exist when its goal ends, while an achieved seal records whether the
target was met. An outline still means planned work. A filled check means recorded
work. Goal dates alone never convert an outline into a completion.

Rhythm puts the same score inside a circular measure, next to the weekly returns
that explain it. The circle describes the current 0–100 score, not a daily quota.
The exact trend and simulator remain available underneath.

**Strength:** a strong connection between recurring effort and accumulated work.
**Tradeoff:** weekly lanes retain horizontal scrolling on phones; the daily and
checklist views are the compact alternative. Pattern density must not masquerade
as exact scheduling.

### Script: intention, chapter, reflection

Creation is a guided brief. A living sentence incorporates the title, target,
frequency, and horizon as they become explicit. The sentence is backed by ordinary
controls for exact values and an editable final receipt.

Chapters gives past goals a dated, readable place in someone's story. Achieved,
ended, and archived chapters use distinct language. An unfinished summer reading
goal can say “eight books read” without awarding the four missing books or
turning the page into a failure report. A chapter opens into the exact totals.

Form leads with an interpretation (“steady”), followed by the exact score and
its evidence. The typography makes the number feel like useful context for a
reflection. Decay is described as a changing current state rather than a loss of
identity or a revoked lifetime level.

**Strength:** warmest interpretation of past work and return after time away.
**Tradeoff:** language needs an exact receipt nearby; elegant prose can otherwise
hide assumptions about target basis, dates, or what a score measures.

## Creation: full setup without one large form

The five-step structure is shared across concepts:

1. **Approach:** one goal by hand or an assisted draft set.
2. **Intention:** name, mandatory preset/custom category, optional description.
3. **Shape:** recurring goal, milestones, or a one-time Planner task.
4. **Schedule:** end/completion date, optional start-date override and time; advanced settings.
5. **Review:** inspect all values, edit individual drafts, remove unwanted drafts, add to the study plan.

| Production capability                                 | Location in all three concepts                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| Single / LLM-assisted entry                           | Approach. Assisted branch supports multiple editable drafts.               |
| Name and category, including custom category          | Intention. Required before moving forward.                                 |
| Description                                           | Intention, optional “why”.                                                 |
| Recurring / milestones / Planner task                 | Shape. Task destination is disclosed.                                      |
| Daily / weekly / monthly                              | Shape for recurring goals.                                                 |
| Distinct days per period / lifetime completion target | Shape, explicit target-basis control.                                      |
| Milestone count and individual milestone names        | Shape, names in an optional disclosure.                                    |
| Start date                                            | Defaults to local today; scheduling disclosure exposes exact date.         |
| End date / completion date                            | Schedule; optional open horizon remains supported.                         |
| Time of day                                           | Optional scheduling disclosure, with a clear action.                       |
| Difficulty                                            | Advanced settings.                                                         |
| Goal linking                                          | Advanced; sample main-goal choices, cascade meaning explained.             |
| Privacy                                               | Advanced; team scope disables personal privacy selection.                  |
| Team context                                          | Advanced; sample team, clears incompatible personal link/privacy settings. |
| Color                                                 | Advanced; defaults follow the selected category.                           |
| Achievement reward                                    | Advanced; retained in review and the created study record.                 |
| Editable batch review                                 | Review, with navigation back through the same full form per draft.         |

The app's `GoalFormState`, category catalogue, type/frequency options,
`applyGoalCreationFieldChange`, and `validateGoalCreationFields` are reused.
The study does not implement a second production writer or a second validation
policy. It has no Supabase calls, production mutations, or LLM requests.

The assisted branch is explicitly a **simulated AI journey**. Every nonempty input
line becomes a draft; defaults are disclosed before editing. It does not pretend
to interpret arbitrary language. Real parsing, model errors/retries, import files,
and bulk-write recovery stay with the existing production flow. This round tests
setup and review interaction, not a new AI service.

Drafts survive closing and switching concepts within the page. Discard resets
the draft. Created records remain inspectable in the study plan until reload.
This is not durable storage. Sample history and the score illustration are not
updated by creating a goal: an intention is not a completion.

## History: keep the evidence, tell the truth

Two independent concepts must remain legible:

- **Session state:** completed, planned, or absent. The completion date belongs to
  the event, not to the date on which the goal eventually finished.
- **Goal lifecycle:** active, achieved, ended before its target, or archived by
  the user. A closed goal may contain many completed sessions without having
  achieved its overall target.

Each family has working Day, Week, Month, Checklist, Progress, and Goals controls.
Day and Checklist reduce completed work to an expandable summary. Week preserves
filled completion marks alongside outlined future work. Month uses compact marks
that open a record. Progress shows earned counts against the target. Goals offers
status filtering and complete records. Opening a session shows its own completion
date as well as the goal's achievement date.

The sample includes two achieved goals, one ended goal (8/12), and one archived
goal (16/30). The 53 recorded completions across these closed goals are retained.
There is no “everything before today is complete” inference, faded unreadable
text, or implied accomplishment for unperformed work.

**Working recommendation:** adopt the positive, readable completion mark across
views; test Tempo's compact record against Script's richer goal-history chapters.
Keep Weave's knots specific to layouts where the goal lane is already useful.
These are study recommendations, not approved production changes.

## Score: a current condition, with lasting achievements beside it

A score can decay; a lifetime accomplishment should not. Use **Momentum / Rhythm /
Form** as alternate labels for a current effort measure. Avoid calling it a
permanent “level” if it can fall. Earned achievements remain separate.

[Garmin describes Endurance Score](https://www.garmin.com/en-GB/garmin-technology/running-science/physiological-measurements/endurance-score/)
as a way to relate training and current endurance. The transferable idea here
is an understandable current state with inspectable evidence, not physiological
validity. [Intervals.icu exposes its fitness/fatigue averaging factors](https://forum.intervals.icu/t/change-fatigue-atl-and-fitness-ctl-factors/300),
which supports making smoothing understandable and testable. The formula below
is an original product hypothesis rather than a reproduction of either metric.

For day t:

```text
weights: easy = 0.75, medium = 1.0, hard = 1.5
credits[t] = min(3, sum of weights for credited completions that day))
r = 2 ^ (-1 / half-life)
score[t] = r * score[t-1] + (1-r) * 100 * credits[t] / 3
```

The initial score is zero. The prototype's half-life defaults to 28 days; the
study control also offers 14 and 42. A 28-day half-life retains about 97.6% of
the prior score on an inactive day, 84.1% after one inactive week, and 50% after
four. All calculations retain precision; the screen rounds to one decimal.

The illustration includes 12 weeks of five active days, two medium completions
per active day: 120 completions, including work outside the closed-goal history.
It reaches 40.6 at the default half-life. An eight-week break projects 10.2;
continuing at five active days and two medium completions projects 46.4. The
forecast distributes those active days through each week.

Frequency enters through **actual completed work across days**. Raising a goal's
planned frequency earns nothing. Difficulty changes credit per completion. The
daily cap limits the value of cramming or splitting work into many tiny tasks.
More effort helps up to that cap; more active days create more opportunities to
build the score. There is intentionally no hard streak reset.

This is absolute recorded effort, not adherence percentage. Someone who perfectly
meets a monthly goal can have a lower current score than someone who works daily.
Their goal achievement still counts in full. That tradeoff needs user validation.
A separate adherence meter is a possible alternative if this feels unfair; do
not quietly mix it into the score and make the number impossible to explain.

The simulator exposes active days, completions per day, difficulty, time away,
and half-life. “Keep my rhythm”, “Take a break”, and “Return gently” make those
scenarios immediately comparable. History and forecast use the same selected
half-life. The projected line is labelled as a scenario, never a prediction.

Before production adoption, settle:

- Which completion facts count: goal days, individual milestones, and one-time
  tasks need explicit weights and caps. This demo starts from aggregate counts.
- Linked parent/child cascades must count the underlying effort once, not award
  duplicate credits for one action.
- Snapshot difficulty at completion and replay edited/retracted facts
  deterministically. A later setting change must not rewrite historical effort.
- Use local date boundaries consistently; ignore future completions for current
  score. Score history must not change when a planner month is toggled.
- Calibrate weights and half-life against realistic low- and high-frequency
  patterns. Test rest, holidays, return after absence, and people new to the app.
- Self-rated difficulty and task splitting can still be gamed. The daily cap
  limits their effect; it does not make this suitable for a competitive leaderboard.

## Walkthroughs for comparison

1. Create a weekly Health goal with 24 lifetime completions. Set a completion
   date, optional 07:30 time, hard difficulty, a parent link, privacy, and reward.
   Review, edit, and add it. Switch families and inspect the same created record.
2. Choose assisted entry. Review two drafts, turn one into named milestones,
   edit the second independently, and remove/add a draft before saving.
3. Create a one-time task and confirm that it keeps its task date and destination.
4. In Remember, inspect a September 7 session whose goal was achieved September 10. Filter Goals to Ended and open the 8/12 reading record.
5. In Grow, try Keep my rhythm, Take a break, and Return gently. Compare 14, 28,
   and 42-day half-lives, then switch concepts without changing the scenario.

## Delivery and checks

The route inherits the existing moderator gate and no-index UX metadata.
Production routing, writes, score logic, and app chrome are unchanged.

```sh
node scripts/build-journeys.mjs
python3 -m http.server 4318 --bind 127.0.0.1 --directory /private/tmp/goalmaxxing-journeys/dist
pnpm exec vitest run src/features/ux-journeys
pnpm exec tsc -p src/features/ux-journeys/tsconfig.json
pnpm exec eslint src/features/ux-journeys src/app/ux/journeys/page.tsx src/app/ux/page.tsx scripts/build-journeys.mjs
```

Eleven focused tests cover all three creation treatments, assisted milestone review,
task creation, invalid dates/targets, lifecycle filters, session-vs-goal dates,
and score decay/capping/effort response. The standalone build uses installed
React/Radix/esbuild; it contains no environment files or authenticated data.

Repository-wide `pnpm typecheck` and `pnpm lint` were attempted. They are blocked
by existing errors outside this study, including `plan-view-morph.test.ts`,
`app-boot-splash.tsx`, generated artifacts, and `worktrees/ux-theme-atmospheres`.
Focused study checks are the handoff gate. Browser checks cover desktop creation
and history, plus phone-size layout and score interaction. This does not claim
cross-browser or production end-to-end certification.

A self-contained copy is available at
`artifacts/ux-journeys-2026-09-12/journeys.html`. The build script also writes
`journeys.html` beside the normal JavaScript/CSS preview assets.
