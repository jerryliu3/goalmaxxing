# Goalmaxxing Application UX Research and Directions

Status: **Direction B locked as the leading concept.** Production
`AppShell` is unchanged. This document keeps the research, the rejected
alternatives, and the open questions *inside* B. Do not copy concept shells
into production routes until we explicitly implement the lock.

Public marketing pages still follow
[`goalmaxxing-experience-design-guide.md`](./goalmaxxing-experience-design-guide.md).
Clickable UX prototypes live at `/ux/concepts`. Visual brand directions
(type, color, motif — not IA) live at `/ux/brand` and in
[`goalmaxxing-application-brand-guide.md`](./goalmaxxing-application-brand-guide.md).
Native Expo is out of scope for this pass; it should not invent a third
language after web settles.

**Locked**

- Home is the calendar object (Spatial Plan). Plan has three first-class
  views: **week**, **month**, and **day**. Week is the phone default, not the
  only Home. Calendar shows **placed planner items**. Week items are pills
  (drag later). Tapping a day or a pill opens **Day view** — placed work with
  complete rows. Completing does not live on every week pill.
- Checklist is a **peer tab** for every applicable item, including work that
  was never placed. Day view is not Checklist.
- Interaction craft for the rest of the app lives in the **pattern library**
  (`/ux/concepts/patterns`): rows complete, pills move, sheets propose,
  recover is amber replanning, destinations are Plan / Checklist / Progress /
  Community / You. Visual brand leading lock is Gazetteer
  ([`brand-lock-gazetteer-col.md`](./brand-lock-gazetteer-col.md),
  `/ux/brand/gazetteer`) with Nest completion. Col is the runner-up.
  Applied kits: `/ux/brand/kit-gazetteer`, `/ux/brand/kit-col`. Production
  `AppShell` is unchanged.
- C is not Home. A week pulse may live under Progress later.
- **Progress** leading lock is Goal Ledger: per-goal rates plus a heatmap you
  can tap to log or remove completions. Plan stays placed work; this calendar
  is the completion log, including days that were never scheduled.
- **Duo** is a platform Solo/Duo field on Plan, Checklist, and Progress. Duo
  week on Plan is the shared board (you | partner). It is not a Community-tab
  object.
- **Community** keeps Team, Challenges, and Leaderboards. Cut the feed for
  now. Team stays here because team-specific goals belong with that surface.
- **You** is grouped controls (Plan / Connected / Account) with a hero
  identity and profile configuration at the top.

**Still open inside B**

- How tightly Checklist’s view date should follow the calendar’s selected day.
- Whether team pairing also appears in You/settings, or only next to team
  goals.
- Plan craft (not a destination lock): single-goal placement filter on Plan,
  quieter past-day completions, collapsed Completed on Checklist. Prototypes:
  `/ux/concepts/plan-clarity`.

Current prototype: `/ux/concepts/spatial-home`. Pattern library:
`/ux/concepts/patterns`. v1 archive: `/ux/concepts/spatial-plan`.
Plan craft study: `/ux/concepts/plan-clarity`.
Goal detail study: `/ux/concepts/goal-cards`. It compares a labeled flip for
occasional goal setup inspection with an expand treatment for frequently read
details. Both keep completion separate from opening detail.
Day work inspect study (exploratory, not a lock): `/ux/day-work`.

---

## Application pattern library

Until Spatial Home, we had IA (calendar is Home) and some planner craft. We
did **not** have a system for the rest of the product. This section is that
system. Use it on every new concept surface. Do not invent a parallel card
language on Insights or Community.

Live atoms: `/ux/concepts/patterns`. Source list:
`src/features/ux-concepts/pattern-library.ts`. Primitives:
`src/features/ux-concepts/concept-primitives.tsx`.

This is **not** the brand gallery. `/ux/brand` is type, color, and motif.
Gazetteer is the leading visual lock; do not restyle production until we
implement. This library is interaction: what is tappable, what completes,
what moves, what opens a sheet.

### Principles

1. **One question per screen.** Now, where it sits, or how to adapt. If a
   layout answers all three at once, it is a dashboard.
2. **Objects, not chrome.** The first thing you can touch is the work: a pill,
   a row, a day. Brand, XP, and nested chips recede.
3. **Rows complete. Pills move. Sheets propose.** Complete on a list row. Drag
   a pill to replan. Coach and create open a sheet. Do not stack all three on
   the same control.
4. **Peers, not nested products.** Destinations are Plan, Progress,
   Community, and You. Week, month, and day are views of Plan. Day is the
   list. Do not hide a product behind a chip row.
5. **Recover is replanning.** Unplaced work is amber and movable. It is never
   a failed checkbox or a streak threat.
6. **Desktop recomposes.** At `md+`, two panes. Never a stretched phone with a
   header card.

### Atoms

| Atom | Use | Do not |
|---|---|---|
| Work pill | Plan week and month cells. Grab-able. Category is the fill. | Complete control, category dot, nested card |
| Work row | Day (the checklist). Complete + open. Unplanned rows via Show unplanned. | A second Checklist tab |
| Recover banner | Unplaced work. Adaptive copy. | Shame, streak threat, silent miss |
| Sheet | New goal, Coach, Recover, item detail. One job. | A fourth nested tab row |
| View toggle | Week / Month / Day on Plan. | A second destination bar |
| Destination tabs | Plan, Progress, Community, You. | Planner’s three gradient chips |

### Color meaning (interaction, not brand lock)

