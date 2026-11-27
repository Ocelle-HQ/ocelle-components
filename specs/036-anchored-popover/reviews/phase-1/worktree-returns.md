# Phase 1 red worktree returns

All three slices started at scaffold record `71ee9c2a1e604e16c3add7ae4993eeec0e25c938`. The repository return checker verified common ancestry, clean worktrees, signed commits, and disjoint assigned paths.

| Task | Slice | Signed return | Files |
| --- | --- | --- | --- |
| T003 | Native mouse, keyboard and touch | `df60f558690fc8532cfb59cb716adf87a5e7ddac` | 2 |
| T004 | Built package and strict CSP | `512b84ce11a611d18bcc252e2ed563dc34d16c0d` | 7 |
| T005 | Package contracts | `c6bb2e25dfc5eb98707375d50336b8ce1e9941a7` | 7 |

The integrated tests-only commit `9368fe603427bf89d63b377b443d28fcd4200a4c` produced 34 attributable failures across five selected projects. The focused red command completed in 22.681 seconds. [Canonical red log](red-phase.log)
