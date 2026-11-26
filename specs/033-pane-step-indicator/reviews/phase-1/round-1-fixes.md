# Phase 1 fixes for review round 1

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | Signed tests-only commit `041df853` recorded eight failing assertions for the raw outputs of the eight manifest Plant overlays. | `gates/test/manifest.test.ts` and the eight `gates/plants/manifest/*/tree/packages/elements/custom-elements.json` overlays assigned to T015. |

All eight overlays now include the generated step-indicator declaration. The reordered pass Plant reverses
object keys recursively and preserves array order. Removing the new declaration from each revised fixture
reproduces its prior bytes. The raw check verifies no findings in the reordered pass case and one exact
finding in each failure case, including only the intended missing icon-label finding in `fail-lost-attribute`.

The two focused manifest suites passed all 24 tests. The affected Plant command started from the approved
fix anchor `74b3608eb71f896e3e20afaefd4fcb8363c29731` and exited 0 after judging all eight fixture changes.
The phase-base selection is all 326 Plants. T005 and R1-02 require the corrected candidate's hosted
Plants and Unit tests receipts and changed-source mutation evidence.

```text
plants: affected since 74b3608eb71f896e3e20afaefd4fcb8363c29731: 8 of 326 plants judged, every plant as expected; not the Plants check
```
