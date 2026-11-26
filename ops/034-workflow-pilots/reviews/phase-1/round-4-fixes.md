# Phase 1 fixes, round 4

| ID | Resolution | Red test | Where |
|---|---|---|---|
| R4-01 | Fixed | The real observer CLI checks an advancing association, contradictory or missing immutable head, ambiguous checkout and a local merge with reversed API parents. [Signed red log](red-fix-4.log) | [Observer collector](../../../../tooling/speckit/bin/evidence-reuse-observe.ts) · [Integration tests](../../../../gates/test/integration/evidence-reuse-observe.test.ts) |

The collector uses the unique PR association and its repository IDs for membership and requires matching immutable `head_sha` and `head_commit.id` on each exact CI attempt. It binds the Visual job to that attempt and head, verifies a single logged PR merge checkout, compares the hosted tree and ordered parents to the raw local Git object, and requires the merge's first parent to equal the current base. It continues through the existing current-candidate, audited-input, runtime and fresh-safeguard checks.

The canonical `fix-4` replay recorded five assertion failures at signed tests-only commit `268aa5eb8b4d2fc1edc0097610ad219f31650073`. The focused green passed 14 CLI integration cases and all 138 existing eligibility cases under Node 26.13.0. The advancing-link fixture reaches the runtime safeguard and rejects its deliberately missing `pin-record` upload.

The full local `tdd-check.sh 1` replay passed on signed implementation head `248d358e15fab3966e733eaa34fb3dd672a55c27`. It retained 98 original assertions and all 12 round 1 assertions alongside the five round 4 assertions. The final tests failed on the phase base and both review bases, and passed on the implementation head. [Current replay](tdd-check.json) · [Earlier signed replay](https://github.com/Ocelle-HQ/ocelle-components/blob/509915d1a7ce2413539587330cce9f7b6d776984/ops/034-workflow-pilots/reviews/phase-1/tdd-check.json)

## Required verification for #106

Typecheck passed. Code lint checked 725 files and Test lint checked 547 without findings. Local affected Plants selection returned 326 from the original phase base and zero from the stacked base. The standard incremental mutation plan on the stacked base returned zero shards. [Plants receipt](plants.md)

PR #106 run `45858408090`, attempt `1`, passed all 19 required checks on head `823de462a542d3545749ebb963cf8ffc18391541`, base `b655b83b1d17694039f7b5c968e483384145a90a`, and tested merge `361cf0ed5aa674ecc4d841c644fb9496b181b824`. Unit passed 12,478 tests in 373 files across six shards. Visual matched 796 captures under Docker and Podman. The hosted Plants job judged all 326, and the fresh required Mutation aggregate passed with the empty incremental plan. [Required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45858408090) · [Unit](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45858408090/job/140055124378) · [Visual](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45858408090/job/140042738189) · [Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45858408090/job/140054829355) · [Mutation](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45858408090/job/140042954896)

## Live #104 evidence-only pair

The tested trees differ only by the signed `specs/035-copy-identifier-groups/reviews/phase-2/round-1.md` addition. Both candidates passed all 19 required checks on common base `b655b83b1d17694039f7b5c968e483384145a90a`, with 12,518 Unit tests, 802 Visual matches, 802 Axe audits, and 326 judged Plants each. Both had fresh successful Sign-off and Sandbox paths. [Signed review note](https://github.com/Ocelle-HQ/ocelle-components/blob/6fdbe28fba6adc8dd25f38d6a97fd850da1c000f/specs/035-copy-identifier-groups/reviews/phase-2/round-1.md) · [Current Sign-off](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45855165488/job/140031504269) · [Current Sandbox paths](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45855165488/job/140031504569)

| Candidate | Exact run and tested merge | Full CI cost |
| --- | --- | --- |
| Prior `e88859ab0a3ec4c79941c2d7a816676775df1ac3` | Attempt `1`, merge `b86f0692674d353e32e4c7b4e324e62c2f1d1186`. [Run 45854965102](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45854965102) | 2,472 seconds elapsed, 79,969 runner seconds across 111 jobs |
| Review note `6fdbe28fba6adc8dd25f38d6a97fd850da1c000f` | Attempt `1`, merge `f67cd2fe6d8fddc2371d5d45d5c260f72a5f7953`. [Run 45855165488](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45855165488) | 2,432 seconds elapsed, 78,842 runner seconds across 111 jobs |

The hosted observer run `45861599281` recorded ineligible with reason `provenance` and detail `could not read the exact Visual job log`. Actions read permission was verified. The cause of the hosted log transport failure remains unresolved. The receipt archive SHA-256 was `d46f9a20904917ac9cccf1bb2919ed0a223344ea199ae36c6f01210d3b89e5f0`. [Hosted observer](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45861599281) · [Receipt artifact 15137179453](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45861599281/artifacts/15137179453)

The local replays used live GitHub REST, the exact tested Git objects, and verified Visual job logs and ZIP bytes obtained through the connector. The original collector returned ineligible with reason `provenance` because the historical attempt head differed from its advancing PR association. On the same inputs the corrected collector authenticated both attempts and the exact note-only diff, matched audited Visual inputs `sha256:e1ae08bd1216bc7e1cf5eb13b5bbfc3f3fba2fc7bce388fa16cc94bc4556af1b`, and reached runtime verification. The runner release commit `710e8ff2142ab0ff47974681dba1ae59b2ac4982` and five executable digests matched. The raw pnpm launcher SHA-256 differed, `4749e6ded3849b44a5b2bb228505075d133453901c6a8e4268e88ba87ac99590` on the prior run and `b7b91dfe57606a7aeb3937a8e755ecfd923acd945bdc0bac24b004bb3cc6698a` on the review-note run. The corrected local verdict was ineligible with reason `runtime`. Both required CI runs completed in full. No proofs were reused and no savings were credited.

| Visual receipt | Verified archive SHA-256 | Verified `executed-tools.json` SHA-256 |
| --- | --- | --- |
| [Prior archive 15137265381](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45854965102/artifacts/15137265381) | `1b4362727d3c76f51083beb083aef5bf7058036335de54df6516fd9645228662` | `76b83950ee62455fee0d01856a0069ec0807ee0420630aaa3a3494b06e71cace` |
| [Review-note archive 15136935969](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45855165488/artifacts/15136935969) | `93fcaa6e5ac0250cbe27f0255fc1d44b82a6b97574c9f5a25dad36b714e9aa33` | `92894c78b1fa13fc9c809c66d3d7d8dade033f179f595ca1bd0e29bb8db9ab53` |
