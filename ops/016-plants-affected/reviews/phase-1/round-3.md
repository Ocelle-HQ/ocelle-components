---
phase: 1
round: 3
verdict: changes_requested
base: 80ea82594a0d29800fc692a87041dbadabdd20a2
head: 31bf23e
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 1, round 3: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #45 (reviews/landing/round-1.md)
raised blocking L1-01 and L1-02 and notes L1-03 to L1-06, all in work that phase 1 built. On 2026-11-15 the operator
chose to fold L1-01 to L1-05 into this pull request, test-first. Recorded as an operator round so that the planner
adds the tasks, the fix procedure (label fix-3) applies, and a round 4 review follows. The operator's answers are
quoted verbatim. -->

Operator's answers (2026-11-15):

- L1-01, "What should element and token paths select?": **"Widen by gate (Recommended)"** ("Element paths also
  select every manifest plant; token paths select every contrast, brand-rules and style-lint plant. Red test first;
  the pin test grows to manifest, contrast and brand-rules.").
- L1-02, "Fix it in the same operator round?": **"Add the test (Recommended)"** ("Add an integration case with a
  junk GIT_INDEX_FILE (exit 2, 'git failed'), and point the two records at it. No red commit needed: it's a missing
  test for code that already works.").
- Notes, "Which should I fold into the same round?": **"L1-04 contract docs, L1-05 fold remap, L1-03 cross-import
  check"**.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | gates/lib/plant-runner.ts (`affectedPlants`, `repositoryContentPlants`); spec OR-001/OR-002 | Landing L1-01: element and token paths select only the ten listed repository-content plants, but most manifest plants embed the repository's element source and manifest, most contrast and brand-rules plants are token deltas, and style-lint plants use the tokens. A one-line JSDoc change in an element leaves `manifest/pass-reordered` unselected although it would turn stale. | Red test first. Element-source paths also select every `manifest` plant; token paths select every `contrast`, `brand-rules` and `style-lint` plant. The pin test grows to the full `manifest`, `contrast` and `brand-rules` plant lists. Amend OR-001/OR-002, the plan's path classes, the README paragraph and its known limit, and spec Assumptions to match. |
| O3-02 | blocking | gates/bin/plants.ts:665, :667 (`changed`); gates/test/integration/plants.test.ts | Landing L1-02: no test makes `git diff` or `git ls-files` fail, although the two equivalent-mutant records there claim coverage. A surviving mutant would turn a git failure into an empty selection with exit 0. | Add an integration case that makes `git diff` fail (for example a junk `GIT_INDEX_FILE`) and asserts exit 2 with `git failed (…)`; point the two records at it. A missing test for present behaviour: no red commit needed. |
| O3-03 | blocking | specs/006-storybook-workbench/contracts/plants.md (modes table, registry lists); specs/006-storybook-workbench/contracts/gates.md:164 | Landing L1-04: the contracts do not name the `--affected` / `--list` mode, the `affected-in-ci` rule or the plant `fail-affected-in-plant-check`. | Add them, as dated amendments where the contract is merged. |
| O3-04 | blocking | tooling/speckit/bin/fold-history.sh | Landing L1-05: the fold remaps `base.sha` but not the base line of `reviews/phase-N/plants.md`, so a fold that rewrites a phase base would make a later review see "another base". | Red test first: the fold also remaps the base SHA named in `plants.md`. |
| O3-05 | blocking | gates/bin (gate entries) | Landing L1-03: nothing catches a new import of one gate entry in `gates/bin` by another, which the path classes would then miss (today only `prefix.ts` → `brand-rules`, documented). | Red test first: a test that lists the cross-imports between `gates/bin` entries and pins them to the documented ones, so a new one fails until the selector or the known limit covers it. |

## Verdict

changes_requested (operator round).
