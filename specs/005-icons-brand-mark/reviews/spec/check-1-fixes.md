# Spec check 1: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | spec.md User Scenarios "The strict-CSP fixture" (new: `tokens.css` always linked, `base.css` where a scenario says so; header `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`; allowed requests the page, its scripts, its stylesheets and the vendored font, all same-origin; CSP and size checks on the same page); US1 Independent Test, US1 scenarios 1 and 2; US4 Independent Test; FR-005; SC-001 |
| SPEC-1-02 | fixed | spec.md FR-007 (tokens an element reads are not its CSS custom properties and are not declared; the README names them and the token override is the hook; an own hook uses `--ocelle-<element>-<property>`; both elements declare none); US1 scenario 11; US4 scenario 12 (new, brand-mark manifest entry and tokens it reads); Edge Cases "Compact root" |
| SPEC-1-03 | fixed | spec.md User Scenarios "'Does not' outcomes are paired" (table: each negative outcome, its paired positive outcome in the same test, and its planted defect; documentation checks and the constitution VIII exemption for `THIRD_PARTY_NOTICES`); US1 scenarios 1, 5 and 8; US2 scenario 4; US3 scenario 5; US4 scenario 6 |
| SPEC-1-04 | fixed | spec.md US3 scenario 6 (second Given dropped; observable outcome: the control's name is exactly "Close" and the icon adds no unignored node or name; the no-`label` rule is a README statement under FR-023, checked as documentation); pairing table row for US3-6 |
| SPEC-1-05 | answered | Operator (2026-11-10, human:jeroennouwsdev), "Add a `file` glyph (Recommended)": spec.md operator decisions; Consumer need; US2 scenarios 1 and 4; FR-017 (thirteen names); FR-018; SC-001; SC-007 |
| SPEC-1-06 | fixed | spec.md User Scenarios "Main grounds" (the token source's nine `main` grounds; the chrome is `color-chrome` and `color-chrome-hover`); US4 scenarios 1 and 2; FR-025; FR-026 |
| SPEC-1-07 | fixed | spec.md FR-027 (both parts `currentColor`, the context's system colour); US4 scenario 5 (text, link and button cases); SC-004 |
| SPEC-1-08 | fixed | spec.md FR-011 (non-square box: scaled to the smaller side, centred, aspect kept); US1 scenario 3; US4 scenario 7; Edge Cases "Host page styles the element" |
| SPEC-1-09 | fixed | spec.md US3 scenario 2 (both SVGs have a `viewBox`; the drawing scales); US3 scenario 3 (new: non-square `viewBox` and no `viewBox`); FR-022 |
| SPEC-1-10 | fixed | spec.md FR-014 and FR-028 (empty and whitespace-only labels count as none; name trimmed; `label` property and attribute, not reflected); FR-025 (`ground` and `tone` properties and attributes, reflected); US1 scenario 6; US4 scenario 6 |
| SPEC-1-11 | fixed | spec.md FR-009 (description rule covers properties, attributes, events, slots, CSS parts and CSS custom properties; one fail plant per kind); US1 scenario 12 |
| SPEC-1-12 | fixed | spec.md FR-018 (manifest type of `name` is the union of the thirteen names; no name list is exported, so FR-031 is unchanged); US1 scenario 11; US2 scenario 1 |
| SPEC-1-13 | fixed | spec.md US4 scenario 9 (arcs and ellipse equal the reference's rosette group up to one uniform scale and one translation, within 0.5 % of the drawing's width) |
| SPEC-1-14 | fixed | spec.md FR-025 and Assumptions "Spot colour" (the spot follows the app icon's `#C68A1E`, `--ocelle-color-accent`, not the brand doc's `#E0A23A`, and why) |
| SPEC-1-15 | fixed | spec.md FR-026 (new `color-accent` rows in `packages/tokens/contrast/pairs.json`; existing ink and chrome-ink text rows at 4.5:1 satisfy the 3:1 pairs); Assumptions "Tokens" (absence failing the gate needs `contrast` grounds on `color-accent` in `source.ts` after #20; until then a deleted row is not caught); US4 scenario 4 |
| SPEC-1-16 | fixed | spec.md US1 scenario 8 (no console message), US1 scenario 14 (new, one shared adopted stylesheet across 500 instances), US1 scenario 15 (new, upgrade after the HTML), US3 scenario 1 (`dir="rtl"` slot position); FR-016; Edge Cases linked to them |
| SPEC-1-17 | fixed | spec.md User Scenarios "Reading the accessibility tree" (full tree filtered on ignored; no unignored node and no name; paired labelled case read the same way); US1 scenario 5; US4 scenario 6; SC-003 |
| SPEC-1-18 | fixed | spec.md SC-007 and SC-008 restated as documentation checks in this repository; the outcomes in kitty-mission-ui and #7 moved to Consumer need |
| SPEC-1-19 | fixed | spec.md FR-019 (triage 005, approved by the operator, puts baselines and axe with #10; if 005 merges first, the plan records the gap from constitution III and V in Complexity Tracking with #10's merge as the sunset condition) |
| SPEC-1-20 | fixed | spec.md FR-029 (Lit stays a runtime dependency, not bundled into `dist/`; its notice is added if a later change bundles it) |
| SPEC-1-21 | fixed | checklists/requirements.md (items re-checked after the fixes, with a note on what they rest on) |
