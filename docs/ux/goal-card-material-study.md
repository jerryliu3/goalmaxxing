# Goal card materials — nine directions

Study route: `/ux/brand/card-materials` (existing UX labs access applies).
All nine render the real `TempoGoalCard`. Category color, information hierarchy,
schedule, effort, and creation/history copy come from the same component used
in the product. Study styles are scoped to the gallery; no production material
has been selected yet.

## Directions

| Direction | Material and interaction | Best fit | Implementation scope / tradeoff |
| --- | --- | --- | --- |
| Liquid Glass | Translucent beveled face, continuous polished thickness, pointer lighting, perspective tilt | One featured goal or active folio card | CSS blur plus layered gradients; requires contrast checks over backgrounds. Milky face and opaque fallback preserve readability. Approximate optical glass, not a physical refraction shader. |
| Ceramic Relief | Richer category glaze, continuous rounded edge, raised target and rhythm | Everyday goal creation and detail | CSS extrusion and depth planes; no blur or graphics runtime. Restrained elevation needed when several cards share a screen. Recommended starting point. |
| Layered Diorama | Colored backplate, offset sheets, floating type at different depths | Folio collection and large previews | CSS preserve-3d and transforms. Requires outer space; compress to a flat treatment in dense layouts. Most expressive dimensional option. |
| Foil Print | Dark printed collectible, spectral foil numerals, narrow iridescent sheen, solid gilded edge | Completed goals and collection moments | Selective foil on one gilded card with perspective tilt. Preserve dark/light type contrast and avoid making routine goals feel like rarity tiers. |
| Woven Paper | Matte cloth fibers, stitched inset, colored ink | Archive and warm everyday cards | Small CSS texture gradients; no tilt. Quietest match for the cloth folio. Texture should remain below text contrast. |
| Pearl Reserve | Light ivory pearl lacquer, champagne foil, gilded thickness | A light premium everyday or collection card | Fine-stationery and mother-of-pearl cues. Bronze foil stays dark enough for the ivory face; no rear sheet. |

| Ruby Cabochon | Glossy ruby, rose-gold setting, moving soft reflection | Warm gemstone keepsake | Smooth cabochon lighting with a calm dark-red center. Shares the perspective body and synchronized reflection path. |
| Sapphire Prism | Blue crystal, platinum rim, angular corner facets | Cooler jewel-like collection | Faceted highlights stay near the border. Narrow cyan-white reflection and silver numerals move with the pose. |
| Platinum Mirror | Light satin silver, polished rim, graphite-metal numerals | Bright metallic alternative to Pearl | Brushed center and reflective perimeter keep the material metallic without washing out the text. |

## Comparison controls

- Three shared samples: green weekly goal, violet lifetime target, rose daily goal
  with a long title. These exercise color, target size, effort, and wrapping.
- Creation/completed copy switches through the actual card API.
- Paper/ink backdrops expose how edges and materials read in different settings.
- Mouse tilt and explicit Tilt/Rest buttons offer the same posed view to touch
  and keyboard users. No device orientation permission is needed.
- Still mode and OS reduced motion remove rotation. No ambient animation loop.

## Recommendation and next implementation boundary

Foil Print and Pearl Reserve are the preferred directions. The next round
explores gemstone and precious-metal finishes: smooth ruby, cut sapphire, and
light platinum. Midnight Guilloché and Oxblood Atelier are retired from the
current lineup; their prior implementations remain in Git history. The new
finishes share the same perspective body, pose-driven lighting, and Tempo goal
component. Glass, Ceramic, Diorama, and Woven remain available.

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

## Material refinement

Solid materials use a connected ten-pixel-deep CSS body with four side planes,
rounded corner facets, and a rear face. The former downward edge shadows are
removed. Side visibility and apparent thickness now come from perspective.
They render no offset backplate or second sheet. Glass also loses the separate
colored lens in its backdrop. The number and its rhythm label cast soft shadows;
Ceramic uses a stronger category-color glaze. Foil preserves its ink, fine frame,
and spectral numerals while gaining tilt and a gilded edge. Diorama and Woven
Paper are unchanged. The original effort bars remain the difficulty cue.

## Precious finishes

Pearl Reserve remains unchanged as a material direction. Ruby Cabochon, Sapphire
Prism, and Platinum Mirror replace the two rejected directions and extend the
metallic theme. They are explorations, not a production style selection. All
support sample/history switching, mouse perspective, explicit Tilt/Rest, still
mode, and OS reduced motion. There are no external assets or graphics libraries.

Verification remains approval-gated. Functional interaction coverage is included
as code; no tests, lint, typecheck, browser checks, or CI were run for this update.

## Perspective and reflection refinement

The shared body uses front/back separation and connected side planes instead of
shadow-based extrusion. Eight small quads per rounded corner keep the rim joined
to the card silhouette. The existing goal card remains the front surface; no
canvas, graphics runtime, or duplicate goal content is introduced.

One short-lived animation-frame loop interpolates the card orientation and derives
all lighting from that same angle. A fixed upper-left light is transformed into
card space for rim shading and a stylized specular beam. Foil's beam position,
angle, intensity, broad gloss, and numeral finish respond together. This is a
bounded CSS lighting approximation, not physical refraction. The loop stops at
rest and cancels on unmount or still/reduced-motion mode. Touch and keyboard Tilt
use the identical pose and lighting path.
