# Phase 1 advisory Mutation comparison

Run 46092128875 attempt 1 executed both arms serially on exact candidate `b78736328e6cec05b4d84d3a8724fe1b9c17c5d0`, phase base `58a38e180433d2b1eb748ac321e1234acd761c4b`, and tree `ce2c696922ac3b2dc759f890bc1712d541a40d75`. The normal 12-shard phase plan contained no mixed-default/element shard. The first element-only selection was `packages/elements/src/index.ts,packages/elements/src/ocelle-anchored-popover.ts:1-30`, using `stryker.elements.config.json`. The runner image, Node, pnpm, Playwright and Stryker pins were identical within the comparison. [Hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46092128875) · [Exact raw receipts](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46092128875/artifacts/15242408844) · [Receipt export](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46095418319)

| Observation | Full arm | Related-files arm |
| --- | ---: | ---: |
| Gate exit | 0 | 0 |
| Baseline tests | 3,774 | 109 |
| Baseline dry run | 1,798.618 s | 13.715 s |
| Total Stryker time | 1,953.122 s | 160.278 s |
| Unique mutant identities | 33 | 33 |
| Killed | 20 | 20 |
| CompileError | 13 | 13 |
| Survived | 0 | 0 |
| NoCoverage | 0 | 0 |

Selected ranges and the sets of exact mutant paths, start/end coordinates, mutators and replacements matched. Each outcome matched its corresponding identity. The related-files arm used about 8% of the full arm's Stryker time for this shard. The earlier matched trial at `c218824601f3d61c1027d10f64fdd866d375ec78` had an earlier selection and both arms reported findings, including NoCoverage. It remains historical. [Earlier trial](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45987992795/job/140468388944)

This is one advisory observation on an exact shard. It leaves the normal required Mutation verdict and coverage contract in place. [Required evidence](mutation.md)
