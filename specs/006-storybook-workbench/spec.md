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

**Plan squad round 1 (2026-11-10)**: the operator's fork decisions on the plan squad's round 1
(`reviews/plan/round-1/refute.md`) changed FR-005, FR-012, FR-013, FR-014, FR-016, FR-023, FR-025, FR-026, FR-027 and
FR-029, added FR-030 (run-time I/O) and FR-031 (pointer states), and updated the acceptance scenarios, edge cases and
assumptions that follow from them.

**Plan squad round 2 (2026-11-10)**: the confirmed findings of the plan squad's round 2
(`reviews/plan/round-2/refute.md`, fixes note `reviews/plan/round-2/fixes-1.md`) changed FR-006 (every capture is
taken at scroll position 0, 0) and FR-031 (a pointer target must lie inside the initial viewport; operator decision
on PLAN-FRESH-2-001, option (a)), and US2 scenarios 8 and 14 with them.

**Operator decision SPEC-1-06 (2026-11-10)**: "Yes, amd64 everywhere". Every capture, on every host, runs the
linux/amd64 pinned image, identified by that platform's image digest; on arm64 hosts (for example Apple Silicon) it
runs under emulation and is slower, so a baseline produced on any machine is byte-identical to CI's. "Any machine"
in this spec means any host with podman or docker that can run that linux/amd64 image, natively or emulated.

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

A contributor opens a pull request that breaks the Storybook build (a story file with a syntax error, an import
that does not resolve, a story file the story indexer cannot read). The pull request shows a failing
"Storybook build" check that names the cause, so a broken Storybook never reaches `main`. Today nothing builds the
Storybook in CI except as a side effect of a test.

**Why this priority**: the visual and accessibility gates both read the built Storybook; without a build gate
neither can run, and a broken build would show as their failure for the wrong reason.

**Independent Test**: run the build gate on the repository (passes), on a tree with a story file with a syntax
error, on a tree with an import that does not resolve and on a tree with a story file the indexer cannot read (each
fails naming the file); the plant job proves the same. Type errors in story files are not this gate's: the
`typecheck` gate's scope already holds the Storybook workspace's TypeScript, and the build does not type-check.

**Acceptance Scenarios**:

1. **Given** the repository as it is, **When** the Storybook build gate runs, **Then** it builds the Storybook,
   exits 0 and prints one summary line naming the number of stories in the built index.
2. **Given** a story file with a syntax error, or an import that does not resolve, **When** the gate runs, **Then**
   it exits 1 with one finding that names the file and the build's error. (A type error that is not a syntax error
   builds; it is reported by the `typecheck` gate, not by this one.)
3. **Given** a story file the story indexer cannot read (not valid CSF: for example no default export, or a default
   export or story export the indexer cannot analyse statically), **When** the gate runs, **Then** it exits 1 with a
   finding naming the file. (The indexer reads story files without executing them; a story module that throws when
   it is loaded builds, and is a render failure of the `visual` and `axe` gates, FR-004 and FR-014.)
4. **Given** a built index that holds no story, **When** the gate runs, **Then** it exits 1 (an empty Storybook is
   not a passing build).
5. **Given** the Storybook dependencies are not installed, **When** the gate runs, **Then** it exits 2 naming the
   missing tool and how to install it.
6. **Given** a pull request, **When** CI runs, **Then** a check named "Storybook build" reports this gate's result,
   and the build it runs is the workspace's own build command, whose no-network and no-telemetry behaviour the
   existing Storybook tests prove (FR-002).

---

### User Story 2 - Every story has an exact, byte-stable visual baseline in light and dark (Priority: P2)

A contributor changes a token value, a base style or a story. The "Visual regression" check captures every story in
light and in dark in the pinned container and fails on any capture that differs from its committed baseline in any
byte, on any story without a baseline and on any baseline without a story. The contributor runs one documented
command that produces the new baselines in the same pinned container (the linux/amd64 image, emulated on other
architectures), under podman or docker, on any machine, with the same bytes CI produces; they commit them in a pull
request whose description says why the pixels changed.

