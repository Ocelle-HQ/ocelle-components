# Focused phase replay on the landing candidate

The code head is a4db93fc. CI-first is recorded in [operator-ci-first.md](../operator-ci-first.md).

- Phase 1 local replay passed its original recorded red and its 4dff9105 tests-only red with exit 1, and passed its scoped tests on a4db93fc. The current tests, run with the pre-Op 022 focus walk alone, failed both disclosure-last dialog assertions. With the pre-fix disclosure source alone, the two detached method assertions independently failed. The combined current tests passed.
- Phase 2 local replay passed its original recorded red and its 2fd51b29 tests-only red with exit 1, and passed its scoped tests on a4db93fc. The final test files with only pre-fix code-block source restored independently failed both named reconnect assertions. The current tests passed. A delayed-font probe separately failed the unchanged RTL geometry assertions until the face was loaded before mounting.
- The legacy replay's historical base and scaffold overlay steps ended with exit 2 because the final merged tests could not load in those commits. Its reported overall pass treats both exits as red. Those load failures are outside the behavior evidence. The original folded phase proofs and updated named assertion replays above remain recorded separately.
- Full CI on the landing candidate supplies the required suite, mutation, all plants, and full Storybook verdict. [Candidate run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45059422687)
