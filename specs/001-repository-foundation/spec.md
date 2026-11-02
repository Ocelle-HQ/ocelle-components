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

**Independent Test**: In a fresh clone, install and run the single test command: the passing sample tests in the
packages make it succeed. Then the plant job runs the same test command against the failing-test plants under
`gates/plants/` (FR-009, FR-025): one set up as a test of each of the three packages and one needing a browser; the
command fails on each. The normal test run never reads these plants (FR-028). The story workflow's red/green check on
a demo phase reports "pass" instead of "unavailable".

**Acceptance Scenarios**:

1. **Given** a fresh clone with the pinned runtime and package-manager versions, **When** the online install
   (FR-008) runs, **Then** it succeeds, fills the local package store and browser cache, and leaves the lockfile and
   every other tracked file unchanged.
2. **Given** a machine on which the online install has run once, and a fresh worktree of the repository, **When** the
   offline setup command (FR-006, FR-008) runs with network access disabled, **Then** it succeeds and changes no
   tracked file.
3. **Given** a local package store or browser cache that lacks something the lockfile or the tests need, **When** the
   offline setup command runs with network access disabled, **Then** it fails with a message naming what is missing
   and the online install command that fills it.
4. **Given** the workspace, **When** the test command runs, **Then** it runs the tests of all three packages and
   exits zero when they pass.
5. **Given** a failing test in any one package, **When** the test command runs, **Then** it exits non-zero and names
   the failing test.
6. **Given** a test that renders a custom element and reads the accessibility tree, **When** the test command runs,
   **Then** the test runs in a real browser engine (Chromium, FR-005), not a simulated DOM.
7. **Given** both copies of the story extension's configuration (FR-006), **When** the red/green check runs on a
   phase with a red commit, **Then** it uses the test command and reports `pass` or `fail`, never `unavailable`.
8. **Given** a lockfile that does not match the manifests, or a manifest that declares a dependency by a range (such
   as `^1.2.3` or `~1.2.3`) instead of an exact version, **When** the install-and-pins gate (FR-027) runs, **Then** it
   fails and names the file.
9. **Given** a machine on which the browser engine of FR-005 is not installed, **When** the test command runs,
   **Then** it exits non-zero with a message naming the online install command (FR-008), and it skips no test.
10. **Given** a package with no test file while another package has passing tests, **When** the test command runs,
    **Then** it runs the other packages' tests and exits zero.

---

### User Story 2 - Tests that cannot fail are rejected (Priority: P2)

A reviewer, human or agent, can rely on two automatic checks that catch vacuous tests: a lint of test code that
rejects tests which cannot fail, and mutation testing of changed source that reports changes no test would notice.

**Why this priority**: The constitution's Principle VIII names both as merge gates; the vacuous-test guard has them
as "planned (issue #4)". Without them the story reviews carry that load alone.

**Independent Test**: Run the test lint against the plants under `gates/plants/` that hold each forbidden pattern
(FR-009, FR-025); run mutation testing against the two mutation plants: a change to a covered line of sample source
that its tests do not check, and a changed line of sample source that no test runs.

**Acceptance Scenarios**:

1. **Given** a test with no assertion, **When** the test lint runs, **Then** it reports an error.
2. **Given** a skipped test, a focused test, an assertion inside a conditional, an assertion outside a test, an
   assertion that is never awaited or completed, or a test whose only assertion is a snapshot, **When** the test
   lint runs, **Then** each one is reported as an error.
3. **Given** a change to source that its tests exercise but do not check, or a changed line of source that no test
   runs at all, **When** mutation testing runs on the change, **Then** it reports at least one surviving mutant with
   its location and fails (FR-011: a mutant no test covers counts as surviving).
4. **Given** a surviving mutant recorded as equivalent with a written reason, **When** mutation testing runs again,
   **Then** that mutant no longer fails the run, the reason is kept next to the mutated code (FR-012), and the
   mutation report lists the record so the review can see it.
5. **Given** a change that touches no source, **When** mutation testing runs, **Then** it finishes without mutating
   anything and succeeds.

