# Phase 2 review round 1 fixes

| ID | Resolution | Red test | Where |
| --- | --- | --- | --- |
| R1-01 | fixed | The built AX tree retained Review under the later Publish handle. The in-process control retained Review focus when the handle covered only its outline. A supplemental run reproduced the same focus defect where the browser hit only the handle’s stroke. | [Eligibility measurement](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L749) · [Built interaction](../../../../packages/elements/test/browser/workflow-canvas.test.ts#L337) · [In-process outline and stroke](../../../../packages/elements/test/workflow-canvas.test.ts#L539) |

The signed initial RED `4f706d239ea1f5fed10a4c676dd1a75fb14bb84f` recorded both findings in 52.157s. The signed supplemental RED `02b8aa3145bba575a5e3cff6b447a89cecedb419` recorded one stroke-only assertion in 51.28s. Both runs selected all six scoped canvas files and retained the original acceptance witnesses. [Initial RED](red-fix-1.log) · [Stroke RED](red-fix-11.log)

The fix evaluates later-painted layers first. Cards and the open panel still contribute their footprints. A Move handle contributes its painted bounds after the node and its handle have both passed the existing eligibility checks. The measured screen bounds include the live stroke, which Chromium hit-tests outside the SVG fill box. The forward bounds order stays available to named Reveal.

Built Chromium verified that the later card clears Review’s outline while its ready Move handle wins hit testing inside Review’s button. Review leaves AX and the native Tab entry. Focus recovers to Publish with no requests. Named Reveal raises the original Review action locally and preserves the graph, layout, viewport and nested host scroll. Arrow keys still use graph order. One trusted Enter emits the sole Review selection.

The element project covers only the focus inset and verifies that a clipped, inactive handle cannot hide Review. The transformed stroke fixtures compare true stroke hits with nearby misses on both axes and at the painted corner. All 259 scoped tests passed across six files, including the real touch and strict-CSP aggregate projects. The production build emitted 338 stories. The six rebuilt light and dark PNGs for Arranging, Branching and Narrow focus were byte-identical to the prior local capture, so the pinned baselines need no changes.

The local typecheck, Code lint, Style lint, Test lint, manifest check, CSP scan, prefix check and Storybook build passed. The original six canvas consumers and the two deferred inventory files stay in their established projects.

Canonical replay against signed `73390c2f73621a20674ce099c2c1808af075c58d` reproduced the 17 Phase 2 base assertions and its original stale-submit assertion, as well as both R1 overlap assertions and the supplemental stroke assertion on their respective bases. All nine integrated consumers passed in 92.333s. [Canonical replay](tdd-check.json)

Strict raw mutation covered the entire eligibility method at lines 749–791 and the crossed refresh and Reveal methods at lines 835–877 and 982–1033. It generated 216 mutants in 5m39s and scored 100% at the repository threshold. The changed method had 35 killed and 20 compile errors, with zero survivors, uncovered mutants or timeouts. The unchanged crossed methods had 72 killed, 85 compile errors, one inherited equivalence and three hit-limit timeouts. Two timeouts force repeated size updates and one forces repeated raising. The current plan emits 14 shards against the phase base and 55 against the pull-request base.

The affected Plants selector found the same 21 cases. The official local partial run judged all 16 non-container cases and each matched its expected outcome, including the repository Axe Plant. Exact hosted verification covers the five selected visual Plants and the full judge. [Affected Plants](plants.md)
