---
triage: 006
issues: [10]
decision: mission
target: "storybook-workbench"
in_scope: [10]
out_of_scope: [1, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 20]
semver: none
spec_prompt: "Build the Storybook workbench from issue #10 (triage/006-storybook-workbench.md): a Storybook build gate in CI, visual regression with committed baselines of every story in light and dark produced only in a pinned container, and an axe gate that fails on any serious or critical finding on any story, each gate proven by a plant under gates/plants/ and added to the required checks; it covers the existing token (002) and base-style (003) stories, keeps the preview-only build and the strict-CSP run-time test, reviews 002's two Storybook exceptions and closes 001's 'Storybook build, visual regression and axe gates absent' exception; the custom-elements manifest check stays with the first element feature (#17 or #7), publishing the Storybook (GitHub Pages) is out of scope unless the operator decides otherwise, and elements, icons and their stories stay with their own issues."
status: proposed
---

# Triage 006: Storybook workbench: build, visual regression and axe gates (#10)

## Issues read

**Limitation, read first.** GitHub could not be read from this session: `gh issue view` fails (GraphQL is not
available here) and `gh api` (REST) was refused by the permission system. The body, comments, labels, milestone and
timeline of #10 were **not read**. Everything below about #10 comes from what this repository records about it:
triage 001, 002 and 003, the 001, 002 and 003 specs and plans, `gates/README.md`, and the branch name
(`claude/010-storybook-workbench`). The spec session must read #10 (or the operator supplies its text) before the
spec check, and this record should be re-checked against it.

