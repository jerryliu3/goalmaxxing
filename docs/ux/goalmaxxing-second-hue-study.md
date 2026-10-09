# Second hue study

Status: **Exploratory, not a lock.** Lab: `/ux/brand/second-hue`. Part of
the theme identity study (`docs/ux/goalmaxxing-theme-identity-study.md`,
question 7). Production is unchanged; PR #1161 stays a draft until a mix
locks.

A second hue is worth adding. The open question is which jobs it takes, in
which form, and whether one answer holds across every registered theme.

## Where things stand

- **The role exists but is unused.** Every theme fills `selection` /
  `selectionForeground`. Study skins author a `secondHue`; Gazetteer uses
  sage; Original maps `selection` to `primary`, so it has no second hue.
  The only production reader is Gazetteer's `daySelected` wash.
- **Primary does about six jobs.** Actions (buttons, links), selection
  (selected calendar day ring, picker chips, milestone pills, goal dot
  scrollbar), today (month and agenda day numbers, goal-lane today),
  completion and progress (completion toggle, stamp, progress and XP bars),
  focus and drafts (composer focus, dashed draft tiles, draft shimmer), and
  some status text (`role="alert"` messages in `text-primary`).
- **Navigation marks in ink.** App tabs, the view switcher (raised neutral
  thumb), and in-page tabs all mark the destination in foreground ink.
- **#1161** (draft) moves app tabs, in-page tabs, and the segmented control
  to `selection`, with a thin selection-colored rule on desktop, and deepens
  Gazetteer's sage to `#526456`.
- **Other hues already have meaning:** gain green, recover yellow (the
  recovery panel trace, #1234), destructive red, and the six Mineral Candy
  categories (vermilion, Klein blue, ultraviolet, black cherry, malachite,
  saffron).

## Jobs

| Job | Question it answers | Today |
| --- | --- | --- |
| Act | What will this do? | Identity |
| Where you are | Which destination or view is open? | Ink |
| What you picked | What is chosen right now? | Identity |
| Now | Where is today? | Identity |
| Done | What has been earned? | Identity |
| Focus and drafts | What is being edited? | Identity |

## Measurements

WCAG ratios against each theme's page, from the registry (the lab shows live
values). Separation is the lightness ratio between identity and the second
hue's fill; near 1 means they differ by hue alone.

| Theme | Identity as line | Second as line | Label on second | Separation |
| --- | --- | --- | --- | --- |
| Original | 5.6 | 5.6 | 5.8 | 1.00 (none) |
| Gazetteer sage | 5.6 | 3.9 | **3.7** | 1.44 |
| Gazetteer deep sage (#1161) | 5.6 | 5.9 | 5.6 | 1.06 |
| Undertow | 12.0 | 8.0 | 6.9 | 1.49 |
| Kiln | 7.1 | 8.3 | 6.4 | 1.18 |
| Court | 8.3 | **1.1** | 8.7 | 7.5 |
| Opaline | 7.6 | **1.3** | 5.6 | 5.7 |
| Bloodstone | **2.9** | 9.9 | 6.6 | 3.5 |
| Pitlane | **3.0** | 14.2 | 10.6 | 4.8 |

Bold values miss their floor (3:1 for lines and marks, 4.5:1 for labels).

## Findings

1. **A second hue has three forms, and the registry stores two.** A fill, the
   label on that fill, and a line drawn on the page. Court's lime and
   Opaline's aqua are fill-only: #1161's desktop rule and line-tab
   underline vanish on them. Any lock needs a line form, either authored
   (`selectionLine`) or derived by darkening toward ink until it reaches
   3:1 (the lab's derivation).
2. **Solid second hues on light themes land at identity's lightness.** To
   carry a white label and draw a line, a light-theme second hue must be
   mid-dark, like identity. Every solid candidate (teal, violet, deep sage,
   Prussian) separates by about 1.0 to 1.2: two brand colors competing,
   distinguishable only by hue, which fails under color-vision deficiency.
3. **Tints separate by lightness and read as state.** A pale fill with deep
   ink (library surface/ink pairs such as petroleum, silver lilac,
   pistachio, glacier) separates from identity by 3:1 or more and reads as
   "selected" rather than "press me". Court and Opaline already author
   their second hue this way. Material 3 does the same: its navigation
   indicator and selected filter chips sit on a secondary container.
4. **Dark skins invert the problem.** Bloodstone's and Pitlane's identities
   fail as lines; their second hue is the luminous one. On dark themes,
   form (fill vs line) may decide the assignment more than meaning does.
5. **The hue wheel is crowded.** Every Original candidate neighbors an
   existing meaning: teal near gain and malachite, violet near Personal,
   tangerine near recover and saffron. Original's identity blue already
   sits beside Career's Klein blue. Low-chroma second hues (silver lilac,
   pistachio) avoid collisions by barely being a hue.
6. **#1161's deep sage trades one problem for another.** It fixes the label
   (3.7 to 5.6) but collapses separation from rust (1.44 to 1.06).

## Hypotheses

The lab compares these mixes; each job can also be set by hand.

- **One hue** (shipped): identity everywhere, navigation in ink.
- **Selection** (#1161): navigation, in-page tabs, and the view switcher
  take the second hue.
- **Containers**: the second hue sits behind what is selected (destination,
  view, chips, selected row). Today, focus, actions, and completion stay
  identity.
- **Where and when**: identity is for doing and earning; the second hue
  carries every state job (destination, selection, today, focus).
- **Reward**: the second hue is what you earn (completion, progress);
  navigation stays ink.

## Lean, to confirm in the lab

A starting position for review, not a lock:

- **Containers, in tint form.** The second hue fills selected things
  (phone tab indicator, view switcher thumb, selected chips, selected-row
  wash), with its line form for rules and rings (desktop tab rule, selected
  day ring).
- **Identity keeps act, done, and today.** Pressing and earning are the
  brand moments, and completion already carries the Nest and stamp. Today
  stays the identity marker so "now" and "picked" never share a color.
- **Original gets an authored second hue.** Petroleum tint or silver lilac
  tint are the first candidates to judge.
- **Gazetteer tries a tint before a deeper solid.** Pistachio or glacier,
  against #1161's deep sage.

## Registry shape (sketch)

- Add a line form to the selection pair (`selectionLine`), authored for
  live themes and derived for study skins.
- Add a registry test: line at least 3:1 on the page, label at least 4.5:1
  on the fill, and separation from identity of at least 1.5 for light
  themes (or a documented exception).
- Components read `selection*` only for the jobs that lock. #1161 is
  rebased onto the lock rather than merged as is.

## Questions for review

1. Which mix? Is Containers the right balance, or should today and focus
   also move (Where and when)?
2. Tint or solid for Original and Gazetteer?
3. Should desktop navigation keep its ink rule even if the phone indicator
   takes the second hue?
4. Is a near-neutral second hue (silver lilac) enough identity, or does
   each theme want a clearly colored partner?
5. Should status messages stop using identity text and get their own role?

## Evaluating in the lab

- Pick a mix, then step through every theme in the comparison row.
- Give each board a five-second glance: name what each color means.
- Check deuteranopia and protanopia (Chrome DevTools, Rendering, Emulate
  vision deficiencies) on Original and Gazetteer.
- Check the phone tab bar and view switcher at phone width.

Out of scope: per-theme category palettes (identity study questions 1 to 4)
and web dark mode.
