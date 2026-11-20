# Op Specification: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

**Op**: `ops/022-focus-trap-details-icon-name` | **Issue**: #57 | **Triage**: `triage/022-focus-trap-details-icon-name.md`
**Created**: 2026-11-20 | **Status**: started | **Operator decisions**: Q1 A, Q2 A (`op.md`); phase-1 decisions 1, 2 and 7 (`operator-decisions.md`)

## Intent

Two documented behaviours of `@ocelle/elements` do not hold:

- `ocelle-dialog` and `ocelle-drawer` keep Tab inside the panel and skip elements that are not rendered (README
  § `ocelle-dialog` **Focus**). A link inside a closed `<details>` is not rendered, but the walk counts it as a stop.
  When that `details` is the panel's last control, Tab from its summary leaves the dialog.
- A slotted icon adds nothing to the control's name (`src/icon-slot.ts`; README § Slot convention). In
  `ocelle-button`, a bare `<svg>` with a `<title>` in the `icon` slot can get an `image` node and add its title to the
  name. Hiding the icon wrapper from the accessibility tree removes the `image` node, but in Chromium 153 the slotted
  svg's `<title>` still adds to a name computed from the control's content (measured in phase 1,
  `reviews/phase-1/notes.md`), and Chromium 156 gives the same `Folder Open` (re-measured at T008). So when an icon
  is slotted, the inner control's name, when it comes from the content, comes from the label alone (operator, phase-1
  decisions 1 and 7).

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
   in the button mode and in the link mode (`href="#x"`), **When** the accessibility tree is read, **Then** the inner
   control is a button (a link) named `Open`, and the host's accessibility subtree has no `image` node and no node
   named `Folder`.
7. **Given** the same svg in `<ocelle-button id="b" label="Open project"></ocelle-button>` with no default-slot
   text, in the button mode and in the link mode, **When** the accessibility tree is read, **Then** the inner control
   is named `Open project`, and the subtree has no `image` node and no node named `Folder`.
8. **Given** `<ocelle-button><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>`,
   **When** the accessibility tree is read, **Then** the button is named `Open project`, as before.
9. **Given** `<ocelle-button id="b">` rendered with the text `Open` and the titled svg of scenario 6 as a child that
   is not in the `icon` slot (for example `slot="aside"`), in the button mode and in the link mode, **When** the svg
   is then moved into the `icon` slot (its `slot` attribute set to `icon`), **Then** the inner control is named
   `Open`, and the subtree has no `image` node and no node named `Folder`.
10. **Given** `<ocelle-button id="b">` rendered with the titled svg in the `icon` slot and the one-character text `S`,
    in the button mode and in the link mode, **When** the svg is moved out of the `icon` slot (its `slot` attribute
    set to `aside`), **Then** the inner control is named `S`, and axe reports no serious or critical result on the
    page.

Scenarios 1, 2, 3, 6, 7 and 9 fail on main. Scenarios 4, 5, 8 and 10 pass on main and after the change, and they pin that
the fix hides nothing else. The phase's red commit (`d820f00`) holds scenario 6 in both modes and scenario 7 in the
button mode; scenario 7 in the link mode is added in a second test-only commit (`f5b0bdf`), before the source change
it tests (phase-1 decision 1). Scenarios 9 and 10 are added in a third test-only commit, before the source change that
makes the relation follow the icon slot (phase-1 decision 7). Scenario 10 pins that the relation goes when the icon
goes: a relation left in place gives axe's `label-content-name-mismatch` result for the one-character name.

With the icon wrapper hidden alone, Chromium 153 passes scenario 7 and fails scenario 6 on the name (`Folder Open`),
whether `aria-hidden` is on the wrapper, on the slot or on both (phase-1 measurement); Chromium 156 gives the same
name with `aria-hidden` alone. Scenario 6 therefore needs the name to come from the label (FR-003).

Naming every content-named button from its label wrapper, icon or not, keeps every name but turns 14 existing button
rows red (7 per suite: US1-6/US1-7, the four US1-12 rows, link.ts US2-12 and the href-values edge case), each only on
axe's `label-content-name-mismatch` result (incomplete, serious) for a one-character content (`S`, `P`). Relating
only when the icon slot has assigned content keeps all 227 button rows green (phase-1 measurement at T008). Existing
rows are not loosened (phase-1 decision 7).

