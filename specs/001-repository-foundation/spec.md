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
the demo phase (SC-003) reports "pass" instead of "unavailable".

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
8. **Given** a lockfile that does not match the manifests, a manifest that declares a dependency by a range (such
   as `^1.2.3`, `~1.2.3` or `workspace:^`) instead of an exact version, or a workspace configuration whose
   release-age or install-script setting (FR-027) is missing or loosened, **When** the install-and-pins gate (FR-027)
   runs, **Then** it fails and names the file. A dependency on one of the three packages written as
   `workspace:<exact version>` with that package's current version passes.
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
   runs at all, in package source or in gate source (FR-028), **When** mutation testing runs on the change, **Then**
   it reports at least one surviving mutant with its location and fails (FR-011: a mutant no test covers counts as
   surviving).
4. **Given** a surviving mutant recorded as equivalent with a written reason, **When** mutation testing runs again,
   **Then** that mutant no longer fails the run, the reason is kept next to the mutated code (FR-012), and the
   mutation report lists the record so the review can see it.
5. **Given** a change that touches no source, **When** mutation testing runs, **Then** it finishes without mutating
   anything and succeeds.
6. **Given** an assertion inside a promise callback that is neither returned nor awaited (including
   `void p.then(...)`), inside a `setTimeout` or `setInterval` callback, or inside a `try` block whose `catch`
   swallows the failure, **When** the test lint runs, **Then** each one is reported as an error; an awaited or
   returned promise and a `catch` that rethrows are not reported (FR-010, added at the phase 3 gate).

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
   though no design token exists yet. A string (such as `content: ""`) outside a font value, or an author-defined or
   dashed identifier (such as `anchor-name: --tip`), passes; a named colour (such as `color: red`) fails.
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
7. **Given** each gate's planted defect, **When** the plant job runs, **Then** every gate fails on its plant with
   exactly the findings the plant expects; if any gate passes on its plant, reports other findings, fails on one of
   its pass plants, or does not report "could not run" on one of its breaking plants (FR-025), the plant job fails.
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
- A mutant that does not compile: it is invalid, neither killed nor surviving, and does not fail the run (FR-011).
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
- **FR-003**: A frozen install from the lockfile MUST succeed in a fresh clone. A lockfile that does not match the
  manifests is caught by the install-and-pins check (FR-027), which states that rule.
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
  plant job (FR-025, FR-028), never by the normal gates. The one exception is the inputs of the gates' own tests:
  they live under `gates/test/fixtures/`, are read only by those tests, and are excluded from every normal gate like
  the plants (FR-028; operator decision, plan squad round 1).

**Test quality (Story 2)**

