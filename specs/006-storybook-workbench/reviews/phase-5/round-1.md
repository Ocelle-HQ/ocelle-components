---
phase: 5
round: 1
verdict: approved
base: 25ea114f2e196af2030c82ed47515dee84796d28
head: ea492691c9b8fbaf7117a9d2b28292552c6d6af4
tdd_check: pass
---

# Phase 5 review, round 1

Scope: `git diff 25ea114..ea49269` (red `4cc9293`, green `fefafa1`, check record `ea49269`), no scaffold, no
uncommitted change besides the tdd-check outputs committed with this review. User Story 4: FR-020 to FR-025, research
R-10, plan decisions 31 and 32, tasks T061 to T074.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | gates/README.md:194, gates/README.md:37, specs/001-repository-foundation/plan.md:413, research.md:676 | The wording "the first element feature (#17 or #7)" is stale. Mission 005 (#17) has landed. It delivered the manifest gate (README row 37 says so: "since 005 (#17, the first element feature; FR-009)"). It also delivered an `@ocelle/elements` run-time strict-CSP browser test: `packages/elements/test/browser/serve.ts` serves every element page under `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` with 002's `securitypolicyviolation` collector, used by `icon.test.ts`, `brand-mark.test.ts`, `icon-set.test.ts` and `slot.test.ts`. So the new "Deferred gates" row (line 194) lists as not delivered a test that exists, and R-10's premise "`packages/elements` has no run-time CSP test yet" is false. 001's manifest row (plan.md:413) keeps an open sunset that 005 has already met. The implementer followed FR-023, FR-024, US4 scenarios 4 and 5 and operator decision 32 to the letter, and `gates-readme.test.ts` pins that text. Changing it would contradict the spec, so this is not blocking against the phase. | Operator question: amend FR-023, FR-024 and decision 32 to record that 005 (#17) delivered both, then mark 001's manifest row closed and replace the deferred row by a pointer to `packages/elements/test/browser/serve.ts`. Or keep the wording as decided. |
| R1-02 | note | storybook/test/integration/elements-stories.test.ts:11-26, 45-48 | Mission 005's test lost its CSP header and violation collector in the red commit, and no task names this file. The change is required, not a loosening. FR-021 says the Storybook's run-time test stops serving under a CSP header and stops counting violations. Once T070's externaliser leaves the inline scripts in `iframe.html`, a strict header would block Storybook's own preview, so the test could not stay as it was. The red commit message gives the reason. Every other assertion is unchanged: defined, icons and marks with name, label and drawn, base.css linked, colour scheme, no request outside the origin. Run-time strict CSP for these elements is still proven in `packages/elements/test/browser/` (see R1-01). | None. A task line would have made the change visible; for the record only. |
| R1-03 | note | storybook/test/unit/externalise.test.ts:28-35 | This is the one test changed after its red commit (`git diff 4cc9293..HEAD`). The fixture stylesheet's families went from `ui-monospace, Menlo, Monaco, monospace` to `ui-sans-serif, Arial, sans-serif`, and the test name lost "Storybook's monospace". This file is in the prefix gate's Storybook scope, and the new cross-line matching (T069) now catches the old fixture. The `toEqual` on `{ html, files }` is unchanged. `externalise` treats the `<style>` text as opaque, so the strength is unchanged: the same shape (a `font-family:` whose families follow on later lines) is moved, and the expected file text is compared byte for byte. The comment at lines 28-29 gives the reason. Not a weakening. | None. |
| R1-04 | note | specs/006-storybook-workbench/research.md:663 | R-10 says "The prefix `pass-repository` plant shows the repository still passes", but `gates/plants/prefix/` has no `pass-repository`. contracts/plants.md § `prefix` adds only `fail-storybook-html-multiline-monospace`, and no task asks for the plant. The claim is covered another way: `pnpm -r build && pnpm run gate:prefix` on HEAD exits 0 (210 files, no finding), and CI's Prefix job runs it on every pull request. | None for this phase. Drop the sentence from R-10, or add the plant in a later change if the operator wants it. |
| R1-05 | note | storybook/README.md:13-17 (gates/lib/story-page.ts:343) | Walk-through finding (SC-005, below). The note says the pointer selector must match "exactly one element the story renders". The gates resolve it with `page.locator(selector)` over the whole preview document, not the story root, so the natural first try `hover: "a"` failed with `pointer-target: hover: 5 elements match a`: Storybook's preview page has its own links. `#storybook-root a` worked. The note is not wrong, since the finding names the problem, but a contributor will hit this. | Optional: add to the note that the selector is matched in the whole preview page, so scope it under `#storybook-root`. |
| R1-06 | note | vitest.config.ts:132, storybook/stories/icon.stories.ts:4, storybook/stories/brand-mark.stories.ts:4 | These comments still describe 002's Storybook CSP. vitest.config.ts says the integration test "serves it under the Storybook page's CSP header". The two story files justify their markup by "the csp gate's Storybook check", which no longer exists. The phase removed the behaviour but left the comments. | Optional: update the three comments with the next change that touches these files. |
| R1-07 | note | gates/bin/prefix.ts:71-79 | The cross-line match runs over the whole text. In a non-CSS file, a `font:` or `font-family:` with no `;`, `{` or `}` after it now extends to the next such character, possibly lines later. That is stricter (more findings, never fewer), and every repository file passes. The line number costs `text.slice(0, index).match(/\n/g)` per declaration, which is quadratic in the number of declarations. Neither matters at today's sizes (210 files in a few seconds). | None. |

## Test quality

**Red evidence.** `red-phase.log` (red `4cc9293`, run by `red.sh 5 phase`) has 30 of 3089 failing. Each phase test
fails on its missing behaviour:

- **T061**, `gates/test/csp.test.ts:226, 248`: twelve Storybook paths still selected; the Storybook findings still
  reported.
- **T062**, `gates/test/prefix.test.ts:103-121`: `[]` where a cross-line finding is expected. The `sk-` per-line case
  fails because its expected monospace finding is missing.
- **T063**, `storybook/test/unit/externalise.test.ts`: all seven fail because scripts were still moved to `src` and
  style attributes still rewritten.
- **T064**, `storybook/test/integration/render.test.ts:144`: `[]` where `['inline-script']` is expected. The red comes
  from the build output under test (PLAN-TESTABILITY-1-005), as R-10 requires.
- **T065**, `storybook/test/unit/readme.test.ts:53`: 19 missing fragments.
- **T066**, `gates/test/ci-workflow.test.ts:226`: the csp job still ran `pnpm -r build`.
- **T071**, `gates-readme.test.ts`: fifteen, not eighteen, checks; old deferred rows; no new gate rows; no multi-line
  plant; old manifest wording; old Storybook CSP section.

The five `gates/test/integration/visual.test.ts` failures (exit code 2, `code: 2`) and `capture` (`code: 1`) come
from dockerd being down during the red run. They are not phase tests, and `check-head.log` shows them passing at
HEAD. `tdd-check.json`: `pass`. The red phase exits 1, the final tests exit 1 on base, the head exits 0, and no
problem is listed. `check-final-tests-on-base.log` fails on the phase's tests only.

**Weakened tests.** `git diff 4cc9293..HEAD` on the test pathspecs changes only `externalise.test.ts` (R1-03: same
assertion, fixture families changed, reason given). Since base, the removed tests are those of the removed behaviour:

- 002's Storybook-scope tests in `csp.test.ts`;
- the script and style-attribute tests in `externalise.test.ts`, including the `</head>` placement test of the removed
  style-attribute sheet;
- the CSP header and violation assertions in `render.test.ts` and `elements-stories.test.ts`, as FR-021 requires
  (R1-02).

The replacements assert the new behaviour:

- the packages' `dist/` constructs are still reported beside the out-of-scope Storybook ones (`csp.test.ts:248`);
- scripts and style attributes stay byte for byte (`externalise.test.ts:23, 45`);
- the CSP collector's control is replaced by a control for the outside-request recorder (`render.test.ts:154`: an
  aborted fetch to `192.0.2.1` must be recorded), so `outside: []` cannot pass vacuously.

