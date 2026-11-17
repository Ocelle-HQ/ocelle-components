# Phase 2 stop-and-ask: the scrollbar plant of T016 (T030)

tasks.md T030 names the scrollbar plant of T016 a stop-and-ask point, and the operator's rules for this run name it
again ("including the scrollbar plant of T016/T030"). The phase stopped here: the plant has not been run, and T030
stays open.

## Where the phase stands

- The scrollbar test of T016 (`packages/elements/test/browser/scrollbar.test.ts`, Chromium launched without
  `--hide-scrollbars`, a classic 15 px scrollbar) passes all four cases on the green implementation: the block size is
  the content's plus the ring room on each side plus the measured scrollbar; at a faded edge the scrollbar's pixels
  equal a twin plain box's (`difference(...).over32` is 0 over the band) while the content just above it is faded, at
  the start and in the middle; the mask size follows the scrollbar in the delivery that sees it (the client
  height and the measured thickness); and the frame's handover ring shows over the scrollbar band. So the stop-and-ask
  condition of tasks.md's list, "Chromium fades the scrollbar despite the measured mask layers", has not occurred.
- Every other plant of T030 was run once and bites (`plants.md`: G1, D1 to D3, S1 to S17, L1, L2).
- The gates of T030 were run one at a time on the green implementation: `gate:style-lint`, `gate:csp`,
  `gate:prefix`, `gate:manifest` pass; `gate:plants` (with `OCELLE_VISUAL_ENGINE=docker`, as podman is not installed
  here) judged 306 plants as expected; `gate:mutation -- --base 247991d` passes with no survivor (`plants.md`
  § Guards). `gate:visual` (54 captures match), `gate:axe` (0 serious or critical) and `gate:storybook-build`
  (27 stories) pass too.

## The plant, ready to run

The fade layer sized to the whole box, with no measured block size: in `#measure` of
`packages/elements/src/overflow-region.ts`,

```ts
const figures = `100% ${String(box.clientHeight)}px, 100% ${String(box.offsetHeight - box.clientHeight)}px`;
```

replaced by

```ts
const figures = `100% ${String(box.offsetHeight)}px, 100% 0px`;
```

run against `pnpm vitest run --project elements-browser packages/elements/test/browser/scrollbar.test.ts`, and the file
restored byte for byte. Expected: the band case fails (the fade layer then covers the scrollbar, so its pixels differ
from the twin's at a faded edge) and the mask-size case fails on its figures.

## Question for the operator

May the implementer run the scrollbar plant of T016 now and, if it bites as expected, record it in `plants.md`, tick
T030 and close phase 2 for review? If it does not bite (Chromium does not mask the scrollbar even with the fade layer
over it), the phase stops again with that result, as tasks.md says for a plant that does not bite.
