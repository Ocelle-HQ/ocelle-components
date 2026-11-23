# Tasks for the multiline form textarea

## Phase 1: Enter and correct a multiline decision

**Goal**. Close #74 with one independently usable element and test the shortened phase-verification workflow.

**Independent test**. In a dialog, edit a multiline answer, submit it, correct a host-reported failure, resubmit and reset. Check the editing control and the submitted answer. Include native parity before the first render.

### Tests first

- [X] T001 [US1] Add inert registration and built-fixture scaffolding so errors on the red commit are named assertion failures. Record the scaffold SHA. Establish the path to a shadow control and the per-element import without implementing the form behavior.
- [X] T002 [US1] Add real same-task submit tests for markup and script initialization, before the shadow textarea has rendered. Cover exact LF in value and FormData, exact native-equivalent CRLF on the wire, synchronous required failure and correction, read-only participation, disabled controls and fieldsets, dirty defaults, and reset. Compare native textarea outcomes.
- [X] T003 [US1] Add browser tests for multiline keyboard editing in a narrow existing dialog, pasting, the input event and committed change payloads, and error recovery without losing value or focus. Verify computed label, help and error at the editing control, a single polite async error announcement, clearing, and distinct read-only and disabled cues under forced colours. Cover the per-element export and assert zero strict-CSP violations in the built fixture. Commit regression tests alone and record focused red assertions.

### Implementation and evidence

- [X] T004 [US1] Implement the textarea with the shared form-control behavior and textarea-local synchronous name, constraint, value and validity semantics. Preserve the existing inputs and selects. Add the public entry, manifest, README example and MINOR changelog.
- [X] T005 [US1] Supply editable, invalid, read-only and disabled Storybook states and pinned light/dark baselines. Run the equivalent built-fixture and visual/a11y coverage.
- [X] T006 [US1] Run Op 025 red/base/scaffold/head verification and replay it to measure resume. Run affected plants and changed-source mutation; record the break check when initial form synchronization is deferred. Start the draft PR checks on the first reviewable green code and collect total CI time. Log phase-proof and CI timings separately. Hand the phase to independent review and verify the final required gates.
