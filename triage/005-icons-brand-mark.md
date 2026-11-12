---
triage: 005
issues: [17]
decision: mission
target: "icons-brand-mark"
in_scope: [17]
out_of_scope: [1, 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20]
semver: minor
spec_prompt: "Build the first @ocelle/elements feature from issue #17 (triage/005-icons-brand-mark.md): the element conventions later element missions follow (Lit 3 pinned, registration, token-only static styles, a generated custom-elements manifest at packages/elements/custom-elements.json checked by a new manifest gate with plants, element stories in the existing Storybook, CSP-safe built output); ocelle-icon rendering a shared SVG icon set for navigation and actions (spec-kitty-design#496: back chevron, menu, close, folder, arrow and the icons #7, #12 to #16 name) inline in its shadow root with no network request, sized by --ocelle-icon-size, painted with currentColor, decorative by default (aria-hidden) and visible in forced colours; a documented slot convention that ocelle-button, ocelle-nav-item and ocelle-action-row follow to size slotted icons, proven on a test host; the Ocelle rosette brand mark (Ocelle-HQ/docs src/theme/assets/logo.svg) as SVG for ocelle-top-bar with variants for the dark chrome and light grounds, from tokens only (spec-kitty-design#504); the icon licence recorded (own drawings, or a permissively licensed set in THIRD_PARTY_NOTICES with the operator's approval); the controls themselves, their accessible names and visual baselines and axe stay with #7, #12 and #10."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-10T00:11:08Z
---

# Triage 005: Icons and brand mark (#17), and the first element conventions

## Issues read

