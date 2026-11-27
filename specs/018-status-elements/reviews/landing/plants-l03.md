# Plants of L-03: the interactive host sheet's adoption condition

- defect: CI run 45980648741 (head 40d1b7e6), job "Mutation shard (packages/elements/src/ocelle-pill-tag.ts:751-780,
  30)", 3 surviving mutants on `packages/elements/src/ocelle-pill-tag.ts:765`, in `updated()`:
  `if (mode !== "static" && !adopted) root.adoptedStyleSheets = [...root.adoptedStyleSheets, interactiveSheet];`
- tests: c19eb084, a new shared US4 body in `packages/elements/test/scenarios/pill-tag-interactive.ts`,
  "Edge cases, the host sheet held once: ..." (the existing "Edge cases: the interactive host sheet follows the mode"
  body is next to it). `pillInteractiveScenarios` already runs in both harnesses, so no runner changed. Five pills:
  `s` static throughout, `b` button mode and `l` link mode (an `href`) throughout, `p` static then made interactive,
  `q` interactive then made static. After the upgrade and after each of eight steps, each changing an attribute on every
  pill (status, variant, disabled set, disabled removed, the switch, status again, density, label), each pill reports
  `extra` (the sheets of its shadow root beyond the element's own: its adopted count less the distinct sheets over the
  five roots plus one) and its host `display` (`inline-grid` only while the interactive sheet comes after the element's
  `inline-block` host rule). Expected: a static pill `{ extra: 0, display: "inline-block" }`, an interactive one
  `{ extra: 1, display: "inline-grid" }`, at every step.
- At HEAD (the element unchanged) the body passes in both harnesses.
- Method: each mutant hand-applied to line 765 of `src/ocelle-pill-tag.ts` at c19eb084, then the pill-tag tests run in
  process (`pnpm exec vitest run --project elements packages/elements/test/pill-tag.test.ts
  packages/elements/test/pill-tag-interactive.test.ts packages/elements/test/pill-tag-truncation.test.ts`, 138 tests)
  and on the strict-CSP fixture with the browser build, which the fixture's global setup builds from the mutated source
  (`pnpm exec vitest run --project elements-browser packages/elements/test/browser/pill-tag.test.ts
  packages/elements/test/browser/pill-tag-interactive.test.ts packages/elements/test/browser/pill-tag-truncation.test.ts`,
  134 tests), the source restored with `git checkout` after each. CI names one operand mutant without saying which, so
  both operand mutants were run.

| Mutant (line 765) | In process | Fixture | Failing assertion (the new body only; every other test passed) |
|---|---|---|---|
| ConditionalExpression, the whole condition replaced by `true` | killed, 1 of 138 failed | killed, 1 of 134 failed | the interactive pills' `extra` 2 at the upgrade, one more at each step (`b` and `l` 9 at `label="Mine filter"`; `p` 2, 3, 4 after its switch); static `s` `extra` 1 and `display` `inline-grid` at `status="warning"`, `disabled set`, `status="danger"` and `label="Mine filter"`, and so `p` before its switch and `q` after it |
| ConditionalExpression, operand `mode !== "static"` replaced by `true` | killed, 1 of 138 failed | killed, 1 of 134 failed | the static pills only: `s` `extra` 1 and `display` `inline-grid` instead of 0 and `inline-block` at `status="warning"`, `disabled set`, the switch step and `label="Mine filter"`, `p` at `status="warning"` and `disabled set` before its switch, `q` at the switch step and `label="Mine filter"` after it; the interactive pills as expected |
| ConditionalExpression, operand `!adopted` replaced by `true` | killed, 1 of 138 failed | killed, 1 of 134 failed | the interactive pills only: `b`, `l` and `q` `extra` 2 at the upgrade, one more at each step (`b` and `l` 9 at `label="Mine filter"`); `p` 2, 3, 4 after its switch; the static pills as expected |
| LogicalOperator, `mode !== "static" \|\| !adopted` | killed, 1 of 138 failed | killed, 1 of 134 failed | the same observation as the whole condition replaced by `true`, step for step |

## Why these survived on CI when phase 5's mutation run killed them

Line 765 was in scope at phase 5: it came in with 7824d341, and phase 5's `gate:mutation -- --base 401f8db1` mutated
every changed line of the phase (reviews/phase-5/notes.md § Gates: 283 mutants, then 271, no survivor left but one
recorded equivalent on line 498). Phase 6's runs (`--base c2731a36`, `--base 51059341`) mutated only the lines phase 6
changed, and line 765 was not one of them; phase 7 changed no source line.

The same three mutants hand-applied to earlier trees (in process: pill-tag, pill-tag-interactive, pill-tag-truncation
where present, and control tests):

| Tree | whole condition `true` | `mode !== "static"` → `true` | `!adopted` → `true` | `\|\|` |
|---|---|---|---|---|
| db9f3658 (phase 5 round 1, end of phase 5) | killed | killed | survived | killed |
| dfa6bc09^1 (end of phase 7, before the second merge of main) | survived | survived | survived | survived |
| dfa6bc09 (after the second merge of main) | survived | survived | survived | survived |

At db9f3658 the killing test was the existing "Edge cases: the interactive host sheet follows the mode" body, on its
`again` read (after interactive → static: `inline-grid` and a 5 px margin instead of `inline-block` and `0px`). That
body is unchanged since. The kill was lost in phase 6 (88f87ae6, 5a871ac2), not in either merge of main
(e465bfbc changed nothing under `packages/elements/`; dfa6bc09 changed the drivers but the mutants already survived
before it). Phase 6 added `#measure()`, which every default-slot `slotchange` runs, static or not, and which requests one
more update when the full text changes. Under these mutants a static pill gains the sheet on one update and loses it on
the next (the removal on line 766 runs only once the sheet is held), so the extra update makes a static pill end each
step without the sheet, and the body's reads, one per step, no longer see it. The `!adopted` operand mutant (a duplicate
on each update of an interactive pill) was never caught by a pill-tag body: no body counted the sheets.

The new body reads the sheet count, not only the computed style, after each of nine steps on five pills, so a static
pill holding the sheet on any step, or an interactive pill holding it more than once, fails it whatever the parity of
the updates.

## gate:mutation

`gate:mutation -- --base 1d599fd4 --files packages/elements/src/ocelle-pill-tag.ts:751-780` at c19eb084
(`mutation-l03.log`): "mutation: 58 mutants on the changed lines of 1 file, none survived; 0 timeouts, 9 compile
errors, 0 zero-mutant entries; 0 equivalent records", exit 0.
