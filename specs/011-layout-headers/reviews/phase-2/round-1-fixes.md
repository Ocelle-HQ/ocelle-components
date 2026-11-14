# Phase 2, review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | deferred: not a code defect, no change made. At HEAD the only failing tests are the 5 container-engine tests of `gates/test/integration/visual.test.ts` (lines 115, 126, 239, 251, 271), the same set the `fix-1` red log shows besides the new red scenarios; line 239's `expected 42 to be 66` is the open T023 baselines under operator decisions 2 and 3. Left for the operator's accept, as for phase 1; those tests are unchanged. | none (no behaviour defect) | reviews/operator-decisions-implementation.md |
| R1-02 | fixed: the heading column is hidden (`empty` class) while it shows nothing (no heading, and no description or the eyebrow variant), and `.heading-column.empty + .actions { margin-inline-start: auto; }` keeps the actions at the inline end (FR-010). Actions that do not fit beside an empty column and an `--ocelle-space-4` gap no longer wrap to a second line, so they start at the host's block start, or `--ocelle-space-1` under the eyebrow (FR-005). The README's empty-slot statement now holds without a text change. | `fix-1` 9fea5fa, scenario "FR-005, FR-010, narrow (phase 2 review R1-02)" in both harnesses (`red-fix-1.log`: top 8 px, eyebrow gap 12 px, actions 12 px off the inline end) | packages/elements/src/ocelle-section-header.ts; packages/elements/test/scenarios/section-header.ts; plants in reviews/phase-2/plants.md § Review round 1 fix |
| R1-03 | note, not for the implementer (orchestrator sign-off of 1b9cc98 and 671196d). The fix-round commits are signed off. | none | — |
| R1-04 | note, not for the implementer: research.md is not changed. The fix does not touch the actions wrapper's `flex` value; it adds `margin-inline-start: auto` on the actions only when the heading column is hidden, which R-04 does not describe either, so a later R-04 amendment (or the page header's R-07, which reuses it) should record both. | none | — |
| R1-05 | note: T023 baselines stay open under operator decisions 2 and 3. | none | — |

`reviews/phase-2/notes.md` departure 6 ("the heading column is never hidden") is superseded by this fix; that file is
the phase's own record and is not rewritten here.

Checks at the fix (OCELLE_CHROMIUM_PATH set to Chromium 1243): `pnpm test` 5 of 3304 failed, only
`visual.test.ts:115, 126, 239, 251, 271` (R1-01); `gate:mutation -- --base 296e02d` 147 mutants on the changed lines
of 6 files, none survived (43 compile errors, 2 zero-mutant entries, 2 equivalent records as in round 1); typecheck,
lint, style-lint, test-lint, prefix, csp, manifest, brand-rules, contrast (169 / 177 / 158), pins and config-copies
pass.
