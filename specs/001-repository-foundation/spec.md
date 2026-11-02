# Feature Specification: Repository Foundation

**Feature Branch**: `001-repository-foundation` (work happens on `claude/kitty-ui-speckit-decouple-x3prkx`)

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Build the repository foundation from issue #4 (triage/001-repository-foundation.md): Apache-2.0 LICENSE, CONTRIBUTING.md with DCO sign-off, SECURITY.md with a private reporting channel, THIRD_PARTY_NOTICES, a pinned pnpm workspace with empty @ocelle/tokens, @ocelle/styles and @ocelle/elements packages, a Vitest (browser mode) runner behind one command wired into story-config.yml (both copies), test-quality lint, incremental StrykerJS mutation testing of changed source, and pull-request CI for typecheck, ESLint, Stylelint token-only, unit tests, strict-CSP check on built output, the sk-/monospace prefix check and DCO, each gate proven by a planted defect under gates/plants/; Storybook build, visual regression and axe stay with #10, and tokens with #5."

**Issues**: #4 (triage record `triage/001-repository-foundation.md`, approved by the operator)

## User Scenarios & Testing *(mandatory)*

The users of this feature are the people and agents who build the library: the operator, contributors, and the
agent roles of the story workflow (implementer, reviewer). Every later feature (#5 to #17) depends on it.

### User Story 1 - One command runs every test, and the story workflow can use it (Priority: P1)

A contributor or agent checks out the repository, installs its dependencies from the committed lockfile with the
pinned tool versions, and runs one command that executes every test in every package, including tests that need a
real browser. The command fails when any test fails. The story workflow's red/green check is configured to use this
command, so the next feature's phases can be proven red first.

**Why this priority**: Nothing else can be built test-first until this exists; the red/green check reports
"unavailable" today and blocks every phase with behaviour.

**Independent Test**: In a fresh clone, install and run the single test command: a sample passing test makes it
succeed, a sample failing test (in each of the three packages, and one needing a browser) makes it fail; the story
workflow's red/green check on a demo phase reports "pass" instead of "unavailable".

**Acceptance Scenarios**:

1. **Given** a fresh clone with the pinned runtime and package-manager versions, **When** dependencies are installed
   from the lockfile with no network access to registries beyond the lockfile's packages, **Then** the install
   succeeds and changes no tracked file.
2. **Given** the workspace, **When** the test command runs, **Then** it runs the tests of all three packages and
   exits zero when they pass.
3. **Given** a failing test in any one package, **When** the test command runs, **Then** it exits non-zero and names
   the failing test.
4. **Given** a test that renders a custom element and reads the accessibility tree, **When** the test command runs,
   **Then** the test runs in a real browser engine, not a simulated DOM.
5. **Given** both copies of the story extension's configuration, **When** the red/green check runs on a phase with a
   red commit, **Then** it uses the test command and reports `pass` or `fail`, never `unavailable`.
6. **Given** an install that would change the lockfile or use an unpinned version, **When** it runs in CI, **Then**
   it fails.

---

### User Story 2 - Tests that cannot fail are rejected (Priority: P2)

A reviewer, human or agent, can rely on two automatic checks that catch vacuous tests: a lint of test code that
rejects tests which cannot fail, and mutation testing of changed source that reports changes no test would notice.

**Why this priority**: The constitution's Principle VIII names both as merge gates; the vacuous-test guard has them
as "planned (issue #4)". Without them the story reviews carry that load alone.

**Independent Test**: Plant each forbidden pattern in a scratch test and run the lint; change a covered line of
sample source in a way its tests do not check and run mutation testing on that change.

**Acceptance Scenarios**:

1. **Given** a test with no assertion, **When** the test lint runs, **Then** it reports an error.
2. **Given** a skipped test, a focused test, an assertion inside a conditional, an assertion outside a test, an
   assertion that is never awaited or completed, or a test whose only assertion is a snapshot, **When** the test
   lint runs, **Then** each one is reported as an error.
3. **Given** a change to source that its tests exercise but do not check, **When** mutation testing runs on the
   changed files, **Then** it reports at least one surviving mutant with its location and fails.
4. **Given** a surviving mutant recorded as equivalent with a written reason, **When** mutation testing runs again,
   **Then** that mutant no longer fails the run, and the reason is kept next to the code.
5. **Given** a change that touches no source, **When** mutation testing runs, **Then** it finishes without mutating
   anything and succeeds.

---

### User Story 3 - Every merge gate runs on pull requests and is proven able to fail (Priority: P3)

The operator opens a pull request and sees every merge gate of this feature run: typecheck, code lint, style lint
(token-only), unit tests, the test lint, mutation testing, the strict content-security check on built output, the
prefix check and the sign-off check. For each gate a planted defect exists and a CI job shows the gate fails on it.

**Why this priority**: Gates are what keep agents honest after this feature; a gate that passes everything is worse
than none. It depends on Stories 1 and 2.

**Independent Test**: Open a pull request that changes nothing: every gate passes. Then run each gate against its
plant: every gate fails, with a message naming the defect.

**Acceptance Scenarios**:

1. **Given** a pull request, **When** CI runs, **Then** each gate of FR-020 runs as its own named check.
2. **Given** a raw colour, font, size, radius, shadow or duration value in element styles, **When** the style lint
   runs, **Then** it fails, even though no design token exists yet.
3. **Given** built package output that contains an inline script, an inline style element or attribute, an event
   handler attribute, or a dynamic-code call, **When** the content-security check runs on it, **Then** it fails.
4. **Given** an element name, token name or event name starting with `sk-` / `--sk-`, or a `monospace` font family,
   anywhere in source or build output, **When** the prefix check runs, **Then** it fails and names the file and line.
5. **Given** a commit in the pull request without a `Signed-off-by` line, **When** the sign-off check runs, **Then**
   it fails and names the commit.
6. **Given** each gate's planted defect, **When** the plant job runs, **Then** every gate fails on its plant; if any
   gate passes on its plant, the plant job fails.
7. **Given** the near-empty packages of this feature, **When** a gate passes, **Then** the plant job has shown in the
   same run that it can fail, so no gate passes only because there is nothing to check.

---

### User Story 4 - Licence and governance files for a future public repository (Priority: P4)

A prospective contributor finds the licence, how to contribute (sign-off, no contributor agreement, the Spec Kit
flow), how to report a vulnerability privately, and which third-party material ships with the code.

**Why this priority**: Required before the repository goes public at 1.0.0 (ADR-0071, issue #11), but nothing else
in this feature depends on it.

**Independent Test**: Read the four files in a fresh clone and check them against FR-030 to FR-034.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** a contributor opens it, **Then** they find `LICENSE` with the Apache-2.0
   text, `CONTRIBUTING.md`, `SECURITY.md` and `THIRD_PARTY_NOTICES`.
2. **Given** `CONTRIBUTING.md`, **When** a contributor reads it, **Then** it explains sign-off (`git commit -s`),
   states there is no contributor licence agreement, and points to the Spec Kit flow and the constitution.
3. **Given** `SECURITY.md`, **When** a reporter reads it, **Then** it names a private reporting channel, what to
   include, and what response to expect, and it does not ask for public issues.
4. **Given** `THIRD_PARTY_NOTICES`, **When** it is read, **Then** it lists every third-party asset that ships in a
   package and no asset that does not.

---

### Edge Cases

- A test file in a package that has no tests yet: the test command must still run the other packages and succeed;
  an empty package must not fail the run.
- A browser engine missing on the machine: the test command fails with a message saying how to install it, never
  silently skips browser tests.
- A pull request with no source change: mutation testing must not mutate the whole code base.
- A plant accidentally fixed or deleted: the plant job must fail ("gate X has no plant" or "plant X did not fail").
- A commit authored by an agent: it needs a sign-off like any other commit.
- A lockfile change in a pull request without a matching manifest change: the install check fails.
- The story extension's two configuration copies disagree: a check must flag it.
- `THIRD_PARTY_NOTICES` while no third-party asset ships yet: it states that, and the font entry is added by #5 when
  the font is vendored.

## Requirements *(mandatory)*

### Functional Requirements

**Workspace and test command (Story 1)**

- **FR-001**: The repository MUST be a workspace of exactly three packages, `@ocelle/tokens`, `@ocelle/styles` and
  `@ocelle/elements`, each with no public surface yet (no tokens, styles or elements).
- **FR-002**: The runtime and package-manager versions MUST be pinned in the repository, every dependency MUST be
  pinned to an exact version, and the lockfile MUST be committed.
- **FR-003**: A frozen install from the lockfile MUST succeed in a fresh clone and MUST fail when the lockfile would
  change.
- **FR-004**: One root command MUST run every test of every package and exit non-zero when any test fails.
- **FR-005**: Tests of elements MUST run in a real browser engine.
- **FR-006**: Both copies of the story extension's configuration MUST set the test command, an offline setup command
  and the test file patterns of this repository, and MUST be identical; a check MUST fail when they differ.
- **FR-007**: The mutation command MUST be set in both configuration copies (Story 2).

**Test quality (Story 2)**

- **FR-010**: A test lint MUST reject tests without an assertion, skipped and focused tests, assertions inside
  conditionals, assertions outside a test, assertions that are not awaited or completed, and tests whose only
  assertion is a snapshot.
- **FR-011**: Mutation testing MUST run on the source changed relative to the target branch, MUST fail when a mutant
  survives in changed code, and MUST report each survivor's location.
- **FR-012**: A surviving mutant MAY be recorded as equivalent only with a written reason kept in the repository.
- **FR-013**: Mutation testing in CI MUST finish within the time budget of SC-005.

**Merge gates (Story 3)**

- **FR-020**: Pull-request CI MUST run these gates as separate named checks: typecheck, code lint, style lint
  (token-only), unit tests (the FR-004 command), test lint (FR-010), mutation testing (FR-011), the content-security
  check on built output (FR-021), the prefix check (FR-022), the configuration-copies check (FR-006) and the sign-off
  check (FR-023).
- **FR-021**: The content-security check MUST fail on any inline script, inline style element or attribute, event
  handler attribute, or dynamic-code call in the packages' built output.
- **FR-022**: The prefix check MUST fail on any `sk-` element name, `--sk-` token name, `sk-` event name or
  `monospace` font family in source or build output, naming file and line.
- **FR-023**: The sign-off check MUST fail on any commit in a pull request without a `Signed-off-by` line.
- **FR-024**: The style lint MUST reject raw colour, font, size, radius, shadow and duration values in element
  styles without depending on any design token existing.
- **FR-025**: Every gate of FR-020 MUST have a planted defect under `gates/plants/`, and a CI job MUST run each gate
  against its plant and fail unless every gate fails on its plant.
- **FR-026**: Gates that this feature does not deliver MUST be named in the repository's gate documentation with the
  issue that delivers them: Storybook build, visual regression and accessibility checks (#10), contrast check (#5),
  custom-elements manifest check (first element feature, #7 or #10).

**Licence and governance (Story 4)**

- **FR-030**: `LICENSE` MUST contain the Apache License 2.0.
- **FR-031**: `CONTRIBUTING.md` MUST explain sign-off, state that there is no contributor licence agreement, and
  point to the Spec Kit flow and the constitution.
- **FR-032**: `SECURITY.md` MUST name a private reporting channel: [NEEDS CLARIFICATION: which private channel —
  GitHub private vulnerability reporting may be unavailable while the repository is internal; a security mailbox
  needs an address],
  what to include in a report and the expected response time, and MUST NOT ask for public issues.
- **FR-033**: `THIRD_PARTY_NOTICES` MUST list every third-party asset that ships in a package with its licence, and
  only those.
- **FR-034**: No file of this feature MAY contain a secret, token or personal data.

### Key Entities

- **Gate**: a named merge check; has a command, the CI check it runs as, and one plant.
- **Plant**: a deliberate defect under `gates/plants/` that one gate must fail on.
- **Story configuration**: the story extension's settings (test, setup, mutation commands; test file patterns),
  present in two copies that must match.
- **Equivalent-mutant record**: a surviving mutant accepted with its location and reason.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a fresh clone, install plus the full test run completes in under 5 minutes on a standard CI runner.
- **SC-002**: 100% of the gates in FR-020 fail on their plant in the plant job, and 0 gates pass on their plant.
- **SC-003**: The story workflow's red/green check on a demo phase reports `pass` (not `unavailable`) after this
  feature, and `fail` when its final tests pass against the code from before the phase.
- **SC-004**: Each of the six forbidden test patterns of FR-010 is reported as an error in 100% of planted cases.
- **SC-005**: Mutation testing of a typical pull request (up to 10 changed source files) finishes in under 10
  minutes in CI.
- **SC-006**: A first-time contributor finds the licence, the sign-off rule and the vulnerability reporting route in
  under 2 minutes from the repository root.

## Assumptions

- Tools named in issue #4 and the triage record are the starting point for the plan: pnpm workspaces, Vitest with
  browser mode, an ESLint plugin for test rules, StrykerJS in incremental mode; the plan confirms or replaces them.
- CI runs on GitHub Actions; the sign-off check mechanism (an action or a GitHub App) is a plan decision.
- No third-party asset ships in this feature; the Schibsted Grotesk font and its OFL entry arrive with #5.
- Storybook, visual regression and axe CI are out of scope (#10); the contrast check is out of scope (#5); the
  custom-elements manifest check comes with the first element feature. Until those land, `main` merges without them,
  and FR-026 makes that visible.
- The repository stays internal until 1.0.0 (#2, #11); nothing is published in this feature.
- The first phase (workspace and test command) may use `tdd-exempt.md`, since no runner exists before it; every later
  phase runs red first.
