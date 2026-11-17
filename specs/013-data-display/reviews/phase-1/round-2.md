---
phase: 1
round: 2
verdict: approved
base: 30e513065d010f5c6ffcb81db0e0b83e79cacc0f
head: e9ab851f9eb3c56a8d4fa1e6cd8c7e4c772567c7
tdd_check: pass
---

# Phase 1 review, round 2

Scope: `git diff 30e5130..e9ab851`. The only change since round 1's head b3f8d56 is e9ab851, plus the round-1
review itself. e9ab851 touches `contracts/checks.md` (one row), `tasks.md` (T021 step 1), `research.md` (R-02,
Threshold), the `why` of `gates/plants/visual/fail-token-changed/plant.json`, and adds `round-1-fixes.md`. No source,
test, story, baseline or plant defect changed. There is no uncommitted change apart from the TDD-check outputs I
re-ran. Binding operator decisions applied as in round 1: I3, `operator-decisions.md`, `operator-spike-decisions.md`,
and `operator-plant-decisions.md` (decision (b) "Add test, keep R-03").

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/013-data-display/research.md:252-253 | The implementer flagged this sentence: "the `calc()` resolves on the host from inherited custom properties". Strictly, it is inaccurate. The `calc()` is declared on the two shadow probes (`packages/elements/src/ocelle-facts.ts:146` as the hook's `var()` fallback, and `:150` on `.probe.default`), so it resolves at computed-value time on each probe, not on the host. The previous sentence, which e9ab851 rewrote, now says this correctly ("read on the probe"), so the two sentences disagree. The *argument* still holds, though. The shadow styles declare no `--ocelle-space-*` or `--ocelle-shell-*` property (the only `--ocelle-` names in the file are inside `var()` references or the `@cssprop` docs). So the probes inherit exactly the custom properties the host has. A default built on `--ocelle-shell-sidebar-width` would therefore still follow a consumer's `:root` change, which is the point of the sentence. The wording is imprecise, but the reasoning and the decision are correct. | Optional: say "resolves on the probe from the custom properties it inherits through the host". |
| R2-02 | note | specs/013-data-display/research.md:249-251 | The rewritten sentence now has two "which" clauses in a row: "whose default is the `var()` fallback … read on the probe (not a `:host` declaration, which would beat …), which is 24rem". It reads awkwardly but is accurate. It matches notes.md § "The threshold hook is not declared on `:host`" and the source. | Optional, with R2-01. |

No blocking finding.

## Test quality

- **TDD check.** `tdd-check.json` predated HEAD (head 1f8c1cd), so I re-ran
  `.specify/extensions/story/scripts/tdd-check.sh 1` on e9ab851. The result is `pass`, with head e9ab851 and no
  problems:
  - the red record `phase` (935ac40) exits 1, and `check-red-phase.log` holds 300 `AssertionError` failures;
  - the final tests exit 2 on the base and 1 on the scaffold (`unit-tests: 314 of 3429 tests failed`);
  - HEAD exits 0 (`unit-tests: 3429 tests passed in 145 files`).
  The refreshed JSON and its four `check-*.log` files are committed with this review.
- **Tests since round 1.** None changed (`git diff b3f8d56..e9ab851` touches no test file). Round 1's analysis still
  applies: the red evidence, nothing weakened after red (`935ac40..HEAD` on the tests is insertions only), no vacuous
  assertion, every US1 scenario covered, and the mutation result (300 mutants, none survived, 16 equivalent records
  read and accepted).
- **Plants.** No plant defect or finding list changed. The `fail-token-changed` edit adds one comma in `why`, and the
  file still parses as JSON. The redefined "value column never widened" plant and its two single-rule equivalents
  are the ones plants.md § Resolution measured: the pair bites (the unbroken-value body fails, 52 pass), and each
  rule alone gives 53 passes.

## Checks run

All on HEAD e9ab851 with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

| Check | Result |
|---|---|
| `tdd-check.sh 1` (runs `pnpm test` at the red commit, the base, the scaffold and HEAD) | `pass`; HEAD: `unit-tests: 3429 tests passed in 145 files` |
| `gate:lint` | `lint: 281 files checked, no finding` |
| `gate:prefix` | `prefix: 217 files checked, no finding` |
| `gate:test-lint` | `test-lint: 189 files checked, no finding` |
| `gate:config-copies` | the two `story-config.yml` copies are identical |

I did not repeat the heavy gates: typecheck, style-lint, manifest, CSP, contrast, Storybook build, visual, axe,
mutation and the full `gate:plants`. Round 1 ran all of them clean on b3f8d56, and e9ab851 changes no input they
judge except the `why` string of one plant, which no gate reads as a defect. Round 1's results stand for HEAD.

`gate:prefix` now counts 217 files, where round 1 counted 221. No file it would scan was removed between b3f8d56 and
e9ab851, so the difference comes from the working tree when each run happened, not from the change. It reports no
finding.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - The CSS-only behaviours row (`contracts/checks.md:343`) now names operator decision (b)'s plant: the value
    tracks' `minmax(0, 1fr)` → `1fr`, two-column and stacked, together with the `<dd>`'s `min-inline-size: 0`
    removed. Its body is the unbroken-value body (600 px two-column sheet, a 64-character value without `wrap`).
  - The row records each single-rule change as equivalent, with the reason (either rule alone keeps the column's
    minimum at 0) and references to plants.md § Resolution and the operator decision.
  - "Two-column and stacked" matches the source: the value track is `minmax(0, 1fr)` at `ocelle-facts.ts:73` (two
    columns) and `:101` (stacked).
  - T021 step 1 (`tasks.md:294`) lists the same paired plant with the same guard and equivalence note, in place of
    the old `minmax(0, 1fr)`→`1fr` entry.
  - This was documentation only, so no `fix-1` red record was needed, and none was made (`red-commits` holds only
    `phase`).
- **R1-06 (note): addressed.** R-02 no longer says the default is set in `:host`. One sentence later still says the
  `calc()` resolves "on the host" (R2-01).
- **R1-07 (note): addressed.** "listed, the eight".
- **R1-02 to R1-05 (notes):** deferred by the implementer, as they allow.