---

### User Story 3 - Every merge gate runs on pull requests and is proven able to fail (Priority: P3)

The operator opens a pull request and sees every merge gate of this feature run: typecheck, code lint, style lint
(token-only), unit tests, the test lint, mutation testing, the strict content-security check on built output, the
prefix check, the configuration-copies check, the install-and-pins check and the sign-off check. For each gate a
planted defect exists and a CI job shows the gate fails on it.

**Why this priority**: Gates are what keep agents honest after this feature; a gate that passes everything is worse
than none. It depends on Stories 1 and 2.

**Independent Test**: Open a pull request with a change that touches no checked file (FR-028): every gate passes. Then run each gate against its
plant: every gate fails, with a message naming the defect.

**Acceptance Scenarios**:

1. **Given** a pull request, **When** CI runs, **Then** each gate of FR-020 runs as its own named check.
2. **Given** a raw colour, font, size, radius, shadow or duration value in styles the style lint covers (FR-024),
   including a style embedded in an element's TypeScript, **When** the style lint runs, **Then** it fails, even
   though no design token exists yet.
3. **Given** built package output that contains an inline script, an inline style element or attribute, an event
   handler attribute, or a dynamic-code call, **When** the content-security check runs on it, **Then** it fails.
4. **Given** a name starting with `sk-` or `--sk-` at a name boundary (FR-022), or a monospace font family, in any
   file the prefix check covers (FR-028), **When** the prefix check runs, **Then** it fails and names the file and
   line.
5. **Given** a name that only contains `sk-` inside a longer word, such as `task-list`, `desk-row` or `--risk-level`,
   **When** the prefix check runs, **Then** it passes.
6. **Given** a non-merge commit in the pull request without a `Signed-off-by` line, or whose `Signed-off-by`
   identity does not match its author, **When** the sign-off check runs, **Then** it fails and names the commit
   (FR-023).
7. **Given** each gate's planted defect, **When** the plant job runs, **Then** every gate fails on its plant; if any
   gate passes on its plant, or fails on one of its pass plants (FR-025), the plant job fails.
8. **Given** a pull request, **When** the normal gates run, **Then** none of them reads `gates/plants/`, so the plants
   never make a normal gate fail.
9. **Given** the near-empty packages of this feature, **When** a gate passes, **Then** the plant job has shown in the
   same run that it can fail, so no gate passes only because there is nothing to check.

---

### User Story 4 - Licence and governance files for a future public repository (Priority: P4)

A prospective contributor finds the licence, how to contribute (sign-off, no contributor agreement, the Spec Kit
flow), how to report a vulnerability privately, and which third-party material ships with the code.