**Why this priority**: it is the evidence constitution V asks for and the reason #10 exists; it depends on User
Story 1's build.

**Independent Test**: on the repository, the gate passes against the committed baselines of the 12 existing stories
(8 token, 4 base-style) in both themes (24 baselines); change one token value, delete one baseline, add one stray
baseline: each fails with the expected finding. The gate itself captures every story-theme twice, under docker and
under podman in CI, and fails on any byte difference between the two (FR-026); a planted story that varies between
renders makes it fail.

**Acceptance Scenarios**:

1. **Given** the committed baselines and an unchanged tree, **When** the gate runs, **Then** it captures every story
   of the built index in light and in dark and exits 0, naming the number of captures compared.
2. **Given** a change that alters any pixel of one story in one theme (for example a token value), **When** the
   gate runs, **Then** it exits 1 with one finding per differing capture naming the story id and the theme, and
   keeps the capture and an image marking the differing pixels for the contributor to inspect (in CI as a job
   artifact, which also holds the new captures laid out as baseline files).
3. **Given** a capture whose pixels equal the baseline's but whose file bytes differ, **When** the gate runs,
   **Then** it exits 1: the comparison is on bytes, with no tolerance (#10: byte-stable baselines).
4. **Given** a story that has no baseline in one theme, **When** the gate runs, **Then** it exits 1 naming the story
   and the theme; a new story never passes without its baselines.
5. **Given** a baseline whose story is no longer in the index, **When** the gate runs, **Then** it exits 1 naming
   the baseline file.
6. **Given** a contributor on any machine with podman or docker (an arm64 host emulating linux/amd64 included),
   **When** they run the documented baseline command, **Then** it writes one baseline per story per theme from the
   pinned container, and running it again, or under the other engine, writes byte-identical files (proven in every
   CI run by FR-026). When a capture made on their machine and CI's disagree (byte identity across CPUs is not
   measured), CI's captures, kept in its job artifact as baseline files (FR-005), are the ones committed.
7. **Given** the host entry point of the gate or of the baseline command, **When** no container engine is
   available, or the image it would start is not the pinned linux/amd64 image by its digest, **Then** it exits 2
   naming the cause. **Given** the capture that runs inside the container, **When** it runs anywhere other than the
   pinned image, or with a browser build other than the pinned one, **Then** it exits 2 naming the cause. Neither
   layer ever compares or writes a capture made in an unpinned browser (FR-009).
8. **Given** a story with motion, a caret, a scroll position or anything else that varies between renders, **When**
   it is captured twice, **Then** the two captures are byte-identical (the capture settles or fixes what varies,
   for example by emulating reduced motion, and by taking every capture at scroll position 0, 0 even when the story
   focuses or scrolls to an element below the fold); a story whose pixels vary by an input the capture does not fix makes
   the gate exit 1 (FR-026).
9. **Given** a story whose rendered text uses any font face other than the vendored Schibsted Grotesk (a system
   font, a fallback in the token stack, a per-glyph fallback), or whose font has not loaded when the capture is
   taken, **When** the gate or the baseline command runs, **Then** it exits 1 naming the story, the theme and the
   face, and writes or compares no capture for it (FR-027). A face the page declares but no text uses is not a
   finding. A story whose element attaches a closed shadow root, whose text the check cannot read, fails the same
   way, naming the element.
10. **Given** a story that renders differently the second time it is rendered in the same page (for example it keeps
    state in storage or in a module variable), **When** the gate runs, **Then** each theme's capture equals the
    capture of that story rendered fresh in that theme: no state of an earlier capture reaches a later one (FR-028).
11. **Given** a story module that throws when it is loaded, or a story whose render throws, **When** the gate runs,
    **Then** it exits 1 naming the story as failed to render, not as a pixel difference.
12. **Given** a pull request, **When** CI runs, **Then** a check named "Visual regression" reports this gate's
    result: the job calls the gate's host entry point, which starts the same pinned image the baseline command
    uses.