| Color | Means |
|---|---|
| Blue | Action, primary, next step |
| Emerald | Complete, saved, recovered into the plan |
| Violet | Long-range, community, Duo |
| Amber | Recover, unplaced, needs a new day |

### Surfaces still to apply

Written locks above are canonical. Clickable shells at `/ux/concepts` may
lag (Checklist tab, month dots, single-goal heatmap only). Do not polish
those shells into the product. Production `AppShell` stays untouched until
we implement.

### Plan craft (open inside B)

Not a destination debate. Same Spatial Home. Clickable study:
`/ux/concepts/plan-clarity`. Live calendar still uses strikethrough, has no
one-goal placement filter, and leaves completed rows in the open list.
Progress Ledger already isolates one goal — that heatmap is the
**completion log**, including unscheduled days. These shells filter **placed
work** on Plan.

| | F1 Goal focus | F2 Past-day done | F3 Collapsed completed |
|---|---|---|---|
| **Object** | One goal’s placed days | Yesterday’s pills | The open queue |
| **First viewport** | Tempo run on four Plan days | Quiet pills. Nest on a clear day. | Tempo run. Completed · 2 folded. |
| **Steal** | Ledger’s one-goal select, on Plan | Gazetteer Nest; Continuity Map’s quiet history | Today Home’s Done section, closed |
| **Reject** | Merging Plan with the Progress heatmap | Streak-threat stars as the default | A second Checklist product |
| **Prototype** | `/ux/concepts/plan-clarity/focus` | `/ux/concepts/plan-clarity/history` | `/ux/concepts/plan-clarity/checklist` |

Treatments on F2: **Strike** (live control), **Quiet** (color, no line),
**Fold** (hide, expand the day), **Marks** (nest instead of a title). Clear
days can take Nest (leading, from Gazetteer) or a star around the date number.

---

## Destination debate: Progress, Community, You

Home is Spatial Plan. The three option groups were **choose-between**
shells, not layers to stack. The leading hybrids below keep product we
were not willing to drop. Earlier shells stay as clickable alternatives.

Live production names stay Insights / Community / Profile until we implement.

### Progress (live Insights) — leading: Goal Ledger

Live first viewport is a year heatmap plus six nested metric tiles, then
per-goal cards with streaks. That is a dashboard.

**Lock:** `/ux/concepts/progress` (ledger). Goal list. Default heatmap is
the **aggregate**. Select one goal → **editable** per-goal calendar. Multi-select
→ **read-only overlap**. Plan places work; this calendar logs completions,
including days that were never scheduled. Do not merge the two calendars.
Month vs year can wait.

| | P1 Week Pulse | P2 Goal Ledger | P3 Continuity Map |
|---|---|---|---|
| **Object** | One week number | The goal list | A month of completions |
| **First viewport** | 7 of 10. Recover. | Tempo run 8 of 12. Strength unplaced. | September grid. Tap a day. |
| **Comps** | Apple Fitness, Whoop, rejected Home C | Things 3, Whoop per-metric | GitHub contrib, Apple Fitness history, Flighty |
| **Steal** | Truthful planned-vs-done. Glance then drill. | Rows not cards. Rate per goal. Mutable heatmap. | Spatial history without becoming Home. |
| **Reject** | Vanity streaks as the title. Remaining work as a second Checklist. | Nested goal cards and chip filters on entry. | A second planner calendar. Completions ≠ placed work. |
| **Desktop** | Pulse + week left, rates right. | Ledger left, selected goal heatmap right. | Month left, that day’s completions right. |
| **Cost** | Thin if someone wants per-goal history first. | No single glance number. | Easy to confuse with Plan’s month. |
| **Prototype** | `/ux/concepts/progress/pulse` | `/ux/concepts/progress/ledger` | `/ux/concepts/progress/map` |

C remains rejected as **Home**. P1 is C living under Progress as an alternative.

### Community (live `/social`) — leading: Team / Challenges / Leaderboards

Live first viewport is four equal chips (Feed, Challenges, Leaderboards,
Team) and a Feed of XP events.

**Lock:** `/ux/concepts/community`. **No feed.** Views are Team,
Challenges, and Leaderboards. Team stays here (team-specific goals). Duo is
**not** this tab’s object — it is a platform Solo/Duo field. Shared Board
is how Duo week looks on Plan (`/ux/concepts/spatial-home`).

| | S1 Duo | S2 Shared Board | S3 Quiet Circle |
|---|---|---|---|
| **Object** | Maya | Two week columns | One opted-in stream |
| **First viewport** | Maya completed Yoga. Nudge. | You · Maya. Pills, not feed cards. | Maya, then Deep work. Challenge is a row. |
| **Comps** | Find My, Duo tab, BeReal pair | Things/Fantastical split, Strava flyby | iMessage, Find My people, quiet Slack huddle |
| **Steal** | Partner as the product. Nudge. | Spatial accountability. Desktop-native. Now Plan Duo week. | Chronology without gamification. |
| **Reject** | Feed-first. Four social products. XP fireworks. | Treating the board as a Community destination instead of Plan Duo. | Rankings as a peer chip with a feed. |
| **Tabs** | Fifth destination tab. | Fifth destination tab. | Fifth destination tab. |
| **Cost** | Five tabs is crowded. | Partner without a pairing may look empty. | Still a social surface — just quieter. |
| **Prototype** | `/ux/concepts/community/duo` | `/ux/concepts/community/board` | `/ux/concepts/community/quiet` |

### You (live Profile / Settings) — leading: identity + grouped controls

Live first viewport is an account card plus a settings list of nested cards
in sheets. Closest to already-good IA.

