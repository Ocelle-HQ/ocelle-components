---
triage: 006
issues: [10]
decision: mission
target: "storybook-workbench"
in_scope: [10]
out_of_scope: [1, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 20]
semver: none
spec_prompt: "Build the Storybook workbench from issue #10 (triage/006-storybook-workbench.md): Storybook as the visual source of truth as in kitty-mission-ui, with a Storybook build gate, visual regression in which every story is captured in light and dark against baselines produced in a pinned container that runs under podman or docker and gives byte-identical images on any machine (exact comparison, no tolerance), and axe on every story failing on any serious or critical finding, each gate proven by a plant under gates/plants/ and added to the required checks; cover the existing token (002) and base-style (003) stories and give element issues a harness they add their own stories to; settle first with the operator how #10's 'the built Storybook is not the CSP check target; the CSP check runs on the packages' built output' meets 002's Storybook CSP work (record, Risks, question Q1), then close or keep 002's two Storybook exceptions accordingly and close 001's 'Storybook build, visual regression and axe gates absent' exception; the custom-elements manifest check stays with the first element feature (#17 or #7), publishing the Storybook is out of scope, and elements, icons and their stories stay with their own issues."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-10T00:10:59Z
---

# Triage 006: Storybook workbench and visual regression baselines (#10)

## Issues read

