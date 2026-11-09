# Squad round 2: fixes 2

The unresolved row of `verify-1.md` (PLAN-FRESH-2-002, the token test of `--ocelle-measure-container`) and its two
non-blocking wording notes (FR-017 "as wide as its content"; "any host rule wins" in plan decision 3 and R-03).

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-002 | fixed | research R-08 (the `expected.ts` entry is `width` 1000; `packages/tokens/test/browser/values.test.ts` gives its probe block `container-type: inline-size`, so `100cqi` measures 1000px, not the 1280px viewport fallback that a `width(1280)` entry would accept; other probes unchanged; the header comment names the query container; the "Where a token is added" list names the harness change); plan source tree (`test/browser/values.test.ts` line) and phase 4 (the harness change first, the 1000 entry red against the unchanged harness); contracts/checks.md (new `tokens-browser` row for the changed `values.test.ts`) |
| PLAN-FRESH-2-001 (verify-1 note) | fixed | spec FR-017 and US3-3: a table that fits "does not overflow its box (its `clientWidth` equals its `scrollWidth`)" replaces "is as wide as its content" |
| PLAN-FRESH-2-004 (verify-1 note) | fixed | plan decision 3 and research R-03: "any rule of the host page's own stylesheets wins", with a pointer that a custom element's `:host` rules do not (decision 16, R-12) |
