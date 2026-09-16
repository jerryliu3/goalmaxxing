# Goal card materials — five directions

Study route: `/ux/brand/card-materials` (existing UX labs access applies).
All five render the real `TempoGoalCard`. Category color, information hierarchy,
schedule, effort, and creation/history copy come from the same component used
in the product. Study styles are scoped to the gallery; no production material
has been selected yet.

## Directions

| Direction | Material and interaction | Best fit | Implementation scope / tradeoff |
| --- | --- | --- | --- |
| Liquid Glass | Translucent beveled face, separate rear lens, pointer lighting, perspective tilt | One featured goal or active folio card | CSS blur plus layered gradients; requires contrast checks over backgrounds. Milky face and opaque fallback preserve readability. Approximate optical glass, not a physical refraction shader. |
| Ceramic Relief | Opaque glaze, thick rounded edge, raised target and title | Everyday goal creation and detail | CSS extrusion and depth planes; no blur or graphics runtime. Restrained elevation needed when several cards share a screen. Recommended starting point. |
| Layered Diorama | Colored backplate, offset sheets, floating type at different depths | Folio collection and large previews | CSS preserve-3d and transforms. Requires outer space; compress to a flat treatment in dense layouts. Most expressive dimensional option. |
| Foil Print | Dark printed collectible, spectral foil numerals, narrow iridescent sheen | Completed goals and collection moments | Static gradients and selective foil; no tilt. Preserve dark/light type contrast and avoid making routine goals feel like rarity tiers. |
| Woven Paper | Matte cloth fibers, stitched inset, colored ink | Archive and warm everyday cards | Small CSS texture gradients; no tilt. Quietest match for the cloth folio. Texture should remain below text contrast. |

## Comparison controls

- Three shared samples: green weekly goal, violet lifetime target, rose daily goal
  with a long title. These exercise color, target size, effort, and wrapping.
- Creation/completed copy switches through the actual card API.
- Paper/ink backdrops expose how edges and materials read in different settings.
- Mouse tilt and explicit Tilt/Rest buttons offer the same posed view to touch
  and keyboard users. No device orientation permission is needed.
- Still mode and OS reduced motion remove rotation. No ambient animation loop.

## Recommendation and next implementation boundary

Start with Ceramic Relief for a broadly reusable card. Keep Liquid Glass as the
alternate if luminous transparency is the priority, and Woven Paper if the folio
should feel more archival. Diorama suits a single focused collectible; Foil Print
suits a completion moment. Do not combine all five into one material.

After a direction is chosen, move only its selected styling into the canonical
Tempo card stylesheet. Reconcile the current difficulty-dependent stacked edge
with the chosen material (retain the effort bars as the explicit difficulty cue).
Scope optional pointer tilt to large focused previews instead of every card on
the page. Inspect creation, review, and history at narrow widths, long titles,
200% zoom, reduced motion, and forced colors before broad rollout. No data model,
API, or goal semantics need to change.

## Folio opening companion

The production book opening is a separate change: capture the selected book’s
viewport center, size, and current transform; animate that shared book cover
to screen center; rotate its cover on the spine while the reader fades in.
The roughly 900 ms sequence overlaps travel, opening, and reveal. The dialog
owns Escape and focus from the start, holds reader controls inert during the
entrance, and returns focus to the original shelf button on dismissal. Reduced
motion goes directly to the reader. Closing interrupts the decorative animation
without delaying the user.
