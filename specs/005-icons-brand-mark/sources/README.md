# Sources read for spec 005 (2026-11-10)

Reference material only. Nothing in this directory ships, and nothing from the Spec Kitty design library is copied
(constitution VI).

## Ocelle brand mark

- `ocelle-docs-logo.reference.svg`: a byte copy of `public/logo.svg` in `Ocelle-HQ/docs` at `main`,
  commit `9974686e2fdffe211a5887670a83497df9cf5f78` (2026-11-02). Issue #17 names `src/theme/assets/logo.svg`; that
  path does not exist on `main`, where the file is `public/logo.svg`. It is the **app icon** (concept D: a rounded
  `#15130F` square around the rosette), not the bare rosette.
- `docs/context/brand.md` (same commit), section "Mark": "An organic rosette: a broken ring around a spot. The spot
  is the agent, the ring is the boundary, and the gaps are the only exits the policy allows." It names
  `rosette-light.svg` (on light grounds), `rosette-dark.svg` (on dark grounds) and `app-icon.svg` (favicon and
  avatars); the two rosette files are not in that repository. Colours: bone `#F1EEE8`, rosette black `#15130F`,
  ochre `#C68A1E` (accent fill), light ochre `#E0A23A` (accent on black). Rule: never ochre text on bone (2.6:1).
- The rosette geometry this feature uses is the inner group of the app icon: four open arcs of different stroke
  widths (11 to 16 units, round caps) on a 100-unit grid, and a filled ellipse (the spot) rotated -18 degrees.

## spec-kitty-design issues (requirements only)

Read on 2026-11-10 from the public issue pages through a summarising fetch, so the wording below is a close
paraphrase with short verbatim quotes, not a full copy.

- **#496** "sk-button does not size slotted SVG icons; no shared navigation icon set". An icon-only or icon-and-label
  button (back chevron, menu, close) renders at 0 px or at the SVG's native size, and there is no shared icon set.
  Ask: "Size slotted `svg`/`[slot=icon]` content to an icon token ... and centre it"; "ideally provide an icon slot
  and a small navigation icon set (back, menu, close, chevrons)". Consumer workaround: local `inline-size`/
  `block-size` rules on the SVGs. Comments (MOES-Media): the Artifact Viewer needs per-kind icons in its file tree
  and added stand-ins for a **magnifier** and a **table** glyph, asking for "a library icon element backed by a
  shared set"; the Projects screen dropped the **folder** icon from its "Open project" button because slotted SVGs
  are not sized; a request to forward `aria-describedby` belongs with #501 (out of scope here, #7).
- **#504** "sk-action-row has no unavailable state; brand mark not shipped as SVG". The brand mark ships only as a
  raster PNG on a cream background, not in the published packages and not as SVG; "Consumers trace or redraw it."
  Ask (mark part): "a monochrome `currentColor` SVG brand mark". The action-row part belongs to #7.