**Why this priority**: Required before the repository goes public at 1.0.0 (ADR-0071, issue #11), but nothing else
in this feature depends on it.

**Independent Test**: Read the four files and `CODEOWNERS` in a fresh clone and check them against FR-030 to FR-035.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** a contributor opens it, **Then** they find `LICENSE` with the Apache-2.0
   text, `CONTRIBUTING.md`, `SECURITY.md` and `THIRD_PARTY_NOTICES`, and the repository has a `CODEOWNERS` file that
   names `@MOES-Media` as the owner of the whole repository (FR-035).
2. **Given** `CONTRIBUTING.md`, **When** a contributor reads it, **Then** it explains sign-off (`git commit -s`),
   states there is no contributor licence agreement, and points to the Spec Kit flow and the constitution.
3. **Given** `SECURITY.md`, **When** a reporter reads it, **Then** it names GitHub private vulnerability reporting
   (switched on when the repository goes public) and `@MOES-Media` as the private contact until then, says what to
   include in a report, promises an acknowledgement within 3 working days and a status update within 10 working
   days, and does not ask for public issues (FR-032).
4. **Given** `THIRD_PARTY_NOTICES`, **When** it is read, **Then** it lists every third-party asset that ships in a
   package and no asset that does not.

---

### Edge Cases

- A package with no test files yet: the test command must still run the other packages and succeed; an empty
  package must not fail the run (FR-004). A run that finds no test file at all in the workspace fails (FR-004), so a broken
  file pattern cannot pass silently.
- A browser engine missing on the machine: the test command fails with a message saying how to install it, never
  silently skips browser tests (FR-004).
- A pull request with no source change: mutation testing must not mutate the whole code base.
- A changed line that no test runs: its mutants count as surviving, so new code without tests fails mutation testing
  (FR-011).
- A survivor on an unchanged line of a changed file: it does not fail the pull request (FR-011).
- A plant accidentally fixed or deleted: the plant job must fail ("gate X has no plant" or "plant X did not fail").
- A commit authored by an agent: it needs a sign-off like any other commit; a sign-off by the agent identity that
  authored it is valid (FR-023).
- A merge commit, or the repository's unsigned root commit `d08d413`: the sign-off check skips it (FR-023).
- A lockfile change in a pull request without a matching manifest change: the install-and-pins gate fails (FR-027).
- The offline setup runs on a machine where the online install never ran: it fails with a message naming the online
  install command, never reaches for the network (FR-008).
- The story extension's two configuration copies (FR-006) disagree: a check must flag it.
- `THIRD_PARTY_NOTICES` while no third-party asset ships yet: it states that, and the font entry is added by #5 when
  the font is vendored.

## Requirements *(mandatory)*

### Functional Requirements

**Workspace and test command (Story 1)**

- **FR-001**: The repository MUST be a workspace of exactly three packages, `@ocelle/tokens`, `@ocelle/styles` and
  `@ocelle/elements`, each with no public surface yet (no tokens, styles or elements). No other workspace package,
  private or public, exists; root configuration and gate scripts live in the repository outside the packages. The
  repository root's own manifest is the workspace root, not a workspace package, and is not counted among the three
  (even where the package manager lists it as a workspace project).
- **FR-002**: The runtime and package-manager versions MUST be pinned in the repository, every dependency MUST be
  pinned to an exact version, and the lockfile MUST be committed. All repository TypeScript (FR-028) MUST be checked
  in TypeScript's strict mode (constitution, Technology).
- **FR-003**: A frozen install from the lockfile MUST succeed in a fresh clone and MUST fail when the lockfile would
  change.
- **FR-004**: One root command MUST run every test file (FR-028) and exit non-zero when any test fails or when it
  finds no test file at all. A package with no test file does not fail a run that finds test files elsewhere. When
  the browser engine of FR-005 is missing, the command MUST exit non-zero with a message naming the online install
  command (FR-008); it MUST NOT skip the tests that need it.
- **FR-005**: Tests of elements MUST run in a real browser engine: Chromium, and only Chromium (operator decision,
  2026-11-02).
- **FR-006**: Both copies of the story extension's configuration, `.specify/extensions/story/story-config.yml` and
  `tooling/speckit/extensions/story/story-config.yml`, MUST set the test command, the offline setup command (FR-008)
  and the test file patterns, and MUST be identical; a check MUST fail when they differ. The test file patterns MUST
  match exactly the test code of FR-028. The installer backup `.specify/extensions/.backup/story/story-config.yml`
  is not read by the story workflow and is not part of the check.
- **FR-007**: The mutation command MUST be set in both configuration copies (Story 2). Run outside a pull request (by
  the story workflow's reviewer), it compares against a base commit passed in by its caller (for a phase, the
  phase's base commit) instead of the pull request's base branch (FR-011). The plan defines how the caller passes
  the base commit (for example an argument or an environment variable) and whether the story workflow's review
  command must change to pass it; if it must, this feature makes that change in both copies of the story extension.
- **FR-008**: Installing has two documented commands:
  - The **online install** fetches the lockfile's packages from the configured package registry and the browser
    engine of FR-005 at the version pinned by the test tooling. It stores them in a local package store and a
    browser cache outside the repository, and it changes no tracked file.
  - The **offline setup** (the story configuration's setup command) installs the workspace in a checkout using only
    that local store and cache, with no network access. It changes no tracked file. When the store or cache lacks
    anything it needs, it fails with a message naming what is missing and the online install command; it never
    falls back to the network.
- **FR-009**: Sample tests and sample source used to demonstrate Stories 1 and 2 are not exported by any package and
  are not part of any package's built output. A sample that must pass every gate (a passing test that checks what it
  tests) MAY live in a package as an ordinary test file. Every sample that a gate must fail on (a failing test, a
  vacuous test, source with a change its tests do not check) is a plant under `gates/plants/` and is run only by the
  plant job (FR-025, FR-028), never by the normal gates.

**Test quality (Story 2)**

- **FR-010**: A test lint MUST reject tests without an assertion, skipped and focused tests, assertions inside
  conditionals, assertions outside a test, assertions that are not awaited or completed, and tests whose only
  assertion is a snapshot.
- **FR-011**: Mutation testing MUST run on the package source (FR-028) changed relative to the pull request's base
  branch (outside a pull request, the base commit of FR-007), MUST fail when a mutant survives in changed code, and
  MUST report each survivor's location.
  - **Changed code** is the lines of package source added or modified relative to that base. Only mutants on those
    lines decide the result. A tool may mutate whole changed files, but a survivor on an unchanged line of a changed
    file does not fail the run.
  - A mutant **survives** when no test kills it. That includes a mutant on a line that no test runs (reported by
    mutation tools as "no coverage"), so new source without tests fails. A mutant is **killed** only when a test
    fails on it, or the test run times out or ends in a runtime error with it in place.
- **FR-012**: A surviving mutant MAY be recorded as equivalent only with a written reason, kept next to the mutated
  code. The mutation report MUST list every such record in the changed code, with its location and reason, so the
  review can see and record it.
- **FR-013**: Mutation testing in CI MUST run under a job time limit of 10 minutes (SC-005). A run that exceeds the
  limit MUST end as a failure, never as a pass. A pull request that changes more package source than the SC-005
  bound is expected to be split into smaller pull requests; the limit is not raised for it.

**Merge gates (Story 3)**

- **FR-020**: Pull-request CI MUST run these gates as separate named checks: typecheck (strict mode, FR-002), code
  lint (with a rule set beyond the test lint that the plan names), style lint
  (token-only), unit tests (the FR-004 command), test lint (FR-010), mutation testing (FR-011), the content-security
  check on built output (FR-021), the prefix check (FR-022), the configuration-copies check (FR-006), the
  install-and-pins check (FR-027) and the sign-off check (FR-023). Each gate checks exactly the files FR-028 gives it.
  The plant job (FR-025) MUST run on every pull request as its own named check, alongside these gates.
- **FR-021**: The content-security check MUST fail on any of these in the packages' built output (every JavaScript,
  CSS and HTML file the package build produces): an inline `<script>` element, a `<style>` element or `style`
  attribute, an event handler attribute (`on*=`), each in markup (HTML files and HTML templates inside JavaScript),
  or a dynamic-code call (`eval`, `new Function`, the `Function` constructor, or `setTimeout`/`setInterval` with a
  string argument). Remote loads (constitution IV) are not part of this gate in this feature.
- **FR-022**: The prefix check MUST fail, naming file and line, on:
  - any name that starts with `sk-` or `--sk-` at a name boundary: the `sk-` is not preceded by a letter, a digit,
    `_` or `-`, except for the leading `--` of a custom property. This covers element names, custom-element
    definitions, CSS custom properties and event names, and does not match `task-list`, `desk-row` or `--risk-level`;
  - any monospace font family in a font declaration, case-insensitive: the generic families `monospace` and
    `ui-monospace`, and the named monospace families Menlo, Monaco, Consolas, Courier, Courier New, SFMono-Regular,
    SF Mono, Liberation Mono, DejaVu Sans Mono, Lucida Console, Roboto Mono, Source Code Pro, Fira Code, Fira Mono,
    JetBrains Mono, Cascadia Code and Cascadia Mono. A font declaration is a CSS `font-family` or `font` declaration
    or an `@font-face` `font-family` descriptor, in a stylesheet or in a style template embedded in TypeScript.

  Test code of the three packages is in scope, so a test there that needs a forbidden name does not write it as a
  literal (it builds the name at run time, for example from parts); literal forbidden names belong only in plants
  under `gates/plants/`. Code and test code outside the three packages (such as the gate scripts and their tests,
  which must name the forbidden patterns) is not in scope (FR-028).
- **FR-023**: The sign-off check MUST fail on any commit in a pull request (FR-028) that has no `Signed-off-by` line
  whose identity (name and email) matches the commit's author. A commit authored by an agent and signed off by that
  same agent identity passes; operator accountability for agent work comes from the triage and gate records, not
  from the sign-off. Merge commits and the repository's root commit `d08d413` are exempt (operator decision,
  2026-11-02).
