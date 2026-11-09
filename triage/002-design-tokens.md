---
triage: 002
issues: [5, 3]
decision: mission
target: "design-tokens"
in_scope: [5]
out_of_scope: [1, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
semver: minor
spec_prompt: "Build the @ocelle/tokens package from issue #5 (triage/002-design-tokens.md): every --ocelle-* token for light and dark themes (system preference, light by default, data-theme on <html> overrides) including the dark chrome, link, rule, radius and target-size tokens, the vendored Schibsted Grotesk font with its OFL licence and THIRD_PARTY_NOTICES entry, the brand rules of constitution II enforced as checks, and the automated text and non-text contrast check as a CI gate with a planted defect under gates/plants/ (the gate deferred to #5 in gates/README.md); base styles stay with #6, Storybook and axe with #10."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-03T21:43:09Z
---

# Triage 002: Design tokens (#5); Spec Kit setup (#3) already done on main

## Issues read

**Limitation, read first.** GitHub could not be read from this session. `gh issue view` and `gh search` fail
because GraphQL is blocked (HTTP 403), and `gh api` (REST) was denied by the session's permissions. So the bodies,
comments, labels and timelines of #3 and #5 were **not** read for this record. The descriptions below come from
what the repository records about them: triage 001 (approved by the operator, which read the issues on 2 Nov 2026),
the 001 spec, `gates/README.md`, `THIRD_PARTY_NOTICES`, the constitution and git history. `main` was read with
`git fetch origin main` (`origin/main` = `eaf1689`). Before approving, the operator should compare the two issue
bodies with the claims below (see Risks).

- **#5** "Design tokens package" (open, per triage 001). Recorded content: the `@ocelle/tokens` package with every
  `--ocelle-*` token; new public surface; its "Done when" includes the contrast check (triage 001, Scope); the
  Schibsted Grotesk font and its OFL licence are vendored there (triage 001; `THIRD_PARTY_NOTICES`; 001 spec lines
  185 and 509). Blocked by #4 (triage 001), which is now merged.
- **#3** "Spec Kit setup and constitution" (open, per triage 001, which marked it "appears done" and left closing it
  to the operator).

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #5 | issue (open) | in scope | Design tokens. This mission. |
| #3 | issue (open) | out of scope: **none, already done on main** | See "Finding on #3" below. Recommend closing it as completed, once its body has been checked against the evidence. |
| #4 | issue | out of scope (done), was blocking | Repository foundation. Merged to `main` as `eaf1689` "Mission 001: repository foundation (#4) (#18)". It gives this mission the workspace, the empty `packages/tokens` skeleton (`src/index.ts` is `export {};`), the test runner, mutation testing, Stylelint token-only and the gate-plant pattern. #4's state on GitHub (closed or not) was not checked. |
| PR #18 | pull request | out of scope (merged) | Mission 001. `refs/pull/18/head` = `da7d040`, the local branch head; its tree is identical to `origin/main`. |
| #1 | epic (open) | out of scope | Parent epic; #5 is one of its sub-issues (per triage 001). |
| #6 | issue (open) | out of scope, **blocked by #5** | Base styles; "Depends on: design tokens" (triage 001). The theme stylesheet that consumers load may belong here or in #5; see Risks. |
| #7, #8, #9, #12, #13, #14, #15, #16, #17 | issues (open) | out of scope, **blocked by #5** | Element and icon issues. Constitution II requires all element styling to come from `--ocelle-*` tokens, so no element can pass Stylelint without them. |
| #10 | issue (open) | out of scope | Storybook, visual regression and axe (`gates/README.md`). A token reference story would sit there; the contrast gate does not (it is listed as delivered by #5). |
| #11 | issue (open) | out of scope, blocked by #5 | Release v1.0.0 needs the tokens and the `THIRD_PARTY_NOTICES` font entry. |
| `gates/README.md` "Deferred gates" | repository | in scope | "Contrast check — #5". This mission ends the deferral and removes the row. |
| `specs/001-repository-foundation/plan.md` Complexity Tracking | repository | in scope (sunset) | "Contrast gate absent — Sunset when #5 merges." |
| `THIRD_PARTY_NOTICES` | repository | in scope | "Its entry, with its licence text beside the font files, is added here by #5, when the font is vendored in @ocelle/tokens." |
| `.specify/memory/constitution.md` v1.3.1, II, III, IV, VII | constitution | constrains | II: the brand rules are "checked, not just documented" (theme selection, dark chrome, no monospace and tabular figures, ochre never on bone, `--ocelle-color-link`, decorative `--ocelle-color-rule`, one radius, pill radius, ochre fill never the only mark of state in light mode). III: automated text and non-text contrast check; `--ocelle-target-min`. IV: font vendored, no CDN. VII: token names are public surface. |
| `knowledge/speckit-flows/experiments/2026-11-02-spec-kit-baseline.md` | experiment | note | Names #4 and #5 together as the baseline feature; triage 001 split them, so #5 is the second run of that experiment. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | Token checks are easy to pass vacuously (for example a contrast check over an empty token set). Each needs a plant. |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | Only `specs/001-repository-foundation` (merged and finished) and `triage/001`; no `ops/`. Nothing in progress covers #5. |
| Pull requests other than #18 | - | unknown | Could not be listed (GitHub unreachable). `git ls-remote origin` shows only `refs/pull/18/head`, so no other PR exists. |