- **FR-010**: A test lint MUST reject tests without an assertion, skipped and focused tests, assertions inside
  conditionals, assertions outside a test, assertions that are not awaited or completed, and tests whose only
  assertion is a snapshot. It MUST also reject three further patterns (operator decision, phase 3 gate,
  2026-11-02: "Add rule now: add an ocelle rule for these patterns as a small extra task before phase 4,
  test-first."): an assertion inside a promise callback that is neither returned nor awaited, including
  `void p.then(() => expect(...))`; an assertion inside a `setTimeout` or `setInterval` callback; and an assertion
  inside a `try` block whose `catch` swallows the failure (research.md R-06 defines each). An awaited or returned
  promise, and a `catch` that rethrows or asserts, are not these patterns.
- **FR-011**: Mutation testing MUST run on the package source and gate source (FR-028) changed relative to the pull
  request's base branch (outside a pull request, the base commit of FR-007), MUST fail when a mutant survives in
  changed code, and MUST report each survivor's location (operator decision, plan squad round 1: the gate scripts
  are mutation-tested too).
  - **Changed code** is the lines of package source or gate source added or modified relative to that base. Only mutants on those
    lines decide the result. A tool may mutate whole changed files, but a survivor on an unchanged line of a changed
    file does not fail the run.
  - A mutant **survives** when no test kills it. That includes a mutant on a line that no test runs (reported by
    mutation tools as "no coverage"), so new source without tests fails. A mutant is **killed** only when a test
    fails on it, or the test run times out or ends in a runtime error with it in place.
  - A mutant that does not compile (the type checker rejects it, so no test runs on it) is **invalid**: it is
    neither killed nor surviving, and it does not fail the run (operator amendment, plan squad round 3, approved by
    the operator, human:jeroennouwsdev, 2026-11-02).
  - Mutation testing MUST NOT pass with changed code it did not check. A changed file whose path it cannot read
    from the diff (any path git writes, including one with spaces, non-ASCII or special characters, MUST be read),
    and a changed in-scope file whose path the mutation tool cannot take as a mutate input (it contains a glob
    metacharacter `*?[]{}!` or a comma, or otherwise cannot be passed verbatim), end the run as "could not run"
    (exit 2 of the gate contract) before the tool runs, naming the file or diff line, never as a pass (operator
    decision, PR #18 landing review, human:jeroennouwsdev, 2026-11-03). A mutate input the mutation tool reports
    it did not read (it says the pattern "did not result in any files", as it does for a file in a folder it always
    skips) also ends the run as "could not run" (exit 2), naming each such entry, whether the run covers the whole
    diff or a listed shard; this covers any path the tool skips, not only the folders it skips today (operator
    decision, phase 3 round 12, O12-01, human:jeroennouwsdev, 2026-11-03: "Fail on unread files (Recommended)").
    A changed file the tool read but its report does not list counts as zero mutants, so a change with no mutable
    code (type-only or comment-only) passes (operator decision, PR #18 landing review, human:jeroennouwsdev,
    2026-11-03: "Guard the input instead (Recommended)").
  - **Amendment, 2026-11-10 (mission 007, `specs/007-mutation-gate-strictness/` FR-001 to FR-008, FR-015):** the
    text above stands, verdicts included; mutation testing additionally MUST report, in a passing and in a failing
    run, what no test was seen killing on changed lines: every Timeout mutant and every CompileError mutant on a
    changed line, one line each naming its path, start line, mutator and replacement, and every zero-mutant entry
    (an entry of the run with no mutant on its changed lines, named as the run holds it: its path in a whole-diff
    run, its `--files` entry as given in a shard run), and its summary counts the three, also when zero. These
    report lines are not findings and change no exit code. The operator's three answers (human:jeroennouwsdev,
    2026-11-10): a Timeout on a changed line is reported and still passes ("Report, still pass (Recommended)"; a
    timeout stays a kill); a CompileError on a changed line is reported and still passes ("Report, still pass
    (Recommended)"; the 2026-11-02 amendment stands); a changed file with no mutant on its changed lines is reported
    and still passes (triage gate, approved by the operator). A `--files` list that names one file more than once
    ends the run as "could not run" (operator decision, plan squad round 1, PLAN-CORRECTNESS-1-005 (a)).
- **FR-012**: A surviving mutant MAY be recorded as equivalent only with a written reason, kept next to the mutated
  code. The mutation report MUST list every such record in the changed code, with its location and reason, so the
  review can see and record it.
- **FR-013**: Mutation testing in CI MUST run in shards, each a separate CI job under a job time limit of 10 minutes
  (SC-005). A shard holds the changed package source and gate source (FR-028) as up to 10 entries and up to 250
  changed lines (operator decision, phase 4 round 3, human:jeroennouwsdev, 2026-11-03: GitHub runner variance took
  a 435-line shard past 10 minutes). An entry is a changed file, or, for a file with more than 60 changed lines,
  one line range of it: such a file MUST be split by line range into several entries of at most 60 changed lines
  each, written `path:start-end` (Stryker's own `mutate` range syntax), and a range never crosses a shard (operator
  decision, phase 3 round 9, human:jeroennouwsdev, 2026-11-03: plant-judge.ts alone took 9:49 of 10 minutes; the
  entry bound lowered from 120 to 60 changed lines by operator decision, 2026-11-05, phase 5 round 6 of mission
  002, O6-01, human:jeroennouwsdev: "Smaller chunks (Recommended)": the shard
  `packages/tokens/src/generate.ts:121-240` alone held 264 mutants, took 670 s locally and was cancelled at the
  10-minute limit in CI). Two entries of the same file MUST NOT share a shard; an entry MAY share a shard with
  entries of other files, so no shard holds more than 60 changed lines of one file (operator decision, phase 3
  round 10, human:jeroennouwsdev, 2026-11-03: "Chunks never share (Recommended)"). A run given entries mutates only the changed lines within those
  entries. The plan defines how the entries are filled into shards. Accepted limit (operator decision, phase 3
  round 10, human:jeroennouwsdev, 2026-11-03: "Accept, record it (Recommended)"): a mutant whose code spans the
  boundary between two entries of one file (a cut) lies wholly in neither entry and is mutated in no shard; the
  smaller mutants inside it are still mutated. The plan MUST report how many cuts it made, and the gate
  documentation MUST state this limit. A shard that exceeds the 10-minute limit MUST end as a failure, never as a
  pass, and the mutation testing check MUST fail unless every shard passes; the 10-minute limit is not raised
  (operator decision, plan squad round 2: the bound covers gate source and applies to a shard, not to the whole
  pull request).

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
  - any name that starts with `sk-` or `--sk-` at a name boundary, case-insensitive (HTML lower-cases tag names, so
    `<SK-Button>` names an `sk-button` element): the `sk-` is not preceded by a letter, a digit, `_` or `-`, except
    for the leading `--` of a custom property. This covers element names, custom-element
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
    name are raw values, not keywords. A keyword is any identifier that is neither a named colour (the fixed list of
    CSS named colours, `transparent` and `currentColor` excepted) nor part of a `font` or `font-family` value, where
    only the CSS-wide keywords are allowed (operator decision, plan squad round 1);
  - author-defined and dashed identifiers in the properties that take them (such as `animation-name`, `grid-area`
    and grid line names, `container-name`, `anchor-name`, `position-anchor`, `view-transition-name` and the
    `counter-*` properties), for example `anchor-name: --tip` (operator decision, plan squad round 1);
  - strings (such as `content: ""` or `grid-template-areas: "a b"`), except in `font` and `font-family` values
    (operator decision, plan squad round 1);
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
  job) MUST run each gate against its plants and fail unless every gate fails on each of its plants and reports
  exactly the findings the plant lists. Every gate MUST also have at least one pass plant (a near-miss or clean input
  it must accept) and at least one breaking plant (an input that makes it unable to run, which it must report as
  "could not run", not as a finding); the plant job MUST fail when a gate fails on a pass plant or does not report a
  breaking plant as "could not run" (operator decision, plan squad round 1). A breaking plant names the cause it
  expects, and the plant job MUST also fail when the gate reports "could not run" for another cause; a pass plant
  MUST NOT replace the base its gate is given (operator decision, PR #18 landing review, human:jeroennouwsdev,
  2026-11-03). Gates
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
  - test lint: one plant for each of the seven forbidden patterns of FR-010 that SC-004 lists (the three patterns
    added at the phase 3 gate are proven by the test-lint gate's own tests, one fixture per pattern, tasks.md T091);
  - mutation testing: a change to a covered line of sample source that its tests do not check, and a changed line of
    sample source that no test runs (FR-011); an equivalent-mutant record without a reason, and a disable comment
    that is not a next-line record (FR-012); and the pass plant of a survivor with a reasoned record, which the
    report lists;
  - style lint: a raw literal inside a style template embedded in a TypeScript file, and one in a stylesheet; one
    plant per class FR-024 rejects (a `rem` length, a `ms` time, a hex colour, `rgb()`, a named colour, a raw font
    family, a numeric `font-weight`, a unitless number outside the properties FR-024 allows them in, a raw `var()`
    fallback and a raw `calc()` operand); and the pass plants `content: ""`, `anchor-name: --tip` and a raw value in a story file
    under a package's source directory (not covered, FR-024);
  - prefix check: an `sk-` element name, a `--sk-` custom property, an `sk-` event name, a generic `monospace` and a
    named monospace family; and the pass plants `task-list`, `desk-row` and `--risk-level`;
  - install-and-pins check: a lockfile that does not match its manifest, a manifest with a `^` range, a
    `workspace:^` dependency, and a missing or loosened release-age or install-script setting; and the pass plant of a
    `workspace:<exact version>` dependency;
  - content-security check: one plant for each construct FR-021 names: an inline `<script>` element, a `<style>`
    element, a `style` attribute, an `on*=` event handler attribute, `eval`, `new Function`, the `Function`
    constructor called without `new`, `setTimeout` with a string argument and `setInterval` with a string argument;
    plus a `style` attribute separated by a newline, a `/onload=` handler and an indirect `eval`; and the pass plants
    of identifiers that only contain these names (`retrieval(`, `isFunction(`);
  - configuration-copies check: two copies that differ in one setting;
  - sign-off check: a commit with no `Signed-off-by` line and a commit whose `Signed-off-by` identity does not match
    its author; and the pass plants of a commit authored and signed off by the same agent identity and an unsigned
    merge commit.
- **FR-026**: Gates that this feature does not deliver MUST be named in `gates/README.md` with the issue that delivers
  them: Storybook build, visual regression and accessibility checks (#10), contrast check (#5), custom-elements
  manifest check (the first element feature, #7, or #10, whichever lands first).
- **FR-027**: The install-and-pins check MUST fail when the lockfile does not match the manifests (a frozen install
  would change it), when any manifest declares a dependency by anything other than an exact version, or when the
  runtime or package-manager version pin is missing or is not an exact version. A dependency on one of the three
  workspace packages is written `workspace:<exact version>`, where the version equals that package's current version
  and is bumped in lockstep with it; `workspace:*`, `workspace:^` and `workspace:~` are not exact (operator decision,
  plan squad round 1). The check MUST also fail when the workspace configuration's minimum release age for new
  dependency versions (7 days) or its empty allow-list of dependencies that may run install scripts is missing or
  loosened (operator decision, plan squad round 1).
- **FR-028**: Gate scope. Definitions: **test file** is a file whose name ends in `.test.ts` or `.spec.ts`; **test
  code** is every test file, every file under a directory named `test`, and every file whose name ends in
  `.stories.ts`; **package source** is every file in a package's directory except its test code and its built output;
  **built output** is every file the package build produces; **documentation and tooling** is `specs/`, `.specify/`,
  `.claude/`, `tooling/`, `knowledge/`, `triage/` and every Markdown file; **repository TypeScript** is every
  TypeScript file in the repository, inside or outside the packages (root configuration and gate scripts included);
  **gate source** is every TypeScript file under `gates/bin/`, `gates/lib/`, `gates/eslint/` and `gates/stylelint/`
  that is not test code. `gates/plants/`, `gates/test/fixtures/`, installed dependencies and built output are
  excluded from every gate except where the table names built output; the plant job reads only `gates/plants/`, and
  only the gates' own tests read `gates/test/fixtures/` (an exception to the test file and test code rows below:
  fixtures are neither run nor test-linted; operator decision, plan squad round 1). Any sample a gate must fail on is
  a plant or such a fixture (FR-009), so no normal gate ever sees one. Stryker's sandbox copies under
  `.stryker-tmp/` (ignored by git) are not repository files, and the test lint does not check them (operator
  decision, phase 3 gate, 2026-11-02: "Fix in phase 4, test-first: add .stryker-tmp/ to the test-lint ignores.").
  Within that, each gate checks:

  | Gate | Files checked |
  |------|---------------|
  | typecheck, code lint | repository TypeScript |
  | style lint | the styles of FR-024 |
  | unit tests | every test file in the repository |
  | test lint | all test code in the repository |
  | mutation testing | package source TypeScript and gate source changed relative to the pull request's base branch; only mutants on changed lines decide the result (FR-011) |
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
- **Plant**: a deliberate defect under `gates/plants/` that one gate must fail on, with the findings it must report;
  a pass plant is a near-miss under `gates/plants/` that the gate must accept; a breaking plant is an input the gate
  cannot process, which it must report as "could not run".
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
- **SC-003**: The story workflow's red/green check on the demo phase, phase 2 of this feature (the first red-first
  phase, US1's behaviour), reports `pass` (not `unavailable`), and on a phase whose final tests pass against the
  code from before the phase it reports `fail`.
- **SC-004**: Each of the seven forbidden test patterns of FR-010 (no assertion, skipped, focused, assertion inside a
  conditional, assertion outside a test, assertion not awaited or completed, snapshot as the only assertion) is
  reported as an error in 100% of its plants (FR-025). Each of the three patterns added to FR-010 at the phase 3
  gate is reported as exactly one error by the test-lint gate on its fixture, and its allowed look-alikes are not
  reported by its rule (research.md R-06).
- **SC-005**: Mutation testing of one shard (FR-013: up to 10 entries and up to 250 changed lines of package
  source and gate source together, no entry over 60 changed lines of one file, no two entries of one file in
  the same shard; 250 by operator decision, phase 4 round 3, human:jeroennouwsdev, 2026-11-03: GitHub runner
  variance took a 435-line shard past 10 minutes; the split within files by operator decision, phase 3 round 9,
  human:jeroennouwsdev, 2026-11-03: plant-judge.ts alone took 9:49 of 10 minutes; its entry bound lowered from 120
  to 60 changed lines by operator decision, 2026-11-05, phase 5 round 6 of mission 002, O6-01,
  human:jeroennouwsdev: the 120-line shard `packages/tokens/src/generate.ts:121-240` took 670 s; one file's entries in
  separate shards by operator decision, phase 3 round 10, human:jeroennouwsdev, 2026-11-03) finishes in under 10 minutes on the runner of
  SC-001, with the package store and browser cache restored and no earlier mutation result available. Each shard job's 10-minute limit (FR-013)
  enforces it (operator decision, plan squad round 2).
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
- The first phase is the workspace and runner bootstrap only (install, the three package skeletons, the test and
  offline setup commands' plain wiring, and the test and setup commands set in both story configuration copies), and
  it uses `tdd-exempt.md` with no red commit, since no runner exists before it. The behaviour of Story 1 (the FR-004
  exit codes, the offline setup's failure cases, the FR-006 configuration-copies check, the zero-test and
  missing-browser cases) is the next phase and is written red first, as is every later phase (plan squad round 1).
