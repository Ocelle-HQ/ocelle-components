# Ocelle Components Constitution

## Core Principles

### I. Framework-Free Elements Under the `ocelle-` Name

Every primitive is a standards-based custom element (Lit 3) that works in any page: a
server-rendered Thymeleaf and htmx page, a Svelte shell, a Tauri webview or plain HTML.

- Element names start with `ocelle-`, tokens with `--ocelle-`, and events with
  `ocelle-<element>-<action>`. No `sk-` name, from the Spec Kitty design library or
  anywhere else, appears in source or build output.
- Data comes in as properties and attributes; user intents go out as `ocelle-*`
  CustomEvents with `bubbles: true` and `composed: true`. Parts and slots keep plain names.
- Elements perform no I/O: no fetch, XHR, WebSocket, storage, clipboard writes or host
  APIs. Where an action needs I/O (for example copying text), the element emits a request
  event and the host does the work.
- Each element keeps a small, stable interface, and the custom-elements manifest declares
  every public property, attribute, event, slot, part and CSS custom property.

Rationale: the library serves hosts with different stacks and security rules, so it can
assume nothing about the host beyond the web platform.

### II. Tokens Only, Brand Rules Enforced

All styling comes from the `--ocelle-*` tokens in `@ocelle/tokens`. Element CSS contains
no raw colour, font, size, radius, shadow or duration literals; lint rejects them.

The brand rules are part of the token contract and are checked, not just documented:

- Theme follows the system setting, light when the system states no preference;
  `data-theme="light"` or `"dark"` on `<html>` overrides it.
- The top bar, icon rail and personal rail use the dark chrome tokens in both themes.
- No monospace anywhere: ids, digests, values and code use Schibsted Grotesk with
  tabular figures; digests are shown in groups of four.
- Ochre text is never placed on bone; links use `--ocelle-color-link`.
- `--ocelle-color-rule` is decorative only and never marks a control boundary.
- One radius (`--ocelle-radius-2`, 4 px); rows and cards use `--ocelle-radius-row`; the
  pill radius is for state pills only.
- In light mode the ochre fill is never the only mark of a state on a light ground.

Rationale: a token-only library is the only way two products keep one look without
copying CSS, and rules that are not checked drift.

### III. Accessible by Construction (NON-NEGOTIABLE)

Every element meets WCAG 2.2 AA in both themes and in forced-colours mode.

- No ID reference (`aria-labelledby`, `aria-describedby`, `aria-controls`, `for`) crosses a
  shadow root. Elements that need one render that part in light DOM, keep the referenced
  nodes inside one shadow root, or use `ElementInternals`.
- Interactive elements implement the full keyboard model of their ARIA pattern (roving
  tabindex, arrows, Home and End where the pattern has them) and show the token focus ring.
- ARIA state set on a host (`aria-expanded`, `aria-current`, an accessible name) reaches
  the real inner control.
- Interactive targets meet `--ocelle-target-min` where the element is a primary action.
- Motion respects `prefers-reduced-motion`; tooltips meet WCAG 1.4.13.
- Text and non-text contrast is verified by an automated check, and axe reports no
  serious or critical finding on any story.

Rationale: shadow DOM makes common accessibility patterns fail silently, so they must be
designed in, not audited in afterwards.

### IV. Strict-CSP and Offline Compatible

Built output runs under `default-src 'none'; script-src 'self'; style-src 'self'` with no
exception.

- No inline script, no inline style element or attribute, no `eval` or `new Function`.
- Styles use adopted stylesheets; base styles ship as an external stylesheet.
- Elements make no network requests. The Schibsted Grotesk font is vendored in the tokens
  package; nothing loads from a CDN or a font service.

Rationale: the Ocelle console runs a strict CSP and Kitty Desktop's webview makes no network
requests; an element that breaks either cannot be used at all.

### V. Storybook Is the Visual Source of Truth; Tests Prove Behaviour

- Every element has a story per variant and per state, in light and dark, and each story
  has a committed visual baseline produced in a pinned container.
