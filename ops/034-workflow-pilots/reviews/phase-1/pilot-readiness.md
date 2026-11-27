# Pilot readiness

## Exact candidate

PR #103 run `45816853490`, attempt `1`, passed all 19 required checks on tooling head
`509915d1a7ce2413539587330cce9f7b6d776984`. The run used base
`64c575785b325d2ef949b664b3eb48856d1ff791` and tested merge
`bc91dbf6ac7ce40108d981eba3a9e4a98961c52c`. [Required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490)

| Required proof | Result |
| --- | --- |
| Unit tests | 12,464 tests passed in 372 files across six shards. [Aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139911983541) |
| Mutation testing | All 16 standard shards and the required aggregate passed. [Aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139902440292) |
| Plants | All 326 Plants were judged and the required aggregate passed. [Aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139910954363) · [Phase-base selection](plants.md) |
| Visual regression | All 796 captures matched their baselines under Docker and Podman. [Visual job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139898692424) |

The standard phase replay passed on that tooling head. It reproduced 98 original failing assertions and 12 review-fix
failing assertions. The final test overlay reproduced the failure on each applicable base, and the final head passed.
[Replay receipt](tdd-check.json) · [Original red](check-red-phase.log) · [Review-fix red](check-red-fix-1.log) · [Final tests on phase base](check-final-tests-on-base.log) · [Final tests on fix base](check-final-tests-on-fix-1-base.log) · [Head replay](check-head.log)

## Matched mutation comparison

Hosted benchmark `45813507802`, attempt `1`, ran on tooling head
`e50e56b32fe67bd6001a8440629091c6b3b49edd`. The mixed, default-only and elements-only arms used the same immutable
folded #87 source, diff base and selectors. Replaying the three hosted receipts with the final comparator at
`509915d1a7ce2413539587330cce9f7b6d776984` matched all 47 selected lines, all 16 mutant identities and outcomes, and
verdict `0`. The slowest job was 118 seconds shorter in the split run. The split used 12 additional runner seconds
across its jobs, with zero retries. The separate seeded experiment reproduced both real surviving mutants and verdict
`1` under the standard Mutation gate. [Benchmark artifacts and timings](round-2-fixes.md#matched-87-mutation-benchmark) · [Seeded failure parity](seeded-failure.md)

## Visual evidence reuse trial

The final Visual job uploaded the observed runtime record in archive `15117136291`. The archive SHA-256
`9ad8bc67fa91b952d81eff7f4857718886a3f77979821785315e48cbb407a6da` matched GitHub metadata. The
`executed-tools.json` SHA-256 `d634843ab9aebe647b0d76488067301db5001092fee740e1c15b6d0314223b2a`
matched the exact Visual post-step log. [Pin-record archive](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/artifacts/15117136291) · [Visual runtime receipts](round-2-fixes.md#visual-runtime-receipts)

The two observed Visual jobs recorded different pnpm launcher hashes. Rebuilding each launcher from the pinned shim
template and its logged installation directory reproduced both hashes. The receipts lack the native pnpm executable
hash. A future equivalence claim needs to verify the launcher target and measure that executable before and after
capture. [Pinned shim implementation](https://github.com/pnpm/pnpm/blob/666c35e95c17f1a36414adc28bc25a73a8f1f67f/pnpm/crates/cmd-shim/src/shim.rs#L211-L295)

The live #89 trial still needs a same-PR evidence-only pair with matched runtime evidence and successful required
CI on both candidates. Record the observed eligibility and the actual control results at that checkpoint. [Issue #89](https://github.com/Ocelle-HQ/ocelle-components/issues/89)

## Component preflight

The phase-base manifest preflight found all eight expected snapshots. The reordered overlay passed cleanly and
the seven negative fixtures produced their exact expected findings. The regression checks a deleted snapshot
with its descriptor still present and reports the missing path. [Independent preflight checks](round-2.md#checks-run)

Actual Vitest discovery in the normal and default mutation configurations found the #87 pane footer test in the
retained `storybook-browser (chromium)` project. The built-browser-only fixture was excluded from default mutation
discovery. The independent standard scoped Mutation result for the changed #87 host records 140 mutants with zero
survivors or uncovered mutants. [Discovery tests](../../../../gates/test/vitest-config.test.ts) · [Scoped host mutation](../../../../specs/033-pane-step-indicator/reviews/phase-2/mutation.md)

The phase evidence is ready for independent review of the tooling candidate. Review the #89 retrospective before
checking readiness for #86. [Round 2 fixes](round-2-fixes.md) · [Issue #86](https://github.com/Ocelle-HQ/ocelle-components/issues/86)