**Lock:** `/ux/concepts/you`. Y3 grouped controls, with Y1’s hero identity
and profile configuration at the top.

| | Y1 Settings List | Y2 Person | Y3 Controls |
|---|---|---|---|
| **Object** | Identity + list | The person | Grouped product controls |
| **First viewport** | Alex. Preferences rows. | Alex. Partner Maya · 7 of 10. | Plan / Connected / Account. |
| **Comps** | iOS Settings, Linear settings | Strava profile, Apple Fitness profile | Superhuman / Things preferences |
| **Steal** | Rows and sheets. No nested cards. Hero identity. | Partner and week as context. | Groups. |
| **Reject** | XP dashboard on Profile. Nested cards. | Turning You into Insights. | Hiding account so deep it cannot be found. |
| **Desktop** | List left, selected sheet right. | Person + partner left, list right. | Groups left, editor right. |
| **Cost** | Feels like “just settings.” | Duplicates Progress/Community numbers. | Cold without the identity hero. |
| **Prototype** | `/ux/concepts/you/list` | `/ux/concepts/you/person` | `/ux/concepts/you/controls` |

---

## Why this document exists

The experience design guide is an 8/10 case study for the **public website**.
The authenticated application is closer to 5/10 on the same qualities:
focused, interactive, truthful, calm, responsive, and visually polished.

That gap is not a missing animation. It is a category mistake. The landing
research studied **websites** (Linear, Stripe, Notion, Vercel marketing pages).
Those pages optimize for a first visit, a story, and a conversion. Consumer
apps optimize for the hundredth open: thumb reach, status, recovery, and chrome
that recedes so the work can start.

**Landing energy, translated:** keep the effort and philosophy — ruthless
hierarchy, product-truth, motion that explains cause and effect, spatial
stability, progressive disclosure. Do not import cinematic scroll, hero loops,
bento showcases, or conversion pacing into `/calendar`.

Type scale, chrome recipe, and production IA still wait. Interaction patterns
are now canonical in this document and at `/ux/concepts/patterns`. Remaining
work is applying them to Progress, Community, and You — not another Home
debate.

---

## North star for the authenticated product

The experience guide’s north star still holds:

> Help people turn long-range intent into adaptable daily action while always
> understanding where they are, what changed, and what to do next.

Inside the application, every screen should help the person answer one of
**these** questions (not the marketing three):

1. **What should I do now?**
2. **Where does this sit in the week and the longer goal?**
3. **If the plan broke, how do I adapt without shame?**

Healthy engagement is returning because the product helped, not because a
streak threatened to die. Community and Duo reinforce effort. They are not an
attention-maximizing feed.

### Viewport bias

Design **mobile first (~65%)**, then **recompose for desktop (~35%)**. Desktop
is not a stretched phone. Every serious direction must show a different spatial
layout at `md+`, not only larger type.

---

## Current UI, patterns, and UX philosophy

### Information architecture (live)

Authenticated product lives in `src/app/(app)/`, wrapped by
[`src/components/layout/app-shell.tsx`](../../src/components/layout/app-shell.tsx).

| Tab label | Route | Role |
|---|---|---|
| Planner | `/calendar` | Daily execution + planning hub |
| Community | `/social` | Feed, challenges, leaderboards, team |
| Insights | `/insights` | History, heatmaps, goal stats |
| Profile | `/settings` | Preferences, account, integrations |

Shareable public profiles live at `/user/[username]`. They show identity, XP,
earned level medals, and the current-year activity heatmap when
`social_activity_visible` is enabled; otherwise visitors see identity plus
“This account is private.” Settings controls that flag and surfaces the URL.

Planner is itself a three-surface hub
([`planner-page-shell.tsx`](../../src/features/planner/planner-page-shell.tsx)):
Calendar, Checklist (default), Tasks, switched with pressed gradient chips.
Checklist, Calendar, and Tasks also exist as `/checklist` and `/tasks`
redirects. Goal create/edit uses intercepting `@goalSheet` routes. Coach and
Recover are not tabs: Coach is a calendar panel; Recover lives in planner
settings. Duo is a header scope toggle, not a destination. Achievements hangs
off the XP chip.

Native Expo already diverges (hidden checklist tab, different chrome). This
document does not redesign it.

### Visual language (live)

- Light-first cool lavender-gray (`oklch` hue ~286) and blue primary (~255) in
  [`src/app/globals.css`](../../src/app/globals.css). Dark tokens exist; there
  is no product theme switcher.
- Geist Sans / Mono. Radius `0.875rem`. Motion 120 / 200 / 560ms.
- shadcn / Radix primitives. **Card with `ring-1` is the default atom.**
- Surface chips: blue/sky gradients, inset “pressed” shadows, 10px labels.
- Sonner toasts, bottom-right.
- Optional journey/altitude backdrop when the journey flag is on.

### Chrome and navigation (live)

**Mobile:** sticky blurred header (brand wordmark, XP, New Goal `h-8`, Duo) +
fixed frosted bottom tab bar + in-page planner chips + date Card + filters.
Main padding accounts for the tab bar (`pb-[calc(6.5rem+safe-area)]`).

**Desktop (`md+`):** the same stack, except tabs move into a **header card**
and the page is a centered `max-w-5xl` column. There is no split view, no
navigation rail, no command palette.

### Interaction patterns (live)