13. **Given** a story that, while it renders, makes a same-origin fetch, XHR, WebSocket, EventSource or ping request
    other than the Storybook's own, or reads or writes storage, writes the clipboard or sends a beacon, **When** the
    gate or the baseline command runs, **Then** it exits 1 naming the story, the theme and the call (FR-030).
14. **Given** a story that declares a hover or press state on one of its elements, **When** the gate runs, **Then**
    the capture shows that state; a declared state whose target matches no element, or more than one, or whose
    target does not lie wholly inside the initial 1280 × 800 viewport, makes the gate exit 1 naming the story
    (FR-031).
15. **Given** a story whose content overflows its root or opens a top-layer surface (a popover, a dialog), **When**
    the gate runs, **Then** that content is inside the capture (FR-012).

---

### User Story 3 - axe runs on every story and blocks serious and critical findings (Priority: P3)

A contributor adds a story with an unlabelled control or text below the contrast threshold. The "Accessibility"
check runs axe on every story of the built index, in light and in dark, and fails on each serious or critical
finding, naming the story, the theme, the rule and the offending node. A story that renders nothing does not pass
silently.

**Why this priority**: constitution III's axe clause; it depends on User Story 1's build but not on User Story 2.

**Independent Test**: the gate passes on the 12 existing stories in both themes; a planted story with an unlabelled
button fails with the expected rule; a planted story with two text nodes below the contrast threshold fails with two
findings; a planted story that renders nothing fails as empty; a planted story module that throws fails as failed to
render.

**Acceptance Scenarios**:

1. **Given** the existing stories, **When** the gate runs, **Then** it runs axe on every story of the built index in
   light and in dark and exits 0, naming the number of story-theme runs.
2. **Given** a story with a serious or critical finding in one theme, **When** the gate runs, **Then** it exits 1
   with one finding per violating node: a violation that lists several nodes (for example `color-contrast` on three
   text nodes) gives one finding per node, each naming the story id, the theme, the axe rule id, its impact and that
   node's selector. A serious or critical result axe cannot decide (`incomplete`, for example contrast over a
   pseudo-element background) is a finding in the same way, named as incomplete.
3. **Given** a story whose only findings are of moderate or minor impact, **When** the gate runs, **Then** it exits
   0 and lists them as notes, not findings.
4. **Given** a story that renders no content, **When** the gate runs, **Then** it exits 1 naming the story: axe on
   an empty page is not evidence. A story renders no content when its story root has no descendant element with a
   rendered box of non-zero width and height and no non-whitespace text (an empty root, whitespace only, or only
   elements with no box all count as empty).
5. **Given** the story list, **When** the gate runs, **Then** the stories come from the built index, not from a
   list kept by hand, and the count it reports equals the index's story count times two.
6. **Given** a story module that throws when it is loaded, or a story whose render throws, **When** the gate runs,
   **Then** it exits 1 naming the story as failed to render.
7. **Given** a pull request, **When** CI runs, **Then** a check named "Accessibility" reports this gate's result.
8. **Given** a story that renders a surface outside its story root (for example a tooltip appended to the document
   body), **When** the gate runs, **Then** axe audits that surface and the gate exits 1 naming the story and the
   element outside the root; **given** a story whose element attaches a closed shadow root, **Then** it exits 1
   naming the story, since axe cannot see inside (FR-014).
9. **Given** an exception entry for one node of a story-theme, recorded in a plan's Complexity Tracking, **When** the
   gate runs, **Then** that node is a note, another node of the same rule in that story-theme is still a finding, and
   an entry with no matching Complexity Tracking row excepts nothing and is itself a finding (FR-029).

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
   header nor counts CSP violations, and it still asserts that the build is preview-only (no `index.html`, no
   `sb-manager/`, no `sb-addons/`; 002 R1-01), that the build and rendering the stories make no request outside
   the origin, that no rendered element has a monospace family (each with its control), and that each token story
   lists its group's tokens with their values in each theme.
