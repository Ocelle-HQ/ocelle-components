# Op Specification: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

**Op**: `ops/022-focus-trap-details-icon-name` | **Issue**: #57 | **Triage**: `triage/022-focus-trap-details-icon-name.md`
**Created**: 2026-11-20 | **Status**: started | **Operator decisions**: Q1 A, Q2 A (`op.md`)

## Intent

Two documented behaviours of `@ocelle/elements` do not hold:

- `ocelle-dialog` and `ocelle-drawer` keep Tab inside the panel and skip elements that are not rendered (README
  § `ocelle-dialog` **Focus**). A link inside a closed `<details>` is not rendered, but the walk counts it as a stop.
  When that `details` is the panel's last control, Tab from its summary leaves the dialog.
- A slotted icon adds nothing to the control's name (`src/icon-slot.ts`; README § Slot convention). In
  `ocelle-button`, a bare `<svg>` with a `<title>` in the `icon` slot can get an `image` node and add its title to the
  name.

This op makes both behaviours hold, with no change to the public surface.

## User Scenarios & Testing

### User Story 1 - Keyboard and screen-reader users get the documented Tab cycle and button name (Priority: P1)

A keyboard user in a dialog or drawer whose last control is a collapsed `<details>` presses Tab on its summary, and
focus wraps to the panel's first stop instead of leaving the dialog. A screen-reader user reaches an `ocelle-button`
whose icon is a titled svg and hears only the button's label.

**Why this priority**: it is the op's only story. A Tab that escapes a modal dialog and a button name with extra
words both break WCAG 2.2 AA (2.4.3 Focus Order, 2.5.3 Label in Name), which constitution III does not allow.

**Independent Test**: browser scenario rows in `packages/elements/test/scenarios/dialog.ts` (the drawer inherits
them) and `packages/elements/test/scenarios/button.ts`, run by the existing browser suites.

**Acceptance Scenarios**:

1. **Given** an open `ocelle-dialog` whose body is a button `b1` and then a closed `<details>` holding a link, with
   no footer, **When** focus is on the summary and the user presses Tab twice, **Then** focus is on the close control
   and then on `b1`, and the dialog is still open.
2. **Given** the same dialog, **When** focus is on the close control and the user presses Shift+Tab, **Then** focus
   is on the summary.
3. **Given** scenarios 1 and 2 in an `ocelle-drawer`, **Then** the results are the same.
4. **Given** the same `details` opened, **When** focus is on the summary and the user presses Tab, **Then** focus is
   on the link, and the next Tab wraps to the close control.
5. **Given** the closed `details` followed by a footer button `f1`, **When** the user presses Tab on the summary,
   **Then** focus is on `f1`.
6. **Given** `<ocelle-button id="b"><svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="…"/></svg>Open</ocelle-button>`,
   **When** the accessibility tree is read, **Then** the inner control is a button named `Open`, and the button's
   accessibility subtree has no `image` node and no node named `Folder`.
7. **Given** the same svg in `<ocelle-button id="b" label="Open project"></ocelle-button>` with no default-slot
   text, **When** the accessibility tree is read, **Then** the button is named `Open project` and has no `image`
   node.
8. **Given** `<ocelle-button><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>`,
   **When** the accessibility tree is read, **Then** the button is named `Open project`, as before.

Scenarios 1, 2, 3, 6 and 7 fail on main. Scenarios 4, 5 and 8 pass on main and after the change, and they pin that
the fix hides nothing else.

### Edge Cases

- A scroll container inside a closed `details` also stops being a stop, because `rendered()` is used at both call
  sites of the walk. This is correct, and the existing scroller rows stay green.
- An element in a `content-visibility: hidden` or `display: none` subtree was already not a stop, or now is not one.
  Both are correct.
- WebKit 17.4 has `checkVisibility()`. If WebKit hides a closed panel without a client rect, the rows already pass
  there on main, and the red evidence comes from Chromium.

## Requirements

- **FR-001**: `rendered()` in `packages/elements/src/focusable.ts` MUST return false for an element whose
  `checkVisibility()` is false. It keeps its two existing conditions.
- **FR-002**: `overlay.ts` (`#tab`, `#onFocusout`) MUST NOT change. If the red rows show that it has to change, the
  op stops and reports this to the operator as a mission (triage § What would change this decision).
- **FR-003**: `ocelle-button`'s icon wrapper (`<span class="icon-slot">`) MUST carry `aria-hidden="true"` in both
  the button and the link mode. Nothing else in the template changes.
- **FR-004**: `ocelle-action-row` MUST NOT change. Its icon wrapper is measured, and the result is reported to the
  operator (Q2 A).
- **FR-005**: The README states both behaviours (op.md Acceptance 6). The CHANGELOG § Unreleased has a
  `### Fixed` entry per defect. The custom-elements manifest is unchanged.
- **FR-006**: No story, baseline, token, slot, part, attribute or event is added or changed.

## Success Criteria

- **SC-001**: The red rows (scenarios 1, 2, 3, 6 and 7) fail on main and pass after the change. Every existing
  dialog, drawer and button row still passes.
- **SC-002**: `gate:mutation` over the changed lines leaves no surviving mutant that is not recorded as equivalent.
- **SC-003**: The action-row measurement is recorded in `reviews/phase-1/notes.md`.
