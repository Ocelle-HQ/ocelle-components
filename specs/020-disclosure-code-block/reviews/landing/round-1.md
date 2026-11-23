---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 951a398b
head: a4db93fc3a019fd8862a681287d170446ad381c6
tdd_check: historical_phase_records_and_focused_landing_evidence
---

# Landing review, round 1 for PR #77

The reviewed head integrates main at `951a398b`, includes the disclosure and code-block follow-ups, and leaves the check names and registry intact. I found no remaining source or assertion blocker in T014, T015, T034 or T035. The hosted verdict and phase review records are open.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | Phase 1 round 5 and phase 2 round 2 review records | Both operator rounds still read `changes_requested` at the reviewed head. All tasks are ticked, and `units.sh` still reports phases 1 and 2 because their latest verdicts are open. | Close both through the phase review process using the focused evidence and the required hosted checks. Recheck the phase verdicts and `units.sh`. |
| L1-02 | blocking | [Hosted CI for the reviewed head](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45059422687) | CI on `a4db93fc` was in progress during review. The earlier completed failure was on `789cad34`. Visual regression and Accessibility on `381f48af` passed and cover that integration revision. | Await and record all required results covering the integrated follow-up code, including Unit tests, Mutation testing, Plants, visual regression and Accessibility. |

## Independent checks

- **T014 dialog focus.** In both Chromium projects, the closed disclosure starts with focus on its summary, and Tab wraps to the dialog's close button. In a disposable archive with `focusable.ts` from `1b8b0b2b` substituted, both assertions failed with focus on body. The README and its test drop the obsolete limitation. The current focus-walk implementation and its existing native-details tests are in the main base.
- **T015 detached methods.** On the exact test-only red commit `4dff9105`, both assertions independently failed with the undefined-render-root `querySelector` error. The guard returns null before the render root exists and still finds the native summary after render. The detached methods, rendered toggle path and composed focus test passed on the reviewed head.
- **T034 RTL initial geometry.** With the earlier built fixture and unchanged scenario, I reproduced all three line starts outside the box and offset `-591` out of `664`. Loading the vendored face before mount produced visible starts, the exact negative endpoint and the correct right-side fade with clean strict-CSP records. The final fixture also verifies a face was found before mount. The one-write design and the documented late-font caveat remain in effect.
- **T035 reconnect and reflected state.** In the exact test-only commit `2fd51b29`, both browser projects failed the reconnect assertion on stale text, tab stop, role and name. The head refreshes the DOM copy after reconnect, tears down observers on detach and responds to connected edits. New rows assert reflected overflow and digest, user's scroll and focus retention during renaming, RTL reopening on a replacement box and an unchanged nonzero LTR offset after text changes.
- **Local result.** With pinned Playwright Chromium, the focused run over the four code-block and disclosure files passed 18 tests on `a4db93fc`. It covered the above behavior in the in-process and strict-CSP harnesses. The fixture asserts its empty violation, external-request, failed-request and console record. The targeted source, tests, gates and Storybook diff also passes `git diff --check`.

## Public surface and quality gates

The disclosure guard and code-block reconnect refresh add no documented attribute, event, element, token or export to the mission's public contract. Disclosure naming and toggle still use the native summary. Code-block text stays in Lit text bindings; the reconnect path adds an observer registration and a Lit update, with no new I/O or markup parser. Font loading here is a same-origin test-fixture setup step using the pinned font.

The changed-line mutation follow-up covers the behavior differences in the prior failing shards. I reviewed its narrowly scoped equivalence records against the implementation. An empty Lit label declaration has the same String conversion with reflection off. In this RTL-only write, the more-negative arithmetic result clamps to the same endpoint. The one-time focusout listener removes the temporary tabindex from the retained wrap node, and a later rescue creates another node. The hosted mutation result is still pending.

The full Unit tests gate, mutation gate and Plants registry contracts and exit paths are unchanged. The phase TDD JSON files record the earlier folded phase heads. The landing replay evidence is in the focused logs and follow-up reports, with signed test-only red commits for T015 and T035. Use final hosted CI for the full integrated merge checks. [Earlier failing CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45039436202) · [Integration CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45057509403)
