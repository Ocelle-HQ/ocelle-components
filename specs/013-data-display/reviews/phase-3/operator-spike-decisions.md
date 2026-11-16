# Operator decisions: phase 3 spike (T035)

Date: 2026-11-15. Asked as multiple choice after the implementer's stop at T035 (reviews/phase-3/spike.md).

## US3-3: value text not exposed to any test read

Finding: in Chromium 1243 / Playwright 1.64.1, no read a test can make (aria snapshot, CDP AX tree queries) exposes a progressbar's value text, not even plain light-DOM `aria-valuetext`. `value`, `valuemin` and `valuemax` read correctly.

**Decision: (a) Prove the wiring, not the exposure.** US3-3's test checks the visible `value-text` part: it reads "7 of 12" with `show-label`, is absent while indeterminate, and is kept when the value is clamped. The README states that the library's tests do not verify the value text's exposure to assistive technology. Spec US3-3 and research R-05 are amended to match.

Rejected: (b) a Linux AT-SPI harness; (c) a test hook reading `ElementInternals.ariaValueText`.

## Loading-episode key name

**Decision: `Symbol.for("ocelle.progress.sweepStart")`** (the tasks.md T046 name). Research R-06 is aligned to it.

Rejected: `Symbol.for("ocelle.progress.sweep")`.