- Interaction tests assert every event an element emits and its payload, and every
  keyboard path.
- How those tests are written and proven is Principle VIII.
- Baselines change only in a pull request whose description says why.

Rationale: a component library is judged by its pixels and its behaviour; both need
evidence that does not depend on someone remembering to look.

### VI. Consumer Needs Drive Scope; Code Is Our Own

- Scope comes from named consumers: the Kitty Desktop and Kitty Dashboard screens
  (kitty-mission-ui) and the Ocelle web console. Each feature spec names the consumer need
  it meets, including the spec-kitty/spec-kitty-design issue it answers where there is one.
- The library is written from scratch. No code, styles or assets are copied from the
  Spec Kitty design library or from any prototype; those are read as requirements only.
- A primitive a consumer needs is added to the library, not hand-rolled in the consumer.
  Version 1.0.0 meets every need Kitty Desktop recorded against the Spec Kitty library.

Rationale: the library exists so consumers stop working around gaps; copying the library
it replaces would carry its gaps and its licence questions with it.

### VII. Semantic Versioning of the Public Surface

- The public surface is the custom-elements manifest, the token names, and the documented
  base-style hooks. Removing or renaming any of them, or changing an event's payload, is a
  MAJOR change; additions are MINOR; fixes that keep the surface are PATCH.
- The first public release is 1.0.0. Before it, the surface may change without a major bump.
- Every release has a changelog entry per package that names surface changes.

Rationale: three consumers pin these packages; they need to know from the version number
whether an upgrade can break them.

### VIII. Test-First, Proven Non-Vacuous (NON-NEGOTIABLE)

Every behaviour change is test-driven, red first, and every test must be shown able to fail.

- **Red first.** The tests for a unit of work are written and committed before the code
  that makes them pass, in a commit that changes only test files. Run against the code as
  it was, they MUST fail, and the failure MUST be the missing behaviour, not a syntax,
  import or setup error. The red run's output is kept with the review.
- **Green, without touching the tests' meaning.** The implementation makes the tests pass.
  A test written in the red step is not weakened, skipped, deleted or loosened afterwards;
  a test that turns out wrong is replaced by a stricter one with the reason recorded.
- **Proven against the old code.** The final tests of a unit, run against the code from
  before the unit, MUST fail. This is checked automatically before every review, so tests
  rewritten after the red step cannot pass vacuously.
- **Assertions that can fail.** Every test asserts observable behaviour (rendered DOM and
  accessibility tree, emitted events and payloads, computed styles from tokens, keyboard
  results). Forbidden: tests without an assertion, assertions inside conditionals that may
  not run, `skip` and `only`, snapshots as the only assertion of behaviour, assertions on
  the mock instead of the unit, and catching the failure the test is meant to report.
  Lint enforces what it can.
- **Mutation testing.** Changed source is mutation-tested. A surviving mutant in new or
  changed code is a blocking review finding unless the review records it as an equivalent
  mutant with the reason.
- **Fixes are test-first too.** A review finding about behaviour is fixed by first adding
  a test that fails because of the finding, then the fix.
- **Gates are proven, too.** Every CI gate has a planted defect that makes it fail, run in
  CI, so a gate that silently passes everything is caught.
- **Exemption.** A unit with no behaviour (scaffolding, configuration, documentation) may
  skip the red step only if its review states why no test could fail for it.

Rationale: an agent can make any check pass by weakening the check. Only a test that has
been seen failing for the right reason, and that still fails against the old code, is
evidence of the behaviour it names.

## Technology, Licence and Supply Chain

- Packages: `@ocelle/tokens`, `@ocelle/styles`, `@ocelle/elements`, published to the public
  npm registry from 1.0.0, with provenance. The repository is internal until then and goes
  public with 1.0.0.
- Stack: TypeScript (strict), Lit 3, Storybook, Vite, pnpm workspaces. Node and pnpm
  versions are pinned; every dependency is pinned exactly and the lockfile is committed.
