---
triage: 003
issues: [6]
decision: mission
target: "base-styles"
in_scope: [6]
out_of_scope: [1, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20]
semver: minor
spec_prompt: "Build the @ocelle/styles base stylesheet from issue #6 (triage/003-base-styles.md): an external, CSP-safe stylesheet built only on --ocelle-* tokens with reset (applying color-scheme: var(--ocelle-color-scheme) on the root, the 002 hand-off), the regular and compact type scales (spec-kitty-design#531), the token focus ring, reduced motion and forced colours; classless prose for rendered Markdown keyed on element selectors (spec-kitty-design#519: line height 1.65, h1 30 px, h2 18 px, a reading measure token of about 68ch, tables with 12 px tabular-figure Schibsted Grotesk headers in a scroll box, no monospace per constitution II); and one documented identifier-wrap hook with overflow-wrap: anywhere semantics (spec-kitty-design#535); any new token goes into @ocelle/tokens under the 002 contrast and brand-rule gates; element parts or properties for identifier wrapping stay with the element issues, stories beyond the minimal Storybook and axe with #10, no utility classes."
status: proposed
---

# Triage 003: Base styles package (#6)

## Issues read

**Limitation, read first.** GitHub could not be read from this session. The body of #6 was given by the operator
as a file (text as of 2026-11-09); its comments, labels, milestone and timeline were not read, and the three
spec-kitty-design issues it cites (#519, #531, #535) were not read at all. Every other issue below is described from
what this repository records about it (triage 001 and 002, the 002 spec and plan, `gates/README.md`), not from its
current text.

- **#6** "Base styles package: reset, type, prose and identifier wrapping" (open, author MOES-Media, parent epic #1,
  no linked pull request). Page-level base styles on `--ocelle-*` tokens only, as an external stylesheet (no inline
  style) so a Thymeleaf page under a strict CSP and kitty-mission-ui's Storybook load it the same way. Three parts:
  1. Reset, type scale (regular and compact, spec-kitty-design#531), focus ring, reduced motion, forced colours.
  2. **Prose** (spec-kitty-design#519) for rendered Markdown, keyed on element selectors (no classes): line height
     1.65, `h1` 30 px, `h2` 18 px (Desktop V2 prototype), a reading measure token of about 68ch, tables with 12 px
     mono headers inside a scroll box.
  3. **Identifier wrap policy** (spec-kitty-design#535): one shared attribute or class with `overflow-wrap: anywhere`
     semantics for slugs, ids and paths in rows, headers, fact values and code; "the elements expose the same
     through a part or property".
  Out of scope (per the issue): utility classes for components. Depends on: design tokens (#5).

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #6 | issue (open) | in scope | This mission. |
| #5 / PR #19 / `specs/002-design-tokens` | issue, merged PR, finished mission | out of scope (done), was **blocking**, now satisfied | Squash-merged to `main` as `ec0f533` ("Mission 002: design tokens (#5) (#19)"), verified in `9692e31`. Gives this mission every token it builds on, the theme selectors (002 Assumptions: "#6 builds on them and does not repeat them"), the `color-scheme` token that **#6 must apply** on the root (002 Assumptions, "`color-scheme` hand-off"; until then native controls follow the UA default), `figures` (`tabular-nums`), `focus-width`/`focus-offset`/`color-focus`, `motion-*` at `0ms` under reduced motion, and the forced-colours rule (g). 002 spec lists "base styles, reset and typography classes (#6)" as out of scope. |
| #20 | issue (open), op | out of scope; **coordinate** (neither blocks) | Drop `as const` in `packages/tokens/src/source.ts`. This mission will very likely add tokens to the same file (see Scope), so the two touch one file. Prefer #20 lands first (it is small); otherwise whichever lands second rebases. No ops record for it exists yet (`ops/` is absent). |
| `packages/styles/` | repository | in scope (replaced) | Skeleton from mission 001 (`eaf1689`): `src/index.ts` is `export {};`, `test/sample.test.ts` asserts the module "exports nothing yet", `package.json` exports only `./dist/index.js` and builds with `tsc`. There is no stylesheet, no CSS export and no README or CHANGELOG yet; the mission adds the stylesheet export and replaces the skeleton test. |
| `stylelint.config.ts`, `style-lint` gate | repository | applies | Already covers `packages/styles/**/*.css` token-only, and since 002 rejects unknown `--ocelle-*` names. Every literal #6 lists (1.65, 18 px, 68ch, 12 px) must therefore be a token. |
| `csp`, `prefix`, `contrast`, `brand-rules` gates | repository | applies | `csp` and `prefix` already scan the built output of all three packages (`prefix` rejects `monospace`). New tokens fall under `contrast` and `brand-rules` with their plants. |
| #1 | epic (open) | out of scope | Parent epic. |
| #7, #8, #9, #12, #13, #14, #15, #16, #17 | element and icon issues (open) | out of scope; **identifier-wrap exposure goes there** | "The elements expose the same through a part or property" is element surface (custom-elements manifest), and no element exists yet (`packages/elements/custom-elements.json` is added by #7 or #10). This mission defines and documents the shared policy and the base-style hook; each element issue that renders identifiers (rows, headers, fact values, code) exposes it and tests it. They are not blocked by #6 for tokens, but should reuse its hook. |
| #10 | issue (open) | out of scope | Storybook build gate, visual regression and axe. Base-style stories under the strict CSP can ship with the minimal Storybook from 002 (as 002 did for tokens); visual baselines and axe over them belong to #10. kitty-mission-ui loading the stylesheet in its own Storybook is a consumer concern, served by the external-stylesheet contract. |
| #11 | issue (open) | out of scope, blocked by #6 | Release v1.0.0 ships `@ocelle/styles`; needs its changelog entry (constitution VII). |
| spec-kitty-design#519, #531, #535 | external issues | requirement sources, not read | Constitution VI: read as requirements only, no code or styles copied. The spec must name them as the consumer needs. |
| `.specify/memory/constitution.md` v1.3.1 | constitution | constrains | II (tokens only; **no monospace anywhere**, ids and code in Schibsted Grotesk with tabular figures); III (focus ring, reduced motion, forced colours, contrast); IV ("base styles ship as an external stylesheet"); VI (consumer needs named); VII ("documented base-style hooks" are public surface); VIII (test-first, plants). |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | Computed-style tests over an element selector that matches nothing, or a forced-colours test without emulation, pass vacuously. |
| `knowledge/speckit-flows/runs/002-design-tokens.md` | run summary | note | 6 phases, 19 review rounds, two phases past round 3. A sign that a mission with many gate changes runs long; this one should keep gate changes minimal. |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | `specs/001` and `specs/002` are merged and finished; no `ops/`; triage 001 and 002 only. Nothing in progress covers #6. |

## Decision

**mission**. Several mission criteria apply:

- **New public surface.** The stylesheet and its documented hooks are public surface under constitution VII: the
  identifier-wrap attribute or class, the prose element contract and the compact type scale switch. Tokens #6 needs
  and 002 does not have (a prose line height of 1.65, an 18 px size, a reading measure of about 68ch, probably a
  compact scale) are new token names. Semver MINOR (pre-1.0, so no bump is forced, but the changelog names them).
- **Design decisions.** Attribute or class for identifier wrap and its name; how "compact" is selected (an
  attribute on `<html>`, a scope, or a second set of tokens); whether the new values become tokens in
  `@ocelle/tokens` or styles-local values (II says tokens); how the reset and prose layers avoid leaking into hosts
  that load only part of it; how "mono" headers are honoured under "no monospace" (see Risks).
- **More than one user story.** At least three independently testable ones (below).
- **Accessibility beyond a local fix.** Focus ring, reduced motion, forced colours and `color-scheme` for native
  controls apply to every host page.
- **Spans packages.** New tokens land in `@ocelle/tokens` (and its contrast and brand-rule gates); the styles land
  in `@ocelle/styles`.

Why not the others: not an **op** (public surface, design questions, several stories); not a **fold** (002 is merged
and explicitly left base styles to #6; #20 is an unrelated small op); not **none** (`packages/styles` exports
nothing); not **decision-needed** (the one apparent conflict, "mono" headers against constitution II, is settled by
the constitution, which overrides issue text; the operator confirms that reading when approving this record).

## Scope

In scope (#6), suggested user stories in priority order:

1. **Base layer (MVP).** `@ocelle/styles` exports one external stylesheet (for example `@ocelle/styles/base.css`)
   that a host loads after the tokens stylesheet: reset, root `color-scheme: var(--ocelle-color-scheme)` (the 002
   hand-off), body type from the regular scale, the token focus ring on `:focus-visible`, reduced motion, nothing
   that defeats forced colours (with a visible focus indicator there). Verified in a real browser under exactly the
   constitution IV CSP, in both themes.
2. **Compact type scale** (spec-kitty-design#531): a documented way to select it, with new tokens if the scale
   needs values the 002 scale lacks.
3. **Prose** (spec-kitty-design#519): classless, scoped to a documented container so it does not restyle the host
   page; line height 1.65, `h1` 30 px (`font-size-2xl` exists), `h2` 18 px (no 18 px token exists: new token), a
   reading measure token of about 68ch, tables with 12 px headers in tabular-figure Schibsted Grotesk inside a
   scroll box that is keyboard reachable. Text pairs on the prose grounds checked by the contrast gate.
4. **Identifier wrap** (spec-kitty-design#535): one documented attribute or class with `overflow-wrap: anywhere`
   semantics, usable on rows, headers, fact values and code, with tabular figures. This mission defines the hook
   and its documentation for elements to follow.

Plus: package README with the host contract (load order, CSP, `font-src` note from 002), CHANGELOG entry, the
skeleton test replaced.

Out of scope:

- **Element parts or properties for identifier wrapping** go to the element issues (#7 to #9, #12 to #17).
- **Visual regression and axe** over base-style stories go to #10.
- **Utility classes for components** (excluded by #6 itself).
- **Theme selectors** stay in `@ocelle/tokens` (002); #6 does not repeat them.
- **#20** stays its own op.

## Risks and open questions

- **Issue text partly unread.** Comments on #6 and the bodies of spec-kitty-design#519, #531 and #535 were not read.
  #531 may define the compact scale values; #519 and #535 may add acceptance items. The spec session must read them
  (or the operator supplies them) before the spec check.
- **"Mono" headers versus constitution II.** "No monospace anywhere", and the `prefix` gate rejects `monospace`. The
  reading proposed here: the 12 px table headers use Schibsted Grotesk with `--ocelle-figures` (tabular figures),
  matching how II treats ids and code. If the operator wants an actual monospace face, that is a constitution
  amendment and this becomes `decision-needed`.
- **Pixel values against the token scale.** 18 px and line height 1.65 are not in 002's scale, and 68ch is not a
  `measure-*` value (`measure-sheet` and `measure-sentence` are 48rem). Adding tokens reopens `@ocelle/tokens`
  (source, JSON export, brand-rule and contrast gates, the `--sk-*` mapping table). The spec should say whether the
  prototype's 18 px is a new token or snaps to `font-size-fact` (17 px) or `font-size-lg` (20 px); that is a
  question for the operator at the spec check.
- **Classless prose leaking.** Element selectors at page level would restyle the host's own headings and tables.
  The spec needs an explicit scope (a container or an `@layer`) and a test that unscoped markup is unaffected.
- **Attribute or class.** Constitution I uses attributes for element data; a class is easier for Markdown
  renderers. Either is public surface and hard to rename after 1.0.0.
- **Forced colours.** Focus rings drawn with `box-shadow` vanish in forced colours (002 FR-018 note); the base focus
  ring should use `outline`. Tests need forced-colours emulation, or they pass vacuously.
- **#20 overlap.** Both edit `packages/tokens/src/source.ts`; order them.
- **Branch.** This record is committed on `claude/006-base-styles` (clean, tracking origin), not pushed.

## What would change this decision

- The operator wants real monospace headers: `decision-needed` (constitution amendment) before any mission.
- spec-kitty-design#531 shows the compact scale is large or needs its own design: split it into a later mission and
  keep this one to base layer, prose and identifier wrap.
- The operator decides all values snap to existing tokens and the hooks are not yet public: still a mission (base
  styles are public surface and span several stories), but `@ocelle/tokens` would not change.
- The operator moves the element exposure of identifier wrap into this mission: it would then be blocked by the
  first element issue that ships the custom-elements manifest (#7 or #10).
