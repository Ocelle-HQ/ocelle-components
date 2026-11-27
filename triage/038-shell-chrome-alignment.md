---
triage: 038
issues: [109]
decision: mission
target: "038-shell-chrome-alignment"
in_scope: [109]
out_of_scope: [1, 5, 7, 8, 12, 17, 86, 87, 91, 92]
semver: minor
spec_prompt: "Specify #109 and triage/038-shell-chrome-alignment.md as one MINOR mission in @ocelle/elements. Remove the default lower top-bar divider while preserving app-owned pane separators. Give vertical personal rails an opt-in divider immediately above the bottom group while preserving the default and horizontal layouts and empty-group handling. Provide an optional brand accessory through the app shell and top bar beside the product name. Preserve existing names, menu and host actions, keyboard focus and 320 px reflow. Cover both themes, forced colours, strict CSP, manifest and package documentation, and Storybook with pinned visual evidence. Treat closed PRs #83–#85 as requirements evidence."
status: proposed
---

# Triage 038 — Align shell chrome, rail divider placement, and brand accessory

## Issues read

- #109 is open, with no comments, labels, milestone, parent or sub-issues. Its timeline links the three superseded drafts. [Issue #109](https://github.com/Ocelle-HQ/ocelle-components/issues/109)
- Drafts #83, #84 and #85 are closed and unmerged. Their diffs cover the top bar border, vertical rail divider placement, and accessory projection through the shell. [#83](https://github.com/Ocelle-HQ/ocelle-components/pull/83) · [#84](https://github.com/Ocelle-HQ/ocelle-components/pull/84) · [#85](https://github.com/Ocelle-HQ/ocelle-components/pull/85)
- The inspected `main` at `d45efd5` still draws the default border, keeps the rail divider after the primary group, and has no brand accessory slot in the shell or top bar. Issue and PR searches found no duplicate delivery.

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #109 | Issue | In scope | Defines the console shell outcome and acceptance criteria. |
| #83–#85 | Closed drafts | Requirements evidence | Preserve the requested behavior and prove it again through the governed mission. |
| #8 and #44 | Delivered personal rail | Dependency satisfied | Supplies the existing vertical and horizontal layouts, named landmark, and empty-group behavior. |
| #12 | Delivered app frame | Dependency satisfied | Supplies top-bar and shell contracts for branding, host actions, menu access, keyboard focus, and reflow at 320 px. |
| #5, #7, #17 and #87 | Library foundations and verification precedents | Out of scope | Reuse the existing chrome, brand and verification contracts. |
| #86 and PR #108 | Anchored popover mission | Out of scope | Popover placement and interaction remain independent. Coordinate shared Storybook and manifest inventories if both missions change them. |
| #91 | Chrome glyphs and initials | Out of scope | This mission places the rail divider. Glyphs, initials treatment and its account behavior remain in #91. |
| #1 and #92 | Broader epics | Out of scope | The console shell fixes form an independently verifiable library change. |

## Decision

**One MINOR mission.** The opt-in rail setting and brand accessory slots add public
surface. The three changes deliver a coherent chrome frame the console can use
without wrapping each component. Independent browser and accessibility review
covers the shared shell. No current mission owns these three changes together.

## Scope

- Remove the default top-bar divider while preserving the documented chrome part,
  product name, menu and supplied actions. Keep pane separators owned by app layout.
- Expose an optional vertical rail setting that places the divider above the bottom
  group. Preserve the default vertical and horizontal placement, and show a divider
  only when both groups are populated.
- Expose an optional brand accessory beside the product name, both directly in the
  top bar and through the app shell. Preserve accessible names, focus order, menu and
  actions with a long product name and at narrow widths.
- Use test-first behavior assertions, current design tokens, light and dark stories,
  forced-colour and strict-CSP checks, and pinned baseline evidence. Update the
  applicable public manifest, package documentation and changelog.

## Risks and open questions

- At 320 px, an accessory can compete with the product name, actions and menu.
  Specify reflow with both empty and populated slots, including long product names.
- Moving the rail divider must preserve empty-group behavior, vertical spacing,
  and separation in forced colours. Verify each in the relevant layout.
- Manifest Plant overlays and Storybook inventories can change concurrently.
  Preflight the affected fixtures and preserve their intended findings.
- API naming and narrow accessory layout belong in spec review. The issue does
  not require a product decision before triage approval.

## What would change this decision

Reopen scope if the mission would change an existing documented attribute, slot,
part, event or navigation contract, or if a consumer requirement expands into
host-owned layout or popover behavior.
