---
phase: 1
round: 1
verdict: changes_requested
base: de022bb3a92c3616d42ed4bd68f050444d0fbb15
head: 7874183c91a9d844979fe077a29e052a1d2f3984
tdd_check: pass
---

# Phase 1 review, round 1

Scope: `git diff de022bb..7874183` (commits cfc043d red, c2eba5e T002/T003, eb811ea T004 spike record, 0e8eab6
operator decisions in the design documents, 7874183 decisions recorded in spike.md). Nothing is uncommitted except
the tdd-check outputs this review commits.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/bin/axe.ts:7,10; gates/bin/baselines.ts:7,10; gates/bin/storybook-build.ts:7,10; gates/bin/visual.ts:7,10; reviews/phase-1/tdd-exempt.md § Mutation note | `pnpm run gate:mutation -- --base de022bb` exits 1 at HEAD with 12 findings, all `NoCoverage`: per stub one `StringLiteral` (the `not implemented (<gate>, phase <n>)` message replaced by `""`) and two `ConditionalExpression` (`import.meta.main` replaced by `true` / `false`). No record covers them. tdd-exempt.md's mutation note says the survivors are "recorded here rather than covered by tests", but that is not an equivalent-mutant record, and these mutants are not equivalent: the stubs have observable behaviour (`node gates/bin/axe.ts` exits 2 with `could not run: not implemented (axe, phase 4)`, measured), the `""` mutant changes that stderr line, and the `false` mutant makes `pnpm run gate:axe` (and the other three scripts) exit 0 silently, a fail-open entry. The note's claim that "no test could fail" for T003 is therefore wrong for the stubs. Constitution VIII (Mutation testing) makes a non-equivalent survivor blocking, and mutation testing is a merge gate (constitution, Development Workflow). The same class was blocking in 003 phase 1 round 1 (R1-01). | Red first (`red.sh 1 fix-1`): a test that each of the four entries exits 2 with exactly its one stderr line (for example a spawn of `node gates/bin/<gate>.ts` per stub, asserting exit code and the full line), which kills the message mutants and the `false` guard mutant. Then give each `import.meta.main` line the repository's `// Stryker disable next-line all: process boundary, covered by gates-integration: <test> "<case>"` record naming that test, as gates/bin/prefix.ts:128 does. Correct tdd-exempt.md: the stubs have behaviour (exit 2), tested by that test. `pnpm run gate:mutation -- --base de022bb` must then exit 0. |
| R1-02 | note | gates/test/container-pin.test.ts:60-69; contracts/container.md § The pin test | The contract and T001 say "a fixture copy"; the test builds the copy in memory from the real pin with `node` and `browser` changed. tdd-exempt.md gives the reason (red until the pin exists; the other checks are seen passing on real values). This is at least as strict as a separate fixture file. | None. |
| R1-03 | note | commit 0e8eab6 (plan.md, research.md, contracts/gates.md, contracts/plants.md, quickstart.md, tasks.md) | Design documents outside the phase's tasks changed inside the phase range. The reason is given: they carry the operator's two decisions on the spike's stop-and-ask points (2026-11-10, human:jeroennouwsdev), and tasks.md T004 required the decisions before it could close. The tasks.md diff otherwise only ticks T001 to T005 and amends later, unticked tasks (T009, T010, T015, T016, T052, T053a, T054, T057, T060) to the decisions. | None. |
| R1-04 | note | reviews/phase-1/spike.md (header) | The spike ran on the host with Node v22.23.4; the CI and container pin is 26.13.0. The record says so and keeps no Node-version-dependent text as a test expectation (§ 1, `ERR_INVALID_TYPESCRIPT_SYNTAX` note). The container captures (§ 5) ran in the pinned image, so the baseline facts are not affected. | None. |

## Test quality

- **Red evidence:** red commit cfc043d changes only `gates/test/container-pin.test.ts`. red-phase.log (and the
  check's re-run, check-red-phase.log) shows exactly the two new cases failing on their first assertion,
  `storybook/visual/container.json exists: expected false to be true`, an assertion failure for the missing file, not a
  read or setup error; no other test fails (`2 of 2040`). tdd-check.json: `status: pass`, red exit 1, final tests on
  base exit 1 (check-final-tests-on-base.log, the same two failures), head exit 0, no problems. No scaffold.sha.
- **Weakened tests:** `git diff cfc043d..HEAD -- gates/test/container-pin.test.ts` is empty; no other test file changed
  in the phase.
- **Vacuous assertions:** none. Both cases assert unconditionally; the second asserts the exact two problem lines with
  `toEqual`, so `pinProblems` is shown able to fail on `node` and `browser`, and the first case asserts every field
  directly as well as through `pinProblems`. `headlessShellRevision` falls back to a non-numeric text, which the second
  case rejects with `toMatch(/^\d+$/)`. No skip, only, snapshot or mocks. test-lint is clean.
- **Exemption (tdd-exempt.md):** justified for the dependency pins, the scripts in package.json, the `.gitignore`
  entries and the spike record (T004), none of which change what code does. Not justified for the four entry stubs,
  which do have behaviour (R1-01).
- **Mutation:** `gate:mutation -- --base de022bb` with `PLAYWRIGHT_BROWSERS_PATH` aliased (chromium-1248 to the
  installed 1243): 16 mutants on changed lines of 4 files, 12 `NoCoverage` findings (R1-01), exit 1. The changed code
  holds no equivalent-mutant record. The test file is not in the mutation scope.
- **Acceptance scenarios:** phase 1 is setup and has none. Its Independent Test: `gate:pins` passes with the two new
  pins, the pin test passes, spike.md holds every T004 item (§§ 1 to 8, with fixtures under
  `gates/test/fixtures/storybook-build/`, `container/` and `storybook-signals/`) and both stop-and-ask decisions with
  date and operator (spike.md:148, :279), and tdd-check reports pass.

## Checks run

Node v22.23.4, `OCELLE_CHROMIUM_PATH` set, one at a time at HEAD 7874183:

- `pnpm test`: exit 0, `unit-tests: 2040 tests passed in 98 files`.
- `gate:typecheck` 0; `gate:lint` 0 (176 files); `gate:style-lint` 0; `gate:test-lint` 0 (113 files);
  `gate:config-copies` 0; `gate:prefix` 0 (132 files); `gate:pins` 0 (`5 manifests checked, no finding`);
  `gate:contrast` 0; `gate:brand-rules` 0; `gate:csp` 0 (22 files);
  `gate:signoff -- --range de022bb..HEAD` 0 (`5 commits checked, no finding`).
- `gate:plants`: exit 0, `184 plants of 13 gates and the registry judged, every plant as expected` (2 min 28 s).
- `gate:mutation -- --base de022bb`: **exit 1**, 12 findings (R1-01).
- The four new entries by hand: `gate:storybook-build`, `gate:visual`, `gate:axe`, `visual:update` each exit 2 with
  one line `could not run: not implemented (<gate>, phase <n>)`, as T003 specifies. None is in gates.json or ci.yml yet.
- Container pin: storybook/visual/container.json equals contracts/container.md byte for byte in content; its digest is
  the manifest digest in gates/test/fixtures/container/ (`application/vnd.oci.image.manifest.v1+json`), and the tag
  index fixture lists it as the linux/amd64 entry.
- Constitution: no element, story, token or CSP change in this phase; VIII is the applicable principle (R1-01).

## Earlier findings

None; this is round 1.
