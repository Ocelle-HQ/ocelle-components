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

**Independent Test**: Render the same populated rail at a fixed height with measurable spare space. Compare
default and opted-in vertical placement, then change it to horizontal while a destination has focus. Repeat
with each group empty.

1. **Given** a vertical rail with both groups and measurable spare height, **when** the host opts in,
   **then** the divider sits one normal rail item gap above the bottom group. The spare height lies between
   the primary group and the divider. Both destination groups keep their positions.
2. **Given** the default vertical rail or a horizontal rail, **when** both groups are present, **then** divider
   placement follows the existing layout.
3. **Given** either group is empty, **when** the rail lays out, **then** it shows no separator for the absent group.
4. **Given** an opted-in vertical rail with focus on a destination that remains present, **when** the host
   switches the rail to horizontal, **then** focus stays on that destination, keyboard order is preserved,
   and the divider follows the existing horizontal layout.

### User Story 3 — Place a badge beside the product name (P3)

As a console integrator, I want to supply an optional brand accessory in a standalone top bar or through the
app shell so users can see a short status such as “Prototype” alongside the product name.

**Why this priority**: The console needs one shared location for the badge across available shell widths.

**Independent Test**: Provide a short fictional badge both directly and through the shell. Compare each result
with the corresponding empty accessory at 320 px and a wide viewport. Use a long product name and one
host-supplied Settings action matching the existing narrow top-bar example.

1. **Given** a supplied badge, **when** the top bar renders directly or through the shell, **then** the badge
   appears beside the product name and is exposed once.
2. **Given** no accessory, **when** the top bar renders, **then** existing branding and controls retain their
   layout and semantics.
3. **Given** the 320 px shell with a long product name, a short badge, the menu, and the representative Settings
   action, **when** the user navigates with the keyboard, **then** the full product name remains available to
   assistive technology. The menu and action keep their accessible names and relative order and remain
   operable, with focus indicators visible in full. The page fits without horizontal scrolling and the
   menu's hit area meets the existing Ocelle minimum on both axes.

### Edge Cases

- Changing available height or switching between vertical and horizontal layout changes divider placement
  according to the active layout and opt-in state.
- An empty primary or bottom group leaves the remaining destinations usable and does not render a divider.
- The product name may visually truncate at a constrained width. It remains complete in the accessible tree.
- The supported narrow fixture pairs a short host-owned status label with one Settings action. The host owns
  the content and semantics of the badge and any actions it supplies.

## Requirements

### Functional Requirements

- **FR-001**. Remove the bottom divider contributed by the default top bar in light, dark, and forced-colour modes.
- **FR-002**. Preserve app-owned pane separators, existing branding, menu behaviour, host actions, and focus indicators.
- **FR-003**. In an opted-in vertical rail with both groups and spare height, place the divider one normal rail
  item gap above the bottom group. Place the spare height before the divider and retain each destination
  group's default position.
- **FR-004**. Preserve default vertical and horizontal divider placement, empty-group behaviour, and navigation
  semantics. A host-driven orientation change preserves focus on a destination that remains present and
  retains keyboard order.
- **FR-005**. Support one optional brand accessory alongside the product name in both the top bar and the app shell.
- **FR-006**. Preserve accessible branding, menu and action names, keyboard order, visible focus, and operation
  with and without the accessory. At 320 px, the top-bar layout with a long product name, short badge and representative
  Settings action fits without horizontal page overflow or clipped focus indicators. The menu meets the existing
  Ocelle minimum hit area on both axes.
- **FR-007**. Reuse Ocelle design tokens and document the changed public surfaces in the manifest and package docs.
  Capture representative light and dark Storybook baselines with the repository's pinned visual setup.
  Verify forced colours and built-shell operation under strict CSP separately.

## Success Criteria

### Measurable Outcomes

- **SC-001**. The default top-bar lower edge has zero divider pixels from the top bar in the two supported themes and
  forced colours. An explicitly supplied pane separator is still visible in its intended location.
- **SC-002**. Compare identical default and opted-in vertical rails at the same fixed height with measurable
  spare space. The opted-in divider is one normal rail item gap above the bottom group and the extra space is
  before the divider. The groups keep the same positions. Switching the rail to horizontal reproduces the
  existing divider placement and leaves focus on the same destination. With either group empty, the divider
  is absent.
- **SC-003**. Direct and shell-projected badge examples each expose one badge. At 320 px, the top-bar layout with a long product
  name, short badge, menu, and representative Settings action fits without horizontal page overflow or clipped
  focus indicators. The menu meets the existing Ocelle minimum hit area on both axes. The full product name remains
  accessible, and the menu and action keep their names, relative keyboard order, and activation.
- **SC-004**. The changed surfaces have test-first browser evidence, updated package records, and representative
  light and dark Storybook baselines from the pinned visual setup. Separate checks verify forced colours and
  built-shell operation under strict CSP.

## Assumptions

- The existing shell and personal rail are the integration points. The three closed drafts describe the intended
  result. [Earlier proposals](https://github.com/Ocelle-HQ/ocelle-components/issues/109)
- Anchored popovers, account glyphs, and consumer-owned pane styling are separate work.
