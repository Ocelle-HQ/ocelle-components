# Phase 3 plants and gate runs (T040)

Run on 2026-11-11 in this container (Node 22.23.4, Chromium 1243 at `OCELLE_CHROMIUM_PATH`; `PLAYWRIGHT_BROWSERS_PATH`
aliased for the plant and mutation runs), one heavy job at a time. Pairing plants: the planted edit applied to the
element source in the working tree, the guarding shared scenario run through the harness named, the diff kept, the
file restored with `git checkout`. No pairing plant is committed. Every plant bit; no stop-and-ask was needed.

## The pairing plant of User Story 2

| Pairing row (spec table) | Plant (edit) | Harness, scenario | Result |
|---|---|---|---|
| The non-directional icons are not mirrored (US2-4) | mirroring applied to every icon: `class="mirror"` on every `svg` in `ocelle-icon.ts` `render` instead of `class=${icon.mirror ? "mirror" : nothing}` | in process (`elements`), US2-4; and fixture (`elements-browser`), US2-4 | fails in both: four entries go from `rtlEqualsLtr: true` to `false`. In the sorted diff they are the 8th, 9th, 10th and 12th of the thirteen names (`copy`, `file`, `folder`, `search`); `menu`, `table`, `close`, `chevron-up` and `chevron-down` hold (left-right symmetric), and the four mirroring icons are unchanged, as `spike.md` measured |

An extra plant of the forbidden-content check (US2-3, FR-010, analysis L13), not in the spec table: the polyline
rendered with `id="p" xlink:href="#p" onclick=""`, run in process on `chevron-up`'s per-name scenario: fails with
`forbidden` `["polyline[id]", "polyline[xlink:href]", "polyline[onclick]"]` (and the same three as `ownAttributes`)
beside the drawing's diff.

## The `token-only` plants of T034 (judged by `gate:plants`)

`pass-scale-mirror` (`scale: -1 1`) passes; `fail-scale-factor` (`scale: 2`), `fail-scale-length` (`scale: 2px 1`) and
`fail-scale-calc` (`scale: calc(2)`) each fail with one `ocelle/token-only` finding at
`packages/elements/src/x.ts:6`, as their `plant.json` expects.

## Gate runs

| Gate | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | exit 0 (209 and 141 files, no finding) |
| `gate:style-lint` | exit 0, 9 files, no finding |
| `gate:manifest` | exit 0, 1 element, no finding |
| `pnpm -r build`, then `gate:csp` | exit 0, 30 files, no finding |
| `gate:prefix` | exit 0, 182 files, no finding |
| `gate:pins` | exit 0, 5 manifests |
| `gate:plants` (first run) | exit 1: the manifest plants' committed copies of `custom-elements.json` held phase 2's two-name union, so the six `fail-undescribed-*` plants gained a `stale` finding and `pass-reordered` was stale. Regenerated from the current source (`7a725e2`; only the type text of `name` changed) |
| `gate:plants` (second run) | exit 0: 208 plants of 14 gates and the registry judged, every plant as expected |
| `gate:mutation -- --base b560a42` (first run) | exit 1: 10 survivors, in `token-only.ts`'s non-word branch of the `scale` check and in the manifest's code-point comparator; fixed in `251cb05` and `c228503` |
| `gate:mutation -- --base b560a42` (final) | exit 0: 135 mutants on the changed lines of 4 files, none survived; 1 equivalent record (`token-only.ts:138`, the literals of the `classify()` call for a non-number in `scale`, reason in the record) |
| `pnpm test` | exit 0, 2295 tests in 113 files (before the mutation fixes; `gates` and `elements-node` rerun after them: 1694 passed) |

No mutation shard came near 10 minutes.
