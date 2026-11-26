# Feature specification — Anchored popover for compact controls

**Issue** #86  
**Release surface** MINOR, `@ocelle/elements`  
**Consumers** Ocelle console and Kitty Desktop chrome controls that open small groups of settings or account actions.

## User stories

### US1 — Operate a compact popover with the keyboard or pointer (P0)

A user opens an appearance or account surface from a named control and can use its native actions without losing their place in the page.

**Independent test** Use a page with focusable controls immediately before and after the trigger, two native controls in the surface, and an outside pointer target. Inspect the actual trigger and accessible tree across open, close and reopen.

1. Given a closed popover and a named icon or initials trigger, when the user clicks, presses Enter or presses Space, the surface opens once and the actual trigger exposes the open state. The same control exposes the closed state after dismissal.
2. Given an open surface, Tab and Shift+Tab visit its available controls in their normal order and allow the user to continue past the surface. Disabled controls stay out of the sequential order. Opening the surface leaves focus on the trigger.
3. Given focus on the trigger or within its open surface, Escape dismisses that surface and restores focus to its trigger. An outside pointer activation dismisses it and preserves the outside target’s normal focus and activation.
4. Given a selection inside the surface, the host can close it. When focus remains within the closing surface, restore it to the trigger. When the host already moved focus to an external target, preserve that focus.

### US2 — Keep the surface visible in compact chrome (P0)

A user can reach the same controls from a trigger at the top or bottom of a narrow screen.

**Independent test** Open surfaces from both placements in a clipping ancestor, including triggers near opposite horizontal edges. Measure the rendered surface and reach its controls with keyboard and pointer.

1. Given a top-bar trigger, the surface opens below it when there is room. Given a bottom-rail trigger, it opens above or beside it as space permits.
2. At a 320 CSS pixel viewport the surface remains inside the visible viewport, is usable, and escapes its trigger ancestor’s clipping. At 200% text size, independently of viewport testing, longer labels wrap and all enabled controls remain reachable without horizontal page scrolling.
3. While open, reposition when the anchor or viewport moves. Close safely if the trigger is disconnected. If content exceeds the available vertical space, users can reach it by scrolling the surface.

### US3 — Integrate appearance and profile actions (P1)

A contributor can use the component in two isolated, executable Storybook examples.

**Independent test** Run the built stories under the repository’s strict CSP. Use keyboard and pointer to change the selected appearance and request Sign out. Use fictional host state.

1. The appearance story supplies named Light and Dark actions and exposes exactly one as pressed. A selection changes the host fixture and closes the surface. No theme preference is persisted by the component.
2. The profile story uses a meaningfully named initials trigger and a native Sign out action. Activation calls the fictional host action once. The component never fetches account data or executes sign-out.
3. Light and dark baselines cover the two open edge placements and their relevant closed states. Both stories retain visible focus and readable controls in forced colors.

## Requirements

- **FR-001** Provide a reusable nonmodal anchored custom element, with documented root and per-element entry points, trigger and content contract, and host close API.
- **FR-002** Require a meaningful name on the actual trigger for both icon and initials presentations. Publish open state on that control. The name remains meaningful regardless of open state.
- **FR-003** Preserve native button or link semantics and normal Tab order. Do not trap focus or impose a menu keyboard model on host content.
- **FR-004** Support click, Enter and Space activation, Escape with focus return, outside-pointer dismissal with native target behavior, and host-initiated close after selection. Dismiss only the active surface when another overlay is above it.
- **FR-005** Keep the positioned surface in the viewport and out of clipping ancestors. Cover the supported Chromium and WebKit engine floor and the repository’s strict CSP.
- **FR-006** Ship two executable Storybook examples with host-owned appearance and profile behavior. Preserve package documentation, the custom-elements manifest, the generated inventories, and a MINOR changelog entry.
- **FR-007** Use token-based styling, native semantics and accessible focus in both themes and forced colors. Assert focus, activation, state and placement through browser interaction and built Storybook proof.
- **FR-008** Capture visual baselines with the pinned Docker and Podman workflow. Record the three workflow measurements alongside the required CI results.

## Boundaries and edge cases

- The public component owns disclosure, placement and dismissal. The host owns theme persistence, profile data, sign-out and other domain effects. The examples use no live service or user data.
- Existing app shell, rail and top-bar public surfaces remain separate. Issue #91 owns reusable initials styling and new chrome glyphs. The examples can use the current tokens and primitives.
- Prove disabled controls, repeated opens, focus outside the component, no hidden-but-focusable controls, clipping, and separate 320 px and 200% text fixtures.

## Success criteria

- **SC-001** Focused browser assertions prove each trigger input, open-state transition, tabbable path, dismissal route and focus destination.
- **SC-002** Measured surfaces at both edges satisfy the viewport and clipping requirements at 320 px. Controls remain reachable at 200% text.
- **SC-003** Built strict-CSP examples exercise both host callbacks and retain native accessible semantics. Required visual and accessibility checks cover both themes, with a forced-colors browser case.
- **SC-004** Required CI passes on the integrated candidate. Compare advisory mutation with its full control, record scoped baseline capture timing and engine result, and report exact Visual observer eligibility from the review-only control pair if one is available.
