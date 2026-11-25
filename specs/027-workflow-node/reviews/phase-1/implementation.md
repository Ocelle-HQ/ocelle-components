# Phase 1 implementation evidence

- Base: `88702025e56654ceb479d468ad0a565f23ea4f76`
- Inert scaffold: `d8c041a765ff818340c8bcc79e8ee41450a6e804`, with no test edits
- Test-only red: `a5ffb1ca6f954b39c5effe848f3a1ea03a85e51a`

`red.sh 1 phase` recorded 19 named assertion failures across the two Chromium harnesses in 16.465 seconds
(16.775 seconds wall). The scaffold rendered no native action. Title, selection, focus and style cases failed
at their null-safe assertions. The exact exports and manifest inventories passed. The retained red log shows
the four selected project/file identities.

The built green checks use the same pointer input function as the in-process browser commands. The test's
case names and assertions are unchanged. Playwright receives the existing update commands with literal types
so the fixture also passes TypeScript's overload check.

The final in-process suite registers through the package root. On the pre-scaffold base, Vitest browser
mode reduced the standalone import failure to a generic file-load error. Loading the existing package
root lets the base run the same named assertions without the workflow node. The scaffold and green
head still load the same source module through that registration path.

Security review, planning, selected and focused each have a light and dark baseline. All eight captures
matched byte for byte across two runs of the repository's capture library, using its pinned Docker image.

## Focused replay

At `2977ce1357fd06e1bcc53bc088b789d0fcce5a22`, `tdd-check.sh 1` verified all 19 named assertions
on the red commit, pre-scaffold base and scaffold, then verified green at the implementation head.
The first check took 57.003 seconds wall and reused the recorded red stage. The unchanged repeat took
1.176 seconds wall and reused all four stages with the same project and file identities.

| Revision | First replay | Unchanged repeat |
| --- | --- | --- |
| First draft `c0bcbf2300ddbc74c62ddabd75a389d4df70ac18` | 42.749 s | 0.924 s |
| Fixture update `b2fa0c06e0f44254bff0e360ba97cf5e111643fb` | 67.570 s | 1.349 s |
| Final candidate `c9ebf6eccfc634d2a678ee736efd9238647ab6b7` | 77.539 s | 0.847 s |
| Hosted merge revision `d0dc0c245e3a44772202d2d38441fc46a5b5994e` | 43.964 s | 1.483 s |

`tdd-check.sh 1` preserved all 19 named assertion failures on the red, base and scaffold stages
for the final candidate and the independently replayed hosted merge. The first runs at both revisions
reused the recorded red evidence and ran the remaining three stages. Each unchanged repeat reused
all four stages with the same project and file identities. The two revisions selected 4 files for red,
2 for base, 2 for scaffold and 9 for green.

| Project | File | Final replay stages |
| --- | --- | --- |
| elements (chromium) | `packages/elements/test/workflow-node.test.ts` | Red, base, scaffold, head |
| elements-browser | `packages/elements/test/browser/workflow-node.test.ts` | Red, base, scaffold, head |
| elements (chromium) | `packages/elements/test/exports.test.ts` | Red, head |
| elements-node | `packages/elements/test/node/manifest.test.ts` | Red, head |
| elements-node | `packages/elements/test/node/readme.test.ts` | Head |
| gates | `gates/test/manifest.test.ts` | Head |
| gates-integration | `gates/test/integration/manifest.test.ts` | Head |
| gates-integration | `gates/test/integration/plant-repo.test.ts` | Head |
| gates-integration | `gates/test/integration/storybook-build.test.ts` | Head |

## Affected Plants

The selector returned the full inventory for the package export change. Run 45190728055 judged all
317 plants and exited 0. See the exact command and output in the [Plants record](plants.md).
The visual and axe integration cases are CI-only in the phase scope and ran in the required hosted
Unit tests inventory.

## Hosted fixture inventory follow-up

