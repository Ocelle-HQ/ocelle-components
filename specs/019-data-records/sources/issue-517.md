<!-- Provenance: spec-kitty/spec-kitty-design issue #517, title, metadata, body and comments as fetched on 2026-11-20, supplied by the operator (IQ-25 (b), reviews/phase-1/inventory-decisions.md; reviews/phase-2-inventory-decisions.md). Recorded verbatim below this note, unedited. The `sk-*` and `--sk-*` names are spec-kitty roles, not names of this library. -->

# evidence-chain: wrap onto further lines in narrow columns, with an optional compact chip step

- Number: #517
- URL: https://github.com/spec-kitty/spec-kitty-design/issues/517
- State: open
- Author: MOES-Media
- Created: 2026-10-05T09:33:06Z
- Updated: 2026-10-05T09:33:06Z
- Labels: (none)
- Milestone: (none)
- Fetched: 2026-11-20 20:03:42 UTC

## Body

`sk-evidence-chain` lays its steps out as a single non-wrapping row, with fixed 40px connectors and each step's label stacked over its value. In a narrow column (around 200px) it overflows and becomes unreadable, and in a wide placement each step's label duplicates its value.

Ask: let the chain wrap onto further lines when space runs out, keeping it an ordered list with decorative connectors hidden from assistive technology. An optional compact step style (a single pill-shaped chip per step, without the stacked label) would cover dense screens.

Until this lands, the Work Package detail screen in spec-kitty-mission-ui (mission-ui#5) renders its evidence chain as a native ordered list of `sk-pill-tag` items with hidden arrows and a wrapping flex layout, so no style exception is needed. That local stand-in is replaced when this ships.


## Comments (0)
