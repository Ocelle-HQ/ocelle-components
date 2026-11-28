# Feature Specification: Shared Chrome Glyphs and Initials Trigger

**Feature Branch**: `040-chrome-glyphs-initials`

**Created**: 2026-11-28

**Status**: Draft

**Input**: [Issue #91](https://github.com/Ocelle-HQ/ocelle-components/issues/91) and [approved triage](../../triage/040-chrome-glyphs-initials.md).

## User Scenarios & Testing

### User Story 1 - Recognize shared chrome actions (Priority: P1)

An Ocelle console user can identify Inbox, History, Settings, Notifications and Appearance by their glyphs and operate the existing controls that expose them.

**Why this priority**: The same actions need a consistent visual vocabulary across consoles.

**Independent Test**: Render each action in isolation on an existing control, inspect the glyph and accessible name, then reach and activate each appropriate control by keyboard.

**Acceptance Scenarios**:

1. **Given** an existing control for any of the five actions, **when** its matching glyph is requested, **then** the control shows that distinct glyph using the standard chrome icon size, stroke and inherited foreground.
2. **Given** a named control with its glyph, **when** a keyboard or assistive technology user reaches it, **then** the name identifies the action, the glyph contributes no duplicate announcement, and the existing keyboard behavior and visible focus are preserved.
3. **Given** either theme or forced colours, **when** the control is drawn and focused, **then** glyph and focus indicator remain discernible against their surroundings.

### User Story 2 - Identify and operate an initials trigger (Priority: P2)

An Ocelle console user can distinguish and activate a standalone account trigger with caller-supplied initials, including when it sits below Settings in the personal rail.

**Why this priority**: The account entry point needs a recognizable treatment that hosts can reuse with their own account actions.

**Independent Test**: Render the standalone trigger with fictional initials and an action name, and place the same treatment in an existing populated personal rail below a Settings control. Verify the standalone and rail behavior without depending on Story 1.

**Acceptance Scenarios**:

1. **Given** caller-supplied initials and a meaningful button name, **when** the trigger renders, **then** it displays the supplied initials as dark text centered on a circular ochre fill in both normal themes, and assistive technology exposes one button with the supplied name.
2. **Given** Settings and the trigger in that order in the bottom group, **when** the trigger treatment replaces a standard same-footprint control, **then** Settings, the trigger's target box, the divider and item spacing retain their positions. With forced colours, the circle, text and focus remain distinguishable.
3. **Given** the standalone or rail trigger, **when** the user reaches it by Tab and activates it by Enter or Space, **then** focus remains visible and each activation reaches the host once. The host supplies any subsequent account content or actions.
4. **Given** a 320 CSS px viewport or 200% text size, **when** the relevant controls render and receive focus, **then** supported initials and glyphs, control boundaries and focus remain visible, with no new overlap or page-width overflow in the verification examples.

5. **Given** a named initials button, **when** its initials change from a padded decomposed letter plus a second letter to a blank, overlong, internally separated, default-ignorable-only cluster value, a lone U+2800 BRAILLE PATTERN BLANK or a value containing U+0007 BELL, **then** it first shows the exact trimmed letters, then returns to its ordinary presentation with its action name unchanged.

### Edge Cases

- Existing names, including the behavior for an unrecognized icon name, retain their existing rendering and naming.
- A host supplies short initials and a name that describes the action. The library uses the supplied characters without deriving initials from account data.
- The horizontal rail keeps its existing order and layout rules. The vertical rail requires no divider or spacing changes to accommodate the treatment.

## Requirements

### Functional Requirements

- **FR-001**. Provide distinct Inbox, History, Settings, Notifications and Appearance glyphs where the shared set lacks them. Use the set's size, stroke and inherited foreground conventions, and preserve existing glyph behavior.
- **FR-002**. Demonstrate each glyph on an individual named existing control with visible keyboard focus and decorative glyph content. Verify the existing keyboard behavior for the control's role.
- **FR-003**. Provide an opt-in initials treatment that renders caller-supplied short initials as dark text on a circular ochre fill in both normal themes. The button retains its independent meaningful name and the initials are decorative to assistive technology.
After trimming surrounding whitespace, accept one or two Unicode extended grapheme clusters with no internal whitespace. Reject the trimmed value if it contains a Unicode control character (General_Category=Control, Cc) or if every code point in any one cluster is either U+2800 BRAILLE PATTERN BLANK or a Unicode Default_Ignorable_Code_Point. Preserve every code point of an accepted value, including combining marks and joiners. Invalid values use the ordinary presentation.

- **FR-004**. Fit the initials trigger beneath Settings in the existing personal rail bottom group with its standard target footprint, spacing, divider alignment and source order.
- **FR-005**. Demonstrate the treatment as a standalone trigger with fictional content. Preserve standard button activation so the host can provide its own account actions and content through an anchored popover.
- **FR-006**. Verify glyph and initials legibility, visible focus, keyboard operation, both themes and forced colours, and 320 CSS px and 200% text where applicable. Use focused test-first browser coverage, isolated Storybook examples and the repository's strict-CSP and accessibility conventions.

## Success Criteria

### Measurable Outcomes

- **SC-001**. Five distinct glyphs render at the existing icon size, stroke and inherited foreground. All five demonstrated controls have their expected accessible name, visible focus, and native keyboard behavior.
- **SC-002**. Both normal themes show a circular ochre mark with legible dark initials. Forced colours show distinguishable initials and mark. The named button is the only accessible control for the trigger, and each keyboard activation reaches the host once.
- **SC-003**. Comparing the populated vertical rail to a same-footprint control with a standard presentation yields matching target geometry, Settings position, item gap and divider position. Both controls are reachable in source order.
- **SC-004**. The focused browser and Storybook examples retain legibility, reachability and visible focus in the applicable narrow and 200% text cases. Built examples comply with strict CSP and the targeted stories have no serious or critical Axe findings.

## Assumptions

- The console supplies meaningful labels and short initials for the reference treatment. Verification includes single-character and two-character examples, including a wide pair at enlarged text.
- Existing control semantics, target geometry and rail slot contracts apply. A decorative round mark can sit inside a standard control with its existing focus outline.
- Account identity, content, actions and popover wiring belong to the host. The standalone trigger can be delivered independently of the anchored popover.
