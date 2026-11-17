---
check: 3
verdict: issues
---

# Spec check 3

Inputs: `spec.md` as of `c0916ee`, `checklists/requirements.md`, `reviews/spec/check-1.md`, `check-1-fixes.md`,
`check-2.md` and `check-2-fixes.md`, constitution 1.3.1, and, as they stand on the branch,
`packages/tokens/src/source.ts` (token values, the `main` ground list), `packages/styles/src/base.css`,
`packages/elements/README.md` ("Host ARIA") and `gates/README.md`. No browser probe was run.

Check 2's blocking findings are resolved as their fix notes say:

- SPEC-2-01: FR-006 limits "absent, empty or invalid is not set" to `density`, `size`, `variant` and `orientation`.
  `inset` is a boolean whose presence, the empty value included, means inset (FR-006, FR-016, Key Entities). US1-10
  covers `<ocelle-card inset>`, `inset="inset"`, `card.inset = true` with its reflected attribute, and removing the
  attribute.
- SPEC-2-02: FR-028, US3-12, US4-11, the edge case and FR-036 now follow the README's Host ARIA rule word for word. A
  present host `aria-label` decides alone, a blank one leaves the landmark unnamed, and removing it falls back to
  `label`. This is recorded as the operator's "Follow convention".
- SPEC-2-03: FR-021 pads each section (each assigned element), not the region. There is no gap between parts, and
  FR-022 puts each divider between the two parts' padding across the whole inline size. US3-3 and US3-13 measure
  this. The one thing left is the loose-text case in US3-11, which now contradicts itself (SPEC-3-01).

The token values still agree: card 32 / 8 px and 20 / 16 px, titles 20 / 18 / 30 / 24 px, a 52 px rail with a 44 px
content box. `base.css` colours links only inside a prose region, so links in the rail inherit `--ocelle-color-chrome-ink`
as FR-027 says. Check 2's notes SPEC-2-04, SPEC-2-05, SPEC-2-07 and SPEC-2-09 were not taken up. They stay notes;
SPEC-2-09 is repeated below because FR-036 now asserts a README statement that has no source.

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | blocking | spec.md US3-11, FR-021, FR-022, Edge Cases (sidebar text nodes) | US3-11 puts a text node between two section elements. It then requires "one divider between the two sections and none on either side of the text". Every position between the two sections is on one side of the text: either between the first section and the text, or between the text and the second section. So no layout passes the scenario as written. FR-022 draws dividers between "adjacent" parts, and these two sections are not adjacent. The same scenario's last sentence (a default slot holding only text gets the head-to-sections and sections-to-footer dividers) contradicts "dividers lie only between assigned elements" and the edge case "dividers separate only assigned elements". In that case the dividers separate the head and the footer from text. The plan would have to pick the product. | State where the one divider lies: for example, at the second section's block start, so between the text and the second section. Replace "none on either side of the text" with "the text adds no divider of its own". Restate the rule so the text-only default slot fits it, for example: "a divider lies between each two adjacent non-empty parts, where the default slot's text counts toward the slot being non-empty but is never itself separated from a neighbouring section". |
| SPEC-3-02 | note | spec.md FR-012, FR-013, FR-017, US1-5, US1-8 | No requirement covers `variant="eyebrow"` combined with `size="compact"`, or an eyebrow-variant section header in a compact card's `header` slot. FR-013 replaces FR-012's heading style with the eyebrow style, so `size` probably has no effect there. The spec does not say so, and no scenario tests it. | State that in the eyebrow variant `size` and the card's density change nothing, and add that case to US1-5 or US1-8. |
| SPEC-3-03 | note | spec.md SC-006, FR-036, "Consumer need" (repeats SPEC-2-09) | SC-006 counts five workarounds, including "card density overrides". FR-036 makes the documentation test assert, for every element, "the Consumer-need workaround it replaces". "Consumer need" still lists four deletions and names no card workaround. The card bullet describes a missing density, not an override. So for the card, the README sentence and its test have no source to check against. | Name what Kitty Desktop does today for a dense card in "Consumer need". If that is not known, drop the card from SC-006's list of workarounds and from FR-036's statement for the card. |
| SPEC-3-04 | note | spec.md SC-004, FR-030; `gates/README.md` `brand-rules` | FR-030 changes the token source, which the `brand-rules` gate checks (no monospace font token, decorative rules, dark chrome). SC-004 lists `manifest`, `csp`, `prefix`, `style-lint`, `contrast`, `visual` and `axe` but not `brand-rules`. All gates run in CI anyway, so this costs nothing, but the success criterion leaves out the gate most relevant to a token addition. | Add `brand-rules` to SC-004. |
| SPEC-3-05 | note | spec.md FR-025, US4-2, US4-3, US4-7 (repeats SPEC-2-04, SPEC-2-05) | The rail divider's position and its gaps to the two groups are still not stated, and neither is the outcome when a vertical rail's items are taller than its container. US4-2 also gives no container block size for "bottom items at the block end". | As check 2 suggested, state the divider's gaps and the overflowing vertical rail's outcome, and give US4-2 a container block size. |
| SPEC-3-06 | note | spec.md FR-019, US2-2 (repeats SPEC-2-07) | The page header band's ground is still unnamed: transparent or a token. | Name it, or state that the band has no ground of its own. |
