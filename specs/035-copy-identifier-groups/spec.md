# Feature Specification: Grouped copyable identifiers

**Feature Branch**: `035-copy-identifier-groups`
**Created**: 2026-11-26
**Status**: Draft
**Input**: [Issue #89](https://github.com/Ocelle-HQ/ocelle-components/issues/89) · [Triage](../../triage/035-copy-identifier-groups.md)

A user of Workflow Studio in the Ocelle web console can scan a long identifier by its groups and copy the exact value through the existing copy field.

## User Scenarios & Testing

### User Story 1 - Read and copy a grouped value (Priority: P1)

A person can scan a fictional record ID or digest in groups of four, then copy exactly the value the host supplied.

**Independent Test**: In Chromium, mount a grouped mixed-case identifier with a prefix and a short final group alongside a plain field. Leave compact presentation off. Measure the visual grouping and the line wraps, read the accessible value in tree order, and activate Copy by pointer, Enter and Space. Observe the exact request and the live region before dispatch and after the host sets its outcome.

1. **Given** the opted-in value `ni:sha-256:aB😀cDeF123`, **when** it renders, **then** `ni:sha-256:` is one prefix and the body shows `aB😀c`, `DeF1` and `23` in order. The groups use tabular figures in the library's proportional typeface.
2. **Given** the grouped fixture at 320 px or separately at 200% text, **when** the identifier needs a new line, **then** the body wraps between groups without horizontal overflow, and Copy has a visible focus indicator.
3. **Given** a plain field with an ungrouped identifier or command, **when** grouping is omitted, **then** whitespace, wrapping, control name and Copy behavior match the existing field.
4. **Given** raw grouped text with outer whitespace, mixed case and a prefix and a previous host outcome, **when** the user clicks Copy or activates it with Enter or Space, **then** the field clears the polite region before dispatch. Each activation sends one deferred bubbling, composed `ocelle-copy-field-request` with `detail` equal to `{ text: valueAtActivation }` if the field is connected at dispatch. A value replacement before dispatch does not change the captured text. For an isolated activation the region is empty before the listener runs, and the new host outcome is announced once.
5. **Given** a field in a right-to-left layout, **when** the opted-in identifier renders, **then** its prefix, groups and any ellipsis retain left-to-right reading and physical order. The surrounding field layout and the plain rendering keep their existing direction behavior.
6. **Given** a full grouped value with outer whitespace, **when** the user selects and copies its displayed text using the browser, **then** they get the trimmed full identifier in order without visual spacing. The named Copy action sends the full raw value.

### User Story 2 - Reveal a compact preview (Priority: P1)

A person can recognize the ends of a long identifier and reveal all groups with one native control.

**Independent Test**: Mount a compact digest between two focusable controls with a host-supplied Copy name and prior outcome. Verify the first and last groups, the complete accessible value and the reveal state. Activate Copy in both presentations and compare the raw requests. In fresh fixtures reveal with a pointer, Enter and Space, then verify the full display, the active element and the next Tab stops.

1. **Given** a compact grouped value with at least three body groups, **when** the field renders, **then** it shows any prefix, the first and last body groups and one visual ellipsis between them. The accessible value is exposed once in reading order as the full identifier, with every group and no ellipsis. The native Reveal control has a meaningful name and exposes its collapsed state.
2. **Given** focus on Reveal, **when** the user activates it with Enter or Space, **then** all groups are visible in one action, the same control remains focused and exposes its expanded state, and the next Tab reaches Copy. The following Tab leaves the field for the next control. Pointer activation also reveals all groups. A second activation of the same disclosure restores the visible prefix, first group, ellipsis and last group, hides the middle groups and exposes the collapsed state. The control describes the currently available action in each state. The accessible value remains complete and appears once in either state. Copy keeps its identity and default or host-supplied name.
3. **Given** a compact preview and an existing host outcome, **when** the user activates Reveal, **then** it sends no Copy request and leaves the outcome and its live-region text intact. Activating Copy by pointer or keyboard before or after reveal sends exactly the same raw value through the existing Copy protocol.
4. **Given** compact or revealed content, **when** the host replaces the raw value with a different eligible identifier, **then** the preview derives from that new value and opens in its compact state. A replacement with fewer than three body groups appears in full without an ellipsis or Reveal. Setting the same value preserves the reveal state.
5. **Given** focus on the disclosure, **when** the host changes the value, **then** focus stays on that button if it still applies. If the disclosure disappears, focus moves to enabled Copy. If Copy is disabled, focus stays in the field on a retained target and the next Tab reaches the following external control. An update leaves existing external focus in place.
6. **Given** the compact or revealed view, **when** the user selects and copies its displayed text using the browser, **then** the compact view selects the visible prefix and end groups with the ellipsis, and the revealed view selects the full trimmed identifier. The accessible-only full text in compact mode is excluded from native selection. The named Copy action sends the exact raw identifier in either view.
7. **Given** either view, **when** two trusted Copy activations occur before their listeners run, **then** each connected activation keeps its own deferred request and its raw value. If the host restores the same outcome in both listeners, the second same-text write does not repeat the announcement.

## Requirements

- **FR-001**: Extend the existing copy field with opt-in grouping. Retain the original plain presentation by default.
- **FR-002**: For grouped display, trim leading and trailing whitespace and retain plain rendering for values with remaining whitespace. For a supported opaque identifier, retain everything through the last colon as a separate prefix, if present, and group the remaining Unicode code points in fours. Preserve order, case and any shorter final group. Use the existing proportional font, tabular figures, visual spacing and group-boundary wrapping. Keep opted-in identifier content in left-to-right order in either surrounding direction. Native grouped and revealed selection preserves the trimmed full identifier. Compact selection includes only the visible preview with ellipsis. [Library digest convention](../020-disclosure-code-block/spec.md)
- **FR-003**: Offer compact presentation only with grouping and at least three body groups. Keep any prefix and the first and last body groups visible around the ellipsis. Use one distinctly named native disclosure with its current state exposed and a stable focus target in both directions. The accessibility tree exposes one complete identifier in order, then the applicable named disclosure and Copy controls, with host status separate. Reset to compact for each different eligible host value. Keep keyboard focus in context when a targeted host update removes Reveal, with a retained field target if Copy is disabled.
- **FR-004**: Preserve the native Copy action and name, exact activation-time payload, deferred bubbling and composed request while connected, and host clipboard and outcome ownership in every presentation. An isolated Copy clears the live region before dispatch and announces the host outcome once. Each activation within a burst retains its own request and an identical host outcome does not repeat the announcement. Copy is disabled for an empty value. Disclosure actions do not send a Copy request or change the host outcome. [Existing Copy contract](../014-selection-input/spec.md)
- **FR-005**: Keep Copy and Reveal keyboard operable, token-sized and visibly focused in light, dark and forced colours. At 320 px with normal text and separately at a fixed viewport at 200% computed text size, verify group-boundary reflow with no horizontal overflow or clipped focus in grouped, compact and revealed states, where applicable.
- **FR-006**: Document the public options in the custom-elements manifest and package usage. Keep the normal individual and aggregate entry points and add a minor changelog entry. Provide a grouped fictional record ID and compact and revealed views of the same fictional digest in Storybook. Each of the three states has pinned light and dark baselines and focused browser, accessibility and strict-CSP proof.

## Edge Cases

- Empty input shows no groups. A prefix-only identifier shows its prefix without a body. One or two body groups show in full. These states have no ellipsis or Reveal. Empty or missing raw values disable Copy and send no request.
- A prefix wraps within itself only if it cannot fit the available line. A short final body group and mixed case copy exactly. Visual spacing, trimming for grouped display and the ellipsis never alter the event text.
- A host value replacement updates the presentation and clears the status as in the existing field. Any pending Copy request still carries the raw value from its own activation.

## Success Criteria

- **SC-001**: Browser fixtures verify direction and group boundaries with a last-colon prefix, an astral code point and a short final group. Native selection matches the displayed value policy. The named Copy request preserves payload and timing through value replacement, disconnection and back-to-back activation. The default fixture continues to behave as before.
- **SC-002**: One native activation switches presentation in either direction. Each state exposes one complete identifier plus applicable named native controls and the disclosure state. Verify focused node identity, next Tab order and focus on host replacement. Disclosure leaves host outcome intact and emits no Copy request.
- **SC-003**: At 320 px and at separately verified 200% text the relevant presentations wrap at group boundaries with no horizontal overflow and painted, unclipped focus for the applicable controls. All three Storybook states have passing pinned light and dark baselines and accessibility checks. The built strict-CSP proof exercises grouped Copy, compact Copy, Reveal and Copy after reveal with the actual package.
