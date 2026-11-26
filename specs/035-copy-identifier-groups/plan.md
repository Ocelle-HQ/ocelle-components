# Implementation Plan: Grouped copyable identifiers

**Branch**: `035-copy-identifier-groups` | **Specification**: [spec.md](spec.md)

## Approach

Extend `ocelle-copy-field` with Boolean `grouped` and `compact` options. Grouped rendering follows the existing digest convention. Compact presentation applies when both options are present and there are at least three body groups. Keep the raw value as the single source for the existing Copy request. A different raw value restores the compact preview. Assigning the same value preserves reveal.

Preserve the current native Copy node, name, disablement, clearing and deferred request. Add a separate native button in reading order ahead of Copy. It exposes its view state and has a stable relationship to the value. The same button remains focused on reveal and, if activated in the expanded view, returns to compact. Use visible names that describe each action and retain tokenized focus treatment. Keep the expanded value and compact accessible text outside the copy status region.

Keep the existing value part and its default plain markup. Grouped presentation splits the trimmed whitespace-free body into four-code-point visual units, keeps the last-colon prefix separately, and uses a shorter final unit where needed. Render visual breaks at unit boundaries. A compact representation hides its shortened visual sequence from assistive technology and supplies one full value in reading order. The expanded value also has one full reading. Use the existing proportional font, tabular figures and token spacing. Keep focus visible if the field wraps or stacks at 320 px and 200% text.

## Test-first phases

### Phase 1 — Copy field behavior and public options

Record browser assertions before implementation for default markup and plain commands, grouped prefix and short final body, astral code points, internal whitespace fallback, empty and prefix-only cases. Verify visual wrap and color modes. Compare trusted pointer, Enter and Space Copy requests against the original raw string, including a value replacement after activation and the existing clear-before-dispatch status. Test compact eligibility for short and long inputs, rendering and full accessible reading in both states, same-node focus, next Tab and host value updates. Verify Reveal leaves the status and request count intact.

Implement the options and presentation in `packages/elements/src/ocelle-copy-field.ts`. Document the API and release addition under `packages/elements/README.md` and `packages/elements/CHANGELOG.md`. Regenerate `packages/elements/custom-elements.json` and use the component preflight to inventory all affected full manifest overlays. Preserve each overlay's exact intended raw findings when updating fixtures. Verify root and individual built registrations using existing exports. Run changed-source mutation against the phase base.

### Phase 2 — Storybook examples and browser verification

Add red cases for the exact built story IDs in the positive browser suite and the separate strict-CSP fixture. The red checks fail on the absent story or required fixture assets. Build a fictional record ID example with full grouping and a fictional prefixed digest with the compact preview. Include a short final group, mixed case, responsive wrap, native keyboard paths and visible focus. Verify the real built examples separately at 320 px and 200% text, exact Copy host detail and programmatic Reveal state, plus forced colours. Use the built element package in the strict-CSP fixture and assert absence of origin, resource and policy failures.

Assign the story file, exact Storybook index, two light and two dark pinned baselines, normal and injected Axe inventories, and relevant Plants to one integration owner. Run the component preflight early for CEM overlay and applicable shared Storybook host routing. If an executable shared host is needed, verify actual default-mutation discovery and scoped host mutation before the costly visual capture. Keep the full built browser and strict-CSP checks in either case.

## Pilot verification

Use Op 034's approved procedures. Record the exact feature head, main base, tested merge and relevant hosted artifact identities. Keep all required CI checks. Observe the Visual reuse calculation only after an evidence-only update has a complete matching control run, including fresh Sign-off and Sandbox paths. Record potential savings separately from actual wait and runner work. Record setup, replay, failed-run and rework timings and whether preflight caught fixture drift. Review the workflow after #89 and verify any adjustment before choosing the next independent epic issue.

## Constitution Check

The extension is a MINOR addition to the existing control. Hosts own clipboard effects and outcomes. Existing token, keyboard, accessibility and strict-CSP contracts apply. Keep real browser assertions and complete hosted CI, historical red evidence and independent reviews.
