# Goal card materials — twelve directions

Study route: `/ux/brand/card-materials` (existing UX labs access applies).
All twelve render the real `TempoGoalCard`. Category color, information hierarchy,
schedule, effort, and creation/history copy come from the same component used
in the product. Study styles are scoped to the gallery; no production material
has been selected yet.

## Directions

| Direction | Material and interaction | Best fit | Implementation scope / tradeoff |
| --- | --- | --- | --- |
| Liquid Glass | Translucent beveled face, continuous polished thickness, pointer lighting, perspective tilt | One featured goal or active folio card | CSS blur plus layered gradients; requires contrast checks over backgrounds. Milky face and opaque fallback preserve readability. Approximate optical glass, not a physical refraction shader. |
| Ceramic Relief | Richer category glaze, continuous rounded edge, glazed flat type | Everyday goal creation and detail | CSS body extrusion; no blur or graphics runtime. Restrained elevation needed when several cards share a screen. Recommended starting point. |
| Layered Diorama | Colored backplate and offset sheets behind one flat reading face | Folio collection and large previews | CSS preserve-3d and transforms. Requires outer space; compress to a flat treatment in dense layouts. Most expressive dimensional option. |
| Foil Print | Dark printed collectible, spectral foil numerals, narrow iridescent sheen, solid gilded edge | Completed goals and collection moments | Selective foil on one gilded card with perspective tilt. Preserve dark/light type contrast and avoid making routine goals feel like rarity tiers. |
| Woven Paper | Matte cloth fibers, stitched inset, colored ink | Archive and warm everyday cards | Small CSS texture gradients; no tilt. Quietest match for the cloth folio. Texture should remain below text contrast. |
| Pearl Reserve | Light ivory pearl lacquer, champagne foil, gilded thickness | A light premium everyday or collection card | Fine-stationery and mother-of-pearl cues. Bronze foil stays dark enough for the ivory face; no rear sheet. |

| Ruby Cabochon | Glossy ruby, rose-gold setting, moving soft reflection | Warm gemstone keepsake | Smooth cabochon lighting with a calm dark-red center. Shares the perspective body and synchronized reflection path. |
| Sapphire Prism | Blue crystal, platinum rim, angular corner facets | Cooler jewel-like collection | Faceted highlights stay near the border. Narrow cyan-white reflection and silver numerals move with the pose. |
| Platinum Mirror | Light satin silver, polished rim, graphite-metal numerals | Bright metallic alternative to Pearl | Brushed center and reflective perimeter keep the material metallic without washing out the text. |

| Prismatic Pearl | Warm-white pearl with category-tinted moving color | Light everyday premium card | Category color controls wash, rim, and numeral finish; no beam. |
| Chromatic Foil | Graphite face and category-tinted foil | Dark premium collectible | Category color controls beam, metal, frame, and edge; pale text stays readable. |
| Anodized Alloy | Brushed metal infused with category color | More visibly colored everyday card | Category color controls metal body and rim; broad reflection and dark numerals soften the finish. |

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
colored lens in its backdrop. Lettering now has a shallow relief comparison; see
`Surface lettering comparison` below. Ceramic uses a stronger category-color glaze.
Foil preserves its ink, fine frame, and spectral numerals while gaining tilt and
a gilded edge. The original effort bars remain the difficulty cue.

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

## Held rotation and quieter optics

Pearl's pastel layer now shifts its background position gently with the pose;
it does not receive a beam. Reflective cards sweep their beam mainly left/right,
with a faster crossing and a tightly bounded angle rather than a rotating stripe.

Solid study cards support primary-pointer capture and unlimited held rotation on
both axes. Releasing keeps the inspection pose; Reset or Home returns to the
nearest equivalent resting view without unwinding whole revolutions. Keyboard
arrows rotate, Shift increases the step, and Enter turns the card over. A finished
rear face replaces mirrored text at the back. Hover tilt remains the default
until a drag or keyboard inspection. Touch dragging is confined to the card;
the surrounding page remains scrollable. Still/reduced motion cancels capture.
Study-card text is unselectable but stays available to assistive technology.

## Category-responsive additions

Prismatic Pearl, Chromatic Foil, and Anodized Alloy use `fields.color` as their
only chromatic input. Their mixing colors are neutral; no fixed gemstone hue
competes with the category. They share the same goal component, moving optics,
full-rotation controls, and finished back face. Switch the sample goal between
green, violet, and rose to compare the finish. The original material concepts
remain available for comparison; these additions do not recolor them.

## Previous flat-lettering pass

Two passes attempted embossed study type: first a one-pixel highlight and cast
shadow driven by the card-local light vector, then an eight-step extruded wall
with pose-driven side lighting. Neither read as dimensional in review; the
second also muddied the metallic numerals it was meant to sculpt. The extruded
wall was reverted on its own. This pass removes what remains: the `--relief-*`
optics outputs, the per-material relief shadows on study text, and the depth
planes that floated type above the face.

That pass printed study type flat on the card face. Dimensionality comes from the
card body, its connected side planes, its edges, and its moving reflections.
Materials still style lettering by color and foil gradient only — the metallic
numerals keep their pose-driven gradient position, since that is surface finish
rather than geometry. The new surface-lettering comparison below revisits relief with a much smaller
bevel and keeps this printed treatment as an option.

## Application formats and earned objects

The study now has three views. Goal cards preserve the twelve-way comparison.
“In the app” applies one selected material to a community challenge, compact
leaderboard, profile trading card, and landscape team membership card. Their proportions and information
hierarchies differ, but face treatment, edge, and moving light remain one
system.

“Trophies & objects” moves beyond rectangular UI: an annual momentum cup, a
hundred-session medal, a faceted summit, and a momentum compass inherit the
selected material. These are SVG illustrations with CSS lighting and bounded
perspective tilt, without external assets or a graphics runtime. They
test whether a chosen material can identify both everyday product surfaces and
rare earned moments; they do not define achievement rules or production rewards.

## Surface lettering comparison

The study defaults to shallow embossed lettering. The Lettering control also
offers engraved and printed treatments, retained between all three study views.
Opposed subpixel highlights and shadows bevel the headline and numerals without
separating text into floating depth planes. Small metadata stays printed for
legibility; forced-colors removes the effect. Production cards are unchanged.

## Application card editions

Challenge, league, profile, and landscape team membership studies now compose
the same MaterialStage as the original goal previews: all twelve face recipes,
rounded sidewalls, reverse face, tilt, held rotation, and keyboard controls.
Application CSS owns layout only. The team edition adapts into a readable vertical
layout on phones. Category color and lettering controls work across all editions.
The data and identities are illustrative, not connected account records.

## Objects of progress

Four new vector sculptures replace the original icon-based objects: a hollow,
fluted annual chalice with open handles; a reeded milestone medal and woven
ribbon; an asymmetric faceted summit award; and an enamel compass with a jewel
bearing. They are dimensional illustrations with bounded perspective tilt, not
full 360-degree meshes. Unique per-instance SVG definitions supply metal, rim,
cavity, enamel and moving spectral coatings. All twelve finish selections and
category-responsive colors are supported. Still mode and OS reduced motion
stop movement; each sculpture has an accessible description and a tilt control.
These are illustrative achievement concepts, not new award eligibility rules.