| Pattern | Where it stands |
|---|---|
| Completions | Optimistic toggle + XP flight. Checkbox ≠ green card ≠ hide. |
| Calendar moves | Explicit draft → Save plan / Saving… / Undo. Strongest craft in the app. |
| Sheets | Dialogs restyled as sheets (goals, settings). No dedicated sheet primitive. |
| Drag-drop | Calendar `@dnd-kit`, with dialog/move alternatives. |
| Loading | Generic `LoadingCard` pulse or “Loading planner surface…”. |
| Empty | Inline muted copy, not a dedicated empty-state pattern. |
| Nested tabs | Search-param surfaces (`?surface=`, `?tab=`). |
| Preference | `planner_primary_tab` is stored and **ignored** on web tab order. |

### Stated philosophy vs live UX

The experience guide already asks for focus, momentum, control, recovery,
Calendar vs Checklist as working styles, time as core IA, and skeletons that
match layout.

The live UI presents a **SaaS dashboard**: brand, XP, New Goal, Duo, then a
second nav, then a date Card, then filters, then the work. That is the 5/10.
The product’s domain rules (completion-intent, draft vs saved, Duo read-only
partner lanes) are stronger than the presentation that carries them.

```
Current mobile chrome stack
  Brand + XP + New Goal + Duo
  → Calendar / Checklist / Tasks chips
  → Date stepper Card + filters
  → Goal cards
  → Bottom tab bar
```

### Naming drift

| User-facing | Route / code |
|---|---|
| Planner | `/calendar` |
| Checklist | files under `features/today`, default `?surface` omitted |
| Community | `/social` |
| Profile | `/settings` |
| Recover / Coach | marketing language; buried in calendar chrome |

### What not to regress

Regardless of direction, keep:

- Calendar draft vs persisted vs undo.
- Completion-intent and checkbox ≠ green ≠ hide.
- Duo partner lanes read-only; fail closed.
- Motion contract in [`docs/motion_system.md`](../motion_system.md): motion is
  never required to understand state; reduced-motion still complete.
- Product-truth: recurring goals vs one-time tasks; Recover replans, it does
  not invent completions or shame misses.
- No engagement dark patterns (forced urgency, streak-guilt, unbounded feeds,
  hidden exits, preselected sharing).

---

## Shared constraints (not up for grabs)

All directions must:

1. Use **product-truth** copy and states. No fake metrics, no “edit anything
   in your history.”
2. Treat **replanning as normal**. Missed work is recoverable.
3. Keep **one primary task per viewport**. Secondary work is disclosed, not
   dumped.
4. Recompose for mobile vs desktop. Do not shrink.
5. Honor WCAG 2.2: 24px targets or spacing, no sticky occlusion of focus,
   drag alternatives, visible focus, contrast during motion.
6. Stay inside current color **semantics** unless a direction explicitly
   argues a change: blue = focus/action, emerald = completion, violet =
   long-range/community, amber = adapt/recover, neutrals = structure.
7. Keep static concept tours honest. Prototypes at `/ux/concepts` are seeded,
   not live data.

**Not in this pass:** activating dark mode, iOS 26 Liquid Glass as a skin,
restyling production routes, redesigning native Expo.

---

## How to channel landing energy without copying the landing

| Landing quality | Website expression | Application expression |
|---|---|---|
| Decisive first viewport | Hero + one CTA | Today’s next action visible without scrolling chrome |
| Product as proof | Faithful planner preview | Real states: draft, saved, missed, duo, task vs goal |
| Pace information | Scroll chapters | Progressive disclosure; Home is not Insights |
| Unambiguous action | One primary CTA | One dominant completion or save; quieter alternatives |
| Motion explains | Lift → move → save | Complete, save, recover; not pulsing chips |
| Spatial stability | Reserved hero stage | Skeletons match layout; sheets do not jump the page |
| Recompose for mobile | Card + visual pairs | Thumb-zone actions; desktop split, not stacked cards |
| Edit ruthlessly | Short copy, one idea | Fewer rows of chrome; list rows instead of nested cards |

The landing succeeded because it **removed competing ideas**. The app currently
adds chrome every time a capability ships.

---

## Research synthesis: consumer apps, not marketing sites

Apps evolve. The durable value is the **design decision**, not a screenshot.
Each row is steal vs reject for Goalmaxxing.

### Lens 1 — Daily action, time, and lists

| App | Famous for | Steal | Reject |
|---|---|---|---|
| **Things 3** | Best-in-class Today; large type; color restraint; completion as reward; When vs Deadline | Today as the product; 95% neutral UI so color means something; list rows not cards; Someday/Later as pressure release; keyboard accelerates, touch welcomes | GTD Areas/Projects as our IA; Apple-only chrome; no collaboration (we have Duo) |
| **Structured** | Visual day as a timeline; ADHD-friendly; Replan for missed blocks | One “what now” object; missed work is rescheduled, not shamed; approachable density | Hour-by-hour time-blocking as the core model (Goalmaxxing is goal/cadence, not a calendar of meetings) |
| **Fantastical** | Calendar as a glanceable object; grid + agenda; natural language add; day detail beside month | Month as a spatial object; selected day as sheet (mobile) or split (desktop); natural-language *feel* for Coach later | Becoming a calendar-of-events product; subscription-feature gates as UX |
| **Apple Calendar / Reminders** | Platform-native large titles, sheets, tab bars people already know (Jakob’s Law) | Collapsing titles; sheets from source; tab bar = destinations not actions | Cloning Apple’s exact visual skin; Reminders’ weak planning horizon |
| **Todoist / TickTick** | Cross-platform Today + karma/habits; natural language | Capture speed; clear Today/Upcoming split | Karma/points as the personality; feature sprawl |
| **Amie** | Todos live on the calendar; drag to time-block; low ceremony | Desktop: tasks and days on one surface; no mandatory morning ritual | Meeting-bot / email workspace scope |
| **Sunsama** | Guided daily planning ritual | Optional “plan the day” moment | Mandatory ceremony that punishes a chaotic Thursday |
| **Notion Calendar** | Clean month + side agenda | Desktop split geometry | Notion’s configurability as a product strategy |
| **Clear** | Gestural lists, extreme minimalism | Gesture as accelerant, with a button alternative (WCAG 2.2) | Gesture-only IA; fashion-over-clarity |
| **Superlist** | Calm lists + docs; collaboration without Slack energy | Visual confidence without demo-flash; partner presence as quiet context | Turning goals into documents |

