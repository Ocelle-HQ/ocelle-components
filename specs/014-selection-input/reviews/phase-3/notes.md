# Phase 3 notes

## The T040 stop and the operator's decision

T040's host-exposure spike (`spike.md` (2)) met its stop condition: a host `aria-label` on the tabs host gives two
named nodes in every form that keeps the host's attribute. The operator chose option (c) (`operator-decisions.md`):
`ocelle-tabs` is named from `label` only, a host `aria-label` is not forwarded or observed, and the element writes no
attribute on its host. The planner amended the artifacts in `82ea0c4` (FR-006's tabs exception, US2-24, R-01, the
Complexity Tracking row of the constitution III exception). US2-24's body (`test/scenarios/tabs.ts`) and the README's
tabs section and Host ARIA note follow it.

## Stand-ins for elements of later phases (US2-21, US2-22)

US2-21 names an `ocelle-segmented-choice` in the selected panel and US2-22 an `ocelle-link`; neither exists before
phases 4 and 6. Their bodies use stand-ins with the property each scenario is about:

- US2-21: a nested `ocelle-tabs` in the Plan panel. It is a nested parent of the same keyboard mechanism, and
  ArrowRight is one of its handled keys, so the outer tabs' origin filter is exercised by a key a nested control
  handles, as the segmented choice's ArrowRight would.
- US2-22: `x-shadow-link`, a custom element defined by the body, whose open shadow root delegates focus to an
  `<a part="anchor" href="#x">`. It is a focusable reached only through a shadow root, as `ocelle-link`'s anchor is.

The bodies with the real elements belong to phases 4 and 6. They are recorded here so that those phases add them to
`test/scenarios/tabs.ts`.

## Test infrastructure added in the red commit

`axStates` gains the scope `"ancestors"`: a node's unignored ancestors in the accessibility tree, nearest first
(`test/commands.ts`). US2-1 needs it to read that no tabpanel has the tablist as an ancestor. Its own test
(`test/ax-states.test.ts`) passes at red, because it is test infrastructure on native elements. The plant that proves
it is recorded in `plants.md`.

## Visual baselines under docker (T049)

By the operator's decision of 2026-11-14 (`reviews/phase-2/operator-decisions.md`), phase 3's baselines are produced
in #10's pinned container under docker with `pnpm run visual:update`, and checked with `pnpm run gate:visual`. No
podman cross-engine check was possible in this session, because there is no podman. CI's `visual` gate, which runs
both engines, confirms the baselines at landing.

## A focus case the spike's order does not cover (found in green; red bodies added)

R-03 and the phase 2 spike rely on one order: the focused child's removal blurs it inside the `remove()` /
`insertBefore()` call, and the `focusout` handler queues its microtask before any other. That holds when the focused
child's mutation is the first mutation of the task. When an earlier mutation of the same task, such as removing the
selected tab's panel before the tab (US2-18) or moving another option first, has already queued the
`MutationObserver`'s callback, that callback runs first. It processed every record with no focus, and the `focusout`
microtask then found no record, so focus was lost to the body. This happened in phase 2's listbox too. Two listbox
bodies and one tabs body (`R-03: a host that removes / moves ... in one task`) were added to the red commit by amending
it, and `red.sh 3` was run again. The listbox bodies fail on phase 2's listbox.

The fix: `SelectionModel.delivered(removed, focusLeft)` is the observer's batch. It runs the delivered records through
`takeBlurred`, as the `focusout` microtask and the `value` setter do, so the outcome is the same whichever runs first.
Both the listbox and the tabs use it.

## Tests changed after the red commit

- `test/scenarios/tabs.ts`, `bar()`: the tab's selected bar is the block-end border of its `::before`, not its
  background. axe-core 4.14.0's `color-contrast` counts an absolutely positioned pseudo-element with a background as
  covering the text when its area exceeds a quarter of the text element's box. With a short label such as "Plan" it
  then reports a serious `incomplete` (`pseudoContent`), which the axe gate counts as a finding and FR-051 forbids. A
  pseudo-element with a transparent background is not counted.
  - The read is as strict as before. It checks the content, the bar's thickness (`border-block-end-width`, 3 px), style
    and colour, its block-end and inline offsets, and that its background is transparent.
  - The plant "the bar drawn by colour only" still bites (`plants.md`).
  - R-15's "background colour" read becomes the border colour for the tab. The option keeps its background bar
    (phase 2), whose story has no such finding.
- `test/node/selection-pairs-check.ts`: a border of a `::before` is read in the `bar` role, so the tab's border bar is
  checked as a bar pair. Before, it was not read at all.
- `test/tabs.test.ts`, the in-process axe case: the expected `passes` list named `aria-required-parent`, which axe
  4.14.0 reports as inapplicable to children whose role comes from internals, as the listbox case shows. It now names
  the rules that pass: `aria-allowed-attr`, `aria-allowed-role`, `aria-required-children`, `aria-valid-attr-value` and
  `color-contrast`. The violation and incomplete lists stay empty.
- `test/selection.test.ts`: a `SelectionModel.delivered` case, added with the method, which did not exist at red.

## The mutation gate (T050)

The first run of `pnpm run gate:mutation -- --base 83a6f8b` on the green commit reported 53 findings in
`src/ocelle-tab.ts` and `src/ocelle-tabs.ts`. The commit after the green one handles them:

- **Killed by new bodies in `test/scenarios/tabs.ts`**, run in both harnesses:
  - the tab's `disabled` and `value` properties, and the default that counts tabs only;
  - a tab's `value` attribute changed to the remembered value;
  - a tab and panel prepended (generated ids stay unique, and a panel no longer shown loses its tabindex);
  - the shown panel's focusable measure through each attribute the panel observer follows, and the anchor, editing
    host, disabled, hidden, unslotted and slotted cases;
  - a disabled tab that leaves the tabs;
  - "a move does not steal focus back";
  - a host that focuses elsewhere while it removes the focused tab;
  - tabs whose `focusin` and `focusout` stop propagating;
  - a `SelectionModel.delivered` case in `test/selection.test.ts`.
- **Removed by simplifying the source**: the anchor rule now covers `a` only, and an editing host is counted (Chromium
  reads `tabIndex` 0 for an anchor without `href` and -1 for an editing host); a WeakMap entry's deletion was dropped.
- **Recorded as equivalent**, each with a `Stryker disable next-line` comment giving the reason:
  - the tab's `value` attribute handling (Lit's own path writes the same attribute back);
  - the per-document counter counting down (the numbers stay distinct);
  - observing the shown panel again;
  - leaving an old panel observed (the callback measures the shown panel only);
  - the panel observer's `childList` and `disabled` (the host's own observer follows both in the whole subtree);
  - the `false` passed for a shadow root's children (no shadow host is their parent).

The final run is recorded in the gate run below.