Run 45180364570 was on `c0bcbf2300ddbc74c62ddabd75a389d4df70ac18`. Its manifest overlays lacked the
new declaration, and the empty-index overlay left all four workflow-node stories loadable. Local repro
showed the unexpected stale declaration in seven intentional-failure manifest plants and the reordered
pass plant. The empty-index gate exited 0 after building four stories. The Storybook build and plant-repo
integration tests independently failed against their old expectations of 326 stories and 652 baselines.
[Hosted CI run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45180364570)

The manifest overlays now include the generated declaration. The reordered plant reverses its object keys
and keeps the array order. The empty-index overlay replaces the new file with a CSF module that exports
only metadata. The integration expectations cover exactly 330 stories and 660 baselines. The affected
Plants gate judged the eight manifest cases and the empty-index case as expected, and all 104 tests in
the five focused manifest, Storybook build and plant-repo files passed.

The visual token plant adds the four measured light-theme differences from the new stories and keeps its
279 prior findings. Two pinned Docker captures confirmed all four dark baselines still match.
The full local affected replay from `c0bcbf23` judged all 10 selected plants as expected in 17m 40.024s.
The fixture update's hosted run passed the Unit tests and Plants aggregates. Its mixed mutation shard
reached the 75-minute runner limit, so the mutation aggregate failed. [Fixture update CI run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45183063310)

## Hosted mutation follow-up

The original mutation shard reported four surviving changes in the Lit property declarations. In a
detached checkout of `b2fa0c06e0f44254bff0e360ba97cf5e111643fb`, the in-process suite from `7378919c`
ran both new public markup tests against each exact replacement and the original code.
[Hosted mutation shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45180364570/job/137712581838)

| Replacement | Result |
| --- | --- |
| `label: {}` | Both tests passed, including the label's initial markup, property update and clearing. |
| `kind: {}` | Both tests passed, including the kind's initial markup, property update and clearing. |
| `outcomes: {}` | The property-only outcomes test failed on the first attribute write before connection. |
| `outcomes: { attribute: true }` | The same assertion failed before connection. |
| Original declarations | Both tests passed. |

The two outcomes variants changed the initially empty array to the literal string
`["Ignored initial markup"]`. The assertions also check that markup edits preserve the exact host
array and that only its labels render. Both outcomes mutations remain enabled.

For `label` and `kind`, Lit derives the same lowercase attribute name with either declaration. Its
default converter returns the attribute value unchanged for both `String` and an omitted type. Both
declarations use the same change detection, omit reflection and clear the rendered text on attribute
removal. The manifest's documented types come from the public properties. Each declaration now has a
located record for its equivalent `ObjectLiteral` mutant.

## Full hosted verification for T005

Run 45190728055 passed all 18 required checks with 111 successful jobs and one skipped opt-in stock
comparison. The run was created at 14:06:59 UTC and its last required check completed at 15:03:51 UTC,
for **56m 52s** elapsed. The checked merge `d0dc0c245e3a44772202d2d38441fc46a5b5994e` combines
`ff85ae5676ba52f5312719d5253fd938eac4aa94` with the candidate `c9ebf6eccfc634d2a678ee736efd9238647ab6b7`.
The merge and candidate share tree `0ace131ccce48cad63da2d8c82144db1d9a341c5`.
[Hosted CI run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055)

- The Unit tests aggregate passed 10,852 tests across 326 files and six shards, 35m 14s after run
  creation. [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137769842235)
- Changed-source mutation passed all seven shards with zero survivors and timeouts. The mixed shard
  reported the two located `ObjectLiteral` equivalents for the `label` and `kind` declarations.
  The local probes above exercised the four original replacements individually. The full mutation
  verdict came from CI. [Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137783762007) · [Mixed mutation shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137748397981)
- Visual regression, Accessibility and Content security passed. The focused built Chromium suite
  also passed against the same candidate. [Visual regression](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137748050386) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137748050117) · [Content security](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137748049928)
- The Plants aggregate judged all 317 plants from the 17 gates and the registry. [Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137760355525)
