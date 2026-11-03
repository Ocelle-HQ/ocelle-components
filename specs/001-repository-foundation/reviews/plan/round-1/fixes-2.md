# Squad round 1: fixes 2

Resolves the one unresolved row of `verify-1.md`. The configuration rule now states the shape of a plant tsconfig
(no keys other than `extends` and `include`) and, separately, that a `fail` or `pass` plant's `extends` resolves to
`tsconfig.base.json`; only an `error` plant's `extends` may name a missing file. The plant job's rejection check
tests exactly that rule, so the rule text, the typecheck breaking plant and the check agree. Probed with tsc 6.0.3:
a tsconfig `{"extends": "./missing.json", "include": ["a.ts"]}` gives `error TS5083: Cannot read file ...` and
exit 2, which contracts/gate-cli.md classifies as exit 2 (TS5xxx).

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-TESTABILITY-1-002 | fixed | contracts/plants.md (configuration rule, typecheck breaking plant names `TS5083`, plant job failure list); data-model.md § Plant (configuration rule); research.md R-10 (same configuration rule and rejection check: any tsconfig key other than `extends`/`include`, or a `fail`/`pass` plant whose `extends` does not resolve to `tsconfig.base.json`) |
