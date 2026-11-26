# Feature Specification: Grouped copyable identifiers

**Feature Branch**: `035-copy-identifier-groups`
**Created**: 2026-11-26
**Status**: Draft
**Input**: [Issue #89](https://github.com/Ocelle-HQ/ocelle-components/issues/89) · [Triage](../../triage/035-copy-identifier-groups.md)

A Workflow Studio user can scan a long identifier by its groups and copy its exact original value through the existing copy field.

## User Scenarios & Testing

### User Story 1 - Read and copy a grouped value

A person can scan a fictional record ID or digest in groups of four, then copy exactly the value the host supplied.

1. **Given** an opted-in opaque identifier, **when** it renders, **then** consecutive groups hold four characters, with a shorter final group where necessary. A prefix such as `sha256:` reads as a separate unit.
2. **Given** a 320 px viewport, **when** an identifier is wider than the available line, **then** it wraps between groups. At 200% text, the content and focus indicators remain visible without horizontal scrolling.
3. **Given** a plain copy field, **when** the host omits grouping, **then** the value, wrapping, and Copy behavior match the existing field.
4. **Given** grouped text with a prefix and mixed case, **when** a user activates Copy, **then** the host receives the complete raw string, including the prefix and original capitalization.

### User Story 2 - Reveal a compact preview

A person can recognize the ends of a long identifier and reveal all groups with one native control.

1. **Given** a long grouped value in compact mode, **when** the field renders, **then** it shows its first and last groups with an ellipsis. Assistive technology can read the complete value in order.
2. **Given** a meaningful reveal control, **when** a user activates it, **then** the full value becomes visible and keyboard focus stays predictable. The Copy control remains available with its existing name and behavior.
3. **Given** a compact preview, **when** a user copies before revealing, **then** the host receives the same raw string as it does after reveal.

## Requirements

- **FR-001**: Extend the existing copy field with opt-in grouping. Retain the original plain presentation by default.
- **FR-002**: Format opted-in identifiers using the existing proportional font and tabular figures. Preserve an optional prefix as a separate unit. Wrap at group boundaries and support a shorter final group.
- **FR-003**: Offer a compact presentation for identifiers with middle groups to omit. Use a meaningful native reveal control and keep the full value readable to assistive technology.
- **FR-004**: Preserve the existing copy request event, activation timing and host-owned clipboard and status behavior. The request carries the exact original value in every mode.
- **FR-005**: Maintain native keyboard operation and visible focus in light, dark and forced colours. Verify 320 px and 200% text, including the compact reveal and copy paths.
- **FR-006**: Document the public options and preserve the normal individual and aggregate entry points. Add two fictional Storybook examples, pinned theme baselines, and focused browser and strict-CSP proof.

## Edge Cases

- Short or empty values show no ellipsis or reveal control. The current empty-value Copy state applies.
- A short final group and mixed case stay visible and copy exactly. Group spacing is a visual presentation.
- A host can update the value while the field is visible. Grouping and any compact preview describe the current value, and Copy still captures the value at activation.

## Success Criteria

- **SC-001**: Browser fixtures verify group boundaries, prefix preservation, a short final group, exact raw Copy requests, and the unchanged default.
- **SC-002**: One keyboard activation reveals the full grouped value. The compact and revealed accessibility states each expose the full value and have named native controls.
- **SC-003**: Both documented fixtures pass responsive, keyboard, forced-colour, strict-CSP, Visual and accessibility verification.
