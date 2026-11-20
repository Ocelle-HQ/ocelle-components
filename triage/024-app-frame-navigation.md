---
triage: 024
issues: [12]
decision: mission
target: "app-frame-navigation"
in_scope: [12]
out_of_scope: [1, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 55, 56, 57, 58, 60, 61, 62, 63]
semver: minor
spec_prompt: "Build the six public app frame and navigation elements from #12 (triage/024-app-frame-navigation.md) in @ocelle/elements: ocelle-app-shell with rail, context sidebar and content plus a sidebar-only project layout, a collapsed icon-column tier, consumer-set container thresholds following the #15 convention, the no-team personal drawer on ocelle-drawer, and opt-outs for block-end and inline-end content padding; ocelle-top-bar with brand mark, product name, actions and menu control; ocelle-nav-item with icon, label, aria-current and an accessible compact hover/focus label bubble; ocelle-nav-pill for Desktop V2; ocelle-breadcrumbs aligned with the page title; and ocelle-skip-link that moves focus by element reference or selector across supported shadow boundaries. Preserve the landed component contracts, cover keyboard behavior at each tier transition and reflow at 320 px, and meet #7's per-element checklist. Use the upstream issues as consumer requirements and implement original Ocelle elements."
status: proposed
---

# Triage 024: App frame and navigation (#12)

## Issues read

