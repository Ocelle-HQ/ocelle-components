# Phase 1 (Setup, red measurement): TDD exemption

Constitution VIII, "Exemption": a unit with no behaviour (scaffolding, configuration, documentation) may skip the
red step only if its review states why no test could fail for it.

## Why no test can fail for this phase

- The phase is evidence only (tasks.md Phase 1, spec FR-011a): it runs the gate of `main` and keeps what it printed
  and wrote. It changes no code, no configuration and no test. The one scratch edit (`"checkers": []` in
  `stryker.config.json` for the checker-split runs) was restored with `git checkout -- stryker.config.json` and is not
  in the commit.
- Nothing in the commit is executed by any command: `specs/007-mutation-gate-strictness/evidence/` holds text output,
  wall times, copies of Stryker's `mutation.json` and a README. So there is no behaviour a test could observe.
- Every behaviour of the mission is written red first in its own phase: the report lines, summaries, repeated-file
  cause and plant judge (phase 2), the module order of the mutation configuration (phase 3). The red figures kept
  here are what phase 3's green runs are compared with.

## What the phase adds (T001 to T003)

- T001 `evidence/red/plan.txt`: the `--plan` output for `B = ec0f533~1`, 28 shards, 27 cuts.
- T002 `evidence/red/<entry-slug>/` for the four `source.ts` entries and the two FR-013 reference entries
  (`generate.ts:1-60`, `gates/lib/wcag.ts`): `stdout.txt`, `stderr.txt`, `time.txt`, `mutation.json`.
- T003 `evidence/red/source-*/no-checker/` (the checker split, a diagnostic) and `evidence/README.md` (the red table
  and every Timeout and CompileError of each `source.ts` entry).

## Deviation and open question, for review

- `/usr/bin/time` is not installed in the sandbox, so the wall time of each run was taken by the wrapper shell with
  `date +%s.%N` around the same command (evidence README, *Command*).
- Stop-and-ask point "any mutation shard over 10 minutes": the checker-off diagnostic run of `source.ts:121-180` took
  606.54 s. The run of the gate as configured took 537.27 s. Recorded for the operator in the evidence README; not
  worked around.
