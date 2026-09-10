# Goalmaxxing Interaction Lab

Five interaction systems for a product that keeps its calendar, flexible planning, varied goals, completion history and social participation. This is a divergent study, not a decision to replace the production application or the earlier design locks. Desktop and phone receive equal priority.

The strongest opportunity is to make a consequential action feel unusually clear: seeing a date open, carrying several items to a new place, moving through a long collection without losing position, or watching a goal combination reveal a pattern. Visual identity should reinforce those actions. It should not make a familiar task require learning an elaborate metaphor.

## Product foundation

The product’s source distinguishes recurring goals, fixed milestones and one-time planner tasks. Recurring goals can have daily, weekly or monthly cadence, with period or lifetime targets. A completion is a dated record; a planned item is a placement. A goal can also carry category, privacy, difficulty, reward, dates, team association and linked-credit relationships. The interaction study keeps these distinctions visible instead of converting every object into a duration-based calendar event.

The earlier Next Wave study is useful as a set of component and atmosphere references. Its follow-up correctly identifies that several directions varied presentation more than behavior, and that duration assumptions were not faithful to the product. This round consequently begins with operations and state, then gives each operation an expressive physical arrangement. The calendars remain exact-date calendars. No new energy, readiness or productivity score is introduced.

The canonical production references inspected were the goal types and creation fields, planner and completion surfaces, Insights filtering and selectors, and Community’s teams, challenges and leaderboards. The previous experience guide supplies the central requirements: preserve context, show state, support recovery, and recompose for phones. The new study is isolated under `/ux/interaction-lab`; the existing moderator gate still applies to that application route.

| Capability | Study treatment | Production adoption requirement |
| --- | --- | --- |
| Month, week, day | Exact date controls, period navigation, stable selected date | Retain production calendar preferences, timezone and eligibility |
| List | Dated weekly agenda; Index also has goal-specific future occurrences | Preserve Checklist’s broader eligibility and unplanned work |
| Moving work | Individual moves, drag on desktop, named date-input alternative, review, cancel, undo | Use the canonical planner mutation and stale-write checks |
| Goal types | Recurring cadence, lifetime targets, named/reordered milestones and tasks | Use canonical schemas and database-enforced target limits |
| Goal details | Privacy, category, dates, difficulty, reward, team, linked goal | Keep authorization and linked-credit rules at their existing boundaries |
| Progress | Goal combinations, monthly records, comparison table, daily inspection | Preserve production aggregates, year analysis and supported history corrections |
| Social | Seeded team summaries, team goal, optional challenge, leaderboard visibility | Preserve real membership, cohort eligibility, sharing and Duo contracts |

This is interaction fidelity, not a duplicate implementation of the production planner. Automated scheduling, quotas, regeneration, notifications, imports, account settings, real memberships, the full linked-goal graph, and production persistence are not simulated. Their contracts are retained as integration requirements rather than silently redesigned.

## Research findings and transferable patterns

### 1. Inspect without leaving

