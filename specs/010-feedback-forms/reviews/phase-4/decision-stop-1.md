# Phase 4 stop 1: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-15
question: stop-1.md (the T049a scaffold `class OcelleFormSelect extends FormControl {}` does not compile against the
abstract `FormControl` of phase 3, so the build fails and every fixture-page cell of the red run fails on the build,
not on the select)

**Decision: option (a), a stub scaffold.** A new scaffold commit on `94af87b` implements the four abstract members of
`FormControl` as neutral stubs (`control()` throws `not implemented`, `initialValue()` returns `""`, `renderControl()`
returns an empty template, `dispatchChange()` does nothing). `OcelleFormSelect` stays undefined and unwired, and no
test file changes. The unchanged red tree of `9a0824b` is committed on top of it. The phase's `scaffold.sha`,
`red-commits` and `red-phase.log` are cleared, and `scaffold.sh 4` and `red.sh 4 phase` run again. T049a gets a note
that the scaffold stubs the base class's abstract members. The local, unpushed commits `80188b1` and `9a0824b` are
replaced; stop-1.md and this record are kept. The parked green draft (`9513344`) then goes back on top, and the phase
continues from T054.

Options not taken: (b) an `abstract` scaffold class; (c) keeping the commits and their evidence.
