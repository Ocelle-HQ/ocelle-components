# Phase 1 required Mutation evidence

- Candidate head: `b78736328e6cec05b4d84d3a8724fe1b9c17c5d0`
- Phase base: `58a38e180433d2b1eb748ac321e1234acd761c4b`
- Synthetic PR merge: `cabb96977f5f1748b3a8d73a000e2ced989924a9`
- Tested tree: `ce2c696922ac3b2dc759f890bc1712d541a40d75`
- Required verdict: pass in attempt 1

The phase-base and PR-base plan files were byte-identical across all 12 shards with SHA-256 `815d76281db9e14ef6e52053a009382dcc292a8faa9ab49dbb04228192787914`. Required Mutation used the normal unchanged configuration. Its shard logs report 287 mutants on changed ranges, zero survivors, one timeout, 136 compile-error reports, four zero-mutant entries, and zero equivalent records. [Exact plan comparison](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46047111974/job/140669004952) · [Required Mutation aggregate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46039694975/job/140670907950)

The separate serial comparison is advisory. The result cannot replace the required run.
