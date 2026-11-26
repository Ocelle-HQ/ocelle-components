# Feature specification — Anchored popover for compact controls

**Issue** #86  
**Release surface** MINOR, `@ocelle/elements`  
**Consumers** Ocelle console and Kitty Desktop chrome controls that open small groups of settings or account actions.

## User stories

### US1 — Operate a compact popover with the keyboard or pointer (P0)

A user opens an appearance or account surface from a named control and can use its native actions without losing their place in the page.

**Independent test** Use a page with focusable controls immediately before and after the trigger, native controls in the surface, and an outside pointer target. One surface action opens a foreground overlay with its own Escape and focus-return behavior. Inspect the actual trigger and accessible tree across open, close and reopen.

1. Given a closed popover and a named icon or initials trigger with native button semantics, when the user clicks or activates it with Enter or Space, the surface opens once and the actual button exposes the open state. The same button exposes the closed state after dismissal. Keyboard activation retains focus on the button. Pointer activation preserves the browser’s native button focus behavior, without moving focus into the surface.
2. Given an open surface, when the user presses Tab and Shift+Tab, the available controls participate in sequential focus order in both directions and the user can continue past the surface. Disabled controls stay out of the sequential order, and native controls supplied by the host keep their own semantics.
3. Given focus on the trigger or within its open surface, when the user presses Escape with no foreground overlay handling it, the surface closes and focus returns to the trigger. When the user instead activates an outside pointer target, the surface closes and the outside target keeps its normal focus and activation.
4. Given the host closes the surface after an action inside it, when focus is still inside the closing surface it returns to the trigger. If the host has already moved focus to an external target, that target keeps focus.
5. Given a focused action inside the popover opens a foreground overlay and moves focus into it, when the user presses Escape and the foreground overlay handles that key, only the foreground overlay closes. In the test fixture the foreground overlay returns focus to the action that opened it. The underlying popover remains open. A second Escape from that action closes the popover and returns focus to its trigger.

### US2 — Keep the surface visible in compact chrome (P0)

A user can reach the same controls from a trigger at the top or bottom of a narrow screen.

**Independent test** Open surfaces from both placements in a clipping ancestor, including triggers near opposite horizontal edges. Measure the rendered surface and reach its controls with keyboard and pointer.

1. Given a top-bar trigger with space below it and a separate bottom-rail trigger near the bottom edge, when the user opens each popover, the top-bar surface appears below its trigger and the bottom-rail surface appears above or beside its trigger as space permits.
2. Given a 320 CSS pixel viewport and a clipping ancestor around each trigger, when the user opens each popover near its respective edge, the surface fits within the visible viewport and its controls remain reachable outside the ancestor’s clipping region. Given a separate fixture at 200% text size, when the user opens the popover, longer labels wrap and all enabled controls are reachable without horizontal page scrolling.
3. Given an open surface, when the anchor or viewport moves, the surface repositions to remain visible. When the trigger is disconnected, the surface closes without leaving an active overlay. When a surface with tall content opens with limited vertical room, users can reach its controls by scrolling the surface.

### US3 — Integrate appearance and profile actions (P1)

A contributor can use the component in two isolated, executable Storybook examples.

**Independent test** Run the built stories under the repository’s strict CSP. Use keyboard and pointer to change the selected appearance and request Sign out. Use fictional host state.

1. Given the host fixture starts with Light pressed, when the user selects Dark, the host updates its choice and the surface closes. When the user reopens it, only Dark is pressed. Selecting Light closes the surface and restores Light as the sole pressed choice on reopening. The host fixture owns the choice and the component does not persist it.
2. Given the profile story is closed and the host’s Sign out callback has not run, when the user opens the surface with its named initials trigger and activates the native Sign out action, the fictional host callback runs exactly once. The component never fetches account data or executes sign-out.
3. Given each story in light and dark themes, when the contributor captures the open placements and relevant closed states, each has a baseline. Given forced colors, when the user opens each story and navigates by keyboard, focus remains visible and controls remain readable.

## Requirements

- **FR-001** Provide a reusable nonmodal anchored custom element, with documented root and per-element entry points, trigger and content contract, and host close API.
- **FR-002** Use native button semantics for the trigger in both icon and initials presentations. Give the actual button a meaningful accessible name and expose the open state on it. The name remains meaningful regardless of open state.
- **FR-003** Preserve the native semantics of host-supplied surface controls and normal Tab order. The nonmodal surface allows focus to continue to surrounding controls without imposing a menu keyboard model.
- **FR-004** Support click, Enter and Space activation, Escape with focus return, outside-pointer dismissal with native target behavior, and host-initiated close after selection as described in US1. When a foreground overlay handles Escape, the underlying popover stays open and leaves focus handling to the foreground overlay. Once focus returns inside the popover, its own Escape behavior applies.
- **FR-005** Keep the positioned surface in the viewport and out of clipping ancestors. Cover the supported Chromium and WebKit engine floor and the repository’s strict CSP.
- **FR-006** Ship two executable Storybook examples with host-owned appearance and profile behavior. Preserve package documentation, the custom-elements manifest, the generated inventories, and a MINOR changelog entry.
- **FR-007** Use token-based styling, native semantics and accessible focus in both themes and forced colors. Assert focus, activation, state and placement through browser interaction and built Storybook proof.
- **FR-008** Capture visual baselines with the pinned Docker and Podman workflow. Record the pilot measurements defined in SC-004 alongside the required CI results.

## Boundaries and edge cases

- The public component owns disclosure, placement and dismissal. The host owns theme persistence, profile data, sign-out and other domain effects. The examples use no live service or user data.
- Existing app shell, rail and top-bar public surfaces remain separate. Issue #91 owns reusable initials styling and new chrome glyphs. The examples can use the current tokens and primitives.
- Prove disabled controls, repeated opens, focus outside the component, no hidden-but-focusable controls, clipping, and separate 320 px and 200% text fixtures.

## Success criteria

- **SC-001** Focused browser assertions prove each trigger input, open-state transition, tabbable path, dismissal route and focus destination, including the foreground overlay and subsequent popover Escape sequence.
- **SC-002** Measured surfaces at both edges satisfy the viewport and clipping requirements at 320 px. Controls remain reachable at 200% text.
- **SC-003** Built strict-CSP examples exercise both host callbacks and retain native accessible semantics. Required visual and accessibility checks cover both themes, with a forced-colors browser case.
- **SC-004** Required CI passes on the integrated candidate. Compare advisory mutation with its full control and record scoped baseline capture timing and engine result. Record whether an exact review-only Visual control pair was available. Report the observer’s eligibility decision if it was, or the reason a qualifying pair was unavailable.