3. **Given** the `prefix` gate, **When** it runs, **Then** its scope on `storybook/` is unchanged: the Storybook
   workspace's source, tests, generated stylesheets and HTML entries `storybook/dist/*.html` are still checked for
   `sk-` names and monospace families (this is not a CSP check and stays).
4. **Given** `gates/README.md`, **When** the maintainer reads it, **Then** the Storybook build, visual regression and
   accessibility gates are in the gates table with their plants, the Storybook scope section no longer lists a CSP
   scope or the two exceptions, the deferred-gates table no longer lists the three gates, the custom-elements
   manifest row names the first element feature (#17 or #7) alone, a row names the first element feature (#17 or
   #7) as the deliverer of the `@ocelle/elements` run-time strict-CSP browser test, and the required checks on `main`
   list seventeen checks.
5. **Given** mission 001's and 002's plans, **When** the maintainer reads their Complexity Tracking, **Then** the
   "Storybook build, visual regression and axe gates absent" row and 002's two Storybook exception rows are marked
   closed by this feature with its number.
6. **Given** an element issue's author, **When** they read the contributor note, **Then** it says where stories go,
   that each variant and state is one story (a hover or press state through the pointer parameter), that themes are
   captured by the harness (a story is not written twice), how to produce and commit baselines (including that on an
   arm64 host the capture runs the linux/amd64 image under emulation and is slower, and that CI's captures are
   committed when a local run and CI disagree), that a baseline change needs a pull request description saying why,
   that elements use open shadow roots and render every surface inside their own host, and that element packages
   prove run-time strict CSP in their own browser tests, not in the Storybook.

---

### Edge Cases

- A story id changes (rename of a title or a story name): its old baselines become stray and its new id has none,
  so the gate reports both; the contributor regenerates and commits.
- Two stories render identically: each has its own baseline; equality between baselines is not a finding.
- A story is larger than the capture viewport, overflows its root or opens a top-layer surface: the capture is the
  whole page at the fixed viewport width, so content below the fold, outside the root's box and in the top layer is
  compared too (FR-012).
- A story renders a surface outside its root (a portal to the document body): axe audits it and the gate fails the
  story, since elements render every surface inside their own host (FR-014).
- An element attaches a closed shadow root: neither axe nor the font check can see inside, so both gates fail the
  story (FR-014, FR-027).
- Fonts: the only font face a capture may render is the vendored Schibsted Grotesk of `@ocelle/tokens`
  (constitution II, one type family). The pinned container may hold system fonts the browser needs, but text
  rendered with any of them, including a per-glyph fallback for a character Schibsted Grotesk lacks, fails the story
  rather than being captured (FR-027, US2 scenario 9).
- Theme leakage: every story-theme is captured and checked by axe in a fresh page, so no state of an earlier render
  reaches a later one (FR-028, US2 scenario 10).
- A story that throws while it loads or renders: the visual and accessibility gates report the story as failed to
  render (exit 1, naming it), not as a pixel difference or an empty story (FR-004, FR-014, US2 scenario 11, US3
  scenario 6).
- An existing story with a serious or critical axe finding when the gate first runs: it is fixed in the story file
  in this feature; a fix that needs a token or base-style change (002 or 003 surface) is not made here (FR-029).
- An arm64 host: the capture runs the linux/amd64 image under emulation; it is slower and gives the same bytes.
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
  (exit 1) on an error the build reports (a syntax error, an import that does not resolve), on a story file the
  story indexer cannot read (not valid CSF), and on a built index with no story; each finding names the file where
  the build names one. It MUST exit 2 when it cannot run (tool missing, configuration unreadable). It does not
  type-check: type errors in the Storybook workspace are the `typecheck` gate's, whose scope holds them today. It
  follows the gate CLI contract of `gates/README.md` (`--root`, one line per finding, summary line).
- **FR-002**: The build MUST make no network access and send no telemetry (as today), and the gate's summary MUST
  name the number of stories in the built index. The evidence stays the existing Storybook tests, kept with their
  controls: the run-time test's build under the no-network preload (FR-021) and the telemetry test of the build
  configuration; the gate runs the same build command they check and is not itself required to observe the
  network.

**Visual regression (US2)**

- **FR-003**: A gate `visual` MUST capture every story of the built index in light and in dark (the harness sets the
  theme; stories are not authored per theme) and compare each capture with its committed baseline byte for byte,
  with no tolerance.
- **FR-004**: The gate MUST report, one finding each: a capture that differs from its baseline (story id, theme);
  a story-theme with no baseline; a baseline with no story-theme in the index; a story that fails to render (its
  module throws when loaded, or its render throws), named as such and not as a pixel difference.
- **FR-005**: For each differing capture the gate MUST keep the capture and an image marking the differing pixels
  where the contributor can inspect them (locally in an ignored directory; in CI as a job artifact). For each
  differing capture and each story-theme with no baseline it MUST also keep the capture laid out as a baseline file
  (same directory layout and name), so the files CI produced can be committed as they are; CI is the producer of
  record when a local capture and CI's disagree.
- **FR-006**: Captures MUST be deterministic: the same tree captured twice, and under podman and under docker, on
  any host, gives byte-identical files. The capture MUST fix every input that can vary (CPU architecture and
  platform, browser build, fonts and font rendering, viewport size and device scale factor, colour scheme, reduced
  motion, carets and other time- or state-dependent rendering, scroll position (every capture, and every pointer
  state, is taken at scroll position 0, 0; a page a story has scrolled is scrolled back first), image encoding
  without timestamps or other metadata). FR-026 is the check that proves it.
- **FR-007**: The pinned container MUST be the linux/amd64 image identified by that platform's immutable image
  digest, committed in the repository (not a multi-platform index that resolves per host), run as linux/amd64 on
  every host, under emulation on other architectures (operator decision SPEC-1-06). It MUST hold the browser build
  the repository's pinned Playwright expects and the font files a capture uses, and MUST make no network access
  during a capture.
- **FR-008**: One documented command MUST produce or update the baselines from the pinned container, under podman
  or docker, without root, and report the number and total size of the baselines written. It has the two layers of
  FR-009 and writes no baseline when either layer exits 2, when two captures of a story-theme differ (FR-026) or
  when a story fails FR-027.
- **FR-009**: The `visual` gate and the baseline command MUST each have two layers:
  - a **host entry point**, run on the contributor's machine or the CI runner, which needs podman or docker and
    starts the pinned image by its digest as linux/amd64 with the repository mounted. It MUST exit 2 naming the
    cause when no container engine is available, when the pinned image cannot be obtained, or when the image it
    would run does not have the committed digest;
  - the **capture** inside the container, which MUST exit 2 naming the cause when it is not running in the pinned
    image or the browser it would launch is not the pinned build.
  Neither layer ever compares or writes a capture from an unpinned browser. CI's "Visual regression" job and the
  plant job call the host entry point (`pnpm run gate:visual`, `--root` as in the gate CLI contract); the exit of
  the capture is the exit of the host entry point.
- **FR-010**: Baselines MUST be committed under one directory in the Storybook workspace, one file per story per
  theme, named so the story id and the theme can be read from the file name.
- **FR-011**: The baselines of the 12 existing stories (8 token, 4 base-style) in light and dark MUST be committed
  by this feature.
- **FR-012**: The capture of a story MUST be the whole page the story renders at the fixed viewport width: content
  outside the initial viewport, content outside the story root's box (overflow, outer shadows) and top-layer content
  (dialogs, popovers) included.
- **FR-026**: The `visual` gate MUST prove FR-006 on every run: it captures every story-theme of the built index
  twice and exits 1 with one finding per story-theme whose two captures differ in any byte (finding
  `nondeterministic`, naming the story id and theme), before and independently of the baseline comparison. In CI
  the two captures run one under docker and one under podman (both available on the runner): whenever the gate runs
  in CI (`CI` or `GITHUB_ACTIONS` is `true`) it requires both engines, whatever engine it was asked for, and exits 2
  naming a missing one or refusing a single engine; elsewhere both captures run under the engine available and the
  summary says the cross-engine comparison was not made. The
  baseline command makes the same two captures and writes nothing when they differ.
- **FR-027**: The `visual` gate and the baseline command MUST fail (exit 1) a story-theme in which any rendered text
  is drawn with a font face other than the vendored Schibsted Grotesk (the only allowed face; constitution II), or
  in which a font face the story's text uses has not finished loading when the capture is taken (or any face is
  still loading or failed to load), one finding per story-theme naming the face(s) found; no capture of it is
  compared or written. A face the page declares but no text uses is not a finding. A story-theme in which an element
  attaches a closed shadow root fails the same way (finding `closed-shadow-root`, naming the element), since its
  text cannot be checked.
