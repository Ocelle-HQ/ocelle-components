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
- A behaviour change without a test that fails before it and passes after it is not done.
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
  gates on this document), `/speckit-tasks`, `/speckit-implement`, one feature per
  `specs/NNN-name/` directory and branch. Feature directories are kept after merge: they are
  the project record, and kitty-mission-ui reads them as its first real Spec Kit project.
- Changes reach `main` through pull requests. The operator merges; agents never merge.
- A pull request merges only when all of these pass: typecheck, ESLint, Stylelint
  (token-only), unit and interaction tests, Storybook build, visual regression, axe, the
  contrast check, the strict-CSP check on built output, the custom-elements manifest check,
  the prefix check (no `sk-` names, no monospace family) and the DCO check.
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

**Version**: 1.0.0 | **Ratified**: 2026-11-02 | **Last Amended**: 2026-11-02