- [#12](https://github.com/Ocelle-HQ/ocelle-components/issues/12) is open under epic #1, with no comments, labels, milestone or sub-issues. Its six elements support Kitty Desktop and Kitty Dashboard first and the Ocelle console later. No PR for the shell turned up in GitHub search or the branch inventory.
- [#1](https://github.com/Ocelle-HQ/ocelle-components/issues/1) assigns the frame and navigation gaps to #12. [#11](https://github.com/Ocelle-HQ/ocelle-components/issues/11) lists #12 and the other element issues as release dependencies. The landed dependencies below are enough to start #12. #7, #13 and #14 are still open, and selection/input PR #54 is open, so the checked main does not establish that #12 is the only remaining release work.
- [#7](https://github.com/Ocelle-HQ/ocelle-components/issues/7) supplies the inherited checklist: stories and baselines per variant and state in light and dark, tests for event payloads and keyboard and screen-reader behavior, axe, complete manifest entries, and strict CSP on the build.
- The upstream consumer issues describe the [personal drawer](https://github.com/spec-kitty/spec-kitty-design/issues/450), [Desktop V2 primitive list](https://github.com/spec-kitty/spec-kitty-design/issues/470), [top bar](https://github.com/spec-kitty/spec-kitty-design/issues/494), [shell layouts and thresholds](https://github.com/spec-kitty/spec-kitty-design/issues/499), [navigation item](https://github.com/spec-kitty/spec-kitty-design/issues/500), [skip link](https://github.com/spec-kitty/spec-kitty-design/issues/502), [flush content edges](https://github.com/spec-kitty/spec-kitty-design/issues/512) and [breadcrumb alignment](https://github.com/spec-kitty/spec-kitty-design/issues/518).

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #1, #11 | Epic and release | #12 blocks the release | Release mechanics and the consumer migration stay with their own work. |
| #5, #6, #10 | Landed foundations | Dependencies satisfied | The shell dimensions and chrome colors come from tokens. Base styles, Storybook, visual baseline and axe tooling already exist. |
| #17 / mission 005 / PR #26 | Landed icons and brand | Dependency satisfied | Reuse the Ocelle rosette, menu and navigation icons, and the existing decorative icon convention. |
| #8 / mission 011 / PR #44 | Landed layout and headers | Dependency satisfied | Compose context sidebar, personal rail and page header. The rail orientation is consumer-controlled. Mission 011 explicitly leaves the icon-column contract and drawer integration to #12. |
| #16 / mission 008 / PR #47 | Landed overlays | Dependency satisfied | Reuse drawer focus and dismissal and tooltip behavior. The drawer supports chrome and a visually hidden heading. The nav item's label bubble can repeat its accessible name without supplying its description. |
| #7 / mission 012 / PR #50 | Button and action row landed | Dependency satisfied for #12 | Reuse the button's chrome and compact flush interfaces and the established naming and current-state behavior. Keep the rest of #7 in its own status-elements workstream. |
| #15 / mission 009 / PR #46 | Landed workflow layouts | Interface to coordinate | Adopt its own-border-box, exclusive-bound, consumer-set threshold convention. Check how consumers pass the narrow tier to list/detail and keep the Pipeline inspector flush. |
| #9, #13, #14 / PR #54 | Sibling element work | Out of scope | Slotted content can use forms, display and selection elements. No #12 behavior depends on the new selection/input exports. |
| #56, #57, #61 | Overlay and icon follow-ups | Coordinate, out of scope | #56 tracks generic tooltip composition, #57 the known closed-details focus-trap and bare SVG name defects, and #61 a flaky entry-motion test. Verify the actual drawer and icon-bubble behavior used by #12. Escalate if #57 blocks an acceptance scenario. |
| #55, #58, #62, #63 | Shared gate and test follow-ups | Out of scope | Apply current mutation, manifest, test-driver and visual-baseline rules to the new elements. Keep broad tooling repairs in their issues. |
| #60 / op 023 | Release hygiene | Out of scope | This release work occupies triage number 023. The accessibility op for #57 occupies 022. |
| Existing specs, triage records and ops | Repository records | No fold target | Earlier work assigns #12 the frame and sets its dependencies. None implements the six elements. |

## Decision

**Mission.** Six public custom elements add a MINOR surface. Responsive composition, drawer interaction, and keyboard and focus behavior cross multiple user stories and require decisions and independent accessibility and plan review. App frame and navigation form a coherent consumer deliverable, with independently testable stories inside one mission.

## Scope

- Frame and top bar: rail, context sidebar and content in mission layout, sidebar and content in project layout, collapsed icon column, consumer-configurable container thresholds, personal drawer for no-team context, and independent flush content edges. The top bar supplies the branded chrome, named product, actions and menu control.
- Navigation: expanded and compact vertical nav items with an accessible name and current state, the Desktop V2 nav-pill primitive, breadcrumbs aligned with the title, and a visible-on-focus skip link with documented element and selector targeting.
- Use the existing tokens and element APIs wherever they meet these needs. Include a narrowly scoped additive hook only if needed to establish the #12 contract. Use original Ocelle code and assets and keep product routes, data and screen migration in the consumers.
- Cover both themes and forced colors, the actual accessibility tree, keyboard behavior at every tier transition, no horizontal overflow at 320 px, and drawer/menu focus restoration. Apply all inherited manifest, strict-CSP, visual, accessibility and red-first gates.

## Risks and open questions

- Specify threshold precedence, behavior at equality, default values, and settlement when the drawer is open or focus moves with the responsive tier. Use mission 009's border-box convention, including an independently sized container in tests.
- Specify supported skip-link selector scope, focusable and missing targets, and the cross-root element-reference case. Cover the behavior through real focus changes and avoid cross-root ARIA ID references.
- Ground nav-pill semantics in actual Desktop V2 use and the Ocelle rule that pill radius belongs to state pills. Distinguish current links from actions and from tabs or toggle groups before committing to public attributes.
- Work out how slotted navigation stays usable across tiers, with a single active set of landmarks and controls. Include the compact bubble's hover, focus and Escape behavior and check nested Escape interaction with the drawer.
- A later upstream change may clarify consumer needs. Record evidence with its source and keep the approved Ocelle styling and engine floor in force.

## What would change this decision

A live branch or accepted spec already covering #12 would warrant a fold. Verified consumer evidence that an element can ship independently and adds a separate product decision would warrant splitting that element into its own triage. A demonstrated dependency on an unlanded overlay fix would block the affected story until that fix is available.
