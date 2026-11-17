# Squad round 2: fixes 2

Applied to the artifacts at the commit that adds this note, from the unresolved row of `verify-1.md`.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-2-007 | fixed | research R-14 "Touch only where the touch rows run" (`elements-touch` has the same excludes as `elements`: `test/node/**`, `test/build/**`, `test/browser/**`, so the fixture's `test/browser/*.touch.test.ts` stay in `elements-browser` only); plan § Project Structure (in-process and fixture touch files on separate lines with their projects; `vitest.config.ts` line states the excludes); checks gate table `unit-tests` and § Tooltip "Touch" (which project runs which touch files) |
