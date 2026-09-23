# Secondary color in the live application

Follow-up to PR #975. The picker already loaded the study palettes; missing
consumer roles made their live appearance differ from the prototypes.

## Findings

The local `six-brand-worlds.html` and `strong-brand-worlds.html` studies use
secondary for the current tab, today, and prominent progress indicators. Runtime
navigation used primary and hardcoded white. Radix tabs selected a neutral fill;
filter chips, the calendar view switch, and progress bars selected primary.
Production chrome also duplicated selection/today colors independently of the
theme. Scoped previews did not receive application chrome tokens at all.

## Role contract

| Meaning | Source | Consumers |
| --- | --- | --- |
| Main action | primary / primaryForeground | Default Button, CTA, action links |
| Current state | secondary / secondaryForeground | Navigation, tabs, selected filters, selected menu options, calendar view, today |
| Progress | secondary | Shared Progress (including XP), competition bars, milestones |
| Mixed-content selection | secondary wash over background | Selected work rows, goal list, onboarding choices |
| Goal identity | Category library | Goal/category surfaces and ink |
| Status | Dedicated status tokens | Warnings, recovery, completion marks |

`applicationChrome` derives selection and today from the theme's semantic pair.
`getBrandThemeStyle` supplies these roles to both scoped previews and document
CSS, so preview descendants cannot inherit a different host's selection color.
Legacy role definitions were removed from production chrome. Original and
Gazetteer retain their authored secondary palettes; this change does not invent
new palette colors. The same consumers support every catalog theme.

Solid secondary surfaces must use their paired foreground. Line tabs keep
normal readable text with a secondary underline. Today-plus-selection uses the
paired foreground as an outline so the outline is visible against today's fill.
Mixed-content rows use a wash because nested category chips and metadata own
their own colors. Primary remains on action affordances; category palettes,
status colors, historical heatmap scales, and independent UX studies are not
globally recolored.

## Review and coverage

Source inspection covered the theme adapters, shared UI/navigation, and live
planner, checklist, progress, community, check-in, and onboarding consumers.
Regression coverage covers all catalog themes in both document appearances,
scope/document parity, primary action preservation, foreground pairings,
navigation, tab state, progress semantics, and existing calendar/filter tests.
Tests, typecheck, lint, browser checks, and CI were not run, per repository policy.