### Lens 2 — Health, fitness, habits, recovery

| App | Famous for | Steal | Reject |
|---|---|---|---|
| **Apple Fitness** | Rings as one-glance status; drill-down after; sharing with close people | Open with a summary, then the list; streaks as evidence not a threat | Three rings as our metaphor; daily close-or-fail pressure |
| **Gentler Streak** | Rest does not break the story; activity path instead of all-or-nothing | Recover as a first-class, proud state; language that treats rest/misses as human | Replacing Goalmaxxing’s planning model with a training-load path |
| **Whoop / Oura** | Recovery score as the first impression; strain vs rest | One number that orients; then detail | Medical/wearable dependency; black-box scores we cannot compute |
| **Strava** | Activity as evidence; kudos as lightweight social | Proof next to effort; social as a tap, not a feed physics | Public performance identity; infinite activity firehose |
| **Streaks** | Tiny habit app, beautiful completion | Satisfying mark-done | Reducing Goalmaxxing to daily binary habits |
| **MacroFactor** | Honest numbers, no crash-diet theater | Truthful metrics; algorithm stays in the service layer | Diet-app visual language |
| **Headspace / Calm** | Soft hierarchy, one session at a time | Calm default; one primary action | Meditation-app illustration as brand |
| **Nike Run Club / Peloton** | Guided session, then summary | Start → do → recap loop | Class-catalog / coach-celebrity IA |
| **Rise (sleep)** | Energy curve as the object | Glanceable chart that changes the next action | Sleep-science as our domain |

Duolingo belongs in Lens 3 as craft and in anti-patterns as ethics. Habit
apps that punish a broken streak are incompatible with Recover.

### Lens 3 — Mass-market polish, motion, “what do I do now”

| App | Famous for | Steal | Reject |
|---|---|---|---|
| **Uber** | Map is the product; huge primary target; bottom sheet keeps context | First viewport *is* the task; sheets over full-screen modals when context matters | Hamburger for primary nav; marketplace density |
| **Airbnb (app)** | Tab bar of destinations; Explore vs Trips vs Profile | 3–5 tabs with labels; each tab owns a stack | Travel-marketplace search as Home |
| **Spotify / Apple Music** | Home = resume what you were doing; Now Playing is inescapable | Persistent “now” object; desktop is a different layout, not a phone | Card grids of recommendations as our Home; engagement maximization |
| **Instagram** | Visual craft, stories, motion | Quality of media and motion timing | Unbounded feed, infinite scroll, engagement dark patterns |
| **Photos / Apple Weather** | Content is the chrome; large titles recede | Content-first; chrome floats and minimizes | Weather-app complication density |
| **Google Maps** | Search + sheet + map coexistence | Primary object + sheet; progressive detail | Map as our metaphor |
| **WhatsApp / iMessage** | List is the app; open → last conversation | Recognition over recall; large row targets; status on the row | Chat as Goalmaxxing’s social model |
| **ChatGPT** | Empty state is a prompt; composer is the product | Coach: one composer, visible proposals, not a dashboard of tools | Chat wrapping the whole product |
| **Cash App / Monzo / Copilot Money** | High-contrast money, playful but trusted, one number | Trust + one primary figure; tactile confirmation | Video-game energy as our brand; neon |
| **Flighty** | Apple Design Award; airport-board clarity; context-aware states | “Boringly obvious”; pack/wrap/color data; status without interpretation | Travel-app visual skin; 15 states we cannot staff |
| **Halide** | Pro depth without flight-simulator chrome; muscle-memory gestures | Progressive disclosure of power; consistent control placement | Camera-app gestures on a planning product |
| **Duolingo** | Delightful motion, mascot, streak craft | Satisfying completion feedback (we already have XP flight) | Guilt owl, streak freeze economy, daily obligation theater |

### Lens 4 — Craft / power-user interaction (steal feel, not IA)

| App | Famous for | Steal | Reject |
|---|---|---|---|
| **Linear (the app)** | Speed as a feature; Cmd-K; optimistic UI; density that still feels clean | Instant feedback; keyboard as an accelerator on desktop; muted surfaces | Dark-developer identity; issue-tracker IA; copying linear.app marketing |
| **Superhuman** | Command palette as vocabulary; density for experts | Desktop: one palette for “go to / complete / recover / new goal” | Email-triage density on mobile Home |
| **Arc / Dia / Raycast** | Chrome recedes; command launcher | Desktop command bar; less persistent chrome | Browser/launcher product scope |
| **Craft / iA Writer** | Typography as the product | Type hierarchy over boxes | Notes-app IA |
| **Procreate** | Gesture fluency, undo always available | Undo prominence (Calendar already has this — keep it) | Canvas-app chrome |

### Accountability and social (restraint)

