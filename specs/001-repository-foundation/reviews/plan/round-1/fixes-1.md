# Squad round 1: fixes 1

Applied the 19 confirmed fixes and the operator's 9 fork decisions from `refute.md`. Duplicates and refuted findings
are covered by the rows they point to and have no row here. CORRECTNESS-1-001 was applied after reading
`tooling/speckit/extensions/story/scripts/common.sh` as of a9fe63b (story 1.2.2): `story_run_tests_at` now takes
`test_command` and `setup_command` from the current configuration, so the "empty command at the base commit" part
of the finding no longer holds. The split is still needed because `tdd-check.sh` treats a phase as exempt only when
it has no red commit, and phase 1's red commits would run before `setup:offline` and `gates/bin/test.ts` exist.
The plan states that the split does not depend on the 1.2.2 change.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-003 | fixed | research.md R-16; contracts/ci-checks.md (security block, checkout); plan.md Technical Context Constraints, Constitution Check (supply chain) |
| PLAN-A11Y-SECURITY-1-004 | decided: (a) | research.md R-11 (parse5 tokenizer over HTML and static template parts, TypeScript compiler API for eval, Function, indirect eval and string timers; `javascript:` left out); spec.md FR-025 csp plants; contracts/plants.md csp row; plan.md Technical Context (parse5 8.0.1), Constitution Check IV |
| PLAN-A11Y-SECURITY-1-005 | decided: (a) | research.md R-04 (minimumReleaseAge 10080 strict, `allowBuilds: {}`, re-pins), R-14 (pins gate enforces both), R-01/R-03/R-05; spec.md FR-027, US1 scenario 8, FR-025 pins plants; contracts/plants.md pins row; plan.md Technical Context (Vitest and @vitest/browser-playwright 5.0.5, ESLint 10.13.0, typescript-eslint 8.72.0, @types/node 26.6.5), Source Code, Constitution Check |
| PLAN-A11Y-SECURITY-1-006 | fixed | plan.md Technical Context (postcss 8.5.31, postcss-value-parser 4.2.0 exact, hoisting off); research.md R-07, R-14 |
| PLAN-A11Y-SECURITY-1-007 | decided: (a) | research.md R-17 (verification); quickstart.md step 9; plan.md Phases 5; FR-032 wording unchanged |
| PLAN-A11Y-SECURITY-1-008 | fixed | contracts/plants.md (identities); data-model.md § Plant (identities); research.md R-13 |
| PLAN-CORRECTNESS-1-001 | fixed | plan.md Phases (phase 1 bootstrap exempt with no red commit; US1 behaviour in phase 2, the SC-003 demo phase; later phases renumbered), Complexity Tracking row 1, Constitution Check VIII; spec.md SC-003, Assumptions, US1 Independent Test; contracts/story-config.md; quickstart.md step 8 |
| PLAN-CORRECTNESS-1-002 | decided: (a) | spec.md FR-011, FR-028 (gate source definition, mutation row), US2 scenario 3; research.md R-08 (scope pathspecs, in-process gate tests, entry guard); plan.md Testing, Constitution Check VIII, Phases 3; contracts/gate-cli.md; contracts/plants.md mutation row (gate source survivor) |
| PLAN-CORRECTNESS-1-003 | fixed | plan.md Source Code (`.gitignore`), Phases 1; quickstart.md steps 1 and 7 |
| PLAN-CORRECTNESS-1-004 | fixed | contracts/ci-checks.md (Mutation testing: `fetch-depth: 0`, `--base` from `github.event.pull_request.base.sha`; Sign-off range from the event's base and head); research.md R-08 step 1, R-16 |
| PLAN-CORRECTNESS-1-006 | fixed | plan.md Technical Context (Vite 8.3.5, jiti 2.7.0); research.md R-03, R-05, R-06 |
| PLAN-CORRECTNESS-1-007 | fixed | research.md R-08 step 2 (TypeScript-only pathspecs with test-code excludes), R-07 (`ignoreFiles` test-code globs); spec.md FR-025 style-lint pass plant; contracts/plants.md style-lint and mutation pass plants |
| PLAN-CORRECTNESS-1-008 | fixed | contracts/plants.md unit-tests row (project per plant; elements in Chromium) |
| PLAN-CORRECTNESS-1-009 | fixed | research.md R-10 (registry check against `ci.yml` and the FR-020 list in `gates/lib/registry.ts`, with plants under `gates/plants/plants/`); data-model.md § Gate; contracts/plants.md; contracts/ci-checks.md; plan.md Phases 4 |
| PLAN-CORRECTNESS-1-012 | fixed | data-model.md § Finding (single definition: `<location>: <gate-id>: <rule>: <message>`, location `path:line`, `path` or commit hash); research.md R-09; contracts/gate-cli.md |
| PLAN-FRESH-1-003 | fixed | contracts/plants.md (configuration rule, plant tsconfig only `extends` and `include`); data-model.md § Plant; research.md R-10 (plant job rejects a plant carrying configuration) |
| PLAN-FRESH-1-005 | fixed | plan.md Technical Context; research.md R-01, R-02 (`erasableSyntaxOnly`, `verbatimModuleSyntax`, `nodenext`, `.ts` imports with `allowImportingTsExtensions` and `rewriteRelativeImportExtensions`, rootDir/outDir per package, `.js` relative imports rejected by the code lint; probed with tsc 6.0.3), R-05 |
| PLAN-FRESH-1-007 | fixed | contracts/story-config.md (`pnpm run gate:mutation -- --base <sha>`, reinstall command, every installed copy); research.md R-08; plan.md Source Code note, Phases 3 |
| PLAN-FRESH-1-008 | decided: (b) | spec.md FR-027, US1 scenario 8, FR-025 pins plants; research.md R-14; contracts/plants.md pins row (pass `workspace:0.0.0`, fail `workspace:^`); plan.md Constitution Check |
| PLAN-FRESH-1-009 | decided: (a) | spec.md FR-024 (keyword definition, strings, author-defined and dashed identifiers), US3 scenario 2, FR-025 style-lint plants; research.md R-07; contracts/plants.md style-lint row (pass `content: ""`, `anchor-name: --tip`; fail `color: red`) |
| PLAN-TESTABILITY-1-002 | decided: (c) | research.md R-09, R-10; contracts/gate-cli.md (classification from structured output per tool, top-level catch to 2); contracts/plants.md (expected findings, a pass and a breaking plant per gate); data-model.md § Plant; spec.md FR-025, US3 scenario 7, Key Entities; quickstart.md step 5 |
| PLAN-TESTABILITY-1-004 | decided: (a) | research.md R-10 (temporary repository for commit and mutation plants, normal mode with `--root`), R-13; contracts/gate-cli.md (plant mode); contracts/plants.md (`commit-repo`, `mutation-repo`); data-model.md § Gate plantForm, § Commit record |
| PLAN-TESTABILITY-1-005 | decided: (b) | spec.md FR-009, FR-028 (`gates/test/fixtures/` excluded from every normal gate, recorded exception); research.md R-10, R-05, R-06, R-07; plan.md Testing, Constraints, Source Code |
| PLAN-TESTABILITY-1-007 | fixed | research.md R-08 step 5; data-model.md § Equivalent-mutant record; contracts/plants.md mutation row (fail: reasonless next-line, `disable all`; pass: reasoned record with expected `records`); spec.md FR-025 mutation plants |
| PLAN-TESTABILITY-1-008 | fixed | contracts/plants.md style-lint row (one fail plant per FR-024 reject class); spec.md FR-025 style-lint plants |
| PLAN-TESTABILITY-1-009 | fixed | research.md R-04 (test seam: store and browser path from the environment, registry at a local socket, zero connections); quickstart.md step 2; plan.md Phases 2 |
| PLAN-TESTABILITY-1-010 | fixed | research.md R-03 (Chromium-only sample test, plant expected finding); contracts/plants.md unit-tests row; plan.md Phases 2; quickstart.md step 3 |
| PLAN-TESTABILITY-1-011 | fixed | quickstart.md step 11 (generated change at the SC-005 bound through the CI mutation job, duration recorded) |