- **FR-024**: The style lint MUST reject raw colour, font, size, radius, shadow and duration values in the styles it
  covers (FR-028), without depending on any design token existing. It covers styles embedded in the TypeScript of
  `@ocelle/elements` (tagged style templates) and every stylesheet in the source of `@ocelle/elements` and
  `@ocelle/styles` that is package source (FR-028); test code, stories included, is not covered. The token
  definitions in `@ocelle/tokens` are excluded, since they are the raw values.
  In the covered styles a value MAY contain, without a token, only (operator decision, 2026-11-02):
  - `0` and percentages (such as `100%`);
  - CSS keywords, such as `auto`, `inherit`, `initial`, `unset`, `none`, `currentColor` and `transparent`, and the
    CSS system colour keywords (such as `Canvas`, `CanvasText`, `Highlight` and `ButtonText`), so forced-colours
    styling stays possible (operator confirmation, 2026-11-02); a named colour (such as `red`) and a font family
    name are raw values, not keywords;
  - unitless numbers in properties that take them: `line-height`, `flex` (and its longhands), `z-index`, `opacity`
    and `order`;
  - `fr` units;
  - `calc()` whose operands are tokens and the values above.

  Everything else is rejected, including every length with a unit (such as `px`, `rem`, `em`, `vh`, `vw`, `ch`), every
  time (`ms`, `s`), every colour literal (hex, `rgb()`, `hsl()` and similar) and every raw font family. As a
  consequence, numeric `font-weight` values (such as `600`), angles (`deg`), `aspect-ratio` values, grid line
  numbers and `scale()` factors are raw values too and need a token. A token is a `var()` reference to a custom
  property; a `var()` reference is not itself a raw value (the value given to a custom property is checked where it
  is declared in covered styles), but a fallback inside it (such as the `4px` in `var(--ocelle-x, 4px)`) is checked
  like any other value and is rejected when raw.
