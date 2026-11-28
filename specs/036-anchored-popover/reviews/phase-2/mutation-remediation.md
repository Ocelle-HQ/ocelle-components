# Phase 2 Mutation remediation

The first ordinary run on `f4fc2e8bbf2ab1c30b2513fbb0078bfe81440a5f` found 69 surviving or uncovered mutants in four shards. The retained test-first scope now observes exact fitting width and height, one-pixel constraints, region equality, visual viewport boundaries, use of one adopted sheet and redundant native CSSOM writes. The production correction removes a second first-Tab placement path and redundant sides of the position calculation. [Initial ordinary run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158758007) · [Focused verification](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162402315)

The CSS cleanup has one narrow equivalent mutation. Native Chromium cleared all four populated declarations when assigned either the empty string or the exact invalid string emitted by Stryker. An exact comment records only that StringLiteral equivalence. [Native CSSOM comparison](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162164109/job/141031659342)

The ordinary rerun on `3ff4e940ae544b0010d0b091602685c858b03823` supplies the next Mutation verdict. [Current ordinary run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162541866)
