---
check: 3
verdict: clean
---

# Spec check 3

Third check, after `check-2-fixes.md`. Every finding of check 2 is resolved as the fix note says. SPEC-2-01, the only
blocking finding, is fixed in FR-011, US2 AS4, SC-003 and FR-012: a former op 004 Timeout mutant may end as Killed, with
a killing test on its record, or as CompileError only where the red run of FR-011a already has it so. The by-hand check
covers Killed mutants only, and `Group`, `TokenRecord` and the `tokenRecords` signature may be neither loosened nor
tightened. Notes SPEC-2-02 to SPEC-2-07 and SPEC-2-09 are applied as their fix rows say. The dispute of SPEC-2-08
holds: `git branch --show-current` gives `claude/023-mutation-gate-strictness`, and the header now names both the
branch and the feature directory.

No `[NEEDS CLARIFICATION]` marker is left. No requirement conflicts with a constitution principle: the feature is gate
tooling, with no element, raw style value, `sk-` name, monospace, inline script or style, or network request in scope.
Constitution Principle VIII is covered by FR-008, FR-011a and the configuration-only exemption. The UI-state edge cases
(loading, themes, forced colours, narrow width) do not apply to a CLI gate.

I also checked these facts, and they hold:
- The sandbox has 4 cores, as *Assumptions* "Sandbox" says.
- The base needed by FR-009 and FR-013 exists. Against a commit before `ec0f533`, `source.ts`, `generate.ts` and gate
  source are all changed, so the plan can name entries of each under the same base.
- FR-007's verdict table matches `gates/lib/mutation/report.ts` (`surviving`, `passing`).

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | note | spec.md FR-004, US1 AS5; `gates/bin/mutation.ts:142,166,169` | The gate has three closing lines today: a passing summary ("… none survived; N equivalent records"), a failing summary ("N findings in M changed files (K mutants on changed lines)") and "nothing to mutate". FR-004 says "the gate's summary line", and AS5 says the failing run behaves "exactly as today" for its finding. So the spec does not say whether the failing summary also carries the three counts. It also does not say whether the "nothing to mutate" line, which has no entries, stays unchanged. Either answer can be tested, so this does not block. | Say in FR-004 that the counts appear in the passing and in the failing summary, and that the "nothing to mutate" line is unchanged. Or leave both choices to the gate contract that the plan writes. |
| SPEC-3-02 | note | spec.md US2 intro ("either killed by a failing test within Stryker's limit or rejected by the type checker (CompileError)") | The intro allows CompileError for any former Timeout mutant. FR-011, AS4 and FR-012 allow it only where the red run of FR-011a already records that mutant as CompileError. The requirements decide, but the intro reads more loosely than they do. | Add "where the red run already has it so" to the intro sentence. |
| SPEC-3-03 | note | spec.md FR-011 ("Stryker's report names a killing test whose assertion is on the record's value or group") | The report gives only the killing test's name (`killedBy`). Whether that test's assertion is on the record's value or group has to be found by reading the test, so a reviewer checks this part, not a tool. That is enough for evidence, but the plan should say how the check is recorded for each mutant, for example by mapping each killing test to the assertion it makes. | No spec change needed. The plan or the evidence should record, for each killing test, the assertion it makes. |