- **FR-025**: Every gate of FR-020 MUST have at least one planted defect under `gates/plants/`, and a CI job (the plant
  job) MUST run each gate against its plants and fail unless every gate fails on each of its plants. A gate MAY also
  have pass plants (near-misses it must accept); the plant job MUST fail when a gate fails on a pass plant. Gates
  that do not read ordinary source files are given their plants in the form they read: the plan defines, for each
  gate, how its plant is presented to it (for example a commit range or bundle for the sign-off check, prebuilt
  output for the content-security check, a source-and-base pair for mutation testing). Plants are not test code
  unless their file name makes them a test file (FR-028); so a gate's red step is a failing test of the gate itself,
  and the plants it reads arrive with the green commit (the plan says where gate tests live). At least these plants
  exist:
  - typecheck: a type error that only strict mode reports (such as an implicit `any`);
  - code lint: a violation of a rule of its rule set that the test lint does not have;
  - unit tests: a failing test set up as a test of each of the three packages, and a failing test that needs a
    browser (US1);
  - test lint: one plant for each of the seven forbidden patterns of FR-010;
  - mutation testing: a change to a covered line of sample source that its tests do not check, and a changed line of
    sample source that no test runs (FR-011);
  - style lint: a raw literal inside a style template embedded in a TypeScript file, and one in a stylesheet;
  - prefix check: an `sk-` element name, a `--sk-` custom property, an `sk-` event name, a generic `monospace` and a
    named monospace family; and the pass plants `task-list`, `desk-row` and `--risk-level`;
  - install-and-pins check: a lockfile that does not match its manifest, and a manifest with a `^` range;
  - content-security check: one plant for each construct FR-021 names: an inline `<script>` element, a `<style>`
    element, a `style` attribute, an `on*=` event handler attribute, `eval`, `new Function`, the `Function`
    constructor called without `new`, `setTimeout` with a string argument and `setInterval` with a string argument;
  - configuration-copies check: two copies that differ in one setting;
  - sign-off check: a commit with no `Signed-off-by` line and a commit whose `Signed-off-by` identity does not match
    its author; and the pass plants of a commit authored and signed off by the same agent identity and an unsigned
    merge commit.
