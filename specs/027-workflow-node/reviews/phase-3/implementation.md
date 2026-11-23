# Phase 3 implementation evidence

- Base `5cd17445bbe9cad02200548885d1e15ddfbc946a`
- Test-only red `ef5acce09c4e715ddc20e973003be87673937a4a`

`red.sh 3 phase` took 12.586 seconds wall and recorded four named assertion failures. The source
Chromium and built strict-CSP suites each exercised two inspection cases. The absent status slot
failed both placements before any browser driver needed to resolve it.

The native slot sits in the step details outside the button. Native slot distribution supplies the
button's description with the actual host content and updates it when that content changes. The green
tests read the computed accessible description after adding, replacing, editing, emptying and removing
status. They confirm that outcome and status clicks request zero selections. Pointer, Enter and Space
each send the same stable ID and preserve the original host data and status. The isolated source tests
also rejected a renamed slot and a slot moved inside the action. The isolated green fixture loads and
restores the token sheets so its pointer target remains stable even when only inspection cases run.

The serialized green run passed all 1,224 tests in nine behavior and inventory files, including all 43
workflow-node cases. The separate package export test passed. Typecheck, test lint, the token checks
and the built package CSP gate passed. The manifest gate found 42 valid elements.

## Storybook and affected Plants

The read-only inspection story has a pinned light and dark pair. Both Docker captures agreed for all
18 workflow-node story-themes. The 16 previous baseline files matched the existing bytes, and axe
reported zero serious, critical or incomplete findings in all 18 cases.

Storybook contains exactly 335 stories and 670 baselines. The eight manifest overlays carry the new slot
with their original intended findings and key order. The empty-index overlay still holds an empty index.
The visual token plant retains its earlier 287 findings and adds the one measured light-theme difference
for read-only inspection. The corresponding dark image matched its baseline in both pinned captures.

The phase-base selector found 21 of 317 affected plants and judged none with `--list`. The manifest
overlays and empty-index fixture passed their local probes. [Plants record](plants.md)

## Final focused replay for T013

`tdd-check.sh 3` reproduced four original named assertion failures at the Phase 3 base and two
hidden-status assertion failures at the review fix base. Both sets had the same two selected
project and file identities at their recorded red commit and respective base. Phase 3 extends an
existing component and has no scaffold stage. The final green stage also ran the Plants repository
and Storybook build integration tests.

| Revision | First replay | Unchanged repeat |
| --- | --- | --- |
| Corrected candidate `948c01faf02870fb69f355acd19a272f874044c5` | 44.738 s | 1.536 s |
| Independently replayed hosted merge `9c81bf8d033fc195fb2582ceef3beefa37e8b797` | 61.701 s | 1.790 s |

The candidate's first replay reused both recorded red stages. The independent merge replay reused
only the original phase red stage. Each repeat reused all five stages with identical test identities.
The two browser suites passed 45 tests on the corrected candidate. Twice-captured pinned baselines
remained byte-identical. [Round 1 fixes](round-1-fixes.md)

| Project | File | Replay stages |
| --- | --- | --- |
| elements (chromium) | `packages/elements/test/workflow-node.test.ts` | Both reds, both bases, head |
| elements-browser | `packages/elements/test/browser/workflow-node.test.ts` | Both reds, both bases, head |
| gates-integration | `gates/test/integration/plant-repo.test.ts` | Head |
| gates-integration | `gates/test/integration/storybook-build.test.ts` | Head |

## Full hosted verification for T013

Run 45223305705 completed all 18 required checks in **57m 06s**, from 17:02:56 to 18:00:02 UTC.
It finished with 113 successful jobs and one skipped opt-in stock comparison. GitHub tested merge
`9c81bf8d033fc195fb2582ceef3beefa37e8b797`, with parents `ff85ae5676ba52f5312719d5253fd938eac4aa94`
and `948c01faf02870fb69f355acd19a272f874044c5`. The merge and candidate share tree
`e10bc63ed9459a9087e54e3c2b777f096ecba160`. [Hosted CI run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705)

The earlier candidate cleared its required checks in 56m 50s. The independent review still found
that the status slot overrode native `hidden` styling. The corrected candidate reran every required
check after adding that regression in both browser suites. [Earlier CI run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45221456769) · [Review finding](round-1.md)

- The Unit tests aggregate passed 10,876 tests in 326 files across six shards, 45m 20s after run
  creation. Its full inventory included the deferred visual and axe integration files, with all 11
  visual cases and four axe cases passing on the exact synthetic merge.
  [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137891788673) · [Unit plan](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/artifacts/14841647833) · [Visual integration evidence](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/artifacts/14846783019) · [Axe integration evidence](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/artifacts/14843211204)
- Changed-source mutation passed all nine shards. They reported 87 mutants, zero survivors, zero
  timeouts and 10 compile-error outcomes. The mixed shard reported the two inherited scoped
  `ObjectLiteral` equivalents for `label` and `kind`.
  [Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137899200942) · [Mixed mutation shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137863378015)
- Visual regression, Accessibility and Content security passed on the same tree. The required run
  also cleared the manifest, Storybook, lint and sign-off checks.
  [Visual regression](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137863045454) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137863045286) · [Content security](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137863044209)
- The hosted Plants aggregate judged all 317 plants from the 17 gates and the registry.
  [Plants result](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137876348201)
