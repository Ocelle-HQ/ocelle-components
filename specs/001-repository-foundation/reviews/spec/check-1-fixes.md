# Spec check 1: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | spec.md FR-028 (new: definitions, `gates/plants/` excluded from normal gates, per-gate file table, documentation and tooling out of the prefix check); FR-004, FR-020, FR-024; US3 scenario 8 |
| SPEC-1-02 | fixed | spec.md FR-022 (name-boundary rule for `sk-` / `--sk-`; generic and named monospace families rejected, per constitution II "no monospace anywhere"); FR-025 pass plants `task-list`, `desk-row`, `--risk-level`; US3 scenarios 4 and 5 |
| SPEC-1-03 | fixed | spec.md FR-024 (styles embedded in `@ocelle/elements` TypeScript and stylesheets of `@ocelle/elements` and `@ocelle/styles`; `@ocelle/tokens` definitions excluded); FR-025 plant inside an embedded style template; US3 scenario 2 |
| SPEC-1-05 | fixed | spec.md FR-027 (new install-and-pins gate), FR-020, FR-025 plants (mismatched lockfile, `^` range), FR-028 row; US1 scenario 8; Edge Cases |
| SPEC-1-06 | fixed | spec.md FR-008 (new: online install vs offline setup, browser binary from the online install into a cache outside the repository, offline failure message); FR-006; US1 scenarios 1 to 3; Edge Cases |
| SPEC-1-10 | fixed | spec.md SC-006 (scripted check of the four root files and their contents) |
| SPEC-1-11 | fixed | spec.md SC-001 (GitHub-hosted `ubuntu-latest`, 2 vCPU while internal, cold caches), SC-005 (size bound, warm package and browser caches, no earlier mutation result), FR-013 (10-minute job limit, timeout is a failure) |
| SPEC-1-12 | fixed | spec.md Assumptions (exemption narrowed to workspace and runner bootstrap); the Complexity Tracking row is for the plan |
| SPEC-1-13 | fixed | spec.md Edge Cases (reworded), FR-004 (a run with no test file fails) |
| SPEC-1-14 | fixed | spec.md FR-012 (record kept next to the mutated code; report lists every record in changed code), US2 scenario 4, Key Entities |
| SPEC-1-15 | fixed | spec.md FR-009 (new: samples are fixtures or plants, not exported or built); US1 and US2 Independent Tests |
| SPEC-1-16 | fixed | spec.md FR-021 (constructs and built-output files enumerated; remote loads stated as not part of this gate in this feature) |
| SPEC-1-17 | fixed | spec.md FR-034 ("credential or access token"; verified by the story review, no secret-scan gate) |
| SPEC-1-18 | fixed | spec.md FR-026 and Assumptions (gate documentation is `gates/README.md`; manifest check "#7 or #10, whichever lands first"); the Complexity Tracking row is for the plan |
| SPEC-1-19 | fixed | spec.md US3 narrative (configuration-copies and install-and-pins checks added), Independent Test (a change that touches no checked file) |
| SPEC-1-20 | fixed | spec.md FR-028 (package source defined), FR-011 (the pull request's base branch) |
| SPEC-1-21 | fixed | No change needed (the finding asks for none) |

Operator findings SPEC-1-04, SPEC-1-07, SPEC-1-08 and SPEC-1-09 (questions 1 to 4) have no answers yet and are left
for the operator at the gate. FR-005, FR-023, FR-032, FR-034's contact exemption and the FR-024 allow-list are
unchanged on those points.