| Pattern | Steal | Reject |
|---|---|---|
| Apple Fitness sharing, Find My | Close people, glanceable, not a network | Public follower graphs |
| Strava kudos | One-tap recognition | Ranked performance identity as default |
| BeReal / Letterboxd | Constraint, taste, small community | Performative feeds |
| Duo partner check-in | Already our product: Solo / Partner / Duo lanes | Cloning Instagram, TikTok, or Duolingo leagues |

**Anti-patterns to keep naming:** streak-guilt, infinite feeds, surprise
notifications, hidden exits, preselected sharing, motion that competes with
the task, dashboards that open on charts instead of the next action.

### Platform canon

- **iOS HIG:** tab bars are destinations (3–5), not actions; do not hide tabs
  when empty; labels under icons; sheets for tasks; large titles that scroll
  away; 44pt targets. iOS 26’s lesson is **content vs chrome**, not Liquid
  Glass paint.
- **Material 3:** navigation bar + FAB for the one primary action; do not mix
  destinations and actions in the same bar.
- **NN/g:** visibility of status, user control and recovery, recognition over
  recall, aesthetic and minimalist design *for complex apps* (progressive
  disclosure, not emptiness).
- **WCAG 2.2 / Core Web Vitals:** already in the experience guide; still
  underused in app chrome (sticky header vs focus, generic skeletons, INP on
  heavy client trees).

### Cross-app decisions that keep showing up

1. **The first viewport is the job.** Uber’s map, Things’ Today, Spotify’s
   Now Playing, Flighty’s board. Goalmaxxing’s job is “do or adapt today’s
   work in light of the longer plan.”
2. **Chrome recedes; content is the layer.** Large titles, floating tab bars,
   sheets, FABs. Persistent brand wordmarks are for marketing.
3. **One elevation system.** Things, Reminders, WhatsApp: rows. Cards are for
   distinct objects (a month, a heatmap, a profile), not every goal.
4. **Color is semantic and scarce.** If everything is a blue gradient chip,
   nothing is a signal.
5. **Overview + detail in one place on desktop.** Fantastical, Apple Mail,
   Linear, Things Mac: list/grid + inspector. A `max-w-5xl` column is a
   website.
6. **Recovery is a designed state.** Gentler Streak, Goalmaxxing Recover,
   Calendar undo. Shame is a product bug.
7. **Social is an overlay on the work**, not a fourth product.

---

## Shared opportunities (problems, not solutions)

Directions disagree on *how*. They should all attack these:

1. **Today’s work is not in the first viewport.** Chrome tax: brand, XP, New
   Goal, Duo, chips, date card, filters.
2. **Nested navigation.** 4 app tabs + 3 planner chips + 4 community chips.
   Tab bars should be destinations; chips currently pretend to be a second
   tab bar.
3. **Card-as-default-atom.** Nested rings, 10px labels, dashboard density.
4. **Desktop is a stretched phone.** Header card + single column.
5. **Recover and Coach are buried** while marketing treats them as
   differentiators.
6. **Insights opens as a long dashboard** instead of one glance, then drill.
7. **Community treats Feed / Challenges / Leaderboards / Team as equals**,
   competing with “trusted accountability, not a feed.”
8. **Generic loading/empty/error** vs landing honesty.
9. **Naming drift** and unused `planner_primary_tab` on web.
10. **Motion spent on chrome** (pressed chips, ambient journey) instead of
    complete / save / replan.

---

## Competing directions

These were real forks in IA and personality, not three skins of one layout.
The gallery debate **locked B**. A remains a craft reference. C is rejected
as Home. Prototypes: `/ux/concepts`. Same seeded Thursday story in every
shell: Tempo run, Launch notes, Weekly reset, Deep work done, Strength missed
Tuesday, partner Maya.

Desktop split is **Direction D**: a required recomposition at `md+`,
not a fourth mobile personality.

### Direction A — Today Home

**Status:** not Home. Keep as the reference for selected-day list craft.

**Comps:** Things 3, Structured, Apple Reminders, WhatsApp lists.

**Bet:** Most sessions are “complete today’s work.” Planning is a mode.

**Mobile first viewport:** Large “Thursday” / “3 left.” List rows with a
completion control. Recover as a slim banner. New Goal in the thumb zone
(tab-adjacent). No brand wordmark. Calendar and Tasks are a Plan mode or
sheet, not a second physical chip row.

**Desktop:** List + inspector (selected goal, or week strip). Keyboard: `N`
new, `J`/`K` dates (shown as captions in the prototype).

**Community / Coach / Recover:** Recover banner. Coach as a header icon that
opens a proposal sheet. Community is a tab, but Home never becomes a feed.

**Costs:** Calendar-first users take an extra tap to see the month. Risk of
looking like “just a to-do list” unless week context stays visible (counts,
week dots, or a peek strip).

**Prototype:** `/ux/concepts/today-home`

### Direction B — Spatial Plan

**Status:** locked as Home. Current prototype is Spatial Home v8 (may lag
the written locks: it still has a Checklist tab and month dots).

**Comps:** Fantastical, Apple Calendar, Amie, Notion Calendar, Uber sheets.

**Bet:** The differentiator is adaptable planning across days, weeks, and
months. The calendar object *is* Home. Day is the checklist. Month shows
movable tiles, not dots.

**Mobile first viewport:** Week agenda with item pills as the default. Month
grid and dedicated Day view are first-class toggles, not afterthoughts.
Tapping a day or a pill opens Day. Missed Strength is an amber cell plus
“1 to reschedule.” Save plan stays visible when the grid is in draft
(prototype uses a Recover move as the stand-in).

