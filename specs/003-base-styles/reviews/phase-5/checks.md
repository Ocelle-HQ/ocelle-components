# Phase 5 checks (T051)

Run by the implementer on 2026-11-09 in the container (Node 22, not the pinned 26.13.0; Chromium from
`PLAYWRIGHT_BROWSERS_PATH`), one heavy job at a time, on the green commit c6f8403.

| Check | Result |
|---|---|
| quickstart 1, `pnpm -r build` | exit 0; `packages/styles/dist/base.css` identical to `src/base.css` (`cmp`); `packages/tokens/dist/tokens.css` holds `--ocelle-line-height-prose` (`grep -c` 1); Storybook build completed |
| quickstart 2, `pnpm test` | 2005 tests passed in 96 files (`tokens`, `tokens-browser`, `styles`, `styles-browser`, `storybook`, `storybook-integration` included) |
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | no finding |
| quickstart 3, `gate:style-lint`, `gate:prefix`, `gate:csp` | no finding |
| quickstart 3, `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | pass (contrast: 158 pairs in light, 157 in dark; no pair added: the wrap family sets no colour) |
| quickstart 3, `gate:plants` (alone) | 182 plants of 13 gates and the registry judged, every plant as expected; about 2 min 10 s |
| quickstart 4, `gate:mutation -- --base 523c5ce` | 11 mutants on the changed lines of 1 file (`storybook/stories/render.ts`), none survived, 0 equivalent records; about 49 s |
| `tdd-check.sh 5` | `pass` (red commit f6434c2 exits 1; the final tests exit 1 on the base and on the scaffold bb47742; HEAD exits 0) |

**Red run** (`red-phase.log`, red commit f6434c2, recorded by `red.sh 5 phase`, not amended): 25 of 2005 tests
failed, every one an `AssertionError` on missing behaviour: the hooked identifier at `overflow-wrap: normal`, its
column about 1094 px against the short text's 47 px, on one line, outside its cell and its paragraph (`wrap.test.ts`,
US4-1 to US4-4 in light and dark); no wrap rule in the parse (`source.test.ts`, two tests); the README's wrap
statements, hook table row and SC-006 table absent, and no CHANGELOG entry for `data-ocelle-wrap` (`readme.test.ts`,
ten tests); `renderFamily("wrap")` rendering nothing (the scaffold), so no Identifier wrap markup in the unit tests and
in the built story (`render.test.ts`, `stories.test.ts`, `csp.test.ts` in light and dark).

**Plants** (research R-10, US4 guards): each was run against the green rule before the red commit (the rule added to
a working copy of `base.css` and taken out again) and is asserted in `wrap.test.ts`, in light and dark; each makes its
helper report the expected problem. Measured at 1280 px:

| Guard | Plant | Without | Reported with it |
|---|---|---|---|
| no ellipsis (US4-1) | `plants/wrap-ellipsis.css` | `clip`, not clipped, 8 lines | `text-overflow ellipsis`, clipped, on one line, a line outside the cell |
| wrap is opt-in (US4-2) | `plants/wrap-all.css` | unhooked `normal`, column 1093.5 px against 46.6 px | `unhooked: anywhere`, `wrap-true: anywhere`; both unhooked columns 150 px |
| undocumented value (FR-005) | `plants/wrap-presence.css` | `"true"` identifier `normal` | `wrap-true: anywhere` |
| identifier copy (US4-3) | `plants/wrap-copy.css` | the selection equals the source | copied text differs from the source |
| FR-020's list on the wrap rule | the four plant strings of R-10 § Source-level guards | — | each reported once; the boundaries (the wrap rule itself, the list on a rule without the hook) none |

The hooked columns are 150 px and 150 px at 1280 px, 320 px and 200% zoom (SC-005).

**`styles-browser` suite time**: 13.1 s for the 80 tests of `base.test.ts`, `compact.test.ts`, `prose.test.ts` and
`wrap.test.ts` (Vitest duration), against the plan's 60 s goal.