**Source of the issue text.** GitHub could not be read from this session: `gh` fails on GraphQL (HTTP 403), and
REST calls through `gh api` and `curl` were refused by the session's permission rules. The orchestrator fetched the
issue text through the GitHub tools on 2026-11-09 and gave it as two files:
`scratchpad/issue-17-context.md` (#17 in full, #10, #20, key parts of epic #1) and
`scratchpad/epic-1-sub-issues.md` (the bodies and states of all 16 sub-issues of #1). The record is based on that
text as of 2026-11-09. The two spec-kitty-design issues #17 cites (#496, #504) and the source file of the brand mark
(`Ocelle-HQ/docs` `src/theme/assets/logo.svg`) were not read.

- **#17** "Icons and brand mark — ocelle-icon and the Ocelle rosette as SVG" (open, author MOES-Media, created
  2026-11-02, parent epic #1; no labels, milestone, comments or linked pull requests). Four checklist items:
  1. A shared icon set for navigation and actions (back chevron, menu, close, folder, arrow, ...), shipped as SVG and
     used through `ocelle-icon` **or** a slot convention that `ocelle-button`, `ocelle-nav-item` and
     `ocelle-action-row` size correctly (spec-kitty-design#496).
  2. The Ocelle brand mark (the rosette in `Ocelle-HQ/docs` `src/theme/assets/logo.svg`) shipped as SVG for
     `ocelle-top-bar`, with light and dark variants (spec-kitty-design#504 asked the same for the Spec Kitty mark).
  3. Icons decorative by default (`aria-hidden`); an icon-only control gets its name from the control, not the icon.
  4. Icon licence recorded: own drawings, or a permissively licensed set named in the third-party notice.
- Epic #1 gap table row: "#496 #504 | icon sizing and icon set, brand mark as SVG | #17 icons and brand". Day-one
  rule: every gap row is met in the first release (#11).

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #17 | issue (open) | in scope | This mission. |
| #1 | epic (open) | out of scope | Parent epic; its gap row for #496 and #504 closes with this mission. |
| #4 / `eaf1689` | issue (closed), merged | done, was blocking | Workspace, Vitest browser runner (`packages/elements/test/chromium.test.ts`), lint, mutation, CSP and prefix gates, plants. |
| #5 / PR #19 / `ec0f533` | issue (closed), merged | done, was blocking | Gives `--ocelle-icon-size` (1.25rem), `color-chrome*` (the top bar is dark in both themes), `color-accent*`, `color-focus`, the forced-colours rule (g). The 002 spec (lines 285, 555 to 557) keeps the element name `ocelle-icon` allowed and forbids an element property named `--ocelle-icon-size`, which is the token. |
| #6 / PR #21 / `64c61d9` | issue (closed), merged | done | `base.css` styles element hosts (they live in the light DOM) and sizes `svg` in the light DOM to its container (`packages/styles/README.md`, "Custom-element hosts"). Icons rendered inside a shadow root are not touched by it; slotted light-DOM `svg` is, and the slot convention must allow for that. Identifier wrap does not apply to icons. |
| #2 | issue (closed) | done | Package names; icons ship in `@ocelle/elements`. |
| #7 | issue (open) | out of scope, **blocked by #17** (soft) | `ocelle-button` "sizes slotted SVG icons; an `icon` slot before the label (#496, #509)", `ocelle-action-row` `trailing` slot "for an arrow" (#508). #7 builds those slots on the convention defined here and uses the set's icons; it also inherits the element conventions this mission sets. |
| #12 | issue (open) | out of scope, **blocked by #17** | `ocelle-top-bar` "brand mark and product name, an actions area, a menu button" (#494) consumes the brand mark and the `menu` icon; `ocelle-nav-item` "icon and label ... compact icon-only mode that keeps the accessible name" (#500) consumes icons and the slot convention. The accessible name of the icon-only control is tested in #12, not here. |
| #13, #14, #15, #16 | issues (open) | out of scope, use the set | Likely icon users: disclosure chevron (#13), copy-field Copy control (#14), scroller edges (#15), dialog and drawer close (#16). This mission's spec should list their icon needs so the first set covers them; the elements themselves stay in their issues. |
| #8, #9 | issues (open) | out of scope | No icon named; they inherit the element conventions only. |
| #10 | issue (open), triaged in parallel as 006 | out of scope; **coordinate** (neither blocks) | Owns visual regression in a pinned container and axe on every story. This mission adds `ocelle-icon` and brand-mark stories to the existing Storybook (`storybook/stories/*.stories.ts`, `@storybook/html-vite` 10.6.5, as 002 and 003 did) with behaviour tests in Vitest; baselines and axe over them come with #10. Both may touch `storybook/.storybook/main.ts` and `preview.ts`: whichever lands second rebases. |
| #20 | issue (open), triaged in parallel as 004 | out of scope; **coordinate**, lands first | Drops `as const` in `packages/tokens/src/source.ts`. If this mission adds tokens (brand-mark colours, a slotted-icon gap), it edits the same file and rebases on #20. |
| #11 | issue (open) | out of scope, blocked by #17 | Release v1.0.0 is "Blocked by ... #17"; needs the icon licence in `THIRD_PARTY_NOTICES` if a third-party set is used, and the `@ocelle/elements` changelog. |
| spec-kitty-design#496, #504 | external issues | requirement sources, not read | Constitution VI: read as requirements only, nothing copied. The spec names them as the consumer need. |
| `Ocelle-HQ/docs` `logo.svg` | external asset | source of the brand mark, not read | Ocelle's own mark, not a Spec Kitty or prototype asset, so VI does not forbid it; but it must be normalised (no `style` attributes, no literal colours, no ids that matter outside a shadow root), and its licence or trademark status in an Apache-2.0 repository has to be stated (Risks). |
| `packages/elements/` | repository | in scope (replaced) | Still the 001 skeleton: `src/index.ts` is `export {};`, `test/sample.test.ts` asserts it "exports nothing yet", `package.json` builds with `tsc`, no Lit dependency, no `custom-elements.json`. |
| `stylelint.config.ts`, `style-lint` gate | repository | applies | Already lints `packages/elements/**/*.ts` style templates through `postcss-lit` (token-only), and resolves `var(--ocelle-…)` names against the token source and `packages/elements/custom-elements.json`, which does not exist yet. |
| `csp`, `prefix`, `pins` gates | repository | applies | `csp` scans built output and already has a `<svg/onload=>` plant; `prefix` scans `@ocelle/elements` source and `dist/`; `pins` covers the new Lit (and manifest analyser) pins and release age. |
| Custom-elements manifest check | constitution gate, **missing** | in scope | Constitution "Development Workflow" lists "the custom-elements manifest check" as a merge gate, and I requires the manifest to declare every property, attribute, event, slot, part and CSS custom property; `gates/README.md` has no such gate. The first element is where it has to exist. |
| `THIRD_PARTY_NOTICES` | repository | in scope if a third-party set is chosen | Lists only Schibsted Grotesk. Constitution "Technology, Licence and Supply Chain": any other third-party asset needs the same treatment **and the operator's approval**. |
| `knowledge/speckit-flows/findings/frontend-missions.md` | finding | applies | Node 22 against 26.13.0, `OCELLE_CHROMIUM_PATH`, no WebKit, one heavy job at a time; browser facts found late cost 003 most of its rounds. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | An `aria-hidden` or forced-colours test that queries an empty shadow root, or runs without emulation, passes vacuously. |
| `knowledge/speckit-flows/runs/002-design-tokens.md`, `003-base-styles.md` | run summaries | note | Missions that add gates and touch several packages ran long; keep gate work to the one manifest gate. |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | `specs/001` to `003` are merged; no `ops/`; triage 001 to 003, with 004 and 006 in parallel. Nothing in progress covers #17. |

## Decision

**mission.** Several mission criteria apply:

- **New public surface (MINOR).** A new element `ocelle-icon` (its attribute or property for the icon name, its
  parts, its sizing custom property if any), the icon names themselves (renaming one after 1.0.0 is MAJOR), the brand
  mark (an element, an icon name or an export), the slot convention other elements follow, and the first
  `custom-elements.json`. Possibly new tokens for the mark's colours.
- **Design decisions.** `ocelle-icon` element, slot convention, or both (the issue leaves it open); how the set is
  shipped (one module per icon for tree shaking, or a registry); whether the brand mark is its own element; how
  "light and dark variants" map onto a top bar that is dark in both themes (by ground, not by theme); own drawings
  or a third-party set; and, because this is the first element, the conventions every element mission inherits
  (Lit 3 version and pin, registration and double-definition, file layout, styles, manifest generation and gate,
  story layout).
- **More than one user story** (four, below).
- **Accessibility beyond a local fix.** Decorative-by-default semantics across shadow roots, forced-colours
  rendering, and a naming rule that every control in #7 and #12 relies on.
- **Spans packages, possibly.** `@ocelle/elements`, the Storybook workspace and the gates; `@ocelle/tokens` if the
  mark needs colour tokens.

Why not the others: not an **op** (new public surface and open design questions); not a **fold** (nothing in
progress covers it; #7 and #12 depend on it rather than containing it); not **none** (no icon, mark or element
exists); not **decision-needed** (the open choices are design questions the spec and its check can put to the
operator; the one that needs explicit operator approval under the constitution, a third-party icon set, can be
answered when this record is approved, and the default, own drawings, needs none).

**Element conventions.** This is the first `ocelle-*` element, so this mission sets the `packages/elements`
conventions and records them in the package README for #7 to #9 and #12 to #16. They belong here, not in a separate
foundation mission, because an infrastructure-only mission has no user-visible outcome, and `ocelle-icon` is the
smallest element that proves each convention end to end. The operator may split them out instead (see the last
section).

## Scope

In scope (#17), suggested user stories in priority order:

1. **Element conventions and `ocelle-icon` (MVP).** Lit 3 pinned exactly; one registration pattern (side-effect
   import, safe against a second definition); token-only `static styles` (no `<style>` element or `style` attribute
   in output, constitution IV); a generated `packages/elements/custom-elements.json` and the missing manifest gate,
   with fail, pass and breaking plants; the skeleton test replaced. `ocelle-icon` renders one named icon as inline
   SVG inside its shadow root (no `<use href>`, `<img src>` or other request, constitution IV), sized by
   `--ocelle-icon-size` by default, painted with `currentColor`, `aria-hidden` by default and visible in forced
   colours, with an unknown name handled in a defined way. Stories in light and dark in the existing Storybook.
2. **The icon set.** Back chevron, menu, close, folder, arrow, and the icons #7 and #12 to #16 need (the spec lists
   them by consumer); one stroke and grid style; the licence recorded (README for own drawings, or
   `THIRD_PARTY_NOTICES` with the licence beside the files and the operator's approval for a third-party set).
3. **Slot convention.** One documented way for an element to size and colour a slotted icon (`ocelle-icon` or a
   bare `svg`), proven on a test host element in the test suite, since `ocelle-button`, `ocelle-nav-item` and
   `ocelle-action-row` do not exist yet; including the interaction with `base.css`'s light-DOM `svg` rule. The
   naming rule (an icon-only control takes its name from the control) is documented here and tested by #7 and #12.
4. **Brand mark.** The Ocelle rosette as SVG, from the docs repository's `logo.svg` normalised to tokens only, with
   a variant for the dark chrome (what `ocelle-top-bar` uses in both themes) and one for light grounds, meeting the
   3:1 non-text contrast on its ground and visible in forced colours; decorative or named as the spec decides (in
   the top bar the product name beside it usually carries the name).

Plus: package README (conventions, icon list, slot convention, licence), `@ocelle/elements` CHANGELOG entry.

Out of scope:

- `ocelle-button`, `ocelle-action-row` (#7), `ocelle-top-bar`, `ocelle-nav-item` (#12), and the accessible names of
  their icon-only modes.
- Visual baselines in a pinned container and axe over the stories (#10).
- Favicons, app icons or a standalone SVG export for hosts outside elements, unless the spec finds a named consumer
  need.
- The token change of #20.

## Risks and open questions

- **External sources unread.** spec-kitty-design#496 and #504 and `logo.svg` were not read; #496 may list more icons
  or sizes, and `logo.svg` may carry literal colours, gradients, `style` attributes or text that has to be redrawn.
  The spec session reads them, or the operator supplies them, before the spec check.
- **Brand mark licence.** Shipping the Ocelle mark in an Apache-2.0 package grants a copyright licence to the file
  but not trademark rights; the operator should state whether the mark ships under Apache-2.0 with a trademark note
  (README or `NOTICE`), or under separate terms. This is an operator question for the spec check.
- **Third-party icon set.** Needs the operator's approval under the constitution. Own drawings avoid that but cost
  drawing time and review of a consistent style.
- **Mark colours.** If the rosette uses ochre on the chrome, `color-accent` on `color-chrome` must meet 3:1 as a
  non-text pair; new pairs go into `packages/tokens/contrast/pairs.json`, and new tokens reopen `source.ts` (after
  #20). Light-mode ochre on bone is 2.6:1, below 3:1, so the light-ground variant cannot rely on `color-accent`
  alone.
- **Forced colours.** `currentColor` maps to a system colour; a two-colour mark collapses to one, so the mark must
  stay recognisable in a single colour.
- **Bundle size and surface.** A registry of every icon in one module defeats tree shaking for consumers; per-icon
  modules add one export path per icon to the public surface. The plan decides.
- **Shadow DOM and `aria-hidden`.** `aria-hidden` on the host hides the whole element; on the inner `svg` only the
  drawing. Tests must assert the accessibility tree in Chromium, not attributes alone. No WebKit is available here
  (frontend finding), though Kitty Desktop runs on WebKit.
- **Parallel work.** #10 (triage 006) may also touch Storybook configuration and expect the manifest; #20 (triage
  004) touches `source.ts`. Ordering: #20 first, then rebase; with #10, whichever lands second rebases. If triage 006
  puts the manifest gate in #10, one of the two records must drop it.
- **Environment.** Node 22 here against 26.13.0 in CI; browser runs need
  `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
- **Branch.** This record is committed on `claude/017-icons-brand-mark`, not pushed. The feature directory is
  `specs/005-icons-brand-mark/`.

## What would change this decision

- The operator wants the element conventions (Lit, manifest gate, layout) in their own foundation mission first:
  split them out, and this mission is blocked by it and keeps only stories 1 (the element), 2, 3 and 4.
- The operator wants #7 to be the first element: #17 would still be a mission, but it would inherit the conventions
  from #7 and be blocked by it.
- The brand mark needs a licence or trademark decision that cannot be made at the spec check, or a redraw by a
  designer: split it into a later mission, and this one ships the icon set, `ocelle-icon` and the slot convention.
- The operator picks a third-party set and does not approve the asset under the constitution: `decision-needed`
  until a set or own drawings is chosen.
- Triage 006 (#10) takes the manifest gate or the element story conventions: this scope drops them and is blocked
  by #10 for them.