### Edge Cases

- A scroll container inside a closed `details` also stops being a stop, because `rendered()` is used at both call
  sites of the walk. This is correct, and the existing scroller rows stay green.
- An element in a `content-visibility: hidden` or `display: none` subtree was already not a stop, or now is not one.
  Both are correct.
- A host `aria-labelledby`, a host `aria-label` and a non-blank `label` keep naming the inner control, in that order,
  over the label; the existing button rows pin this and stay green.
- An icon-only `ocelle-button` with no `label`, no host `aria-label` and no host `aria-labelledby` has no name the
  element guarantees. Its label wrapper is empty; Chromium 156 still names it from its content (for example
  `Folder`), and axe reports `button-name` (critical) for it. The README already says to name such a button with
  `label`. No row asserts its name.
- **Known limitation** (phase-1 decision 7): an `ocelle-button` with a slotted icon and a one-character text label,
  and nothing on the host naming it, is named correctly (the text), but axe reports `label-content-name-mismatch` for
  it as incomplete (needs review, serious), because the name now comes by `aria-labelledby` from that text. The
  README and the CHANGELOG say so. No row and no story has this combination; no row asserts the axe result.
- An icon slotted or removed after the button is rendered changes whether the relation is set, on the icon slot's
  `slotchange` (scenarios 9 and 10). A busy button keeps its icon assigned while the icon wrapper is hidden, so the
  relation stays and the name is unchanged.
- WebKit 17.4 has `checkVisibility()`. If WebKit hides a closed panel without a client rect, the rows already pass
  there on main, and the red evidence comes from Chromium.

## Requirements

- **FR-001**: `rendered()` in `packages/elements/src/focusable.ts` MUST return false for an element whose
  `checkVisibility()` is false. It keeps its two existing conditions.
- **FR-002**: `overlay.ts` (`#tab`, `#onFocusout`) MUST NOT change. If the red rows show that it has to change, the
  op stops and reports this to the operator as a mission (triage § What would change this decision).
- **FR-003**: In both the button and the link mode, `ocelle-button`'s icon wrapper (`<span class="icon-slot">`) MUST
  carry `aria-hidden="true"`. When the `icon` slot has assigned content and no host `aria-labelledby`, host
  `aria-label` or non-blank `label` names the inner control, the inner control MUST be named from its label wrapper
  (`<span class="label">`) by an `aria-labelledby` relation inside its own shadow root, so a slotted icon adds nothing
  to the name. When the `icon` slot has no assigned content, the inner control MUST carry no such relation, and it is
  named from its content as on main. The relation MUST follow the icon slot's assignment after the first render
  (an icon slotted or removed later). The name order (host `aria-labelledby`, host `aria-label`, `label`, then the
  content, which is the label wrapper when an icon is slotted) and every other part of the template are unchanged. No
  attribute, property, slot, part or event is added (operator, phase-1 decisions 1 and 7; patch).
- **FR-004**: `ocelle-action-row` MUST NOT change. Its icon wrapper was measured in phase 1: the inner control is
  named `Folder Open project` in both modes. That gap is reported to the orchestrator for a separate issue (operator,
  phase-1 decision 2); this op does not fix it, and the README's new sentences make no promise for the row.
- **FR-005**: The README states both behaviours (op.md Acceptance 6). The CHANGELOG § Unreleased has a
  `### Fixed` entry per defect. The README and the `ocelle-button` CHANGELOG entry record the known limitation of
  § Edge Cases (icon and one-character label; phase-1 decision 7). The custom-elements manifest is unchanged.
- **FR-006**: No story, baseline, token, slot, part, attribute or event is added or changed.

## Success Criteria

- **SC-001**: The red rows (scenarios 1, 2, 3, 6, 7 and 9, including scenario 7's link-mode row) fail on main and
  pass after the change. Scenario 10's rows pass on main and after. Every existing dialog, drawer and button row still
  passes, unchanged.
- **SC-002**: `gate:mutation` over the changed lines leaves no surviving mutant that is not recorded as equivalent.
- **SC-003**: The action-row measurement is recorded in `reviews/phase-1/notes.md`, and the phase report names it
  as a follow-up issue.
