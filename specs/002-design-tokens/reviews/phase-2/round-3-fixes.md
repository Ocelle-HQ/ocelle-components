# Phase 2 review round 3: fixes

Review: `round-3.md` (operator round from the landing pass of PR #19, changes_requested, 1 blocking finding). Task
T069.

Red evidence (operator decision of 2026-11-04, `operator-decisions.md` § Round 3 O3-01): the failing "Unit tests"
jobs of CI runs 41845918777 and 41854105381 on the pinned Node 26.13.0, 1 of 1794 tests,
`gates/test/token-only.test.ts:295` ("throws naming the file, the reason and the cause when the manifest cannot be
read"), which expected Node 22's exact text `EISDIR: illegal operation on a directory, read`. The sandbox runs Node
22.23.4, where the old test passes, so there is no local red commit, no `red.sh 2 fix-3` and no `fix-3` line in
`red-commits`, as the operator decided. The next CI run on Node 26 must show the test passing.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed | CI runs 41845918777 and 41854105381 ("Unit tests", Node 26.13.0, `gates/test/token-only.test.ts:295`); no local red by operator decision | `gates/test/token-only.test.ts`: the test now asserts `cause.code` is `EISDIR`, that the error and its cause are `Error`s with a non-empty cause message, that the message starts with `token-only: cannot read packages/elements/custom-elements.json: ` (prefix and file), ends with the cause's own `message`, and is exactly the prefix followed by the cause's message. No Node wording is written in the test. `gates/stylelint/token-lists.ts` is unchanged: it already builds the message from the cause's message. |

Checks on Node 22.23.4: `pnpm test` (1794 tests), `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`,
`gate:plants` (176 plants as expected), `gate:mutation -- --base 98c1dcd` (`round-3-mutation.log`) pass, and
`tdd-check.sh 2` reports `pass`.
