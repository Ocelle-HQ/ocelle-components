# Phase 1 fixes for round 2

## Hosted recovery

The first required run stopped in the shared Vitest baseline for all 16 mutation shards. The exact Visual workflow
test still expected the job from before the two runtime observations. The corrected assertion checks both observations
in order, the required capture, pin inspection and artifact uploads. The default gates project went from 3,089
passes and one failure to 3,090 passes. The next standard Stryker initial run completed 4,704 tests. [First required run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45812056150)

The next required run exposed changed-source mutants. The strengthened tests check precise eligibility failures,
mutation coverage, runtime and timing evidence, and missing or extra host owners. The host preflight compares the
single retained owner directly. Its old `some` and `every` were equivalent after the cardinality check. Moving the
focused path into the exercised function made its mutation observable. The comparator's set-size check duplicated
the equal-length check and unique deletions. [Mutation findings](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45813467170)

The subsequent run passed 14 of 16 mutation shards. Its remaining status and regex mutants targeted values created
before activation. Moving evaluation to the call sites exposed seven status variants and eleven regex variants in
instrumented replay. The final standard local run on `gates/bin/evidence-reuse-shadow.ts:12-17` and
`gates/bin/mutation-config-shadow.ts:96-97` passed its 4,795-test baseline. It reported 54 mutants, with 44 killed,
10 compile errors and zero survivors, uncovered mutants or timeouts. [Previous required run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45815311151)

## Required checks on the exact candidate

At 12:33 UTC on 2026-11-26, PR #103 run `45816853490`, attempt `1`, had 18 of 19 required checks green. Unit tests
was the only pending aggregate. The run tested head `509915d1a7ce2413539587330cce9f7b6d776984` against base
`64c575785b325d2ef949b664b3eb48856d1ff791`, using merge `bc91dbf6ac7ce40108d981eba3a9e4a98961c52c`.
The round 2 record is pending final review of the complete required results. [Exact required run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490)

| Required check | Result on the tested merge |
| --- | --- |
| Mutation testing | All 16 standard shards and the aggregate passed. [Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139902440292) |
| Visual regression | All 796 baselines matched under Docker and Podman. [Visual regression](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139898692424) |
| Plants | All 326 Plants were judged and the aggregate passed. [Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139910954363) |

## Matched #87 mutation benchmark

Run `45813507802`, attempt `1`, tested the folded #87 head `48909216bf586574376c3ed8cdbf4b7e088a87f8`, tree
`61c0168cae9bd8ff17a85ac8c11bff0fd9de1d66`, against diff base `25c53a915717fe464a67b53a7dd58ceaf4abc0c7`.
The benchmark workflow ran on tooling head `e50e56b32fe67bd6001a8440629091c6b3b49edd`, tested merge
`faa672192cf011bd5b835ac4ff2c1ed106d89a39`. Its unchanged selectors were
`storybook/stories/pane-action-footer.ts:1-30` and `packages/elements/src/ocelle-step-indicator.ts:151-167`.
Replaying the immutable same-run receipts with the final comparator at `509915d1a7ce2413539587330cce9f7b6d776984`
matched all 47 selected lines and all 16 mutant identities and outcomes, with verdict `0` in both arms. The default
configuration ran 4,555 baseline tests and reported 14 mutants. The elements configuration ran 3,725 baseline tests
and reported two mutants. [Benchmark run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45813507802)

| Report | Artifact |
| --- | --- |
| Mixed receipt | [15116911972](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45813507802/artifacts/15116911972) |
| Default-only receipt | [15113069915](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45813507802/artifacts/15113069915) |
| Elements-only receipt | [15117321756](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45813507802/artifacts/15117321756) |
| Comparison report | [15116857075](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45813507802/artifacts/15116857075) |

The slowest job fell from 2,505 seconds mixed to 2,387 seconds split, a reduction of 118 seconds or 4.71%. Combined
runner time rose from 41.75 to 41.95 minutes, an increase of 12 seconds, with zero retries. Shared benchmark overhead
was 19 seconds, comprising three seconds for runtime pinning and 16 for comparison. [Comparison job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45813507802/job/139909040665)

## Visual runtime receipts

The first recorder hit its short deadline during cold Podman initialization. The corrected recorder, blob
`a7a2b1459ddb2ba50b7b30f05f64c4ef9bde09ff`, uses one bounded local Podman query. The controlled probes rejected
wrong context, timeout, malformed identity and binary drift. Hosted before and after observations then completed
on both candidates below.

- Run `45815311151`, attempt `1`, head `fa703dfd7e66c3df62d72b4e0c5e15fe9486af69`, tested merge
  `0956985cbfe9dfa6e2b1c8c282742d8dd716dd9b`. Archive SHA-256
  `136535100bdea78ef025a54b2fde3373c1ee8c2200d6333f6b074414010542ba` matched GitHub metadata. The
  `executed-tools.json` SHA-256 `73eb2a8ce4dc77dda0faf794596f41e3ca4e3bf19787350a2dea3a51304671f7`
  matched the exact post-step log. [Visual job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45815311151/job/139893424204) · [Artifact 15115524198](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45815311151/artifacts/15115524198)
- Run `45816853490`, attempt `1`, tested merge `bc91dbf6ac7ce40108d981eba3a9e4a98961c52c`. Archive SHA-256
  `9ad8bc67fa91b952d81eff7f4857718886a3f77979821785315e48cbb407a6da` matched GitHub metadata. The
  `executed-tools.json` SHA-256 `d634843ab9aebe647b0d76488067301db5001092fee740e1c15b6d0314223b2a`
  matched the exact post-step log. [Visual job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/job/139898692424) · [Artifact 15117136291](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45816853490/artifacts/15117136291)

The two hosted receipts had matching reported versions and five matching executable fingerprints. Their pnpm launcher
fingerprints differed. Reconstructing each launcher with its observed per-install path reproduced both recorded
fingerprints. Attestation of the underlying native binary remains open, so the eligibility check continues to reject
launcher drift. The actual evidence-only pair on #89 is pending, and required control CI still runs.
