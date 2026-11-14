---
phase: 1
round: 1
verdict: changes_requested
base: 0efc2f72bfd57b33dabe5496070eb1fb0d6e61fb
head: ac048000ae51b705d7c09125b6280c009fb2d211
tdd_check: pass
---

# Phase 1 review, round 1

Scope: `git diff 0efc2f7..ac04800` (red cbc9fc2, green b213f53, docs 2909b6a, tdd-check outputs ac04800); no
uncommitted change. The phase's own work (harness, shard size, records) is sound; the one blocking finding is a
commit in the phase range without a DCO sign-off.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | commit ac04800 (`chore(012-button-action-row): phase 1 tdd-check outputs`) | `pnpm run gate:signoff -- --range 0efc2f7..HEAD` exits 1: `ac04800…: signoff: no-signoff: no Signed-off-by line for the author Claude <noreply@anthropic.com>` (`signoff: 1 finding in 4 commits`). The DCO check is a merge gate (constitution, Development Workflow and Quality Gates; Technology § "Contributions are signed off"; FR-023). cbc9fc2, b213f53 and 2909b6a are signed off. This is the commit that records the tdd-check outputs, not the implementer's code. | Re-make the tdd-check outputs commit with a `Signed-off-by:` line (whoever owns it amends it, and this review's commit is re-applied on top), so that `gate:signoff` over the phase range has no finding. |
| R1-02 | note | `packages/elements/test/scenarios/driver.ts:272`; `specs/012-button-action-row/contracts/checks.md:10`, `research.md:588`, `tasks.md:82` | Deviation: the state fields are on a new `axState(id, inner?)` and `ax(id)` is unchanged. **Accepted on its merits.** `ax(id)` returns the `AxNode[]` list that mission 005's scenarios assert with `toEqual`, and adding `focusable` and the rest to it would change those expectations without any new behaviour. `axState` also takes `inner`, which later hosts need. The contract and research still say that `ax(id)` returns the states. | When later phases are written, use `axState` for these states. Bring `contracts/checks.md:10` and `research.md:588` in line when those files are next edited, so the next implementer does not call `ax(id)` for states. |
| R1-03 | note | `packages/elements/test/commands.ts:261-285`; `research.md:593` | Deviation: `axe(scope?)` returns violations and incomplete results of **every** impact. **Accepted.** The reason holds: `region`, `landmark-one-main` and `page-has-heading-one` are moderate, so with a serious-and-critical filter T005's "no `region`" assertion could never fail. Each `AxeResult` carries `impact`, and 006's gate still fails only on serious and critical. Consequence: a later page test that expects `axe()` to be `[]` (T018, T050) is stricter than the gate, because moderate, minor and incomplete results also fail it. That is allowed under Principle III, but research.md:593 now describes this wrongly. | Update research.md:593 and contracts/checks.md to "every impact" when they are next edited. If a later phase needs to accept an incomplete result, it filters it explicitly in the test, never in the driver. |
| R1-04 | note | `packages/elements/test/commands.ts:190-203`; `in-process.ts:229-243`; `browser/driver.ts:216-230` | Deviation: clicks, hover, down and up all go through one `pointer` function (Playwright `locator.click({ force: true })` or `hover({ force: true })` plus `mouse.down`/`up`), and both harnesses use it. **Accepted, and better than the alternative.** One implementation means the in-process and fixture bodies cannot drift apart, and `force: true` is pinned by the `aria-disabled` and disabled click scenario (`scenarios/harness.ts`, "click(id) always forces"). | none |
| R1-05 | note | `packages/elements/test/commands.ts:161-167` | Deviation: `forcedColors("none")` also resets reduced motion to `no-preference`. **Accepted.** It makes the single `afterEach` reset of each in-process file clean up both emulations (005 phase 4 R1-01), and the ax scenario "reducedMotion(…) … forcedColors("none") resets it too" pins it. The cost is ordering: a later test that wants reduced motion with forced colours ended must call `reducedMotion("reduce")` after `forcedColors("none")`. The driver comment (driver.ts:270) documents this. | none; later scenarios keep that order |
| R1-06 | note | `gates/test/plants.test.ts:823-1090`; `gates/test/integration/plants.test.ts:149-162` | Deviation: the red commit also changed two test files that T006 does not name. **Accepted.** They pinned the repository's `shardSize` through counts (5 shards, then 3). The new expectations have the same assertions, recounted for size 1 (13 shards, then 6), and none is loosened. The not-run case now covers two shards with one plant each, which is stricter. Because of the repository constant, no in-memory shard in these tests holds two visual plants any more. Shards with more than one plant are still covered by `plantShards` at explicit sizes (`gates/test/plant-runner.test.ts:658-713`). | none |
| R1-07 | note | `specs/006-storybook-workbench/contracts/plants.md:202-204` | Deviation: this file still says `size` is **3** "approved by the operator", and "232 other plants give 3 shards" (now 228). It is outside T011's list and is a record, not code. Left as is, it contradicts `gates/lib/plant-runner.ts:272` and `gates/README.md`. | Update it in a later docs change, for example with phase 6's CI record. Not blocking, because no code or test reads it. |
| R1-08 | note | `notes.md` § Checks run (T013) | Deviation: `unit-tests/fail-elements-chromium` exited 2 during the implementer's single 75-minute run, and passed alone and in `--shard 3`. **Reproduced in this review:** `gate:plants -- --shard 3` gives `76 plants judged, every plant as expected`, with that plant at 28.8 s. Reading it as load in the single run is plausible, and nothing in this phase changes that plant's input except the added commands in `vitest.config.ts`, which the plant runs fine. | Check that CI's shard 3 is green on the PR. |
| R1-09 | note | `packages/elements/test/in-process.ts:102,245-256`; `browser/driver.ts:24,232-243` | `tabOrder` stops silently after `maxSteps` (64) Tab presses and returns a partial order, with no error. No page in this feature comes near 64 stops, so it cannot hide a failure today. | Optional: throw when 64 steps pass without leaving the page or coming back to the start. |
| R1-10 | note | `notes.md` § Operator questions | Two operator questions are open, and this review does not decide them: (1) approving the split count of **76 stories** at size 1; (2) opening a triage record for a plant design whose shard time does not grow with the story count, before the next element mission (PLAN-FRESH-3-003 (a)). `gates/README.md` and 006 plan.md's Complexity Tracking row record both as "awaiting the operator's approval". | For the operator. |

