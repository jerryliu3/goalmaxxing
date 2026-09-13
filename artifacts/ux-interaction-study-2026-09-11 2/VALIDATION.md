# Validation

Verified in local headless Chromium with networking disabled:

- Portable HTML opens from file://, initializes all three study groups, and needs no server.
- 320px, 360px, and 736px content widths; light and dark appearance; no horizontal root overflow.
- Both vertical calendar concepts: month tile → vertical week → day → adjacent date → month.
- Vertical week shows seven aligned full-width rows with row heights above 44px.
- Reduced-motion view changes and rapid interruption of an animated transition converge to the requested view.
- Living folio: overview → individual goal → log → undo → overview.
- Rhythm weave: select goal → scrub date → remove session → restore session.
- Goal constellation: select child → follow actual fixture link to parent.
- Evidence studio: inspect evidence → return → capture a note → inspect the saved note.
- Original calendar study remains accessible in the portable export.
- No JavaScript runtime errors during these checks.
- Visually inspected mobile screenshots for vertical week, folio collection, and constellation.

The note action uses a local button handler rather than browser form submission because the inline host sandbox does not grant form submission. The same code works in the portable export.

Scope limits: no real backend, production integration, persistent saves, pinch gestures, physical touch-device or Safari validation. The calendar fixture uses equal-height week rows and one month. See HANDOFF.md for the production behavior still to explore.
