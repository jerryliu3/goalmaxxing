# Theme identity study

Status: **Scoped, not started. Exploratory, not a lock.** Production keeps
one category palette for every theme until this study locks a direction.

One round covering what makes a theme feel like itself beyond page colors
and type: its goal category colors, and the unfinished parts of the study
skins (faces, card materials, heading styling). They share one question,
"what does a theme own?", and one place to answer it, the theme registry
(`packages/shared/src/brand`).

## Where things stand

- **Categories are global.** Mineral Candy (`categories.ts`) colors every
  theme since #1148: Health vermilion, Career Klein blue, Personal
  ultraviolet, Interpersonal black cherry, Finance malachite, Other saffron.
  Goals store the category's surface hex in `goals.color`, and the
  `goal_categories` table holds the same surfaces.
- **Fills use the pigment.** Goal cards (#1149) and planner pills (#1162)
  mix each category's stronger pigment rather than its pastel surface, so
  categories stay distinct on glass, alloy, and paper.
- **Gazetteer lost its earth tones.** Before #1148 Gazetteer re-inked
  category colors to sage, rust, walnut, rust-red, ochre, and taupe. That
  set was the weakest we measured: on pills, Career/Interpersonal (both
  rusts) and Personal/Other (both browns) are about ΔE 2.6, against about
  7.9 for Mineral Candy pigments. Bringing it back means re-tuning it, not
  restoring it.
- **Study skins are partial.** The six shortlisted skins (Undertow, Kiln,
  Centre Court, Opaline, Bloodstone, Pitlane) keep their authored palette,
  faces, and weights; `themes/study.ts` derives everything else. Quarry,
  Fieldwork, Longplay, and Lido are set aside in `library/`. Card materials
  and heading tracking/uppercase from the original skin round (#965) were
  not carried over, and some faces read as gimmicky in real UI.

## Questions

1. **Should each theme own its category colors?** If yes, the registry gains
   a six-color category set per theme (surface, pigment, ink), generated into
   `themes.css` like the other roles, and Original keeps Mineral Candy.
2. **What follows the theme?** Pills, badges, swatches, insights charts, and
   the mobile Nest mark almost certainly do. Decide whether 3D goal cards do
   too, or stay Mineral Candy everywhere as the goal's identity.
3. **How do stored colors resolve?** Category goals store a surface hex. A
   per-theme set needs category goals to resolve their color from the
   category key at display time (custom colors stay as stored), which also
   retires Gazetteer's legacy re-inking map. Confirm this before designing
   palettes, since it decides whether a migration is needed.
4. **Career vs Personal.** Klein blue and ultraviolet are the closest pair in
   Mineral Candy (pill ΔE about 7.9 with pigments). Pool cyan or petroleum
   for Career separates it from Personal, though Career/Finance then becomes
   the closest pair (about 7.3). Decide here, alongside any per-theme sets,
   so goals move at most once.
5. **Study skin faces.** Vet each shortlisted skin's display and sans faces
   at real sizes (item names, figures, eyebrows) and replace any that read
   as novelty. Criteria: legible at 13–15px, the weights the text roles ask
   for, and a Google Fonts or bundled source.
6. **Study skin materials and headings.** Decide which of #965's card
   materials and heading treatments (tracking, uppercase) come back as
   per-theme variants, and which stay in skin notes.
7. **Second hue.** Every theme fills `selection`, but production barely
   reads it and Original maps it to primary. Decide which jobs (act,
   place, pick, today, done, focus) take each theme's second hue, and in
   which form (fill, label, line). Explored in
   `docs/ux/goalmaxxing-second-hue-study.md` and `/ux/brand/second-hue`;
   #1161 waits on that answer.

## Constraints

- Every set passes a distinguishability check at the pill mix (target
  weakest pair at least ΔE 7 on that theme's paper) and readable ink on its
  surface. Encode the check as a registry test so new sets cannot regress.
- Theme values live only in `packages/shared/src/brand`; components keep
  reading roles.
- Production pages carry no study-only CSS or fonts (the
  `STUDY_THEMES_ENABLED` contract from #1136).

## Deliverables

- A `/ux/brand` round with, per theme: a category board (pills on the
  calendar, badges, swatches, a glass/alloy/chromatic card row, an insights
  chart) and the vetted type specimen.
- A side-by-side of Gazetteer earth tones (re-tuned) vs Mineral Candy
  pigment on Gazetteer paper.
- A short proposal for the registry shape (category role per theme, display
  resolution by category key) with the migration story, if any.
- A locked second hue mix, with a line form added to the selection pair
  and a registry contrast test.

## Already decided

- Mineral Candy is the global palette until this study locks (#1148).
- Pills and cards mix pigment, not surface (#1149, #1162).
- Quarry, Fieldwork, Longplay, and Lido stay out of the picker (#1136).
