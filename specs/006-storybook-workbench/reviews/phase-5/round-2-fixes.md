# Phase 5, review round 2 (operator round, landing L1-01, L1-05, R1-01): fixes

Red commit `24d50ef` (label `fix-1`, `red-fix-1.log`: 3 of 3112 tests failed, each an assertion mismatch: the README's
Deferred gates table still held the `@ocelle/elements` run-time strict-CSP row, and the `visual` command in
`gates/gates.json` and in the README gate table lacked `--remove-docker-image`; no load or setup error).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O2-01 | fixed: `gates/README.md` § Deferred gates drops the `@ocelle/elements` run-time strict-CSP row; the paragraph after the table says mission 005 (#17) delivered that test (`packages/elements/test/browser/serve.ts`, constitution IV's header and a `securitypolicyviolation` collector) and, as before, that since 006 the Storybook no longer observes CSP. The README holds no "(#17 or #7)". 001's "Custom-elements manifest gate absent" row keeps its text and is marked **Closed by feature 005 (#17)** (record change, no test reads it). Plan decision 33, spec FR-023/FR-024 and research.md R-10 were already amended before this round (no change needed). | `gates/test/gates-readme.test.ts` "has no Contrast check, Custom-elements manifest check, Storybook gate or @ocelle/elements run-time strict-CSP row in Deferred gates, and says mission 005 (#17) delivered that test in packages/elements/test/browser/serve.ts (006 FR-023, plan decision 33)" (red) | `gates/README.md`, `specs/001-repository-foundation/plan.md` |
| O2-02 | fixed, no red: record change only. No test reads `specs/001-repository-foundation/contracts/ci-checks.md` (`grep -rn "ci-checks" gates/test storybook/test` finds only a comment in `ci-workflow.test.ts`), so there is no behaviour to make fail first (Principle VIII). The first table gains `Storybook build`, `Visual regression` (with the pin record step, `pin-record` and `visual` artifacts) and `Accessibility`; the Plants row is the verdict job (`needs: [plants-plan, plants-shard]`, `if: always()`, the `plant-shard-*` download, `--verdict storybook/.visual/plant-shards`); the helper-job table gains `plants-plan` and `plants-shard` and its lead sentence names both gates' helper jobs; "fourteen in all" is seventeen (with 006's `storybook-build`, `visual`, `axe`); "fifteen" is "eighteen" in both places; a Mission 006 paragraph says the operator must add the three check names to `main`'s ruleset. Checked against `gates/gates.json`, `gates/lib/registry.ts` (`fr020`, `plantHelperJobs`), `.github/workflows/ci.yml` and `gates/README.md` § Required checks on `main` (eighteen rows in the first table). | none (record change) | `specs/001-repository-foundation/contracts/ci-checks.md` |
| O2-03 | fixed: the `visual` command is `pnpm run gate:visual -- --engine both --remove-docker-image` in `gates/gates.json` and the README gate table, as in `ci.yml` and contracts/gates.md. The registry copies in plant trees and fixtures are left (the registry check does not compare the command). | `gates/test/registry.test.ts` "registers visual as a repo-tree gate with the check Visual regression, its plant command taking {engine}" (red); `gates/test/gates-readme.test.ts` "lists visual in The gates with its check, its command and every plant of gates/plants/visual/" (red) | `gates/gates.json`, `gates/README.md` |

## Checks

- `pnpm test` (OCELLE_CHROMIUM_PATH set): exit 0, 3112 tests passed in 138 files.
- `gate:typecheck`, `gate:lint`, `gate:test-lint`: exit 0.
- `gate:mutation -- --base 24d50ef` (before the green commit): exit 0, "nothing to mutate: no package or gate source
  line changed since 24d50ef", as expected.
- `gate:plants -- --plan`: `[1,…,28]`, 28 shards, unchanged.
- `gate:plants -- --shard k` (OCELLE_VISUAL_ENGINE=docker), k = 1 to 3, one at a time: each exit 0, 76 plants judged,
  every plant as expected, with all seven `plants` plants (`fail-gate-without-entry`, `fail-gate-without-job`,
  `fail-shard-in-plant-check`, `fail-skip-container-in-ci`, `fail-skip-container-in-shard`, `pass-matching`,
  `pass-split-plant-jobs`). Local times: 1: 83 s; 2: 79 s; 3: 102 s. All far below 570 s.
