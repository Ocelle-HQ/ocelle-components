# Feature Specification: Storybook workbench and visual regression baselines

**Feature Branch**: `claude/010-storybook-workbench`

**Created**: 2026-11-10

**Status**: Draft

**Input**: Issue #10, triage record `triage/006-storybook-workbench.md` (approved 2026-11-10), with the operator's
answer to its question Q1. Spec prompt: "Build the Storybook workbench from issue #10: Storybook as the visual
source of truth as in kitty-mission-ui, with a Storybook build gate, visual regression in which every story is
captured in light and dark against baselines produced in a pinned container that runs under podman or docker and
gives byte-identical images on any machine (exact comparison, no tolerance), and axe on every story failing on any
serious or critical finding, each gate proven by a plant under gates/plants/ and added to the required checks; cover
the existing token (002) and base-style (003) stories and give element issues a harness they add their own stories
to; close 001's 'Storybook build, visual regression and axe gates absent' exception; the custom-elements manifest
check stays with the first element feature (#17 or #7), publishing the Storybook is out of scope, and elements,
icons and their stories stay with their own issues."

**Operator decision Q1 (2026-11-10)**: option (a), follow #10. The built Storybook is not a target of the
strict-CSP check; that check runs on the packages' built output only. Mission 002's two Storybook exceptions to
constitution IV (the Storybook page's header with `font-src 'self'` and `connect-src 'self'`, and the static `csp`
and `prefix` scope widened to the Storybook inputs and HTML entries) are closed, and the Storybook's CSP scope is
removed. Restoring the Storybook manager UI is a separate operator choice and not part of this feature.

## Consumer need

Constitution V makes Storybook the visual source of truth and requires every story to have a committed baseline,
produced in a pinned container, in light and dark; constitution III requires that axe reports no serious or critical
finding on any story; the Development Workflow lists Storybook build, visual regression and axe among the merge
gates. Mission 001 deferred all three to #10 (001 plan, Complexity Tracking; 001 FR-026). The consumers are Kitty
Desktop and Kitty Dashboard (kitty-mission-ui, the reference #10 names: it judges a component library by its
rendered pixels) and the Ocelle web console. Every element issue (#7 to #9, #12 to #17) adds its own stories to the
harness this feature builds, so this feature must exist, or be written against, before their baselines and axe runs
mean anything.

## Terms

- **Story**: one entry of the built Storybook's story index (an id, a title and a name); documentation entries are
  not stories.
- **Capture**: the image of one story in one theme, rendered in the pinned container.
- **Baseline**: the committed capture of one story in one theme, the reference a capture is compared with.
- **Pinned container**: a container image identified by an immutable digest that holds the browser, the fonts and
  every other input of a capture, and runs under podman and under docker.
- **Gate**, **plant**, **required check**: as in `gates/README.md` (exit 0 nothing found, 1 findings, 2 could not
  run; fail, pass and breaking plants; the checks the `main` ruleset requires).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Storybook build is a merge gate (Priority: P1)

A contributor opens a pull request that breaks the Storybook build (a story that does not compile, an import that
does not resolve, a story module that throws when the story index is built). The pull request shows a failing
"Storybook build" check that names the cause, so a broken Storybook never reaches `main`. Today nothing builds the
Storybook in CI except as a side effect of a test.

**Why this priority**: the visual and accessibility gates both read the built Storybook; without a build gate
neither can run, and a broken build would show as their failure for the wrong reason.

**Independent Test**: run the build gate on the repository (passes), on a tree with a story that does not compile
and on a tree with a story module that throws (each fails naming the file); the plant job proves the same.

**Acceptance Scenarios**:

1. **Given** the repository as it is, **When** the Storybook build gate runs, **Then** it builds the Storybook,
   exits 0 and prints one summary line naming the number of stories in the built index.
2. **Given** a story file with a type or syntax error, **When** the gate runs, **Then** it exits 1 with one finding
   that names the file and the build's error.
3. **Given** a story module that throws while the story index is built, **When** the gate runs, **Then** it exits
   1 with a finding naming the file.
4. **Given** a built index that holds no story, **When** the gate runs, **Then** it exits 1 (an empty Storybook is
   not a passing build).
5. **Given** the Storybook dependencies are not installed, **When** the gate runs, **Then** it exits 2 naming the
   missing tool and how to install it.
6. **Given** a pull request, **When** CI runs, **Then** a check named "Storybook build" reports this gate's result,
   and the build makes no network access and sends no telemetry.

---

### User Story 2 - Every story has an exact, byte-stable visual baseline in light and dark (Priority: P2)

A contributor changes a token value, a base style or a story. The "Visual regression" check captures every story in
light and in dark in the pinned container and fails on any capture that differs from its committed baseline in any
byte, on any story without a baseline and on any baseline without a story. The contributor runs one documented
command that produces the new baselines in the same pinned container, under podman or docker, on any machine, with
the same bytes CI produces; they commit them in a pull request whose description says why the pixels changed.

**Why this priority**: it is the evidence constitution V asks for and the reason #10 exists; it depends on User
Story 1's build.

**Independent Test**: on the repository, the gate passes against the committed baselines of the 12 existing stories
(8 token, 4 base-style) in both themes (24 baselines); change one token value, delete one baseline, add one stray
baseline: each fails with the expected finding. Produce the baselines twice, and once under each container engine:
the files are byte-identical.

**Acceptance Scenarios**:

1. **Given** the committed baselines and an unchanged tree, **When** the gate runs, **Then** it captures every story
   of the built index in light and in dark and exits 0, naming the number of captures compared.
2. **Given** a change that alters any pixel of one story in one theme (for example a token value), **When** the
   gate runs, **Then** it exits 1 with one finding per differing capture naming the story id and the theme, and
   keeps the capture and an image marking the differing pixels for the contributor to inspect (in CI as a job
   artifact).
3. **Given** a capture whose pixels equal the baseline's but whose file bytes differ, **When** the gate runs,
   **Then** it exits 1: the comparison is on bytes, with no tolerance (#10: byte-stable baselines).
4. **Given** a story that has no baseline in one theme, **When** the gate runs, **Then** it exits 1 naming the story
   and the theme; a new story never passes without its baselines.
5. **Given** a baseline whose story is no longer in the index, **When** the gate runs, **Then** it exits 1 naming
   the baseline file.
6. **Given** a contributor on any machine with podman or docker, **When** they run the documented baseline command,
   **Then** it writes one baseline per story per theme from the pinned container, and running it again, or under the
   other engine, writes byte-identical files.
7. **Given** the gate or the baseline command is run outside the pinned container, or the container engine is not
   available, **When** it starts, **Then** it exits 2 naming the cause; it never compares or writes captures made
   in an unpinned browser.
8. **Given** a story with motion, a caret, a scroll position or anything else that varies between renders, **When**
   it is captured twice, **Then** the two captures are byte-identical (the capture settles or fixes what varies,
   for example by emulating reduced motion).
9. **Given** a pull request, **When** CI runs, **Then** a check named "Visual regression" reports this gate's
   result from the same pinned container the baseline command uses.

---

### User Story 3 - axe runs on every story and blocks serious and critical findings (Priority: P3)

A contributor adds a story with an unlabelled control or text below the contrast threshold. The "Accessibility"
check runs axe on every story of the built index, in light and in dark, and fails on each serious or critical
finding, naming the story, the theme, the rule and the offending node. A story that renders nothing does not pass
silently.

**Why this priority**: constitution III's axe clause; it depends on User Story 1's build but not on User Story 2.

**Independent Test**: the gate passes on the 12 existing stories in both themes; a planted story with an unlabelled
button fails with the expected rule; a planted story that renders nothing fails as empty.

**Acceptance Scenarios**:

1. **Given** the existing stories, **When** the gate runs, **Then** it runs axe on every story of the built index in
   light and in dark and exits 0, naming the number of story-theme runs.
2. **Given** a story with a serious or critical finding in one theme, **When** the gate runs, **Then** it exits 1
   with one finding per violation naming the story id, the theme, the axe rule id, its impact and a selector of the
   node.
3. **Given** a story whose only findings are of moderate or minor impact, **When** the gate runs, **Then** it exits
   0 and lists them as notes, not findings.
4. **Given** a story that renders no content (an empty story root), **When** the gate runs, **Then** it exits 1
   naming the story: axe on an empty page is not evidence.
5. **Given** the story list, **When** the gate runs, **Then** the stories come from the built index, not from a
   list kept by hand, and the count it reports equals the index's story count times two.
6. **Given** a pull request, **When** CI runs, **Then** a check named "Accessibility" reports this gate's result.

---

### User Story 4 - The CSP check targets the packages only; exceptions closed; element issues know how to add stories (Priority: P4)

The maintainer reads `gates/README.md` and the plans and finds that the strict-CSP gate covers the three packages'
built output only (#10, operator decision Q1), that mission 002's two Storybook exceptions and mission 001's "gates
absent" exception are closed with the reason, and that the three new gates, their plants and their required check
names are listed. An element issue's author reads one contributor note and knows how to add a story per variant and
state so that it gets baselines in both themes and an axe run.

**Why this priority**: it removes scope that #10 says does not belong to the Storybook and records the closed
exceptions; the gates of User Stories 1 to 3 work without it.

**Independent Test**: the `csp` gate's plants for Storybook files are gone and a Storybook file with an inline
script no longer fails the `csp` gate; the packages' plants still fail it; the README and plans read as stated.

**Acceptance Scenarios**:

1. **Given** a file under `storybook/` holding a construct the strict-CSP check rejects, **When** the `csp` gate
   runs, **Then** it does not report it (Storybook files are outside its scope), while the same construct in a
   package's built output is still reported.
2. **Given** the Storybook's run-time test, **When** it runs, **Then** it no longer serves the Storybook under a CSP
   header nor counts CSP violations, and it still asserts that rendering the stories makes no request outside the
   origin, that no rendered element has a monospace family (each with its control), and that each token story lists
   its group's tokens with their values in each theme.
3. **Given** the `prefix` gate, **When** it runs, **Then** it still checks the Storybook's source files for `sk-`
   names and monospace families (this is not a CSP check and stays).
4. **Given** `gates/README.md`, **When** the maintainer reads it, **Then** the Storybook build, visual regression and
   accessibility gates are in the gates table with their plants, the Storybook scope section no longer lists a CSP
   scope or the two exceptions, the deferred-gates table no longer lists the three gates, the custom-elements
   manifest row names the first element feature (#17 or #7) alone, and the required checks on `main` list
   seventeen checks.
5. **Given** mission 001's and 002's plans, **When** the maintainer reads their Complexity Tracking, **Then** the
   "Storybook build, visual regression and axe gates absent" row and 002's two Storybook exception rows are marked
   closed by this feature with its number.
6. **Given** an element issue's author, **When** they read the contributor note, **Then** it says where stories go,
   that each variant and state is one story, that themes are captured by the harness (a story is not written twice),
   how to produce and commit baselines, and that a baseline change needs a pull request description saying why.

---

### Edge Cases

- A story id changes (rename of a title or a story name): its old baselines become stray and its new id has none,
  so the gate reports both; the contributor regenerates and commits.
- Two stories render identically: each has its own baseline; equality between baselines is not a finding.
- A story is larger than the capture viewport: the capture covers the whole rendered story root, not only the
  viewport, so content below the fold is compared too.
- Fonts: a capture uses only the vendored Schibsted Grotesk and fonts inside the pinned container; a missing font
  must not fall back silently to a system font (a story that requests a font the container cannot serve fails the
  run rather than capture a fallback).
- Theme leakage: switching theme between captures must not leave the previous theme's state; the dark capture of a
  story equals the capture of that story rendered fresh in dark.
- A story that throws while rendering: the visual and accessibility gates report the story as failed to render
  (exit 1, naming it), not as a pixel difference or an empty story.
- The build adds or drops a story compared with the committed baselines because of a parallel feature (#17): the
  second feature to land regenerates the baselines after merging `main`.
- Baselines for a large element set: the repository grows with each story; the baseline command reports the total
  size of the baselines it wrote.
- Forced-colours mode: axe does not test it; it stays with element tests under emulation (002 FR-018 note), and the
  visual gate does not capture it.
- The container engine is podman in rootless mode: the baseline command works without root.

## Requirements *(mandatory)*

### Functional Requirements

**Storybook build gate (US1)**

- **FR-001**: A gate `storybook-build` MUST build the Storybook with the workspace's own build command and fail
  (exit 1) on a build error, on a story module that throws while the index is built, and on a built index with no
  story; it MUST exit 2 when it cannot run (tool missing, configuration unreadable). It follows the gate CLI contract
  of `gates/README.md` (`--root`, one line per finding, summary line).
- **FR-002**: The build MUST make no network access and send no telemetry (as today), and its summary MUST name the
  number of stories in the built index.

**Visual regression (US2)**

- **FR-003**: A gate `visual` MUST capture every story of the built index in light and in dark (the harness sets the
  theme; stories are not authored per theme) and compare each capture with its committed baseline byte for byte,
  with no tolerance.
- **FR-004**: The gate MUST report, one finding each: a capture that differs from its baseline (story id, theme);
  a story-theme with no baseline; a baseline with no story-theme in the index; a story that fails to render.
- **FR-005**: For each differing capture the gate MUST keep the capture and an image marking the differing pixels
  where the contributor can inspect them (locally in an ignored directory; in CI as a job artifact).
- **FR-006**: Captures MUST be deterministic: the same tree captured twice, and under podman and under docker,
  gives byte-identical files. The capture MUST fix every input that can vary (browser build, fonts and font
  rendering, viewport size and device scale factor, colour scheme, reduced motion, carets and other time- or
  state-dependent rendering, image encoding without timestamps or other metadata).
- **FR-007**: The pinned container MUST be identified by an immutable digest committed in the repository, MUST hold
  the browser build the repository's pinned Playwright expects and every font a capture uses, and MUST make no
  network access during a capture.
- **FR-008**: One documented command MUST produce or update the baselines from the pinned container, under podman
  or docker, without root, and report the number and total size of the baselines written; it MUST refuse (exit 2)
  to run outside the pinned container.
- **FR-009**: The `visual` gate and the baseline command MUST exit 2 when the container engine is not available or
  the capture is not running in the pinned container; neither ever compares or writes a capture from an unpinned
  browser.
- **FR-010**: Baselines MUST be committed under one directory in the Storybook workspace, one file per story per
  theme, named so the story id and the theme can be read from the file name.
- **FR-011**: The baselines of the 12 existing stories (8 token, 4 base-style) in light and dark MUST be committed
  by this feature.
- **FR-012**: The capture of a story MUST cover the whole rendered story root, including content outside the
  initial viewport.

**Accessibility (US3)**

- **FR-013**: A gate `axe` MUST run axe on every story of the built index in light and in dark and fail on each
  violation of serious or critical impact, one finding per violation with story id, theme, rule id, impact and node
  selector; moderate and minor results MUST be printed as notes and MUST NOT fail the gate.
- **FR-014**: The `axe` gate MUST fail a story whose story root renders no content, and a story that fails to
  render, naming it.
- **FR-015**: The `axe` gate MUST take its stories from the built index and report the number of story-theme runs,
  which MUST equal twice the index's story count.
- **FR-016**: The axe rule set MUST be axe's default set with the WCAG 2.0, 2.1 and 2.2 level A and AA rules
  enabled; no rule may be disabled except by a recorded exception in the plan's Complexity Tracking.

**Gates, plants and CI (US1 to US3)**

- **FR-017**: Each of the three gates MUST be registered in `gates/gates.json` and the FR-020 list and have a CI job
  reporting the checks "Storybook build", "Visual regression" and "Accessibility", and MUST have fail, pass and
  breaking plants under `gates/plants/<id>/` that the plant job runs. At least: `storybook-build` a story that does
  not compile, a story module that throws, an empty index (fail), the repository's stories (pass), missing
  dependencies (breaking); `visual` a changed token value, a missing baseline, a stray baseline, a same-pixels
  different-bytes baseline (fail), the repository's baselines (pass), no container (breaking); `axe` a story with
  an unlabelled control, an empty story (fail), the repository's stories, a story with only a minor finding (pass),
  a build that fails (breaking).
- **FR-018**: The plant job MUST run the `visual` plants in the pinned container in CI; where the container is not
  available the plant job MUST report those plants as not run (exit 2 cause), never as passed.
- **FR-019**: The new gates' own source MUST be covered by the mutation gate as other gate source is.

**CSP target, exceptions and documentation (US4)**

- **FR-020**: The `csp` gate MUST cover the built output of the three packages only; the Storybook inputs, HTML
  entries and their plants MUST leave its scope (operator decision Q1).
- **FR-021**: The Storybook's run-time test MUST stop serving the build under a CSP header and stop counting CSP
  violations, and MUST keep, each with its control: no request outside the origin while the stories render, no
  rendered element with a monospace family, and each token story listing its group's tokens with their values in
  both themes.
- **FR-022**: The `prefix` gate MUST keep the Storybook's source files in its scope.
- **FR-023**: `gates/README.md` MUST list the three new gates with their plants, drop the Storybook CSP scope and
  002's two exceptions, drop the three gates from the deferred list, name the first element feature (#17 or #7) as
  the deliverer of the custom-elements manifest check, and list seventeen required checks on `main` (the fourteen
  plus "Storybook build", "Visual regression", "Accessibility").
- **FR-024**: 001's "Storybook build, visual regression and axe gates absent" row and 002's two Storybook exception
  rows MUST be marked closed by feature 006 in their plans' Complexity Tracking.
- **FR-025**: A contributor note MUST explain how an element issue adds a story per variant and state, that the
  harness captures both themes, how to produce, inspect and commit baselines, and that a baseline change needs a
  pull request description that says why (constitution V).

### Key Entities

- **Story index entry**: id, title, name, kind (story or documentation); the gates use the story entries.
- **Capture / baseline**: story id, theme (light or dark), image file; a baseline is the committed capture.
- **Pinned container**: image digest, browser build, fonts, the engines it is run with (podman, docker).
- **Gate finding**: location (story id and theme, or a file), gate id, rule, message, per `gates/README.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of stories in the built index (12 today) have a committed baseline in light and in dark (24),
  and the visual gate passes on an unchanged tree.
- **SC-002**: Producing the baselines twice, and once under each of podman and docker, gives byte-identical files in
  100% of cases.
- **SC-003**: Each planted defect (FR-017) makes its gate fail with exactly its expected findings, each pass plant
  passes and each breaking plant exits 2 for its named cause, in the plant job in CI.
- **SC-004**: axe runs on 100% of story-theme pairs of the built index, and no serious or critical finding exists
  on `main` after this feature lands.
- **SC-005**: A contributor adds a new story and its baselines by following the contributor note alone, with one
  command to produce the baselines.
- **SC-006**: A change of one pixel in one story in one theme is reported by the visual gate as exactly one finding.
- **SC-007**: After this feature, no constitution IV exception concerns the Storybook, and the deferred-gates table
  holds no Storybook gate.

## Assumptions

- **Container in this environment.** The development sandbox has the docker client but no container engine running,
  and may not pull images; GitHub's runners do. Baselines for this feature are therefore produced and checked in
  CI; tests of the gates' own logic (comparison, missing and stray baselines, index enumeration, finding format)
  run without a container on fixture images and fixture indexes, so test-first work does not need the container.
  How the plan proves a red-first visual change in this environment is the plan's to state.
- **Browser in the container.** The pinned container carries the Chromium build that the repository's pinned
  Playwright (1.64.1) expects; the sandbox's installed Chromium (1243) is used only for the non-container tests,
  via `OCELLE_CHROMIUM_PATH`.
- **Storage.** Baselines are plain files in Git (no Git LFS); with 24 baselines the size is small. Moving to LFS
  when element stories grow is an operator choice for later.
- **Viewport.** One fixed capture viewport and device scale factor for all stories; per-story viewports are not
  needed by the existing stories and can be added by an element issue if a story needs one.
- **Themes.** Light and dark through the existing theme global, which sets `data-theme` on the preview's `<html>`.
  No forced-colours capture.
- **Manager UI.** The build stays preview-only (002 R1-01); the operator may restore the manager separately now that
  the CSP reason is gone.
- **The externaliser.** `storybook/scripts/externalise.ts` existed for the Storybook's CSP; whether it stays is the
  plan's choice, as long as the gates and run-time test hold.
- **Required checks.** Adding the three checks to the `main` ruleset is a repository setting the operator makes;
  this feature documents the names.
- **Baseline change reasons.** That a pull request changing baselines says why is a documented rule checked at
  review and landing; no gate reads pull request descriptions.
- **Parallel work.** #17 (icons) may add stories and edit the Storybook configuration in parallel; the feature that
  lands second merges `main` and regenerates baselines. A Storybook framework switch is not part of this feature.

## Out of Scope

- Element and icon stories and their baselines (#7 to #9, #12 to #17); interaction tests (constitution V, second
  bullet).
- The custom-elements manifest check (the first element feature, #17 or #7).
- Publishing the Storybook (GitHub Pages or elsewhere).
- Restoring the manager UI; switching the Storybook framework.
- Changing the `main` ruleset (operator).