- **#10** (open, sub-issue of epic #1 per triage 001; title not read, "Storybook workbench" from the branch name).
  As recorded in this repository: it owns the Storybook build, visual regression "in a pinned container" and axe on
  every story (triage 001 Scope, "#10, which owns the workbench"); it "can start as soon as the foundation issue
  lands" (quoted in triage 001); it is the alternative home of the custom-elements manifest check ("#7 or #10,
  whichever lands first", 001 FR-026, `gates/README.md` Deferred gates); and its merge is the sunset of 001's
  exception "Storybook build, visual regression and axe gates absent" (001 plan, Complexity Tracking). 002 and 003
  left "further stories, visual regression and axe" to it, and both plans say 002's two Storybook exceptions are
  "reviewed when #10 extends this Storybook".

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #10 | issue (open) | in scope | This mission. |
| #4 / PR #18 / `specs/001-repository-foundation` | issue, merged PR, finished mission | out of scope (done), was **blocking**, now satisfied | Merged as `eaf1689`. Gives the CI, the plant mechanism, Vitest browser mode with Playwright 1.64.1, and the required-checks list in `gates/README.md`. Its Complexity Tracking row "Storybook build, visual regression and axe gates absent" sunsets when #10 merges; its FR-026 lists the three gates as #10's. |
| #5 / PR #19 / `specs/002-design-tokens` | issue, merged PR, finished mission | out of scope (done); **its exceptions are reviewed here** | Merged as `ec0f533`. Created `storybook/` (private workspace, `@storybook/html-vite` 10.6.5, `--preview-only` build, `externalise.ts`, run-time `csp.test.ts` with the monospace check) and the token stories. Its Complexity Tracking exceptions 1 (Storybook page CSP host additions `connect-src 'self'`, `font-src 'self'`, no manager UI) and 2 (narrowed static `csp`/`prefix` scope for the Storybook build) both say "reviewed when #10 extends this Storybook". |
| #6 / PR #21 / `specs/003-base-styles` | issue, merged PR, finished mission | out of scope (done); **its stories are in scope here** | Merged as `64c61d9`. Added four base-style stories (`storybook/stories/base.stories.ts`) and links `base.css` into the whole preview. Its plan records that those stories have no axe run and no visual baseline under 001's exception, sunset #10. This mission gives them both. |
| #17 | issue (open), parallel session (triage 005) | out of scope; **coordinate** (neither blocks) | Icons, likely the first element (operator). May touch the same Storybook setup (`.storybook/main.ts`, `preview.ts`, perhaps the framework: elements are Lit, the Storybook is `html-vite`). If #17 lands first, this mission gives its stories baselines and axe; if #10 lands first, #17 must ship baselines and pass axe. Whichever lands second rebases its `storybook/` changes. #17 is also the likely home of the manifest check (see Scope). |
| #20 | issue (open), parallel session (triage 004) | out of scope; no overlap of substance | Op on `packages/tokens/src/source.ts` (drop `as const`), lands first. It does not change token values, so token story baselines are unaffected; at most a rebase. |
| #7, #8, #9, #12, #13, #14, #15, #16 | element issues (open) | out of scope; **gain the harness** | Constitution V: every element has a story per variant and state, in light and dark, each with a committed baseline. This mission builds the harness; each element issue adds its stories and baselines. An element landing before #10 would fall under 001's exception. |
| #11 | issue (open) | out of scope, **blocked by #10** | Release v1.0.0: the constitution's merge gates include Storybook build, visual regression and axe, so the release needs them in place. |
| #1 | epic (open) | out of scope | Parent epic. |
| `storybook/` | repository | in scope (extended) | Preview-only build, `prebuild` swatches, `externalise.ts`, `test/integration/csp.test.ts`, `test/unit/theme.test.ts`, stories `tokens.stories.ts` and `base.stories.ts`. No visual or axe test, no Storybook job in `.github/workflows/ci.yml` (CI jobs: typecheck, lint, style lint, unit, test lint, mutation, csp, prefix, config copies, pins, sign-off, contrast, brand rules, plants). Whether the Storybook build already runs inside an existing job is a plan question. |
| `gates/README.md` | repository | in scope (updated) | Deferred gates table lists Storybook build, visual regression and axe as #10's; the manifest check as "#7 or #10". The required-checks list on `main` gains the new checks. |
| `.specify/memory/constitution.md` v1.3.1 | constitution | constrains | III ("axe reports no serious or critical finding on any story"); IV (strict CSP of built output); V (story per variant and state, light and dark, committed baseline "produced in a pinned container", baselines change only in a pull request that says why); VIII (test-first, plants); Development Workflow (the full merge-gate list). |
| `knowledge/speckit-flows/findings/frontend-missions.md` | finding | applies | Installed Chromium build (1243) differs from the one Playwright 1.64.1 expects (1248) and the Playwright CDN is blocked; no WebKit; Node 22 locally against 26.13.0 on CI; memory limits on parallel heavy jobs. All bear directly on reproducible screenshots. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | An axe run over a story that renders nothing, a screenshot of a blank frame, or a visual diff with a tolerance that accepts anything all pass vacuously; each gate needs a plant that bites. |
| `knowledge/speckit-flows/runs/002-design-tokens.md`, `003-base-styles.md` | run summaries | note | 002 (19 review rounds) ran long largely on the Storybook CSP work; 003 ran 9 rounds. Storybook under the strict CSP is the known expensive area. |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | `specs/001` to `003` are merged and finished; `ops/` does not exist; triage 001 to 003 on disk, 004 (#20) and 005 (#17) written in parallel sessions. Nothing in progress covers #10. |

## Decision

**mission**. Mission criteria that apply:

- **Design decisions.** How the "pinned container" is pinned (image and digest, Chromium and font rendering, how a
  baseline is produced and updated, given that this sandbox cannot run the pinned browser); where baselines live
  (committed images in the repository, size budget); the diff threshold; how axe runs under the strict CSP without
  weakening the run-time CSP test (an injected `axe-core` script is not `'self'`; serving it from the origin or a
  separate non-CSP pass are the options); whether the `html-vite` framework stays now that Lit elements are coming;
  whether 002's two Storybook exceptions are kept, narrowed or closed.
- **More than one user story.** At least three independently testable outcomes: a Storybook build gate; visual
  regression with committed baselines; an axe gate. Each is a separate merge gate with its own plant.
- **Accessibility and security behaviour beyond a local fix.** The axe gate enforces constitution III on every
  story, and the mission revisits the Storybook CSP exceptions of constitution IV.
- **Spans packages.** The gates cover stories of all packages (tokens and base styles now, elements later).

Semver **none**: `@ocelle/storybook` is private and nothing published changes. That does not make it an op; the
design questions and the several stories decide it.

Why not the others: not an **op** (several gates, several open design questions, accessibility and security
behaviour); not a **fold** (no feature or op in progress covers it; #17 touches the same Storybook but is an element
mission, not a home for repository-wide gates); not **none** (no visual or axe gate exists, `gates/README.md` lists
them as deferred); not **decision-needed** (the Pages question below is a separate, optional deliverable and does
not block scoping the gates).

## Scope

In scope (#10), suggested user stories in priority order:

1. **Storybook build gate (MVP).** A CI check that builds the Storybook (`--preview-only`, `externalise.ts`) and runs
   the existing run-time CSP test over it, failing the pull request on a build error or a CSP violation; a plant
   that breaks the build; the check named in the required-checks list.
2. **Visual regression.** Every story, in light and dark, has a committed baseline produced only in a pinned
   container (image pinned by digest, matching the pinned Playwright); a CI check compares and fails on a diff; a
   documented update path where baselines change only in a pull request that says why (constitution V); a plant
   (a changed token value or story) that the check catches. Covers the existing token and base-style stories.
3. **Accessibility gate.** Axe runs on every story in both themes and fails on any serious or critical finding;
   the run is held to the same CSP contract as the Storybook page or the deviation is recorded as an exception
   with the operator's approval; a plant (for example a story with a colour-only link or an unlabelled control)
   that the check catches; forced-colours behaviour stays with element tests under emulation (002 FR-018 note:
   axe does not check it).
4. **Exceptions and documentation.** Review 002's Storybook exceptions 1 and 2 (keep, narrow or close, recorded in
   the plan's Complexity Tracking); close 001's "gates absent" exception; update `gates/README.md` (gates, plants,
   required checks); a contributor note on how to write a story so that it gets a baseline and an axe run, which the
   element issues follow.

Out of scope:

- **Custom-elements manifest check.** With no element it can only pass vacuously. It goes to the first element
  feature (#17, per the operator, or #7); the spec updates the `gates/README.md` row from "#7 or #10" to say so. If
  the operator prefers #10 to take it, it needs a plant against a fixture manifest.
- **Element and icon stories and their baselines**: #7 to #9, #12 to #17.
- **Publishing the Storybook** (GitHub Pages or elsewhere). Private Pages need GitHub Enterprise Cloud, and the
  repository and organisation settings are the operator's. It is not a merge gate. If the operator wants it, it is
  a later op once visibility is settled (or added here by the operator, see below).
- **The manager UI.** The build stays preview-only (operator decision R1-01 in 002) unless the operator reopens it.
- **#20** stays its own op.

## Risks and open questions

- **Issue text unread.** #10's body and comments were not read; it may ask for more (for example interaction tests
  in Storybook, a published workbench, the manifest check, a framework switch) or less. The spec session reads it
  first; anything new beyond the four stories above comes back to the operator.
- **Pinned container in this environment.** The sandbox's Chromium (1243) is not Playwright 1.64.1's (1248), the
  Playwright CDN is blocked, and pulling a container image may be blocked by the proxy. Baselines produced locally
  would differ from CI. The plan must say where baselines are produced (a CI job, for example, with the images
  committed back through a pull request) and how a red-first visual test is shown in this environment; otherwise
  phases will stall on the TDD check.
- **Axe under the strict CSP.** Injecting `axe-core` via Playwright adds a script that `script-src 'self'` blocks;
  `bypassCSP` would hide the very violations the CSP test exists to catch. Options: serve `axe-core` from the
  Storybook origin in a test-only build, or run axe in a separate pass and keep the CSP test as is. A design
  decision for the plan squad, possibly an operator fork.
- **Collision with #17.** Both may edit `storybook/.storybook/` and `storybook/package.json`, and #17 may want a Lit
  or web-components framework. Agree the order: the operator's wave puts them in parallel, so whichever lands second
  rebases and re-baselines; neither should change the framework without telling the other.
- **Determinism.** Fonts are vendored (002), but sub-pixel text rendering, animations (motion tokens are `0ms` only
  under reduced motion) and the 003 scroll-box stories can flake. Emulate reduced motion and fix the viewport; set
  the threshold so a planted one-token change still fails.
- **Repository size.** Committed PNGs for every story times two themes grow quickly once elements arrive; the plan
  should state a budget or consider Git LFS (an operator choice, since it affects clones and CI).
- **CI time and memory.** Another browser job next to mutation and plants; run heavy jobs one at a time locally
  (frontend findings).
- **Required checks.** Adding checks to the `main` ruleset is a repository setting, the operator's; the mission only
  documents the names.

## What would change this decision

- #10's text asks for a published Storybook: the operator decides first where and with what visibility (GitHub Pages
  on a private repository needs Enterprise Cloud); then either a fifth story here or a separate op. Until settled,
  that part is `decision-needed`.
- #10's text, or the operator, assigns the manifest check to #10: it comes into scope with a fixture-manifest plant,
  or waits until #17 ships its manifest.
- #17's session decides to switch the Storybook framework to Lit or web components: that switch should land in one
  place first (preferably #17, which needs it), and this mission rebases onto it.
- The operator wants only the Storybook build gate now and visual regression later (for example because the pinned
  container cannot run here): story 1 alone would be a small op, and visual regression and axe a later mission.
