# Implementation plan — Verification feedback from Issue #89

Run the three independent test slices from a common read-only pin. Combine their signed tests before implementation and retain the exact assertion-level red. Integrate their implementations from the joined red pin and run focused replay and the applicable gates on the integrated result before independent review.

- Sample related Vitest tests using the full production element configuration with a single advisory selector and a single explicit override. Compare exact ranges, mutant inventory and statuses, gate verdicts and time. Count parity failure as a result. Keep required mutation on its full test selection.
- Use Storybook’s built index, exact story IDs, both themes and matching captures from the pinned Docker and Podman images. Expose a separate opt-in hosted artifact for the selected baselines. Keep the full Visual gate.
- Try an exact attempt and job archive when the per-job log is unavailable. Preserve checkout and artifact checks. Measure the binary behind the audited pnpm launcher in the existing before/after observation and reject unrecognized launchers.

Stack the #86 pilot on the reviewed tooling pin or start from main after it lands. Preserve the first actionable red, full green, runner time, mutation coverage and outcome comparison, baseline artifact scope and timing, and the observer’s same-PR verdict. If any observation is ineligible or unavailable, report the specific reason and use the regular required checks.