- **#10** "Storybook workbench and visual regression baselines" (open; sub-issue of epic #1; no comments, no
  labels, no linked pull requests). Text supplied by the orchestrator from the GitHub tools. It asks for:
  1. Storybook as the visual source of truth, "as in kitty-mission-ui" (the consumer whose stand-ins 003 maps).
  2. One story per element per variant and state, in light and dark.
  3. Visual regression run in a pinned container (podman or docker), so baselines are **byte-stable across
     machines**.
  4. axe checks on every story.
  5. "The built Storybook is not the CSP check target; the CSP check runs on the packages' built output."
  6. It can start once the foundation issue (#4) lands; each element issue adds its own stories.

  It does not ask for a published Storybook, the custom-elements manifest check, interaction tests or a change of
  Storybook framework. A Storybook build gate is not named in the issue; it comes from the constitution's merge-gate
  list (Development Workflow) and from 001 FR-026, which assign it to #10.

  Point 5 was written before 002 ran. 002, on operator answers of 2026-11-03 (SPEC-1-05, SPEC-3-01), did make the
  built Storybook a CSP target: a run-time test (`storybook/test/integration/csp.test.ts`) under the strict CSP plus
  the host additions, and a static `csp`/`prefix` scope widened to the Storybook inputs, taken as two constitution IV
  exceptions "reviewed when #10 extends this Storybook". The two now disagree; see Risks, Q1.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #10 | issue (open) | in scope | This mission. |
| #4 / PR #18 / `specs/001-repository-foundation` | issue, merged PR, finished mission | out of scope (done), was **blocking**, now satisfied | Merged as `eaf1689`; #10 says it can start once this lands. Gives the CI, the plant mechanism, Vitest browser mode with Playwright 1.64.1, and the required-checks list in `gates/README.md`. Its Complexity Tracking row "Storybook build, visual regression and axe gates absent" sunsets when #10 merges; its FR-026 lists the three gates as #10's. |
| #5 / PR #19 / `specs/002-design-tokens` | issue, merged PR, finished mission | out of scope (done); **its Storybook CSP work conflicts with #10 point 5** | Merged as `ec0f533`. Created `storybook/` (private workspace, `@storybook/html-vite` 10.6.5, `--preview-only` build, `externalise.ts`, run-time `csp.test.ts` with the no-network and monospace checks) and the token stories. Its exceptions 1 (Storybook page served with `connect-src 'self'`, `font-src 'self'`, no manager UI) and 2 (static `csp`/`prefix` scope widened to the Storybook inputs and HTML entries) exist only because the Storybook was made a CSP target, which #10 says it is not. Both are "reviewed when #10 extends this Storybook". |
| #6 / PR #21 / `specs/003-base-styles` | issue, merged PR, finished mission | out of scope (done); **its stories are in scope here** | Merged as `64c61d9`. Added four base-style stories (`storybook/stories/base.stories.ts`) and links `base.css` into the whole preview. Its plan records that those stories have no axe run and no visual baseline under 001's exception, sunset #10. Its README maps kitty-mission-ui's stand-ins, the reference #10 points to. |
| #17 | issue (open), parallel session (triage 005) | out of scope; **coordinate** (neither blocks) | Icons, likely the first element (operator). May touch the same Storybook setup (`.storybook/main.ts`, `preview.ts`, perhaps the framework: elements are Lit, the Storybook is `html-vite`). If #17 lands first, this mission gives its stories baselines and axe; if #10 lands first, #17 adds its stories per variant and state and their baselines, as #10 says each element issue does. Whichever lands second rebases its `storybook/` changes. #17 is also the likely home of the manifest check. |
| #20 | issue (open), parallel session (triage 004) | out of scope; no overlap of substance | Op on `packages/tokens/src/source.ts` (drop `as const`), lands first. It does not change token values, so token story baselines are unaffected; at most a rebase. |
| #7, #8, #9, #12, #13, #14, #15, #16 | element issues (open) | out of scope; **add their own stories** | #10: "each element issue adds its own stories"; constitution V: a story per variant and state, in light and dark, each with a committed baseline. This mission builds the harness; each element issue adds its stories and baselines. An element landing before #10 would fall under 001's exception. |
| #11 | issue (open) | out of scope, **blocked by #10** | Release v1.0.0: the constitution's merge gates include Storybook build, visual regression and axe, so the release needs them in place. |
| #1 | epic (open) | out of scope | Parent epic. |
| `storybook/` | repository | in scope (extended) | Preview-only build, `prebuild` swatches, `externalise.ts`, `test/integration/csp.test.ts`, `test/unit/theme.test.ts`, stories `tokens.stories.ts` and `base.stories.ts`. No visual or axe test, no Storybook job in `.github/workflows/ci.yml`. The CI `csp` job runs `pnpm -r build && pnpm run gate:csp`, whose scope since 002 includes the Storybook inputs and `storybook/dist/*.html` (`gates/README.md`, "The Storybook scope of `csp` and `prefix`"). |
| `gates/README.md` | repository | in scope (updated) | Deferred gates table lists Storybook build, visual regression and axe as #10's; the manifest check as "#7 or #10". The Storybook scope of `csp` and `prefix` is described there and changes with Q1. The required-checks list on `main` gains the new checks. |
| `.specify/memory/constitution.md` v1.3.1 | constitution | constrains | III ("axe reports no serious or critical finding on any story"); IV ("Built output runs under ... with no exception": #10 point 5 reads "built output" as the packages'); V (story per variant and state, light and dark, committed baseline "produced in a pinned container", baselines change only in a pull request that says why); VIII (test-first, plants); Development Workflow (the full merge-gate list, including "the strict-CSP check on built output"). |
| `knowledge/speckit-flows/findings/frontend-missions.md` | finding | applies | Installed Chromium build (1243) differs from the one Playwright 1.64.1 expects (1248) and the Playwright CDN is blocked; no WebKit; Node 22 locally against 26.13.0 on CI; memory limits on parallel heavy jobs. All bear directly on byte-stable screenshots. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | An axe run over a story that renders nothing, a screenshot of a blank frame, a story list that silently drops stories, or a comparison that accepts anything all pass vacuously; each gate needs a plant that bites. |
| `knowledge/speckit-flows/runs/002-design-tokens.md`, `003-base-styles.md` | run summaries | note | 002 (19 review rounds) ran long largely on the Storybook CSP work that #10 point 5 now puts in question; 003 ran 9 rounds. |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | `specs/001` to `003` are merged and finished; `ops/` does not exist; triage 001 to 003 on disk, 004 (#20) and 005 (#17) written in parallel sessions. Nothing in progress covers #10. |

## Decision

**mission**. Mission criteria that apply:

- **Design decisions.** How the container is pinned so that baselines are byte-stable (image by digest, browser
  build, fonts and font rendering, a deterministic PNG encoder) and runs the same under podman and docker; how a
  baseline is produced and updated, given that this sandbox cannot run the pinned browser; where baselines live and
  at what size; how light and dark are captured for every story without authoring each twice; how axe reaches every
  story; how #10 point 5 meets 002's Storybook CSP work (Q1).
- **More than one user story.** At least three independently testable outcomes: a Storybook build gate; visual
  regression with committed byte-stable baselines; an axe gate. Each is a separate merge gate with its own plant.
- **Accessibility and security behaviour beyond a local fix.** The axe gate enforces constitution III on every
  story, and the mission changes what the strict-CSP check (constitution IV) covers.
- **Spans packages.** The gates cover stories of all packages (tokens and base styles now, elements later).

Semver **none**: `@ocelle/storybook` is private and nothing published changes. That does not make it an op; the
design questions and the several stories decide it.

Why not the others: not an **op** (several gates, several open design questions, accessibility and security
behaviour); not a **fold** (no feature or op in progress covers it; #17 touches the same Storybook but is an element
mission, not a home for repository-wide gates); not **none** (no visual or axe gate exists, `gates/README.md` lists
them as deferred); not **decision-needed**: Q1 changes the design of the CSP part and the fate of 002's exceptions,
but not which issues are in scope, the user stories or the decision. It must be answered before the spec is
written (the spec session asks it first), not before the mission is opened. If the operator prefers to settle it
before anything starts, this record becomes `decision-needed` on Q1 alone.

## Scope

In scope (#10), suggested user stories in priority order:

1. **Storybook build gate (MVP).** A CI check that builds the Storybook (`--preview-only`, `externalise.ts`) and
   fails the pull request on a build error; a plant that breaks the build; the check named in the required-checks
   list. What else this job runs over the build (the run-time CSP test, the no-network and monospace checks) follows
   Q1; under #10 as written it is not a CSP check.
2. **Visual regression with byte-stable baselines.** Every story is captured in light and dark (the harness applies
   both themes, so a story is not written twice) against a committed baseline produced only in a pinned container;
   the container is pinned by digest, matches the pinned Playwright, and runs under podman or docker with the same
   bytes out; the comparison is exact (#10: "byte-stable across machines"; no pixel tolerance); a CI check fails on
   any difference and on a story with no baseline or a baseline with no story; one documented command to produce and
   update baselines, which change only in a pull request that says why (constitution V); plants: a changed token
   value, a changed story, a missing baseline. Covers the existing token and base-style stories.
3. **Accessibility gate.** Axe runs on every story, enumerated from the built story index rather than a hand list,
   in light and dark, and fails on any serious or critical finding; a plant (for example a story with a
   colour-only link or an unlabelled control) that the check catches, and a control that an empty story is not a
   pass; forced-colours behaviour stays with element tests under emulation (002 FR-018 note: axe does not check it).
4. **CSP target, exceptions and documentation.** Apply the operator's answer to Q1: under #10 as written, the
   strict-CSP check runs on the packages' built output only, the Storybook leaves the `csp` (and, if so decided,
   `prefix`) scope and the run-time CSP test, and 002's exceptions 1 and 2 close because their cause is gone;
   otherwise they are kept or narrowed with the reason recorded in the plan's Complexity Tracking. Close 001's
   "gates absent" exception; update `gates/README.md` (gates, plants, the Storybook scope section, required checks);
   a contributor note on how an element issue adds its stories per variant and state so that each gets baselines in
   both themes and an axe run.

Out of scope:

- **Element and icon stories and their baselines**: #7 to #9, #12 to #17; #10 says each element issue adds its own.
- **Custom-elements manifest check.** #10 does not ask for it; with no element it can only pass vacuously. It goes
  to the first element feature (#17, per the operator, or #7); the spec updates the `gates/README.md` row from "#7 or
  #10" to say so.
- **Publishing the Storybook** (GitHub Pages or elsewhere). #10 does not ask for it and it is not a merge gate; a
  later op if the operator wants it, once visibility is settled (private Pages need GitHub Enterprise Cloud).
- **The manager UI.** The build stays preview-only (operator decision R1-01 in 002). If Q1 removes the Storybook from
  the CSP target, the reason for R1-01 is gone; bringing the manager back would be a separate operator choice, not
  part of this mission.
- **Interaction tests** (constitution V, second bullet): they belong to each element issue.
- **#20** stays its own op.

## Risks and open questions

- **Q1, CSP target (operator).** #10: "The built Storybook is not the CSP check target; the CSP check runs on the
  packages' built output." 002, on later operator answers (SPEC-1-05, SPEC-3-01, 2026-11-03), made it one. Options:
  (a) follow #10: the strict-CSP check covers the packages' built output only; the Storybook run-time CSP test is
  removed (or kept as a non-gating smoke test), the static `csp`/`prefix` scope returns to the packages, 002's
  exceptions 1 and 2 close; decide separately whether the no-network and monospace checks in `csp.test.ts`, which
  are not CSP checks, stay on the Storybook; (b) keep 002's arrangement: the Storybook stays under the strict CSP
  plus host additions, the exceptions stay, and axe must run under that CSP (an injected `axe-core` script is not
  `'self'`, and `bypassCSP` would hide what the CSP test exists to catch); (c) a mix, for example the CSP gate on the
  packages only while the Storybook run-time test stays as evidence for the token reference. Option (a) is the
  issue's text and the simplest for axe and screenshots; (b) and (c) keep evidence the operator asked for in 002.
- **Byte-stable across machines.** An exact comparison is stricter than the usual tolerance. Anti-aliasing,
  sub-pixel text, GPU or software rasteriser, font hinting, timestamps or metadata in PNGs, animations (motion
  tokens are `0ms` only under reduced motion), carets and the 003 scroll-box stories can all change bytes. The
  container must fix the browser build, fonts, rasteriser flags, viewport and device scale factor, emulate reduced
  motion, and write PNGs without metadata; the plan should show the same image giving the same bytes twice and under
  both podman and docker.
- **Pinned container in this environment.** The sandbox's Chromium (1243) is not Playwright 1.64.1's (1248), the
  Playwright CDN is blocked, and pulling a container image may be blocked by the proxy. Baselines produced locally
  would differ from CI. The plan must say where baselines are produced (a CI job, for example, with the images
  committed back through a pull request) and how a red-first visual test is shown in this environment; otherwise
  phases will stall on the TDD check.
- **Collision with #17.** Both may edit `storybook/.storybook/` and `storybook/package.json`, and #17 may want a Lit
  or web-components framework. The operator's wave puts them in parallel, so whichever lands second rebases and
  re-baselines; neither should change the framework without telling the other.
- **Repository size.** Committed PNGs for every story times two themes grow quickly once elements arrive; the plan
  should state a budget or consider Git LFS (an operator choice, since it affects clones and CI).
- **CI time and memory.** Another browser job next to mutation and plants; run heavy jobs one at a time locally
  (frontend findings).
- **Required checks.** Adding checks to the `main` ruleset is a repository setting, the operator's; the mission only
  documents the names.

## What would change this decision

- The operator wants Q1 settled before the mission is opened: this record becomes `decision-needed` on Q1, with the
  options above, and returns to `mission` with the answer.
- The operator wants only the Storybook build gate now and visual regression later (for example because the pinned
  container cannot run here): story 1 alone would be a small op, and visual regression and axe a later mission.
- #17's session decides to switch the Storybook framework to Lit or web components: that switch should land in one
  place first (preferably #17, which needs it), and this mission rebases onto it.
- The operator assigns the manifest check or publishing to #10 despite the issue text: the manifest check comes in
  with a fixture-manifest plant; publishing needs the visibility question answered first.