## Test quality

- **TDD check:** `tdd-check.json` is `pass`: red commit cbc9fc2 exit 1, final tests on the base exit 1, head exit 0,
  no problems. It was computed at 2909b6a. The only later commit, ac04800, adds only its own output files under
  `reviews/phase-1/`, so it does not need a re-run. `tdd-exempt.md` exempts only T011 (prose in `gates/README.md`
  and 006 plan.md that no code or test reads). That is justified: the behaviour behind it, `shardSize` 1, was tested
  red first (T006).
- **Red for the right reason (red-phase.log, 59 of 3153 failed):** each harness test fails on the missing driver
  method (`driver.hover/events/tabOrder/activeInner/axState/current/reducedMotion/axe/click is not a function`,
  `served.visits is not a function`). For `computed(id, property, inner)`, which already existed, it fails on the
  ignored `inner` (`{ inner: '0px' }` against `'1px'`). The shard tests fail on `shardSize` 3 (`expected 3 to be 1`,
  5 or 3 shards against 13 or 6). There is no syntax, import or setup error: the fixture pages were in the red commit,
  so the fixture bodies fail on the driver and not on a 404. The red commit touches only test pathspec files.
- **Not weakened since red:** `git diff cbc9fc2..HEAD` on every test file and on `scenarios/harness.ts` is empty.
- **Assertions:** every test makes one deep `toEqual` on observable results: computed colours, borders and pointer
  states, event records with all fields and serials, the Tab path through the shadow root, AX states over CDP,
  `aria-current`, emulated media, axe results, the navigation sink's records, and on the fixture real URLs, tabs and
  server visits plus `recorded: clean` (CSP, requests, console). Each negative outcome is paired with its positive in
  the same body (not focused gives no click, disabled gives none, `aria-disabled` gives a click, second
  `takeEvents()` is `[]`, a scoped axe with no finding sits beside one with a finding). There are no conditional
  assertions, no skip or only, no snapshots and no mocks. `gate:test-lint` has no finding.
- **Coverage of T001 to T006:** focus; press Enter, Space and Shift+Enter; click with inner, modifiers (Control, Alt,
  Meta+Shift) and middle button; hover and pointer down and up, native and inner; tabOrder forward and reverse with
  a shadow inner control and `tabindex=-1`; activeInner; recorder fields, serials and preventNext on host and
  native; sink, real navigation and new tab; axState with all ten fields; current; reducedMotion; axe with 006's
  selection, served same-origin under the strict CSP with a clean record; `plantShards` on the repository's real
  plant list. All present. The phase has no story acceptance scenarios (setup only).
- **Mutation:** `pnpm run gate:mutation -- --base 0efc2f7…` exits 0:
  `gates/lib/plant-runner.ts: mutation: zero-mutants: no mutant on the changed lines`; 0 mutants, 0 equivalent
  records. The changed source line is the numeric literal `shardSize = 1`, which Stryker does not mutate, and the
  constant is pinned by `expect(shardSize).toBe(1)` and the repository partition test. The harness code under
  `packages/elements/test/` is test code by the story configuration and is proven by its own self-tests in both
  harnesses.

## Checks run

2026-11-14, Node 22.23.4, `PLAYWRIGHT_BROWSERS_PATH` scratchpad alias (1248 to installed 1243), one at a time:

- `gate:test-lint`: 181 files, no finding. `gate:typecheck`: no type error. `gate:lint`: 271 files, no finding.
  `gate:style-lint`: 12 files, no finding. `gate:config-copies`: identical. `gate:csp`: 10 files, no finding.
  `gate:prefix`: 208 files, no finding. `gate:pins`: 5 manifests, no finding. `gate:contrast`: 160 and 168 pairs.
  `gate:brand-rules`: 7 rules. `gate:manifest`: 2 elements, no finding.
- `gate:signoff -- --range 0efc2f7..HEAD`: **exit 1**, 1 finding (ac04800, R1-01).
- `pnpm test`: `unit-tests: 3153 tests passed in 144 files` (exit 0).
- `gate:mutation -- --base 0efc2f7…`: exit 0 (above).
- `gate:plants -- --plan`: 76 shards. `OCELLE_VISUAL_ENGINE=docker gate:plants -- --shard k`, exit 0 and "every plant
  as expected" for k = 1, 2 and 3 (76 plants each: every non-visual and registry plant, including the plants that
  copy the changed `vitest.config.ts`), k = 4 (first size-1 `visual` shard) and k = 52 (first size-1 `axe` shard).
  The capturing `visual` and `axe` shards were not run here: their plant inputs are unchanged in this phase (no
  story added) and only their partition changed, which the shard tests cover. The implementer's single run judged
  300 of 301; see R1-08.

## Earlier findings

None: this is round 1.
