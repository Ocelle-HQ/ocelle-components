---
phase: landing
round: 1
verdict: approved
base: 54fd21634e5e89ab96541ba2497cc1d2807a3408
head: 23ec42e389bb7ca5d6c2f1f2d908ec49cda4f487
tree: f62d8c3083a946c92acea616d7e088651bbbd624
---

# Landing review, round 1

I reviewed the integrated textarea preview against the simulated Op 025 squash, including the conflict resolutions for the two newly landed components. This approval covers the reviewed product and gate diff on the recorded tree. Verify that the actual `main` merge preserves that diff and pass its required hosted checks before handoff.

## Findings

No blocking findings.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | note | `packages/elements/CHANGELOG.md:56–58` | The Unreleased entry describes the new field and its MINOR public surface. The landing changelog format also calls for a bold impact statement and an issue or mission reference. | Add the #74 reference and format the impact statement during deliverable review. |

## Product and integration

- The native shadow textarea handles editing while ElementInternals synchronizes submission and validity. Immediate value, name, required, read-only and disabled transitions preserve native form behavior. The shared form-control code changes only the native control type and its comment, so input and select retain their current runtime behavior.
- The label and description references resolve within the shadow root. Native focus, ordinary multiline keys, the polite host-error announcement and the enabled, read-only, disabled and invalid cues use the existing control conventions. The component has no runtime network dependency or new CSP rule. Host text and values bind through Lit text and property bindings.
- I verified that the product manifest and all eight changed manifest fixture overlays add the same textarea module and preserve their existing entries. The README names all 41 elements. The 644 previous visual baselines are byte-identical. The four textarea states each add a light and a dark baseline. The changed token plant adds exactly four light-mode findings and keeps its prior findings. The workflow, gate registry, gate implementations and exit-code contracts remain intact.

## Test evidence

- The preview carries the original scaffold `99d950d5`, phase red `1b7a75a4` and native-focus fix red `691011f4` in its ancestry. The independent phase review records named assertion failures for the missing behavior and the early invalid focus fix, with passing final tests on the pilot. The in-process and built browser fixtures exercise the actual native control and form, including pre-render submission, newline serialization, user events, validation, focus and retained text after a host error. [Phase review](../phase-1/round-1.md)
- The two hosted-only inventory files increase their expected story-theme counts by eight and preserve their existing failure, byte-equality and accessibility-exception expectations. Their full tests remain in required CI. The preview integrator reported 1,116 focused tests and 39 integration gate tests passing, along with typecheck, code/style/test lint, content security, sign-off, the 41-element manifest and a 326-story build.
- In an independent Chromium probe of the preview browser bundle under the repository CSP, eight same-task snapshots matched the native textarea. They covered an explicit external form owner, LF normalization, required checks, property toggles, the first-legend exception of a disabled fieldset and restored participation after re-enabling. The field was unrendered at the first snapshot. No console errors or page exceptions were recorded.
- The prior pilot on `b35ebf49` passed 129 executed jobs, including all changed-source mutation shards, all 317 Plants, Visual regression and Accessibility. Its full test aggregate covered 10,287 tests. The hosted run for the actual `main` merge candidate remains pending. [Pilot CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257)