**Desktop:** Week or month left, selected day right — until Day is the main
view, then do not duplicate the day pane.

**Community / Coach / Recover:** Recover on the grid (amber + banner). Coach
proposes a move onto a day, previewed spatially.

**Costs:** Completing today’s Tempo run is further from the thumb than in A
(it lives in Day). A dense month can feel like a dashboard if cells are
noisy. Must preserve task vs goal distinction in Day view. Show unplanned
must stay easy to find.

**Prototypes:** `/ux/concepts/spatial-home` (current) ·
`/ux/concepts/spatial-plan` (v1 archive)

### Direction C — Progress Pulse

**Status:** rejected as Home. A glance pulse may still live under Progress.

**Comps:** Apple Fitness, Whoop, Oura, Gentler Streak, Flighty status.

**Bet:** People return for continuity and motivation. One glance (“7 of 10
this week,” recovery waiting) then the remaining list.

**Mobile first viewport:** A single status object (week completion + today
remaining + recover). Then today’s open rows. Insights vocabulary is the
first impression; the full heatmap is a drill-in.

**Desktop:** Status + week heatmap on the left (or top), remaining list on
the right.

**Community / Coach / Recover:** Recover is “adapt this week,” not a missed
badge of shame. Duo can appear as a quiet partner pulse (Maya completed
Yoga), not a feed.

**Costs:** Extra hop to check off Tempo run vs A. Risk of vanity metrics if
the summary is not a number the product actually computes. Must not become
Duolingo obligation.

**Prototype:** `/ux/concepts/progress-pulse`

### Direction D — Desktop-class split

**Comps:** Things Mac, Fantastical Mac, Linear, Superhuman, Apple Mail.

Not a separate mobile app. At `md+` every direction must:

- Drop the mobile header card pattern.
- Use a quiet rail or compact top tabs (destinations only).
- Show **two coordinated panes** (list+inspector, month+day, or
  summary+list).
- Offer keyboard captions for frequent actions.
- Never duplicate the frosted 4-up pill from mobile in the header.

If a direction cannot explain its desktop panes, it is not ready.

---

## Per-surface notes (apply while implementing B)

These are not locked recipes. They are constraints so prototypes stay honest.

**Day / Checklist.** Day is the list. Complete lives on Day rows. Show
unplanned for items never placed. No second Checklist tab. Rows, not nested
cards. Date is a title, not a Card wrapping the page. Filters in a sheet.
Past / upcoming / archive stay disclosed. Production `/checklist` stays until
we implement.

**Calendar / Plan.** Home for B. Shows **planner items** placed on days.
Month cells show movable tiles with overflow `+N`, not category dots.
Category is the pill fill. Draft vs saved must remain legible. Drag needs a
non-drag alternative. Week, month, and day are views of Plan, not product
splits. Tapping a day opens Day (the checklist).

**Tasks.** One-time items, visually distinct from recurring goals (Launch
notes). Do not invent a third tab language; inbox or day section.

**Insights.** Never the default Home. C was rejected as Home; a pulse may
still live under Progress. Glance → drill (`/insights/more` or a sheet).

**Community.** Team, Challenges, Leaderboards. Feed is cut. Duo is a
platform field on Plan/Progress, not this tab. Do not prototype four social
products.

**Profile / Settings.** Lists and sheets. The tab is “You,” not a second
application.

**Goal create/edit.** Sheet from the FAB or row. Intercepting routes can stay.

**Recover.** Timely banner or amber cell when unplaced work exists. Copy is
adaptive, not guilty.

**Coach.** Proposal + review. Never implied autonomy. Reachable from Home
without living on Home.

---

## Debate rubric

Use the same seeded Thursday on a phone (~390) and a desktop (~1280):

1. Can you see what to do in the first viewport?
2. How many rows of chrome before the first completion?
3. Is planning across the week truthful and reachable in ≤2 taps?
4. Is missed Strength recoverable without shame?
5. Does Maya’s Yoga help without becoming a feed?
6. Does desktop feel like a better spatial layout, not a wide phone?
7. Does it still work at 200% zoom and `prefers-reduced-motion`?
8. Could we implement this without breaking completion-intent or draft/save?

A mix is allowed inside B (A’s day rows, C’s pulse under Progress) but do
not reopen C as Home or A as the first screen without a new debate.

---

## Prototype map

