# Phase 5 README map (T066)

T066 asks for a check, without changing `packages/elements/test/node/readme.test.ts`, that the test asserts every
item of FR-035 and SC-006, with the red commit whose `red.sh` run showed each assertion failing. Phase 5 adds no
README item and no README assertion (analysis U2), and the file is unchanged since the phase base
(`git diff 77dfda1..HEAD -- packages/` is empty).

## How the map was made

- The assertions are the `it.each(fragments)` test "packages/elements/README.md states: %s"
  (`readme.test.ts:265`): each fragment, whitespace normalised, must be in the README. Line numbers below are the
  fragment's line in `readme.test.ts` at HEAD.
- For every fragment of the file, the first 120 characters of its current text were looked up as
  `README.md states: <text>` in the red logs of phases 2 to 4 (`reviews/phase-{2,3,4}/red-*.log`). Every 010
  fragment is found failing in exactly one red run, with the text it has today, so no fragment was changed after
  its red run. All 94 README failure lines of those logs are `AssertionError: expected '# @ocelle/elements …' to
  contain …`, assertions and not setup errors.
- Red commits (`reviews/phase-N/red-commits`):
  - T017 (phase 2, US1): `45ce025` (`red-phase.log`); the T025a red commit `06fa456` of the same phase
    (`red-fix-1.log`, phase 2 stop 2 decision (a)) for line 146 only.
  - T035 (phase 3, US2): `77e199b` (`red-phase.log`).
  - T053 (phase 4, US3): `38cf41d` (`red-phase.log`).

## FR-035

| FR-035 item | Assertion (`readme.test.ts` fragment lines) | Red run |
| --- | --- | --- |
| One section per element: `ocelle-notice`, its attributes, slots, parts and no event | 132, 133, 134, 135, 136 | T017 |
| One section per element: `ocelle-form-input`, its attributes, event, parts and no slot | 168, 194, 195, 196, 197, 199 | T035 |
| One section per element: `ocelle-form-select`, its attributes, properties, methods, event, parts and no slot | 202, 203, 210 | T053 |
| "Form controls" section, FR-020 (form-associated, one shadow root) | 166, 167 | T035 |
| FR-021 (shared attributes and properties, host API) | 168, 169, 186 | T035 |
| FR-022 (naming) | 170, 80, 83 | T035 |
| FR-023 (validity) | 172 | T035 |
| FR-024 (events) | 173 | T035 |
| FR-025 (size, main grounds) | 174, 190 | T035 |
| FR-026 (parts, no slots) | 199 (input), 210 (select) | T035, T053 |
| FR-027 (error shown, announced, first load, reveal, load first) | 175, 177, 178, 179, 180, 181 | T035 |
| FR-028 (error colour and non-colour cue, no blocking) | 175, 176 | T035 |
| Tokens each element reads | 137 (notice), 200 (input), 211 (select) | T017, T035, T053 |
| What "announced" covers in the tests (accessibility tree, no screen reader) | 142 | T017 |
| WebKit limitation: form association and `ElementInternals` | 192 | T035 |
| WebKit limitation: live regions | 153 | T017 |
| Restore by autofill not measured | 191 | T035 |
| How hosts surface a first-load `error` (FR-027) | 177 | T035 |
| The notice's unsupported host roles and attributes (FR-009) | 90, 86 | T017 |
| Slotted content other than FR-008's gives an unspecified announced text | 141 | T017 |
| Only the host's own `hidden` counts as a reveal (FR-008, FR-027) | 157 (notice), 180 (control) | T017, T035 |
| Load the build before swapping in announcing notices or controls with `error` (FR-008) | 162 (notice), 181 (control) | T017, T035 |
| An icon-only heading is absent (FR-006) | 139 | T017 |
| Not measured: validation message's anchor, `email` keyboard hint, `password` masking | 191 | T035 |
| Not measured: the select's list opening | 213 | T053 |
| Form controls not supported on state grounds (FR-025) | 190 | T035 |
| How host ARIA attributes combine with the element's own (FR-022); only `"true"` for host `aria-invalid`, `aria-required`, `aria-disabled` | 182 | T035 |
| A host `aria-label` must contain the visible label text | 183 | T035 |
| Host `role` or `aria-hidden` (`"true"` or `"false"`) on a form control not supported; host `hidden` hides one | 87, 89 | T035 |
| Host `aria-label` and `aria-description` stay on the host's node | 184 | T035 |
| The control's name is the host `aria-label` collapsed and trimmed, the host's node keeps it as written, pass it trimmed | 83 | T035 |
| How announcements reach the tree: separate live region with a copy, written after the serialisation delay, and the delay | 143, 144 | T017 |
| The announcement wait; closer changes merge; a text changing more often is not announced until it stops (FR-008) | 147, 148; 146 (the wait from the empty state's start) | T017; 146 by `06fa456` |
| How long a copy is held; the figure is not measured; browse mode may meet the text twice | 149, 150, 151 | T017 |
| `role="alert"`: insertion, reveal and change to `alert` read through the platform's alert event, with its source (FR-009) | 152 | T017 |
| Text set in the same task is part of that reading; a later change before the next serialisation is read twice, set the text first (FR-009) | 154, 155 | T017 |
| The alert event also reads a `role="alert"` notice shown by a hidden ancestor (FR-008) | 158 | T017 |
| The mixed-form implicit-submission case (FR-030) | 187 | T035 |
| The not-yet-upgraded state (Edge Cases) | 189 (form controls), 214 (select options) | T035, T053 |
| htmx: `hx-trigger="ocelle-form-input-change"` or `"ocelle-form-select-change"` (or `input`), `change` does not leave the shadow root, default trigger `click` | 188, 212 | T035, T053 |

## SC-006

SC-006 is a presence check: the documentation test finds the items of FR-020 to FR-028 in the form-control section.
Those are the rows FR-020 to FR-028 above; the three questions it names are answered by:

| SC-006 question | Assertion | Red run |
| --- | --- | --- |
| How a later form-like element takes part in forms | 166, 167, 169, 172 | T035 |
| How it names its control | 170, 183, 83 | T035 |
| How it shows an error | 175, 176, 177 | T035 |

## Result

Every item of FR-035 and SC-006 has an assertion, and each assertion was seen failing in a red run of phase 2, 3 or
4. No item is without an assertion, so nothing stops the phase here.
