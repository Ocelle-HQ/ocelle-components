# Squad round 1: fixes 1

Applied to the artifacts at the commit that adds this note. Duplicates are resolved by the finding they duplicate.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-001 | fixed | research R-04 (body `tabindex="0"` while it overflows, in the walk), R-18; spec FR-018, US1-10; data-model § Overlay (body stop); checks § Dialog "Long body", § Drawer |
| PLAN-A11Y-SECURITY-1-002 | fixed | research R-02 (module-level overlay stack, topmost only, no `stopPropagation`), R-04 (wrap only when topmost); spec FR-008; data-model § Overlay stack; checks § Dialog "Nested" |
| PLAN-A11Y-SECURITY-1-003 | fixed | research R-10 (`[part=bubble]` hidden by default, shown only via `:popover-open`; `showPopover` guard); plan § Risks restated; spec Edge Cases "Engine without the Popover API"; data-model § tooltip State; contract § ocelle-tooltip; checks § Tooltip "No Popover API" |
| PLAN-A11Y-SECURITY-1-004 | fixed | research R-18 (body minimum block size `3 * target-min`, panel scrolls below it); spec FR-018, US1-10 (320 × 256); checks § Dialog "Long body"; data-model § Stories (story if #10 takes a per-story viewport, R-16) |
| PLAN-A11Y-SECURITY-1-005 | fixed | research R-04 (no layout box / not visible excluded, radio group one stop, deep active element checked after `focus()`); spec FR-008; checks § Dialog "Open and initial focus", "Tab cycle" |
| PLAN-A11Y-SECURITY-1-006 | fixed | research R-09 "Forced colours of the overlays" (panel border, `::backdrop`, outline ring); checks § Dialog "Forced colours"; data-model tokens read (`border-width`) |
| PLAN-A11Y-SECURITY-1-007 | decided: (a) | research R-08 (measured exposure, tree open and closed, story under axe, README § Host ARIA limit); spec FR-005, FR-044, US1-8; data-model § Overlay, § Stories; contract § ocelle-dialog; checks § Dialog "Accessibility tree"; plan Decision 9 |
| PLAN-A11Y-SECURITY-1-008 | fixed | research R-06 (`matchMedia` check as well as 0 ms); spec FR-020, US1-12, SC-008; checks § Dialog "Motion" (ancestor override row) |
| PLAN-A11Y-SECURITY-1-009 | decided: (a) | research R-12 "Text-field triggers"; spec FR-029, US3-10, Assumptions; data-model § tooltip State; contract § ocelle-tooltip; checks § Tooltip "Text-field trigger"; plan Decision 10 |
| PLAN-A11Y-SECURITY-1-010 | fixed | research R-13 "Written safely" (`createElement`, `textContent`, `ocelle-tooltip-desc-<n>` unique in the trigger's root); spec FR-036; data-model § tooltip State; contract § ocelle-tooltip; checks § Tooltip "`describes` lifecycle" |
| PLAN-CORRECTNESS-1-001 | fixed | duplicate of PLAN-A11Y-SECURITY-1-002 |
| PLAN-CORRECTNESS-1-002 | fixed | research R-10 (overlay base hides the current bubble on open), R-12 (Escape only when the trigger is not behind the topmost modal); spec FR-010, FR-034, Edge Cases "Tooltip trigger opens an overlay"; data-model § tooltip State; checks § Tooltip "Trigger opens an overlay" |
| PLAN-CORRECTNESS-1-003 | fixed | research R-11 (physical `top`/`left`; direction only picks the side); spec US3-15; data-model § Stories (rtl tooltip stories); checks § Tooltip "Placement" under `ltr` and `rtl` |
| PLAN-CORRECTNESS-1-004 | fixed | research R-12 (hover on the host from `pointerover`/`pointerout` and `relatedTarget`; delay rule); data-model § tooltip State; checks § Tooltip "Hoverable gap" |
| PLAN-CORRECTNESS-1-005 | fixed | research R-11 "Following the trigger" (per-frame trigger-rect check); plan § Performance Goals; spec FR-035, US3-15; checks § Tooltip "Following the trigger" |
| PLAN-CORRECTNESS-1-006 | fixed | research R-01 (JSDoc `@slot`/`@csspart`/`@cssprop`/`@fires` on each concrete class; `scripts/manifest.ts` and its pinned test named as changed files with a red test if the base must be analysed; manifest test per entry); plan § Risks, Project Structure, Phase 2; checks § gates `manifest` |
| PLAN-CORRECTNESS-1-007 | fixed | spec FR-036 (description node has role `tooltip`, bubble hidden, `describes` needs a self-focusable trigger), FR-029, US3-7, FR-034 reworded; research R-13, spec-check notes; plan Decision 5 |
| PLAN-CORRECTNESS-1-008 | fixed | plan Project Structure and Phases (`readme.test.ts` fragments and floor line red first, README intro, `entry-{dialog,drawer,tooltip}.test.ts`, build and pack file lists), Constitution Check VIII; research R-10, R-17; quickstart step 2 |
| PLAN-CORRECTNESS-1-009 | fixed | duplicate of PLAN-FRESH-1-001 |
| PLAN-CORRECTNESS-1-010 | fixed | research R-02 (request path only for a cancelable `cancel`; non-cancelable is a platform close, reason `host`; README limit); spec FR-013, FR-014, FR-016, Edge Cases "Repeated Escape with a veto"; contract § ocelle-dialog; checks § Dialog "Synthetic `cancel`"; plan Decision 4, § Risks |
| PLAN-CORRECTNESS-1-011 | fixed | duplicate of PLAN-A11Y-SECURITY-1-001 |
| PLAN-CORRECTNESS-1-012 | fixed | duplicate of PLAN-A11Y-SECURITY-1-007 (decided (a)) |
| PLAN-CORRECTNESS-1-013 | decided: (b) | research R-11 "Host layout" (`:host { display: contents }`, measured on the trigger), R-12 (hover by events, not by the host's box); spec FR-029, US3-14; data-model § ocelle-tooltip; contract § ocelle-tooltip; checks § Tooltip "Host layout"; plan Decision 11 |
| PLAN-CORRECTNESS-1-014 | fixed | slot renamed `description` in research R-13, data-model § tooltip State, contract § ocelle-tooltip; plan Constitution Check I |
| PLAN-CORRECTNESS-1-015 | fixed | quickstart step 3 (`--project tokens --project tokens-browser`); checks § gates `unit-tests` |
| PLAN-FRESH-1-001 | decided: (b) | research R-05a (disconnect closes silently, `open` false, no event; re-inserted stays closed); spec FR-022, FR-014, Edge Cases "Removed while open", "Moved while open"; data-model § Overlay State, § Events; contract § ocelle-dialog; checks § Dialog "Moved while open"; plan Summary, Decision 12 |
| PLAN-FRESH-1-002 | fixed | duplicate of PLAN-CORRECTNESS-1-002 |
| PLAN-FRESH-1-003 | fixed | research R-05 (return only while focus is inside the closing overlay or on the body; opener remapped from a closing overlay; README note); spec FR-009, Edge Cases "Focus moved before the close ends"; data-model § Overlay State; contract § ocelle-dialog; checks § Dialog "Focus return is conditional"; plan Decision 14 |
| PLAN-FRESH-1-004 | fixed | duplicate of PLAN-CORRECTNESS-1-005 |
| PLAN-FRESH-1-005 | fixed | research R-03 (slotted `method="dialog"` form does nothing; inner `close()` is the `host` path; README); plan Decision 4; spec FR-016, Edge Cases "Form in a dialog"; data-model § Overlay State; contract § ocelle-dialog; checks § Dialog "Platform close" |
| PLAN-FRESH-1-006 | fixed | research R-02 (ignore `defaultPrevented`, `isComposing`, search field with a value); spec FR-010, Edge Cases "Escape that slotted content uses"; checks § Dialog "Escape with slotted content" |
| PLAN-FRESH-1-007 | decided: (a) | research R-13 "Kept against host re-renders" (`MutationObserver`, re-applied on `slotchange`); spec FR-036, Edge Cases; data-model § tooltip State; contract § ocelle-tooltip; checks § Tooltip "`describes` lifecycle"; plan Decision 13 |
| PLAN-FRESH-1-008 | fixed | duplicate of PLAN-CORRECTNESS-1-003 |
| PLAN-TESTABILITY-1-001 | fixed | spec SC-002 (exact sequence, no `body`, both directions, three starts); research R-04; checks § Dialog "Tab cycle" |
| PLAN-TESTABILITY-1-002 | fixed | checks § Dialog "Escape with slotted content" (stops propagation × {no veto, veto, veto then Escape twice}; `preventDefault`); research R-02 records how the veto holds and its limit |
| PLAN-TESTABILITY-1-003 | fixed | research R-14 (`record()` captures `open`, `:modal` and the focus path synchronously), R-15; checks § Test matrix preamble (state at request and close, motion on and off) |
| PLAN-TESTABILITY-1-004 | fixed | research R-14 (`animations()` probe), R-16 (captures are not the evidence); checks § Dialog "Motion", "Rapid toggle", § Drawer "Motion" (side × dir sign) |
| PLAN-TESTABILITY-1-005 | fixed | checks § Tooltip "Hover delay" (reduced-motion row tests the delay); spec US3-8 restated, SC-008's bubble clause deleted; research R-15 |
| PLAN-TESTABILITY-1-006 | fixed | checks § Dialog "Styles", "Close control" (target size, ring), "Long body", footer present/absent; § Drawer "Size"; § Tooltip "Size"; research R-11 (`overflow-wrap: anywhere`), R-16 |
| PLAN-TESTABILITY-1-007 | fixed | checks § Drawer "Backdrop" (panel padding, press on backdrop released inside, each side under ltr and rtl); research R-07 |
| PLAN-TESTABILITY-1-008 | fixed | research R-14 (`pointer(path)`, `touchTap(id)`, browser commands with the iframe offset, `hasTouch` in `vitest.config.ts` and `serve.ts`, self-tests); plan Project Structure, Phase 1; checks § Tooltip "Hoverable gap", "Touch" |
| PLAN-TESTABILITY-1-009 | fixed | research R-14 (`elements` project viewport 1280 × 800, `viewport()`); plan Project Structure (`vitest.config.ts`); checks § Test matrix preamble, § Dialog "Styles" (uncapped and capped) |
| PLAN-TESTABILITY-1-010 | fixed | research R-14 (self-tests per probe in both harnesses, counts as a delta with a `MutationObserver`, no `driver.style()`); plan Phase 1, Constitution Check VIII; checks § Harness self-tests, § Test matrix preamble |
| PLAN-TESTABILITY-1-011 | fixed | checks § Tooltip "Following the trigger", "Empty `text`, `disabled`" (disabled while shown), "Slot change", "`describes` lifecycle", "Escape" (keydown recorders) |
| PLAN-TESTABILITY-1-012 | fixed | checks § Dialog "Focus return" (disabled, inert, no opener, inner button removed), "Nested" (opener removed: drawer's initial target) |
| PLAN-TESTABILITY-1-013 | fixed | research R-15 (test delay 300 ms, asserted at 150 ms and 450 ms; re-entry row), R-12 (delay rule stated); checks § Tooltip "Hover delay"; plan Phase 1 |
| PLAN-TESTABILITY-1-014 | fixed | checks § Tooltip "Late `:focus-visible`" (steps and `focusVisible()` precondition); research R-14 (`focusVisible()`) |