| Route | What it is |
|---|---|
| `/ux/concepts` | Locked-B index, leading destination hybrids, archive cards |
| `/ux/concepts/spatial-home` | Home sketch (v8). May lag written locks. |
| `/ux/concepts/patterns` | Cross-app interaction library |
| `/ux/concepts/progress` | Progress sketch: Goal Ledger (aggregate lock; sketch is one-goal) |
| `/ux/concepts/progress/pulse` | P1 Week Pulse (alternative) |
| `/ux/concepts/progress/ledger` | P2 Goal Ledger (alternative of the same lock) |
| `/ux/concepts/progress/map` | P3 Continuity Map (alternative) |
| `/ux/concepts/community` | **Leading Community:** Team / Challenges / Leaderboards, no feed |
| `/ux/concepts/community/duo` | S1 Duo (alternative; Duo now lives on Plan) |
| `/ux/concepts/community/board` | S2 Shared Board (alternative; Duo week on Plan) |
| `/ux/concepts/community/quiet` | S3 Quiet Circle (alternative) |
| `/ux/concepts/you` | **Leading You:** identity hero + grouped controls |
| `/ux/concepts/you/list` | Y1 Settings List (alternative) |
| `/ux/concepts/you/person` | Y2 Person (alternative) |
| `/ux/concepts/you/controls` | Y3 Controls (alternative) |
| `/ux/concepts/spatial-plan` | B v1 archive (month-first) |
| `/ux/concepts/today-home` | A reference for day-list craft |
| `/ux/concepts/progress-pulse` | C archive; rejected as Home |
| `/ux/brand` | Unlisted visual language gallery (`noindex`, not in sitemap) |
| `/ux/brand/forge` | Dark serif + electric red (screenshot lineage only) |
| `/ux/brand/contour` | Topographic field guide (round 1, frozen) |
| `/ux/brand/folio` | Journey journal (round 1, frozen) |
| `/ux/brand/dawn` | Landing-energy alpine light |
| `/ux/brand/waypath` | Cairn path / embarking |
| `/ux/brand/field-notes` … `/ux/brand/col` | Round 2 mixes of Contour / Folio / Dawn Ridge |
| `/ux/brand/gazetteer-sans` | Type experiment; not the lock |
| `/ux/brand/col-sans` | Type experiment; not the lock |
| `/ux/brand/kit-gazetteer` | Gazetteer applied kit (Soft paper corners, Nest) |
| `/ux/brand/kit-col` | Col applied kit, Figtree on Col furniture |
| `/ux/brand/hue-contrast` | Study: toggle a second hue on Gazetteer vs a blue-and-white live sketch |
| `/ux/brand/glassline` … `/ux/brand/aero` | Atmospheres round: nine complete alternative worlds; exploratory, not a new lock |

Implementation: `src/features/ux-concepts/` and `src/app/ux/concepts/` for IA;
`src/features/ux-brand/` and `src/app/ux/brand/` for visual language.
Seeded, no auth, no production APIs, `noindex`. Do not import authenticated
planner surfaces.

**Fidelity bar:** written locks in this document win when they diverge from
`/ux/concepts`. Do not polish the prototype into the product. Clickable
shells are for arguing IA, not production chrome.

---

## What finalization will lock later

B is chosen. A follow-up should still lock:

- Week vs month as the phone default
- IA labels (Plan vs Planner; You vs Profile) and whether Today stays gone
- Chrome recipe (mobile title, FAB, desktop panes)
- Type scale and elevation (when a row vs a card) — options at `/ux/brand`
- Where Recover and Coach live in production
- Whether `planner_primary_tab` changes entry, order, or both
- Motion budget additions (complete / save / recover only)
- Skeleton and empty-state components
- Agent prompt for authenticated surfaces

Until we implement, production work should not invent another visual language
on live routes. Explore IA only inside `/ux/concepts`. Explore type, color,
and motif only inside `/ux/brand`.

---

## Agent prompt (exploratory only)

> Authenticated Goalmaxxing UX: Direction B (Spatial Plan) is the locked
> leading concept. Written locks in this document win when they diverge from
> `/ux/concepts`. Do not polish the prototype into the product. Do not restyle
> production AppShell, tabs, or planner chrome until we explicitly implement.
> Day is the checklist (Show unplanned for items never placed). Month shows
> movable tiles, not category dots. Category is pill fill. Progress default
> is an aggregate heatmap; one goal is editable; multi-select is read-only
> overlap. Duo week is the shared board; month/day keep today’s partner
> presence. Keep product-truth seed data. Follow this document for research
> context and `docs/ux/goalmaxxing-experience-design-guide.md` for public
> pages and interaction principles that already apply (status, recovery,
> reduced motion, no dark patterns).

---

## Review checklist for the gallery

- Each direction’s first viewport states the next action without a paragraph.
- Recover is visible in all three; copy is adaptive.
- Launch notes remains a **task**; Tempo run remains a **goal**.
- Desktop panes exist and are not a copy of the mobile stack.
- Reduced-motion still shows complete, recover, and coach states.
- No production route imported the concept shells.

---

## Research references

### Usability and platform

- [NN/g: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [NN/g: Heuristics for complex applications](https://www.nngroup.com/articles/usability-heuristics-complex-applications/)
- [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [W3C: WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [web.dev: Core Web Vitals](https://web.dev/articles/top-cwv)
- [Material 3: Navigation bar](https://m3.material.io/components/navigation-bar)
- Jakob’s Law (users prefer patterns they already know)

### Craft and product writing

- [Things 3: focused simplicity](https://blakecrosley.com/guides/design/things)
- [Things: Today / Upcoming / Anytime / Someday](https://culturedcode.com/things/support/articles/4001304/)
- [Flighty: Behind the Design (Apple)](https://developer.apple.com/news/?id=970ncww4)
- [Halide Mark II: Behind the Design](https://developer.apple.com/news/?id=x6bv1a36)
- [Superhuman: command palettes](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
- [Gentler Streak (The Verge)](https://www.theverge.com/24134067/gentler-streak-app-ios-apple-watch)
- [Streak creep (The Decision Lab)](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)
- [Uber mobile UX breakdown](https://www.reversebits.tech/blog/ubers-mobile-app-a-ui-ux-breakdown-no-one-talks-about/)

### Internal

- [`docs/ux/goalmaxxing-experience-design-guide.md`](./goalmaxxing-experience-design-guide.md)
- [`docs/motion_system.md`](../motion_system.md)
- [`docs/checklist-temporal-context.md`](../checklist-temporal-context.md)
- [`docs/checklist-planner-cleanup-audit.md`](../checklist-planner-cleanup-audit.md)
