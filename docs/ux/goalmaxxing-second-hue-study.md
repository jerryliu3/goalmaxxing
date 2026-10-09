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

## Lab review (2026-10-09)

First pass in the browser at desktop width, all eight themes.

- **Original's selected row is hard to read today.** Its `daySelected` is
  solid `#4687d8` under ink, and the muted subtitle nearly disappears. The
  lab renders production's own class, so this is a production issue. A
  petroleum tint wash under Containers fixes it.
- **Original, Containers, petroleum tint reads cleanly.** Blue keeps Save,
  today, completion, and progress; the pale petroleum marks the open tab,
  view, chip, and selected row.
- **Gazetteer, pistachio tint keeps rust as the only loud color.** Deep
  sage reads as a second dark ink beside rust.
- **Tint lines collapse toward ink.** Pistachio's line form is 9.2:1, so
  desktop tab rules and selected-day rings look like ink. That matches
  shipped navigation, but the second hue then shows only in fills.
- **Today as a tint loses salience.** Under Where and when, Original's
  today becomes a pale circle and is harder to find than the selected day.
  This supports keeping today on identity.
- **Pitlane's lime out-shouts its identity.** Any mix that puts the second
  hue on fills makes lime the loudest color on the page, ahead of blue Save.
- **Court's derived line works.** The desktop rule and line-tab underline
  stay visible in a dark olive; #1161's literal `bg-selection` would draw
  them in lime at 1.1:1.
- **The base line tabs draw no underline.** `TabsTrigger` sizes its rule on
  `data-horizontal`, which Radix does not set (it sets `data-orientation`).
  The check-in supplies its own rule geometry, and the lab does the same.
  #1161's selection-colored line-tab rule was therefore never visible.

## Round 2: identity, shade, optional accent (2026-10-09)

Review feedback: Original, Gazetteer, and Bloodstone want a shade of their
identity rather than a new color. Undertow and Kiln read well with a
contrasting partner, and Court's lime reads as a complementary one. The lab
now models every theme with three colors:

- **Identity**: the theme's primary, solid.
- **Shade**: the identity washed toward the page (18% on light pages, 40% on
  dark ones) with ink labels. Every theme has one; nothing is authored.
- **Accent** (optional): a second hue, drawn solid or as a tint. A theme
  without one uses its shade wherever a mix asks for the accent.

Drafts are split from focus as their own job, and the selected agenda row
now follows the "What you picked" tone in every theme.

### Findings

1. **Solid against tint is not a global switch.** A computed tint only works
   when its source is a mid-tone. On dark pages, tinted pastels go gray
   (Undertow lavender, Kiln periwinkle, Bloodstone slate). Accents that are
   already pale (Court lime, Opaline mint) vanish when tinted, because their
   registry fill already is a tint. Strength belongs to each theme's
   authored accent, not to the mix.
2. **Shade works on every theme.** Identities are mid-tones, so their wash
   is always a soft container; ink on the shade is at least 5.2:1 in all
   eight. Containers with shade is the only mix with no failing board.
3. **The accent's problem is loudness, not hue.** Accent-to-page contrast
   over identity-to-page contrast: Court 0.1×, Opaline 0.2×, Undertow 0.7×,
   Kiln 1.2×, Bloodstone 3.4×, Pitlane 4.7×. The two themes where the accent
   felt wrong are the two where it is louder than the identity. Proposed
   rule: an accent is at most 1.25× as loud as its identity. Pitlane passes
   with its lime washed to olive (1.1×).
4. **Selected rows want the shade.** Rows drawn in solid identity (a mint bar
   on Undertow, an orange one on Kiln) compete with Save.
5. **Today and done stay identity**, as round 1 found.
6. **Drafts in the accent are clean in meaning but faint.** On dark pages a
   15% wash of the accent barely separates from the card. Adopting it needs
   a stronger draft treatment.
7. **Bloodstone's shade sits close to its card.** The selected row is only a
   little redder than an unselected one; it may need a deeper shade or a
   ring.
8. **Two pairs differ by hue alone**: Kiln periwinkle with orange (1.18) and
   Pitlane olive with blue (1.10). They are far apart in hue, but still need
   a color-vision emulation check.

### Proposal

| Job | Color |
| --- | --- |
| Act | Identity |
| Where you are | Accent; shade without one |
| What you picked | Shade |
| Now | Identity |
| Done | Identity |
| Focus | Identity |
| Drafts | Accent; identity without one |

Accents: none for Original, Gazetteer, and Bloodstone; the registry pair for
Undertow, Kiln, Court, and Opaline; a toned-down lime for Pitlane.

The rule in one line: identity is for doing, now, and done; the shade sits
behind what you picked; the accent, where a theme has one, says where you
are.

Ranking of the options compared:

1. **Proposal.** Every theme keeps one loud color, and contrast themes keep
   their partner in the most visible chrome.
2. **Containers with shade, no accents.** The safest. It loses the Undertow
   and Kiln contrast you liked.
3. **Selection solid (#1161) with the loudness rule.** Fine for contrast
   themes, but selected rows stay solid identity.

Set aside: tint as a global strength (gray on dark pages), Reward (thin
marks go muddy), and Where and when (today loses salience).

Registry implications: a derived `shade` role with no authoring; an optional
accent with a line form; a registry test for loudness (at most 1.25×),
labels (4.5:1), and lines (3:1). #1161's selection pair becomes the accent
and is used for navigation only.

### Refinements after review

- **Pitlane keeps its registry lime.** The toned-down olive lost the theme.
  The loudness ratio stays in the readout as advice, not a gate: Pitlane is
  a deliberate exception.
- **Selected things go solid where the shade would vanish.** A new "Shade
  or solid" tone uses the shade where it separates from the card by at
  least 1.2:1, and solid identity where it does not. Shade on card: Original
  1.33, Gazetteer 1.37, Undertow 2.17, Kiln 1.98, Court 1.21, Pitlane 1.25,
  Opaline 1.04, Bloodstone 1.09. Opaline and Bloodstone go solid, which
  gives them the clear selected row that Selection solid had.
- **A theme without an accent falls back the same way.** Solid accent jobs
  use "Shade or solid", so Bloodstone's navigation pill is solid red. With
  Save, today, and the row also red, Bloodstone gets loud; its registry
  slate for navigation is the alternative.
- **Drafts: the treatment matters more than the color.** In the lab's
  drafts comparison, the shipped wash in the accent ("same treatment") is
  indistinguishable from a card on dark themes and from identity on Court.
  A marked draft (dashed border plus a small solid "Draft" chip) reads in
  all eight, with the chip in the accent where a theme has one and in
  identity otherwise.

Updated proposal rows: What you picked is "Shade or solid"; Drafts are a
marked tile in the accent, or identity without one.

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

Round 1's starting position, superseded by the round 2 proposal above:

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
6. Where a second hue is louder than the identity (Pitlane), should it be
   toned down, or should the two swap jobs?
7. Round 2: should drafts take the accent, or stay identity everywhere?
   Lean: marked drafts, accent chip where a theme has one.
8. Round 2: is Pitlane's toned-down olive still Pitlane? Answered: no; it
   keeps the registry lime.
9. Bloodstone: no accent with solid red navigation, or its registry slate?

## Evaluating in the lab

- Pick a mix, then step through every theme in the comparison row.
- Give each board a five-second glance: name what each color means.
- Check deuteranopia and protanopia (Chrome DevTools, Rendering, Emulate
  vision deficiencies) on Original and Gazetteer.
- Check the phone tab bar and view switcher at phone width.

Out of scope: per-theme category palettes (identity study questions 1 to 4)
and web dark mode.
