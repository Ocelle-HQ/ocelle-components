---
triage: 001
issues: [4]
decision: mission
target: "repository-foundation"
in_scope: [4]
out_of_scope: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
semver: none
spec_prompt: "Build the repository foundation from issue #4 (triage/001-repository-foundation.md): Apache-2.0 LICENSE, CONTRIBUTING.md with DCO sign-off, SECURITY.md with a private reporting channel, THIRD_PARTY_NOTICES, a pinned pnpm workspace with empty @ocelle/tokens, @ocelle/styles and @ocelle/elements packages, a Vitest (browser mode) runner behind one command wired into story-config.yml (both copies), test-quality lint, incremental StrykerJS mutation testing of changed source, and pull-request CI for typecheck, ESLint, Stylelint token-only, unit tests, strict-CSP check on built output, the sk-/monospace prefix check and DCO, each gate proven by a planted defect under gates/plants/; Storybook build, visual regression and axe stay with #10, and tokens with #5."
status: proposed
---

# Triage 001: Repository foundation - licence, governance, workspace, test tooling and CI

## Issues read

- **#4** "Repository foundation: licence, governance, workspace and CI" (open, no labels, no milestone, no comments,
  sub-issue of epic #1). Asks for: `LICENSE` (Apache-2.0), `CONTRIBUTING.md` with DCO, `SECURITY.md` with a private
  reporting channel (ADR-0071), `THIRD_PARTY_NOTICES` for the Schibsted Grotesk font; a pnpm workspace with three
  packages, pinned Node/pnpm, exact pins and a committed lockfile; PR CI (typecheck, ESLint, Stylelint token-only,
  unit tests, Storybook build, visual regression, CSP check on built output, `sk-`/monospace prefix check); a DCO
  check; and the Principle VIII test tooling (Vitest browser mode behind one command, `story-config.yml` filled in,
  test-quality lint, mutation testing, gate plants). States that its setup phases are the only ones allowed a
  `tdd-exempt.md`, and that it "depends on the package-name decision".
- Only cross-reference in its timeline: #11.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #1 | epic (open) | out of scope | Parent epic; #4 is one of its sub-issues. Nothing to deliver here beyond closing #4. |
| #2 | issue (closed) | out of scope (done) | The package-name decision #4 depends on: decided 2 Nov 2026 (`@ocelle/tokens`, `@ocelle/styles`, `@ocelle/elements`, public npm, internal until 1.0.0). Dependency satisfied. Its npm-org claim follow-up belongs to #11. |
| #3 | issue (open) | out of scope (appears done) | Spec Kit setup and constitution. Already in the repository (commit `d08d413`, constitution now v1.3.1). Not a blocker; the operator may close it separately. |
| #5 | issue (open) | out of scope, blocked by #4 | Design tokens package: new public surface (every `--ocelle-*` token, semver MINOR pre-1.0), its own design and contrast checks. Ships independently on top of the workspace and runner. The font file and its OFL licence are vendored there. |
| #6 | issue (open) | out of scope, blocked by #4 (and #5) | Base styles package; "Depends on: design tokens". |
| #7, #8, #9, #12, #13, #14, #15, #16, #17 | issues (open) | out of scope, blocked by #4 | Element and icon issues; each needs the workspace, runner, lint and CI gates before its first red phase. |
| #10 | issue (open) | out of scope (owns Storybook, visual regression, axe), blocked by #4 | "Can start as soon as the foundation issue lands." #4's list of CI jobs names Storybook build and visual regression; those overlap with #10 and go there (see Scope). |
| #11 | issue (open) | blocked by #4 | Release v1.0.0; explicitly "Blocked by: #4". Needs `SECURITY.md` and `THIRD_PARTY_NOTICES` from #4. |
| Pull requests | - | none | No pull requests, open or closed. |
| `specs/`, `ops/`, `triage/` | repository | none | None exist; this is the first triage record and no feature or op is in progress, so a fold is impossible. |
| `.specify/extensions/story/story-config.yml` and `tooling/speckit/extensions/story/story-config.yml` | config | in scope | `test_command`, `setup_command`, `mutation_command` are empty; #4 fills them (both copies). |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | in scope | Lists mutation testing and gate plants as "planned (issue #4)". |
| `knowledge/speckit-flows/experiments/2026-11-02-spec-kit-baseline.md` | experiment | note | Names "the test tooling and design tokens, issues #4 and #5" as the baseline feature. This record splits them; see Risks. |

## Decision

**mission.** Several mission criteria apply:

- **More than one user story.** At least four independently testable outcomes: governance and licence files; a
  pinned workspace with a single test command wired into the story loop; test-quality lint and mutation testing;
  CI gates each proven by a plant.