- **FR-026**: Gates that this feature does not deliver MUST be named in `gates/README.md` with the issue that delivers
  them: Storybook build, visual regression and accessibility checks (#10), contrast check (#5), custom-elements
  manifest check (the first element feature, #7, or #10, whichever lands first).
- **FR-027**: The install-and-pins check MUST fail when the lockfile does not match the manifests (a frozen install
  would change it), when any manifest declares a dependency by anything other than an exact version, or when the
  runtime or package-manager version pin is missing or is not an exact version.
- **FR-028**: Gate scope. Definitions: **test file** is a file whose name ends in `.test.ts` or `.spec.ts`; **test
  code** is every test file, every file under a directory named `test`, and every file whose name ends in
  `.stories.ts`; **package source** is every file in a package's directory except its test code and its built output;
  **built output** is every file the package build produces; **documentation and tooling** is `specs/`, `.specify/`,
  `.claude/`, `tooling/`, `knowledge/`, `triage/` and every Markdown file; **repository TypeScript** is every
  TypeScript file in the repository, inside or outside the packages (root configuration and gate scripts included).
  `gates/plants/`, installed dependencies and built output are excluded from every gate except where the table names
  built output; the plant job reads only `gates/plants/`. Any sample a gate must fail on is a plant (FR-009), so no
  normal gate ever sees one. Within that, each gate checks:

  | Gate | Files checked |
  |------|---------------|
  | typecheck, code lint | repository TypeScript |
  | style lint | the styles of FR-024 |
  | unit tests | every test file in the repository |
  | test lint | all test code in the repository |
  | mutation testing | package source TypeScript changed relative to the pull request's base branch; only mutants on changed lines decide the result (FR-011) |
  | content-security check | built output of the three packages |
  | prefix check | package source, test code and built output of the three packages only; not documentation and tooling, and not code or tests outside the packages (FR-022) |
  | configuration-copies check | the two story configuration copies named in FR-006 |
  | install-and-pins check | the workspace and package manifests, the lockfile and the version pin files |
  | sign-off check | the commits in the pull request (base branch to head), except those FR-023 exempts |

**Licence and governance (Story 4)**

- **FR-030**: `LICENSE` MUST contain the Apache License 2.0.
- **FR-031**: `CONTRIBUTING.md` MUST explain sign-off, state that there is no contributor licence agreement, and
  point to the Spec Kit flow and the constitution.
- **FR-032**: `SECURITY.md` MUST name GitHub private vulnerability reporting as the reporting channel and state that
  it is switched on when the repository goes public (1.0.0, #11); until then it MUST name `@MOES-Media` (the owner in
  `CODEOWNERS`, FR-035) as the private contact and tell reporters to contact it directly and privately, not through
  an issue (operator decision, 2026-11-02). It MUST say what to include in a report and MUST promise an
  acknowledgement within 3 working days and a status update within 10 working days of a report (operator decision,
  2026-11-02). It MUST NOT ask for public issues.
- **FR-033**: `THIRD_PARTY_NOTICES` MUST list every third-party asset that ships in a package with its licence, and
  only those.
- **FR-034**: No file of this feature MAY contain a secret, credential or access token, or personal data. This is
  verified by the story review; this feature adds no secret-scan gate. Public GitHub handles (such as the maintainer
  handles of FR-032) are not personal data under this rule (operator decision, 2026-11-02).
- **FR-035**: The repository MUST have a `CODEOWNERS` file, in a location GitHub reads, that names `@MOES-Media` as
  the owner of the whole repository (every path) and names no other owner (operator decision, 2026-11-02).

### Key Entities

- **Gate**: a named merge check; has a command, the CI check it runs as, the files it checks (FR-028), and at least
  one plant.
- **Plant**: a deliberate defect under `gates/plants/` that one gate must fail on; a pass plant is a near-miss under
  `gates/plants/` that the gate must accept.
- **Story configuration**: the story extension's settings (test, setup, mutation commands; test file patterns),
  present in the two copies named in FR-006, which must match.
- **Equivalent-mutant record**: a surviving mutant accepted with its location and reason, kept next to the mutated
  code and listed in the mutation report.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a fresh clone, the online install plus the full test run completes in under 5 minutes on the
  GitHub-hosted `ubuntu-latest` standard runner available to this repository (2 vCPU while it is internal), with no
  cache restored (empty package store and browser cache). It is measured by timing such a cold-cache CI run when the
  feature is verified; it is not a merge gate.
- **SC-002**: In the plant job, every gate of FR-020 fails on 100% of its plants and accepts 100% of its pass plants
  (FR-025).
- **SC-003**: The story workflow's red/green check on a demo phase reports `pass` (not `unavailable`) after this
  feature, and `fail` when its final tests pass against the code from before the phase.
- **SC-004**: Each of the seven forbidden test patterns of FR-010 (no assertion, skipped, focused, assertion inside a
  conditional, assertion outside a test, assertion not awaited or completed, snapshot as the only assertion) is
  reported as an error in 100% of its plants (FR-025).
- **SC-005**: Mutation testing of a pull request that changes up to 10 package source files and up to 500 lines of
  package source finishes in under 10 minutes on the runner of SC-001, with the package store and browser cache
  restored and no earlier mutation result available. The CI job's 10-minute limit (FR-013) enforces it.
- **SC-006**: A script run in a fresh clone confirms that `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md` and
  `THIRD_PARTY_NOTICES` exist at the repository root under exactly these names, that `CONTRIBUTING.md` contains the
  sign-off rule (`Signed-off-by`, `git commit -s`), that `CODEOWNERS` exists and names `@MOES-Media` as the only
  owner of every path (FR-035), and that `SECURITY.md` contains the reporting route and response times of FR-032
  (GitHub private vulnerability reporting, the owner handle from `CODEOWNERS`, 3 working days and 10 working days).

## Assumptions

- Tools named in issue #4 and the triage record are the starting point for the plan: pnpm workspaces, Vitest with
  browser mode, an ESLint plugin for test rules, StrykerJS in incremental mode; the plan confirms or replaces them.
- CI runs on GitHub Actions; the sign-off check mechanism (an action or a GitHub App) is a plan decision.
- No third-party asset ships in this feature; the Schibsted Grotesk font and its OFL entry arrive with #5.
- Storybook, visual regression and axe CI are out of scope (#10); the contrast check is out of scope (#5); the
  custom-elements manifest check comes with the first element feature. Until those land, `main` merges without them,
  and FR-026 makes that visible in `gates/README.md`.
- The repository stays internal until 1.0.0 (#2, #11); nothing is published in this feature. GitHub private
  vulnerability reporting is documented for public repositories, so it is switched on at the 1.0.0 flip (#11);
  until then reports go privately to `@MOES-Media`, the owner named in the `CODEOWNERS` file this feature adds
  (FR-035) (operator decisions, 2026-11-02).
- The first phase may use `tdd-exempt.md` for the workspace and runner bootstrap only (install, the three package
  skeletons and the test command's wiring), since no runner exists before it. The behaviour in that phase (the
  FR-004 exit codes, the FR-006 configuration-copies check, the zero-test and missing-browser cases) is written red
  first, as is every later phase.