- **FR-028**: Every story-theme MUST be captured, and checked by axe (FR-013), in a fresh page whose theme is set
  before the story renders, with no storage, script state or theme state from an earlier render.
- **FR-030**: The `visual` gate and the baseline command MUST fail (exit 1) a story-theme that, while it renders,
  makes run-time I/O (constitution I): a same-origin fetch, XHR, WebSocket, EventSource or ping request other than
  the Storybook's own, a request for a file the build does not hold, a storage read or write, a clipboard write or a
  beacon, one finding (`io`) per story-theme naming each call; no capture of it is compared or written. A request
  outside the origin is the finding `network` (FR-007).
- **FR-031**: A story MAY declare one pointer state, hover or press, on one element it renders. The `visual` gate,
  the baseline command and the `axe` gate MUST apply it after the story renders and before the capture or the axe
  run, and MUST fail (exit 1) a story-theme whose declared state is malformed, whose target matches no element or
  more than one, or whose target's box does not lie wholly inside the initial 1280 × 800 viewport at scroll position
  0, 0 (finding `pointer-target`), so a state is never silently not applied.

**Accessibility (US3)**

- **FR-013**: A gate `axe` MUST run axe on every story of the built index in light and in dark and fail on each
  violating node of a serious or critical violation: one finding per node, with story id, theme, rule id, impact
  and that node's selector (a violation listing three nodes is three findings). Each node of an `incomplete` (needs
  review) result of serious or critical impact MUST be a finding in the same way, its rule named `<rule id>-incomplete`;
  moderate and minor results, violations and incomplete alike, MUST be printed as notes and MUST NOT fail the gate.