FR-021's other checks are kept, each with its control:

- preview-only, and `iframe.html` present;
- the no-network preload, with its one control connection (`render.test.ts:132`);
- the monospace walk, with its control element;
- each token story's tokens in both themes.

**Vacuity.** No test is assertion-free, conditional, skipped or focused (test-lint: 173 files, no finding). No
assertion is on a mock or a snapshot. `readme.test.ts` reads the real `storybook/README.md` and fails per missing
fragment; it showed 19 at red. `gates-readme.test.ts` derives each new gate's plant list from `gates/plants/<id>/`, so
a plant missing from the README fails it.

**Acceptance scenarios (US4).**

1. `csp.test.ts:226, 248`, and the plant `pass-storybook-out-of-scope`.
2. `render.test.ts`.
3. `prefix.test.ts` (unchanged scope tests at :205), plus the new cross-line cases and the plant
   `fail-storybook-html-multiline-monospace`.
4. `gates-readme.test.ts` (006 block).
5. Not covered by a test: plan files are prose. Read here instead. 001's row "Storybook build, visual regression and axe
   gates absent" and 002's exceptions 1 and 2 are marked "Closed by feature 006 (#10, ...)" with reasons, and 001's
   manifest sunset reads "the first element feature (#17 or #7)" (decision 32; see R1-01).
6. `readme.test.ts`.

The story adds no element, so it has no event or keyboard path.

**Mutation.** `pnpm run gate:mutation -- --base 25ea114` exits 0: "60 mutants on the changed lines of 5 files, none
survived; 0 timeouts, 24 compile errors, 2 zero-mutant entries; 9 equivalent records". I read all nine records:

- two at `csp.ts:198, 202`: the `"<"` pre-check only skips work, so the StringLiteral mutant is equivalent;
- seven `all` records on process boundaries (`csp.ts:244`, `externalise.ts:111-117`, `swatches.ts:38-40`), each
  naming the integration test that covers it.

All carry over from earlier phases with their text retargeted from `csp.test.ts` to `render.test.ts`. The
compile-error and zero-mutant lines are reports (`registry.ts` and `swatches.ts` changed comments only).

## Checks run

Run one at a time on HEAD `ea49269`, in the main checkout, docker running:

| Check | Result |
|---|---|
| `pnpm run gate:typecheck` | exit 0, no type error |
| `pnpm run gate:lint` | exit 0, 263 files, no finding |
| `pnpm run gate:style-lint` | exit 0, 12 files |
| `pnpm run gate:test-lint` | exit 0, 173 files, no finding |
| `gate:config-copies`, `gate:pins`, `gate:contrast`, `gate:brand-rules`, `gate:manifest` | exit 0 each |
| `pnpm run gate:signoff -- --range 25ea114..HEAD` | exit 0, 3 commits |
| `pnpm --filter "./packages/*" -r build && pnpm run gate:csp` | exit 0, 17 files, no finding |
| `pnpm -r build && pnpm run gate:prefix` | exit 0, 210 files, no finding; then `gate:csp` again with `storybook/dist/` built: still 17 files, so no Storybook file is read |
| `storybook/dist/` after the full build | `iframe.html` and two `inline-<hash>.css`, no `inline-<hash>.js` |
| `node gates/bin/visual.ts` (docker) | exit 0, "42 captures match their baselines (docker only: no cross-engine comparison)" |
| `pnpm run gate:mutation -- --base 25ea114` | exit 0 (above) |
| `pnpm run gate:plants`, run as `--shard 1` to `--shard 27` then `--verdict storybook/.visual/plant-shards`, `OCELLE_VISUAL_ENGINE=docker` (no podman in this sandbox) | exit 0 for each of the 27 shards (shards 1 to 3 without the env var, before I saw that shards 4 to 19 refused with "no container engine" because the default `both` needs podman; those 16 reports were deleted and run again with docker); `--verdict` exit 0: "299 plants of 17 gates and the registry judged, every plant as expected" |
| `pnpm test` (`OCELLE_CHROMIUM_PATH` set, docker running) | exit 0, "3089 tests passed in 138 files" (as `check-head.log`) |

**SC-005 walk-through of `storybook/README.md` on a scratch story.** Done in a scratch worktree at `ea49269`, removed
afterwards; nothing of it was committed.

1. "Stories go in `storybook/stories/<name>.stories.ts`": I wrote `scratch.stories.ts` with two stories in CSF and the
   HTML renderer, after the note's pointer to `icon.stories.ts`. `Plain` holds an `ocelle-icon` and text. `Hovered`
   holds a link with `parameters: { ocelle: { pointer: { hover: "<selector>" } } }`. Each is written once, not once
   per theme.
2. "One command produces them: `pnpm run visual:update`". The first run with `hover: "a"` wrote nothing and named the
   problem (`pointer-target: hover: 5 elements match a`; R1-05). With `hover: "#storybook-root a"` it wrote "4 files
   (4 added, 0 changed, 0 removed), 30230 bytes": `scratch-walk--{plain,hovered}.{light,dark}.png`, named
   `<story-id>.<theme>.png` in `storybook/baselines/` as the note says. The images show both themes, and the link is
   drawn hovered.
3. "To inspect a difference, run `pnpm run gate:visual`". I changed the story's text and ran it: "2 findings in 46
   story-themes", `differs` for `scratch-walk--plain` in both themes. `storybook/.visual/` held
   `*.actual.png`, `*.diff.png` (the changed glyph in magenta, as the note says) and `baselines/`.
4. Running `visual:update` again wrote "2 files (0 added, 2 changed, 0 removed)": the files to commit with the change.
5. "runs axe on both": `pnpm run gate:axe` gave "46 story-theme runs, 0 serious or critical; 10 notes (0 incomplete,
   10 excepted)". The scratch stories were audited in both themes.