## Finding on #3: done on main, can be closed

Evidence, all checked on `origin/main` (`eaf1689`):

1. **Spec Kit initialised.** Commit `d08d413` "chore: initialise Spec Kit 1.2.5 and ratify constitution v1.0.0"
   (2 Nov 2026) is an ancestor of `origin/main` (`git merge-base --is-ancestor d08d413 origin/main`). It added
   `.specify/` (init options: `speckit_version 1.2.5`, integration `claude`, script `sh`), the `.specify/scripts`,
   templates and the `.claude/skills/speckit-*` commands.
2. **Constitution ratified and maintained.** `.specify/memory/constitution.md` exists on `main` with seven principles,
   at "Version: 1.3.1 | Ratified: 2026-11-02 | Last Amended: 2026-11-02". It was amended four times since
   (`9f951c7`, `4e5f408`, `65cb17f`, `bdb9b70`).
3. **Used in practice.** A full Spec Kit cycle ran on it: triage 001, `specs/001-repository-foundation/` (spec, plan,
   tasks, reviews, verification) and its run summary, merged as `eaf1689` (#18). The repository also has
   extensions beyond a plain setup: the story loop, the squads, triage and the agent profiles in `.claude/agents/`.

Conclusion: the work #3 is known to describe (Spec Kit set up, constitution ratified) is on `main`, so #3 needs no
mission, op or fold (**none: already done**, commit `d08d413`). Recommend the operator closes it as *completed* and
cites `d08d413`. **Caveat:** this is checked against #3's recorded title, not its body. If the body has extra
acceptance items (for example a specific ADR link, labels, an issue template or a CI check for the constitution),
check each against `main` before closing. Any item still missing would be an `op` (docs or tooling, no public
surface), not a reason to keep #3 open as is.

## Decision

**mission** for #5. Several mission criteria apply:

- **New public surface.** Every `--ocelle-*` token name is public surface under constitution VII; adding them is
  semver MINOR (pre-1.0, internal until 1.0.0 per #2).
- **Design decisions.** The token set and naming, the palette values for both themes, how the theme is selected
  (system preference, light by default, `data-theme` on `<html>`) and in which package, the font formats and
  subsets, and how each brand rule becomes a check.
- **Accessibility beyond a local fix.** It brings in the contrast gate of constitution III and the target-size and
  focus-ring tokens that every element relies on.
- **More than one user story.** At least three: token values and themes as a consumable package; the vendored font
  with its licence; the brand-rule and contrast checks as CI gates with plants.

Why not the others: not an **op** (public surface and open design questions); not a **fold** (nothing in progress;
mission 001 is merged and explicitly deferred tokens to #5); not **none** for #5 (`packages/tokens/src/index.ts` is
still `export {};`); not **decision-needed** (#4 has landed and the package name is decided in #2; the open questions
below can be settled in the spec check and plan gates).

#3 is reported in this record rather than in a separate one because the operator asked about it together with #5.
Its own decision is **none** (already done); it does not join the mission.

## Scope

In scope (#5), suggested user stories in priority order:

1. **Tokens and themes.** `@ocelle/tokens` publishes the `--ocelle-*` custom properties (colour, including the dark
   chrome, link and rule tokens; typography; spacing; the single radius, row radius and pill radius; shadow;
   duration and motion; focus ring; `--ocelle-target-min`) for light and dark, following the system setting, light
   with no preference, overridden by `data-theme` on `<html>`. Output is CSP-safe (an external stylesheet, no inline
   style) and checked by the existing CSP and prefix gates.
2. **Font.** Schibsted Grotesk vendored in the package with tabular figures available, the OFL licence text beside
   the files, the `THIRD_PARTY_NOTICES` entry, and no remote load.
3. **Brand rules and contrast as gates.** An automated text and non-text contrast check over the token pairs in both
   themes, and checks for the brand rules that can be checked at token level (ochre never on bone, one radius, rule
   colour not used as a control boundary where checkable, no monospace family). Each gate has a plant under
   `gates/plants/` and a CI job proving it fails. Then the "Contrast check" row leaves `gates/README.md` and the
   Complexity Tracking item of 001 is closed.

Out of scope:

- **Base styles (reset, typography classes, layout primitives)** go to #6.
- **Token stories, visual regression and axe** go to #10.
- **Brand rules that only hold in rendered elements** (for example the top bar using chrome tokens, digests in
  groups of four, the ochre fill never the only mark of state) are enforced by the element missions and #10; this
  mission provides the tokens they need.
- **#3** is done (see Finding).

## Risks and open questions

- **Issues not read.** This record rests on the repository's account of #5 and #3, not on their current text. If
  #5's body or comments name a token list, a source of values (for example a design file or the Spec Kitty library
  values to be renamed), or acceptance items not listed here, the spec prompt must gain them. If #3's body has items
  beyond setup and constitution, see the caveat in the Finding. The operator should check both before approving, or
  rerun triage in a session where GitHub can be read.
- **Source of token values.** Constitution I forbids any `sk-` name in source or output. If the values derive from
  the Spec Kitty library, the spec must show renaming and no copied code (constitution VI, "our own code").
- **Theme selection location.** The `data-theme` and `prefers-color-scheme` selectors could live in the tokens
  stylesheet (#5) or in base styles (#6). This needs a decision in the spec check; it affects #6's scope.
- **Token-only Stylelint after tokens exist.** The 001 rule was proven before any token existed; the plan should
  decide whether it now also rejects unknown `--ocelle-*` names (a typo that falls back silently).
- **Contrast check scope.** Which pairs count (text on every ground, focus ring and non-text against adjacent colours)
  must be explicit, or the gate passes vacuously.
- **Font licence and size.** The OFL requires the licence to ship with the font files; the number of weights and
  formats affects package size and the CSP check (font files are loaded with `font-src`, which `default-src 'none'`
  forbids unless the host allows it; the spec should say what hosts must allow).
- **Branch for this record.** The working branch `claude/kitty-ui-speckit-decouple-x3prkx` is PR #18's head, which
  is already merged (its tree equals `origin/main`). This record is committed there, not pushed; the operator may
  want it moved to a fresh branch from `main`.

## What would change this decision

- #5's body asks only for renaming or importing an existing, approved token set with no design question left: still
  a mission (public surface), but a smaller one.
- The operator moves the contrast gate to #10 alongside axe: story 3 shrinks to the brand-rule checks.
- The operator puts the theme selectors and font-face rules in #6: #5 becomes token values and checks only, and #6
  becomes blocked by #5's output format.
- #5 is split by the operator (for example font as an op first): the font alone would qualify as an op (an asset and
  a licence entry, no token names).
- #3's body lists acceptance items that are not on `main`: #3 becomes an op for those items instead of being closed.