- **FR-014**: The `axe` gate MUST fail a story whose story root renders no content (no descendant element with a
  rendered box of non-zero width and height, and no non-whitespace text), and a story that fails to render (its
  module throws when loaded, or its render throws), naming it. axe MUST run on the whole document except
  Storybook's own harness nodes, so content a story renders anywhere is audited, and the gate MUST fail a story that
  renders an element outside its story root (finding `outside-root`, naming the element) and a story whose element
  attaches a closed shadow root (finding `closed-shadow-root`).
- **FR-015**: The `axe` gate MUST take its stories from the built index and report the number of story-theme runs,
  which MUST equal twice the index's story count.
- **FR-016**: The axe rule set MUST be every rule the pinned axe-core enables by default (its best-practice rules
  included), plus every rule tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` or `wcag22aa` that it does
  not enable by default; experimental rules are not run. The rules that judge the preview document Storybook supplies
  rather than the story are not run: for axe-core 4.14.0 `bypass`, `document-title`, `html-has-lang`,
  `html-lang-valid`, `html-xml-lang-mismatch`, `landmark-one-main`, `page-has-heading-one` and `region`; a test
  derives the list from axe-core's own rule metadata, so an upgrade that adds such a rule fails until it is sorted. No
  other rule may be disabled except by a recorded exception in the plan's Complexity Tracking.
- **FR-029**: A serious or critical finding in one of the 12 existing stories when the `axe` gate first runs MUST be
  fixed in the story file in this feature. A finding whose fix needs a token or base-style change (a 002 or 003
  surface) is not fixed here: it is recorded in the plan's Complexity Tracking as an exception scoped to that story,
  theme, rule and node (its selector), with the operator's approval and the op that fixes it as its sunset, and the
  gate honours only exceptions so recorded: each entry of the exception file names the plan holding its row, the gate
  checks that the row exists, and an entry without it excepts nothing and is a finding. An exception covers only its
  node; another node of the same rule in that story-theme stays a finding.

**Gates, plants and CI (US1 to US3)**

- **FR-017**: Each of the three gates MUST be registered in `gates/gates.json` and the FR-020 list and have a CI job
  reporting the checks "Storybook build", "Visual regression" and "Accessibility", and MUST have fail, pass and
  breaking plants under `gates/plants/<id>/` that the plant job runs. At least:
  - `storybook-build`: a story file with a syntax error, an import that does not resolve, a story file the indexer
    cannot read, an empty index (fail); the repository's stories, a story file with a type error only (pass: it is
    the `typecheck` gate's); missing dependencies (breaking).
  - `visual`: a changed token value, a missing baseline, a stray baseline, a same-pixels different-bytes baseline,
    a story whose pixels vary between renders by an input the capture does not fix (for example a random value; the
    `nondeterministic` finding of FR-026), a story whose text is drawn in a face other than Schibsted Grotesk
    (FR-027), a story module that throws when loaded (fail); the repository's baselines, a story with a running CSS
    animation and a focused text field with a caret (determinism fixes of US2 scenario 8), a story that renders
    differently on a second render in the same page (FR-028) (pass); the capture run outside the pinned image (cause:
    not the pinned container) and the host entry point with no container engine (cause: no container engine)
    (breaking). How a plant presents each breaking cause is the plan's, within the rule that a plant carries no gate
    configuration.
  - `axe`: a story with an unlabelled control (one finding), a story with two text nodes below the contrast
    threshold (two findings, FR-013), an empty story, a story whose root holds only elements with no box, a story
    module that throws when loaded (fail); the repository's stories, a story with only a minor finding (pass); a
    build that fails (breaking).
- **FR-018**: The `visual` plants need a container engine. In CI the "Plants" job MUST run on a runner with docker
  and podman and the pinned image available, and run every `visual` plant through the host entry point. When the
  plant job cannot run the `visual` plants (no container engine), it MUST exit 2 naming the cause and each plant not
  run; it never reports them as passed. A local option MAY run every other plant and exit by their result alone,
  printing each `visual` plant it skipped by name and stating that the run is partial; the plant job's registry
  check MUST fail when the "Plants" job of `.github/workflows/ci.yml` passes that option, so CI cannot skip them.
- **FR-019**: The new gates' own source MUST be covered by the mutation gate as other gate source is.

**CSP target, exceptions and documentation (US4)**

- **FR-020**: The `csp` gate MUST cover the built output of the three packages only; the Storybook inputs, HTML
  entries and their plants MUST leave its scope (operator decision Q1).
- **FR-021**: The Storybook's run-time test MUST stop serving the build under a CSP header and stop counting CSP
  violations, and MUST keep, each with its control: the build is preview-only (no `index.html`, no `sb-manager/`, no
  `sb-addons/`; 002 R1-01), no network access by the build (its no-network preload) and no request outside the
  origin while the stories render, no rendered element with a monospace family, and each token story listing its
  group's tokens with their values in both themes.
- **FR-022**: The `prefix` gate's scope on `storybook/` MUST be unchanged: the Storybook workspace's source, tests,
  generated stylesheets (`storybook/.generated/`) and HTML entries `storybook/dist/*.html`, not the bundles.
- **FR-023**: `gates/README.md` MUST list the three new gates with their plants, drop the Storybook CSP scope and
  002's two exceptions, drop the three gates from the deferred list, name the first element feature (#17 or #7) as
  the deliverer of the custom-elements manifest check, name the first element feature (#17 or #7) as the deliverer of
  the `@ocelle/elements` run-time strict-CSP browser test (the Storybook no longer observes CSP), and list seventeen
  required checks on `main` (the fourteen plus "Storybook build", "Visual regression", "Accessibility").
- **FR-024**: 001's "Storybook build, visual regression and axe gates absent" row and 002's two Storybook exception
  rows MUST be marked closed by feature 006 in their plans' Complexity Tracking.
- **FR-025**: A contributor note MUST explain how an element issue adds a story per variant and state, that the
  harness captures both themes, how to produce, inspect and commit baselines, and that a baseline change needs a
  pull request description that says why (constitution V), and that on an arm64 host the capture runs the
  linux/amd64 image under emulation and is slower. It MUST also say: how to declare a hover or press state (FR-031);
  that when a local capture and CI's disagree, CI's captures from its job artifact are committed (FR-005); that
  elements use open shadow roots and render every surface inside their own host (FR-014, FR-027); and that each
  element package proves run-time strict CSP in its own browser tests, not in the Storybook (FR-023). A
  documentation test MUST check that the note holds each of these items.

### Key Entities

- **Story index entry**: id, title, name, kind (story or documentation); the gates use the story entries.
- **Capture / baseline**: story id, theme (light or dark), image file; a baseline is the committed capture.
- **Pinned container**: platform (linux/amd64), image digest, browser build, fonts, the engines it is run with
  (podman, docker); a host entry point that starts it and a capture that runs inside it.
- **Gate finding**: location (story id and theme, or a file), gate id, rule, message, per `gates/README.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of stories in the built index (12 today) have a committed baseline in light and in dark (24),
  and the visual gate passes on an unchanged tree.
- **SC-002**: In every "Visual regression" run in CI, every story-theme of the built index (24 today) is captured
  once under docker and once under podman, and the two captures of each are byte-identical (FR-026): 0
  `nondeterministic` findings on `main`, and the `visual` determinism fail plant is caught.
- **SC-003**: Each planted defect (FR-017) makes its gate fail with exactly its expected findings, each pass plant
  passes and each breaking plant exits 2 for its named cause, in the plant job in CI, with no plant skipped.
- **SC-004**: axe runs on 100% of story-theme pairs of the built index, and no serious or critical finding exists
  on `main` after this feature lands other than an exception recorded under FR-029.
- **SC-005**: The contributor note holds every item of FR-025, checked by a documentation test, and names one
  command to produce the baselines; the phase review records one walk-through of the note on a scratch story.
- **SC-006**: A change of one pixel in one story in one theme is reported by the visual gate as exactly one finding.
- **SC-007**: After this feature, no constitution IV exception concerns the Storybook, and the deferred-gates table
  holds no Storybook gate.

## Assumptions

- **Container in this environment.** The development sandbox runs docker once its daemon is started as root and
  pulls the pinned image (measured by the plan); podman is not available. Baselines for this feature are produced
  locally under docker and confirmed by a CI run of the branch under docker and podman, held by the visual phase's
  review before it is approved; tests of the gates' own logic (comparison, missing and stray baselines, index
  enumeration, finding format) run without a container on fixture images and fixture indexes.
- **Browser in the container.** The pinned container carries the Chromium build that the repository's pinned
  Playwright (1.64.1) expects; the sandbox's installed Chromium (1243) is used only for the non-container tests,
  via `OCELLE_CHROMIUM_PATH`.
- **Platform.** Every capture runs the linux/amd64 image (operator decision SPEC-1-06). GitHub's ubuntu-24.04
  runners are amd64 and run it natively, with docker and podman both installed; arm64 hosts emulate it and are
  slower, which the contributor note says. Byte identity across CPU generations (the browser's rasteriser picks code
  paths by CPU features) is not measured; CI is the producer of record when a local capture disagrees (FR-005).
- **Build in other jobs.** After FR-020 the `csp` and `prefix` jobs' `pnpm -r build` still builds the Storybook,
  which the `csp` gate no longer reads (the `prefix` gate still reads its HTML entries). Whether those jobs build
  only what they read, leaving the "Storybook build" job as the one place the build is checked, is the plan's.
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