Linear’s Peek lets someone inspect an issue or project while retaining the surrounding list, and move through adjacent objects while that preview updates. The documented entry is a keyboard shortcut. The transferable idea is continuity between a collection and its detail; the shortcut itself is insufficient as the only entry on a phone. Index uses visible rows and a persistent detail area on desktop, with an explicit return to the retained index on mobile. [Linear, Peek preview](https://linear.app/docs/peek).

Fold applies the same continuity principle to time: the selected date opens into its work inside the month. The design hypothesis is that this reduces the mental work of finding one’s way back after checking an item. That hypothesis still needs observation, especially when expanding a later calendar row shifts content vertically.

### 2. Make groups as easy to manipulate as individuals

Things documents insertion at a chosen location, multiple selection and moving a group of to-dos. The interesting quality is the correspondence between what is selected and what moves, not a particular rounded card style. Switchboard makes this correspondence explicit with a retained selection area and an exact before/after review. [Cultured Code, Things features](https://culturedcode.com/things/features/).

Figma’s selection documentation describes selecting ranges and matching objects. This illustrates how powerful selection can be when its scope is intelligible. Goalmaxxing should borrow visible group membership, but avoid importing a professional editor’s shortcut burden into routine personal planning. [Figma, Select layers and objects](https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects).

A move should not require sustained pointer precision. W3C’s dragging criterion requires a single-pointer alternative that avoids dragging, independently of keyboard access. Every draggable item therefore also has a labeled Move action and date control. Switchboard’s two-stage mobile path is a first-class interaction, not an accessibility footnote. [W3C, Understanding SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

### 3. Give one set of objects several useful views

Notion Calendar documents connecting database items to a calendar and managing a database through a list panel, including finding items without dates. That is a useful precedent for treating an unplanned list and calendar as views of connected records. It does not establish Goalmaxxing’s scheduling or completion semantics. The study uses one plan state across its calendar, list, index and move controls. [Notion, Use Notion Calendar with Notion](https://www.notion.com/help/use-notion-calendar-with-notion).

Ableton’s Session View provides a contrasting reference: clips occupy an organized grid whose rows and columns support distinct operations. The useful design question is whether spatial organization makes a group easier to understand and act on. The metaphor stops there. Goals are not clips to launch, and calendar days must not become ambiguous performance slots. [Ableton, Session View manual](https://www.ableton.com/en/manual/session-view/).

### 4. Let collections become navigable, not merely longer

Are.na describes a channel index grouped alphabetically and lightweight personal taxonomies that emerged from how people organized collections. This shows the value of an index that remains useful as a collection grows. Index brings category jumps, compact density, alphabetical sorting, search and a stable detail relationship together. It does not require people to invent symbols or maintain a second filing system. [Are.na, Creating personal taxonomies](https://help.are.na/docs/guides/creating-personal-taxonomies).

Twenty-four named goals are enough to exercise scrolling and grouping in this prototype, but not enough to prove large-scale performance. A production test should include 100–300 active and ended goals, unusually long names, mixed categories and a user’s actual vocabulary. Virtualization is not proposed until profiling shows that ordinary grouped rendering is insufficient.

### 5. Expose the effect of a filter while it is being built

Shneiderman’s information visualization work describes overview, zoom/filter and detail inspection as related tasks. Lens takes this as a design framework: the goal selection and its result remain visible together, and the user can inspect the records behind the result. This is an application of a longstanding interaction principle, not evidence that the particular prototype will improve retention or accuracy. [Ben Shneiderman, The Eyes Have It, 1996](https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf).

Lens separates two questions that a generic multi-select often conceals: “show these goals” and “show the dates on which all these goals occurred.” It offers any/all matching with a visible explanation. Calendar matching uses planned occurrences; history matching uses completed records. Identical goal selections can therefore produce different shapes, correctly.

### 6. Group form questions by decisions, not by an arbitrary one-question rule

Typeform supports both individual question pages and multiple related questions on one page. Its documentation cautions against overloading a grouped page. The lesson is to group information that helps someone make one decision: cadence and target belong together; title, goal type and privacy do not need equal attention at every moment. [Typeform, Multiple questions on a form page](https://help.typeform.com/hc/en-us/articles/38099463383188-How-to-add-multiple-questions-to-a-form-page).

Fold, Switchboard and Glide use intention → shape → details → review. Index and Lens offer an in-page blueprint with a live summary and a final review. The guided path tests reassurance and orientation; the blueprint tests faster editing and visible consequences. Both use the same draft fields and creation model, so the comparison does not conceal differing feature support.

### 7. Make social participation finite and explicit

Airbnb’s host tools illustrate task-oriented destinations: current activity, a calendar and listing details remain distinguishable even within a cohesive application. Goalmaxxing benefits from a similarly legible distinction between planning, goal definitions, evidence and people. The prototype does not collapse everything into one ambient dashboard. [Airbnb, Exploring your hosting tools, December 10, 2025](https://www.airbnb.com/resources/hosting-homes/a/exploring-your-hosting-tools-738).

Strava’s challenge documentation emphasizes rules, eligibility and visible progress. The transferable quality is a bounded commitment with understandable contribution rules. The study’s challenge explicitly counts non-private goal completions in a stated week and excludes tasks and linked credits. Its particular rules are demo rules, not proposed changes to Goalmaxxing’s production challenge system. [Strava, Strava Challenges](https://support.strava.com/en-us/articles/15401916-strava-challenges).

### 8. Treat tactile feedback as an optional consequence

The web Vibration API has limited browser availability and can do nothing on unsupported hardware. A web prototype cannot establish the quality of native haptics across iPhones, Android devices and desktops. Glide therefore offers an opt-in vibration on date selection and completion, accompanied by the same visible state change. No other concept triggers it. [MDN, Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

The intended sensation is a small confirmation of a deliberate action, not repeated buzzing while scrolling or an extra ritual required to finish a task. Native adoption would need actual device evaluation using appropriate platform APIs. In this study, reduced motion also suppresses the vibration call; unsupported browsers retain the complete interaction without it.

## Five concepts

| Concept | Distinct operation | Desktop arrangement | Phone arrangement | Expected delight | Principal risk |
| --- | --- | --- | --- | --- | --- |
| Fold | Open a date in place | Month with an inserted daily list and side tray | Compact date grid with a readable expanded day | The detail feels connected to the place it came from | Expansion can move content |
| Switchboard | Gather work, then place it | Selection list beside a date board and retained selection | Select work / Choose date stages | Several changes become one understandable action | Selection can be confused with completion |
| Index | Browse goals while their plan stays close | Searchable category index beside goal-specific dates | Retained index and explicit return from a goal | Large collections feel quick and organized | Goal scope may conceal the whole plan |
| Lens | Compose and reuse a goal combination | Visible goal expression above the changing calendar | Wrapping tokens and an inline goal palette | The result changes as the question changes | A remembered filter can look like missing data |
| Glide | Change date and work from a compact dock | Calendar and expandable day dock side by side | Date rail followed by a contained work dock | Small actions settle with clear visual, optional tactile feedback | A dock or date display can crowd the work |

### Fold

The day is not a separate destination reached through a modal. It unfolds below its calendar week, with its original date still marked. Work can be completed or given a new date in the readable expanded area. Month, week, day and list controls remain ordinary, named controls. A date change preserves the underlying selected-date model across these scales.

The visual direction is restrained paper and confident typography. The opening motion is short and directional; it does not imitate a physically curling page. The creator opens within the working page, where the four-step flow gives complex goal details enough room without asking the person to hold the entire form in memory.

On phones, month cells expose dates and counts instead of squeezing every title into seven tiny columns. The opened day supplies full names and actions. This trades some whole-month item visibility for readable, directly actionable details. It needs a test against users who routinely compare several dates at once.

**Try:** open September 11, move Running to September 15, inspect the review, save, then undo. Watch whether the person understands what moved and can return to the original date without searching.

**Best candidate for:** a familiar calendar experience with more continuity and less modal interruption. It is the lowest-change interaction hypothesis in this round.

### Switchboard

Selection is a temporary working state, distinct from doing the work. A plus/check selection control picks up an item. The retained tray names everything in the group while the person chooses its destination. The review lists each old date and the new date, then offers Save and Cancel. One undo restores the whole preceding snapshot.

The visual direction is a clear blue planning instrument with a stronger division between the source list and destination board. On desktop, both remain visible. On phones, two named stages replace the side-by-side arrangement. The person can inspect the calendar without having selected anything, and return to selection without losing the group.

The prototype intentionally moves the selected group to one chosen date. It does not infer priorities, redistribute a week automatically, shorten goals or shift an entire recurring series. Those are materially different operations. A production version would need to identify occurrences and enforce eligibility before presenting a batch proposal.

**Try:** pick Running and Reading, choose Friday, inspect the two-item review, cancel once, repeat and save, then undo. Separately complete an item through its detail action and check that picking it up never counted as progress.

**Best candidate for:** people who often rearrange a busy week or recover several unplanned items. This is the clearest operational improvement to validate first.

### Index

Index starts with the goal collection rather than a wall of dates. A stable category index sits next to the selected goal’s upcoming occurrences. A category jump changes the scroll position; compact mode changes density; alphabetical order and search offer direct alternatives. Selecting a neighboring goal updates the work pane instead of navigating to another full page.

A visible Whole plan control restores the broad view, including tasks. The selected-goal scope is named above the planner, and all four calendar/list views remain available. The occurrence list spans future dates rather than forcing a goal with sparse activity into a mostly empty weekly screen.

On mobile the index becomes the entry surface. Opening a goal shows its work and an explicit Goal index return control; the retained index preserves its query and position. The goal blueprint is an editable document with a live summary rather than a floating one-page popup. Its precise target and privacy choices can be reviewed together.

**Try:** jump to Mind, open Reading, inspect its month, return to the index, switch to compact mode, find Spanish, then use Whole plan. Create a milestone goal in the blueprint and find its unplanned steps.

**Best candidate for:** a large, varied goal library and people who think “what am I working toward?” before “what is on Thursday?” The tradeoff is one more decision before seeing a whole-day plan.

### Lens

Lens makes the scope into a visible object: Running + Reading, for example. Adding or removing a token changes the calendar immediately. The goal palette stays integrated with the page; there is no Apply button that hides the result while the person edits their question. Named combinations can be saved, recalled and removed for the current demo session.

Any chosen goal shows the union. All chosen goals shows dates where every selected goal is represented. The same selection can be carried into Progress, where the inputs are completion records instead of placements. A comparison table preserves exact counts, and aligned activity strips offer a quicker visual comparison. Tapping a date exposes its records.

The palette uses soft violet as a structural accent, not category meaning; individual goals keep their existing category colors. Empty results retain the scope and an easy return to Everything. The design must never imply that a filter removed goals from the product or that overlapping activity proves causation.

**Try:** choose Running and Reading, inspect any/all matching, save the combination as Morning rhythm, select Everything, restore the saved lens, then follow it into history and compare the two goals. Change one goal in the lens and inspect the resulting records.

**Best candidate for:** people who repeatedly ask related planning and progress questions across subsets of their goals. It offers the strongest connection between selection and evidence, with the highest need for clear scope labels.

### Glide

Glide keeps the date and the action list close, using a seven-day rail and an expandable dock. The dock switches between the selected day and Unplanned without moving to another destination. Expand and Compact are explicit buttons; no discovery of a drag handle or hidden swipe is required.

The first browser inspection showed that a large date display delayed access to the task list on phones. The revised mobile layout compresses that display and removes the redundant headline from the visible flow. The dock occupies real document space, avoiding an overlay that would cover calendar controls. Its internal list can expand when more room is useful.

Only this concept offers tactile feedback. It is off initially, does not carry essential meaning, and has an explicit support caveat. No completion requires holding a button, waiting for an animation, or achieving a gesture threshold. The goal creation flow becomes a bottom sheet on narrow screens, with conventional back, close and review controls.

**Try:** change the selected date using the rail, complete Running on the sample today, expand and compact the dock, move Reading, and inspect Unplanned. Repeat with reduced motion and without haptics. On compatible hardware, separately compare the optional pulse.

**Best candidate for:** frequent phone check-ins. The main question is whether the dock saves navigation effort or introduces an unnecessary layer around an ordinary list.

## Practicality and delight criteria

The desired reaction has two parts: “I understood what happened” and “I enjoyed doing it.” A concept fails if it achieves the second by weakening the first. No usability or emotional benefit is claimed as established by this research; the product references are precedents and the prototypes are testable hypotheses.

Prefer outcomes that leave inspectable evidence: a moved item on its new date, a saved combination that restores the same scope, a completion in history, a milestone with its chosen name. Avoid novelty that makes the status less legible: object sizes that imply unmodeled duration, orbital distances that hide dates, or celebratory totals without a defined denominator.

A small animation should explain a state change and let the person continue immediately. The study uses brief entry transitions, selected-state changes and stable summary areas. Reduced motion removes those transitions. Future motion polish should be judged during rapid repeated use, not only by watching an isolated animation once.

The same restraint applies to social features. The prototype provides finite team summaries and a bounded optional challenge. Membership and visibility are independent, and private goals are excluded from the demo leaderboard’s eligible total. It does not send messages or imply that seeded people are online.

## Evaluation plan

Use the same scenario and seed in each concept. Counterbalance concept order across participants so that learning the sample data does not make the last concept appear easier. Include desktop-focused planners, frequent phone users, and people with enough active goals to experience collection overload.

| Task | Observe | Failure signal |
| --- | --- | --- |
| Find today’s next item | First action, hesitation, label comprehension | User enters settings or repeatedly changes destinations |
| Move one occurrence into another month | Date accuracy, review comprehension, return path | User thinks the whole series or completion history changed |
| Move two items together | Selection awareness, cancellation, undo | Picking up work is mistaken for completing it |
| Create a weekly goal and a lifetime goal | Understanding cadence versus target basis | User interprets frequency as a rigid scheduled time |
| Create and reorder milestones | Naming, order retention, review edits | Steps lose names or the count differs from the review |
| Find two goals in a long library | Search, category jumps, return position | Detail navigation resets the collection unexpectedly |
| Compare a two-goal history | Scope recognition, count interpretation | User reads combined totals as a success percentage |
| Explain any versus all matching | Ability to predict a resulting date | User treats a missing day as deleted information |
| Join a challenge and inspect sharing | Eligibility and privacy comprehension | Joining is assumed to publish private goals |
| Repeat using keyboard, zoom and reduced motion | Action parity and focus visibility | A primary action requires dragging or hidden hover content |

Record task success, wrong-date mistakes, time to first correct action, number of reversals caused by confusion, and a short ease rating. Ask what felt satisfying only after the task, and ask what would become annoying after a week. Qualitative reactions should be attached to the exact action and state, rather than averaged into a vague “wow” score.

Suggested acceptance targets are hypotheses for a future test: no silent scope mistakes on critical moves, no inaccessible primary action, and a clear improvement over the current UI on the specific task the concept targets. Do not assign a numeric production ranking before those results exist.

## Recommendation

Validate Switchboard’s group move and Index’s collection navigation first, because their proposed value is concrete and easy to measure. Compare Fold against the current calendar for orientation and recovery. Treat Lens as a strong candidate for repeated multi-goal planning and analysis, especially if people already reopen similar filter combinations. Evaluate Glide on real phones before drawing any conclusion about tactile quality.

A final product could reuse successful components from several directions, but the primary navigation should have one coherent model. Combining all five full layouts would multiply concepts a user must learn. Choose the main working arrangement after testing, then adopt only complementary interactions: an index can support a calendar, and saved lenses can support either, without requiring five modes in production.

## Prototype scope and delivery

The prototype uses a fixed September 9, 2026 reference day, 24 named sample goals, September placements and August/September completion records. Navigation extends beyond those months; other dates are honestly empty. State survives switching concepts and destinations within the page and resets on reload. Reset demo restores the seed; Undo reverses the most recent data mutation.

Source lives in `src/features/ux-interaction-lab`. The Next.js page is an isolated client study under the existing UX layout. `scripts/build-interaction-lab.mjs` also produces a static review version, containing only the study, its local dependencies and seeded data. No application environment files or private user records belong in that version.

Automated checks verify interaction behavior and state invariants; browser checks verify the rendered study at representative widths. These checks do not establish real-user usability, native haptic quality, low-end-device performance, or production scheduling correctness. Those remain explicit follow-up work before adoption.

## Verification record

Twelve focused model and component tests pass, covering reviewed moves, cancellation and undo, completion/history separation, linked credit, guided and blueprint creation, milestone order, collection navigation, saved lens matching and social membership state. The isolated study typecheck and targeted lint pass. Chromium checks covered 40 destination screens at 1440px and 390px with no WCAG 2 A/AA axe violations or page overflow, plus 20 phone planner view checks with no page overflow. No browser runtime errors were observed.

Repository-wide checks were also run: typecheck reports an existing optional callback invocation at `src/features/planner/calendar-day-preview-list.tsx:375`; lint reports two existing effect-state errors in `src/components/layout/app-boot-splash.tsx` and 23 warnings. Neither file is changed by this study. The clean study checks above do not imply a clean production build.

## Sources

Official product documentation and original research were preferred. Undated live pages were accessed September 10, 2026; they establish documented patterns, not independent proof of usability outcomes.

1. Linear. [Peek preview](https://linear.app/docs/peek). Undated.
2. Cultured Code. [Things features](https://culturedcode.com/things/features/). Undated.
3. Figma. [Select layers and objects](https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects). Undated.
4. W3C WAI. [Understanding Success Criterion 2.5.7: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html). WCAG 2.2 guidance.
5. Notion. [Use Notion Calendar with Notion](https://www.notion.com/help/use-notion-calendar-with-notion). Undated.
6. Ableton. [Session View](https://www.ableton.com/en/manual/session-view/). Live 12 Reference Manual.
7. Charles Broskoski / Are.na. [Creating personal taxonomies](https://help.are.na/docs/guides/creating-personal-taxonomies). Undated.
8. Ben Shneiderman. [The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations](https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf). IEEE Symposium on Visual Languages, 1996.
9. Typeform. [How to add multiple questions to a form page](https://help.typeform.com/hc/en-us/articles/38099463383188-How-to-add-multiple-questions-to-a-form-page). Undated.
10. Airbnb. [Exploring your hosting tools](https://www.airbnb.com/resources/hosting-homes/a/exploring-your-hosting-tools-738). December 10, 2025.
11. Strava. [Strava Challenges](https://support.strava.com/en-us/articles/15401916-strava-challenges). Live help article.
12. MDN Web Docs. [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API). Live compatibility documentation.

Repository references: `docs/ux/goalmaxxing-experience-design-guide.md`, `docs/ux/goalmaxxing-application-design-guide.md`, `docs/ux/goalmaxxing-next-wave-study.md`, `src/lib/goals/types.ts`, `src/lib/goals/form-options.ts`, `src/features/goals/goal-creation-fields.tsx`, `src/features/insights/insights-goal-stats-filters.tsx`, `src/features/insights/insights-selectors.ts`, and `src/features/social/social-surface.tsx`.
