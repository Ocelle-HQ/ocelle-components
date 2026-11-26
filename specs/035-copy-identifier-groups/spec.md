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
4. **Given** a grouped raw value with case and prefix and a previous host outcome, **when** the user clicks Copy or activates it with Enter or Space, **then** the field's polite region becomes empty before dispatch. Each activation sends exactly one bubbling, composed `ocelle-copy-field-request` with `detail` equal to `{ text: valueAtActivation }`. A value replacement before dispatch does not change that captured text. The host sets the new outcome and the region announces it once.

### User Story 2 - Reveal a compact preview (Priority: P1)

A person can recognize the ends of a long identifier and reveal all groups with one native control.

**Independent Test**: Mount a compact digest between two focusable controls with a host-supplied Copy name and prior outcome. Verify the first and last groups, the complete accessible value and the reveal state. Activate Copy in both presentations and compare the raw requests. In fresh fixtures reveal with a pointer, Enter and Space, then verify the full display, the active element and the next Tab stops.

1. **Given** a compact grouped value with at least three body groups, **when** the field renders, **then** it shows any prefix, the first and last body groups and one visual ellipsis between them. The accessible value is exposed once in reading order as the full identifier, with every group and no ellipsis. The native Reveal control has a meaningful name and exposes its collapsed state.
2. **Given** focus on Reveal, **when** the user activates it with Enter or Space, **then** all groups are visible in one action, the same control remains focused and exposes its expanded state, and the next Tab reaches Copy. The following Tab leaves the field for the next control. Pointer activation also reveals all groups. The accessible value remains complete and appears once. Copy keeps its default or host-supplied name.
3. **Given** a compact preview and an existing host outcome, **when** the user activates Reveal, **then** it sends no Copy request and leaves the outcome and its live-region text intact. Activating Copy by pointer or keyboard before or after reveal sends exactly the same raw value through the existing Copy protocol.
4. **Given** compact or revealed content, **when** the host replaces the raw value with a different eligible identifier, **then** the preview derives from that new value and opens in its compact state. A replacement with fewer than three body groups appears in full without an ellipsis or Reveal. Setting the same value preserves the reveal state.

## Requirements

- **FR-001**: Extend the existing copy field with opt-in grouping. Retain the original plain presentation by default.
- **FR-002**: Follow the [library digest convention](../020-disclosure-code-block/spec.md). For grouped display, trim leading and trailing whitespace. Retain plain rendering for values with remaining whitespace. For a supported opaque identifier, retain everything through the last colon as a separate prefix, if present, and group the remaining Unicode code points in fours. Preserve their order and case and any shorter final group. Use the existing proportional font and tabular figures, with visual spacing and group-boundary wrapping.
- **FR-003**: Offer compact presentation only with grouping and at least three body groups. Keep any prefix and the first and last body groups visible around the ellipsis. Use one meaningfully named native disclosure control with a perceivable reveal state and a stable focus target. The next Tab from it reaches Copy. Compact and revealed presentations each expose a single complete identifier in reading order. Reset to compact for each different eligible host value.
- **FR-004**: Preserve the [existing Copy contract](../014-selection-input/spec.md). The same native Copy action, default or customized name, exact activation-time payload, deferred bubbling and composed request, and host clipboard and outcome ownership apply in every presentation. The existing live-region clear precedes the request, and the new host outcome is announced once. Copy remains disabled for an empty value. Reveal has no Copy request or outcome side effect.
- **FR-005**: Keep Copy and Reveal keyboard operable with visible focus in light, dark and forced colours. At 320 px and separately at 200% text, verify group-boundary reflow without horizontal overflow or clipped focus in grouped, compact and revealed states, where applicable.
- **FR-006**: Document the public options in the custom-elements manifest and package usage. Keep the normal individual and aggregate entry points and add a minor changelog entry. Provide a fictional record ID and a fictional digest in Storybook with pinned light and dark baselines for each, plus focused browser, accessibility and strict-CSP proof.

## Edge Cases

- Empty input shows no groups. A prefix-only identifier shows its prefix without a body. One or two body groups show in full. These states have no ellipsis or Reveal. Empty or missing raw values disable Copy and send no request.
- A prefix wraps within itself only if it cannot fit the available line. A short final body group and mixed case copy exactly. Visual spacing, trimming for grouped display and the ellipsis never alter the event text.
- A host value replacement updates the presentation and clears the status as in the existing field. Any pending Copy request still carries the raw value from its own activation.

## Success Criteria

- **SC-001**: Browser fixtures verify group boundaries and a short final group with a last-colon prefix and an astral code point. Copy preserves its precise request, ordering and single host announcement, including when a value changes before dispatch. The default fixture continues to behave as before.
- **SC-002**: One native activation reveals the full value. Each state exposes one complete identifier and the applicable named native controls, and the disclosure exposes its state. Focus remains on the disclosure and reaches Copy on the next Tab. Reveal leaves the host outcome intact and emits no Copy request.
- **SC-003**: At 320 px and 200% text the relevant presentations wrap at group boundaries with no horizontal overflow and visible focus for Copy and Reveal. Both fictional stories have passing light and dark pinned baselines and accessibility checks. The browser proofs cover forced-colour focus and strict CSP.
