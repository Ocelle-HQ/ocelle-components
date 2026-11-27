# Feature Specification: Shell Chrome Alignment

**Feature Branch**: `038-shell-chrome-alignment`

**Created**: 2026-11-27

**Status**: Draft

**Input**: [Issue #109](https://github.com/Ocelle-HQ/ocelle-components/issues/109) and the [approved triage](../../triage/038-shell-chrome-alignment.md).

## User Scenarios & Testing

### User Story 1 — Present one continuous chrome frame (P1)

As a console integrator, I want the default top bar to join the rest of the shell chrome
so app-owned pane separators can mark the boundaries that matter.

**Why this priority**: The default top-bar border draws a line where the console needs a continuous frame.

**Independent Test**: Render a top bar with its normal branding, menu, and actions. Inspect the lower chrome edge
and the app-provided pane separation in a shell in both themes and forced colours.

1. **Given** a default top bar, **when** it renders, **then** it contributes no lower divider and its controls
   remain legible and operable.
2. **Given** an app-defined pane separator in a shell, **when** the top bar displays without its divider,
   **then** the app-defined separator still marks its original pane boundary.

### User Story 2 — Place the rail divider beside Settings (P2)

As a console integrator, I want a vertical rail option that groups the separator with bottom destinations so
a Settings group has a visual boundary immediately above it.

**Why this priority**: The default divider position leaves the separation with the primary destinations in a tall rail.

**Independent Test**: Render the same populated rail in default, opted-in vertical, and horizontal layouts,
and repeat with an empty group.

1. **Given** an opted-in vertical rail with both groups, **when** the layout has spare height, **then** the divider
   sits above the bottom group and the gap separates that divider from the primary destinations.
2. **Given** the default vertical rail or a horizontal rail, **when** both groups are present, **then** divider
   placement follows the existing layout.
3. **Given** either group is empty, **when** the rail lays out, **then** it shows no separator for the absent group.

### User Story 3 — Place a badge beside the product name (P3)

As a console integrator, I want to supply an optional brand accessory in a standalone top bar or through the
app shell so users can see a short status such as “Prototype” alongside the product name.

**Why this priority**: The console needs one shared location for the badge across available shell widths.

**Independent Test**: Provide a short fictional badge both directly and through the shell. Compare each result
with the corresponding empty accessory at 320 px and a wide viewport, using a long product name and
host-supplied actions.

1. **Given** a supplied badge, **when** the top bar renders directly or through the shell, **then** the badge
   appears beside the product name and is exposed once.
2. **Given** no accessory, **when** the top bar renders, **then** existing branding and controls retain their
   layout and semantics.
3. **Given** a 320 px shell with a long product name, a short badge, and existing controls, **when** the user
   navigates with the keyboard, **then** the product name stays available to assistive technology and the menu
   and host actions retain their order, names, focus visibility, and activation.

### Edge Cases

- Changing available height or switching between vertical and horizontal layout changes divider placement
  according to the active layout and opt-in state.
- An empty primary or bottom group leaves the remaining destinations usable and does not render a divider.
- The product name may visually truncate at a constrained width. It remains complete in the accessible tree.
- The supported accessory reference case is a short, host-owned status label. The host owns the content
  and semantics of anything it supplies there.

## Requirements

### Functional Requirements

- **FR-001**. Remove the bottom divider contributed by the default top bar in light, dark, and forced-colour modes.
- **FR-002**. Preserve app-owned pane separators, existing branding, menu behaviour, host actions, and focus indicators.
- **FR-003**. Provide an opt-in on the vertical personal rail that places its divider immediately above the bottom group.
- **FR-004**. Preserve default vertical and horizontal divider placement, empty-group behaviour, and navigation semantics.
- **FR-005**. Support one optional brand accessory alongside the product name in both the top bar and the app shell.
- **FR-006**. Preserve accessible branding, menu and action names, keyboard order, visible focus, and operation
  with and without the accessory, including at a 320 px viewport with a long product name and a short badge.
- **FR-007**. Reuse Ocelle design tokens and document the changed public surfaces in the manifest and package docs.
  Include representative light, dark, and forced-colour verification. Keep the built shell usable under strict CSP.

## Success Criteria

### Measurable Outcomes

- **SC-001**. The default top-bar lower edge has zero divider pixels from the top bar in the two supported themes and
  forced colours. An explicitly supplied pane separator is still visible in its intended location.
- **SC-002**. The rail layout matrix covers opted-in vertical, default vertical, horizontal, empty primary,
  and empty bottom. Every case renders the expected divider placement or absence.
- **SC-003**. Direct and shell-projected badge examples each expose one badge. At 320 px, the short badge
  and existing menu and action controls fit the viewport, and keyboard users can reach and activate the controls
  in their existing relative order while the complete product name remains accessible.
- **SC-004**. The changed surfaces have test-first browser evidence, updated package records, and Storybook
  evidence across affected themes.

## Assumptions

- The existing shell and personal rail are the integration points. The three closed drafts describe the intended
  result. [Earlier proposals](https://github.com/Ocelle-HQ/ocelle-components/issues/109)
- Anchored popovers, account glyphs, and consumer-owned pane styling are separate work.