- **Spans packages.** It creates the workspace and all three package skeletons, and the gates apply across them.
- **Security behaviour beyond a local fix.** `SECURITY.md` and its private reporting channel, the strict-CSP gate,
  the supply-chain pins and the DCO check.
- **Open design questions.** Tool choices and configuration (Vitest browser provider, StrykerJS incremental mode and
  its CI scope, how the token-only Stylelint rule is expressed before tokens exist, how gate plants are run and
  proven, which reporting channel `SECURITY.md` names).

Why not the others: not an **op** (far more than one bounded phase, and it has design questions); not a **fold**
(no feature or op in progress); not **none** (nothing of it exists yet; #3's setup does not cover it); not
**decision-needed** (the one stated dependency, package names, is decided in #2; the remaining questions can be
answered in the spec check and plan gates).

**semver: none.** No published surface changes: the packages are empty skeletons, nothing is released, and the
public surface (manifest, token names, base-style hooks) is untouched.

## Scope

In scope (#4), suggested user stories in priority order:

1. **Workspace and test command** - pnpm workspace with the three empty packages, pinned Node and pnpm, exact
   pins, committed lockfile; Vitest (browser mode for elements) behind one root command that exits non-zero on any
   failure; `story-config.yml` (both copies) with `test_command`, offline `setup_command`, `test_pathspec`. This is
   the setup phase allowed a `tdd-exempt.md`; every later phase runs red first.
2. **Test quality** - test-quality lint (`expect-expect`, `no-disabled-tests`, `no-focused-tests`,
   `no-conditional-expect`, `valid-expect`, `no-standalone-expect`, a rule against snapshot-only tests); incremental
   mutation testing of changed source with `mutation_command` set; equivalent-mutant marking with a reason.
3. **CI gates with plants** - PR CI for typecheck, ESLint, Stylelint token-only, unit tests, strict-CSP check on the
   packages' built output, the prefix check (`sk-` elements, `--sk-` tokens, `sk-` events, `monospace`), the
   test-quality lint, mutation testing and DCO; each with a planted defect under `gates/plants/` and a CI job
   proving it fails.
4. **Licence and governance** - `LICENSE` (Apache-2.0), `CONTRIBUTING.md` (DCO, no CLA, the Spec Kit flow),
   `SECURITY.md` with a private channel, `THIRD_PARTY_NOTICES` (the font entry may be added by #5 when the font is
   actually vendored, so the notice never lists an asset that does not ship).

Out of scope:

- **Storybook build, visual regression in a pinned container, axe on every story** - go to #10, which owns the
  workbench. #4 should leave CI room for them, and #10 adds their gate plants.
- **Contrast check** - goes to #5 (its "Done when" has it).
- **Custom-elements manifest check** - no elements exist yet; goes to the first element mission (#7) or #10.
- **Tokens, font file, base styles, elements, icons, release** - #5, #6, #7-#9, #12-#17, #11.

## Risks and open questions

- **Bundle with #5?** The baseline experiment names #4 and #5 as one feature. This record splits them because #5
  adds public surface and needs its own design and contrast work, and the smallest independently testable outcome is
  the foundation alone. If the operator wants one baseline feature, #5 becomes a second mission right after this one,
  or the operator overrides this record.
- **Gate list differs from the constitution.** The constitution's merge gates also name Storybook build, visual
  regression, axe, contrast and the manifest check. Under this split those land in #10, #5 and the first element
  mission; until then `main` merges without them. The spec should state this explicitly so no reviewer reads it as a
  gap in #4.
- **Token-only Stylelint before tokens exist.** The rule must be provable with a plant (a raw colour literal) without
  any `--ocelle-*` token defined; the plan must show it does not pass vacuously on empty packages.
- **Gates on empty packages.** CSP and prefix checks on near-empty build output can pass trivially; the plants are
  what prove them, so every gate needs one before the mission closes.
- **SECURITY.md channel.** GitHub private vulnerability reporting may not be available while the repository is
  internal; the operator must choose a channel (for example a security mailbox) during the spec check.
- **DCO check mechanism** (GitHub App vs. an action) and **CI platform** are plan decisions.
- **Mutation testing cost** on CI: incremental mode scoped to changed files; the plan must state a time budget.
- **#3 still open** although Spec Kit is set up; housekeeping for the operator, not this mission.

## What would change this decision

- The operator chooses to bundle #5 into this mission (the experiment's baseline): scope becomes [4, 5], semver
  minor, and the contrast check moves in.
- The operator moves Storybook build and visual regression into #4 instead of #10: #10 shrinks to stories and
  baselines and becomes a fold or an op.
- A pull request or branch already implementing part of #4 appears: that part becomes a fold.
- The operator decides the foundation should be split smaller (for example governance files as an op ahead of the
  tooling mission): the governance files alone would qualify as an op (docs, no public surface).