The note was enough to add, baseline, inspect and re-baseline a story with the one command. Its one gap is R1-05.

**Tasks.** T061 to T074 are all ticked, and the work is present:

- **T068**: `csp.ts` has no Storybook scope. Seven plants were removed and `pass-storybook-out-of-scope` added,
  exactly as contracts/plants.md § `csp` lists. `ci.yml:132` builds the packages only.
- **T069**: `prefix.ts` matches across lines, and the `fail-storybook-html-multiline-monospace` plant reports one
  finding at `iframe.html:6`, the line where the declaration starts. The old per-line scan would have missed it.
- **T070**: the externaliser handles `<style>` only, and `csp.test.ts` was renamed to `render.test.ts`.
- **T071**:
  - `gates.json` scope texts are updated;
  - the README has the three gate rows with every plant, csp on the packages only and the prefix multi-line plant;
  - the Storybook CSP section and 002's exceptions are gone, and the prefix scope is kept;
  - the deferred table has no Storybook gate, plus the elements run-time CSP row;
  - eighteen required checks, in the order of decision 31;
  - `ci.yml` and `registry.ts` comments now say eighteen.
- **T072**: 001's and 002's rows are closed with the reason, and 001's manifest sunset is rewritten per decision 32.
- **T073**: the README note.
- **T074**: the commit records the implementer's runs; the walk-through is above.

The one change outside the tasks is `elements-stories.test.ts` (R1-02, required by FR-021). `vitest-config.test.ts`
follows the T070 rename.

**Constitution.**

- **IV**: the packages' built output stays under the strict `csp` scope with no exception. The Storybook exceptions
  002 took are closed, not widened. Element run-time strict CSP is proven in `packages/elements/test/browser/`.
- **V**: baselines and stories are unchanged, and the visual gate passes on HEAD.
- **VIII**: covered under Test quality above.
- **Workflow**: required checks go to eighteen, matching the constitution's merge list (Storybook build, visual
  regression, axe), with the ruleset change left to the operator (decision 31).

**Plan.** The structure of plan.md § Phases 5 and R-10 is followed, except the nonexistent prefix `pass-repository`
plant (R1-04). Decisions 31 and 32 are applied as written (R1-01).

## Earlier findings

None: this is round 1 of phase 5.