- Licence: Apache-2.0. The only planned third-party asset is the Schibsted Grotesk font
  (SIL OFL 1.1), listed in `THIRD_PARTY_NOTICES` with its licence beside the file. Any other
  third-party asset needs the same treatment and the operator's approval.
- No secrets, tokens or personal data in the repository, fixtures or stories. The npm
  publish token lives only in CI secrets.
- Contributions are signed off under the Developer Certificate of Origin; there is no CLA.
  A `SECURITY.md` with a private reporting channel exists before the repository goes public.

## Development Workflow and Quality Gates

- Work goes through Spec Kit: `/speckit-specify`, `/speckit-plan` (its Constitution Check
  gates on this document), `/speckit-tasks`, then the `ocelle-implement` workflow, one
  feature per `specs/NNN-name/` directory and branch. Feature directories are kept after
  merge: they are the project record, and kitty-mission-ui reads them as its first real
  Spec Kit project.
- Work starts from a triage record (`triage/NNN-slug.md`) written by the `triage-tara` agent
  profile and approved by the operator. It reads the issues and every related issue, pull
  request, feature and op, and decides: a **mission** (new or changed public surface, a design
  decision, more than one user story, or accessibility or security behaviour: the full cycle
  below), an **op** (one bounded change with no new public surface and no open design question,
  recorded in `ops/NNN-slug/op.md` and implemented and reviewed exactly like a mission phase), a
  **fold** into work in progress, **none**, or a decision the operator must take first. In doubt,
  a mission. No code change starts without an approved triage record; a hook blocks code commits
  that are not linked to one.
- The flow runs either interactively (`/ocelle-run`: each role a subagent with its agent profile,
  gates as questions to the operator) or unattended (the Spec Kit workflows). Both use the same
  commands, scripts and records, and in both every loop decision comes from a script, not a model.
- After `/speckit-specify`, a spec check reads the spec on its own (ambiguity, testability,
  acceptance scenarios, constitution conflicts); blocking findings are fixed before planning, and
  questions only the operator can answer go to the operator. The full `/speckit-analyze` runs
  after `/speckit-tasks`.
- After `/speckit-plan`, an adversarial review squad attacks the spec and plan before any task is
  generated: four lenses (correctness, accessibility and security, testability, fresh eyes) in
  separate sessions, a refuter that keeps only findings that survive, operator decisions on forks,
  fixes, and an independent verify. Fresh-eyes rounds repeat on the fixed artifacts until one
  confirms nothing (three rounds at most). The squad runs after planning only.
- `tasks.md` is implemented one phase (user story) at a time. Each phase is written test
  first (Principle VIII), checked by the automatic red/green check, and then reviewed by an
  independent reviewer session; blocking findings are fixed in review rounds until the
  review approves. After three rounds the operator decides: more rounds, accept the phase
  as it is (recorded), or stop.
- Changes reach `main` through pull requests. The operator merges; agents never merge.
- A pull request merges only when all of these pass: typecheck, ESLint, Stylelint
  (token-only), unit and interaction tests, Storybook build, visual regression, axe, the
  contrast check, the strict-CSP check on built output, the custom-elements manifest check,
  the prefix check (no `sk-` names, no monospace family), the test-quality lint (no
  assertion-free, skipped, focused or conditional-assertion tests), mutation testing of
  changed source, the gate plants, and the DCO check.
- Any exception to a principle is recorded in the plan's Complexity Tracking table with
  scope, rationale and a sunset condition, and needs the operator's approval.

## Governance

This constitution overrides any other practice in this repository. Feature specs, plans and
reviews are checked against it; a plan that violates a principle states the violation and
its justification in Complexity Tracking or is not accepted.

Amendments are made by pull request, approved by the operator, and run through
`/speckit-constitution`. The version follows semantic versioning: MAJOR for removing or
redefining a principle, MINOR for adding a principle or materially expanding guidance,
PATCH for clarifications. The decision records behind this document are ADR-0079 (Ocelle
component library) and ADR-0071 (open-source strategy) in the Ocelle-HQ docs repository.

**Version**: 1.3.1 | **Ratified**: 2026-11-02 | **Last Amended**: 2026-11-02
