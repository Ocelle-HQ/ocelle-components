# Plan for the change-list discovery

## Constitution check

The fixtures compose existing framework-free elements with Storybook's external layout stylesheet. Host inputs supply the comparison and materiality judgment. Visible labels, native headings and facts carry the change meanings in document order. Native Copy buttons provide keyboard activation, and the host reports the simulated result. Styling uses the existing tokens, including the focus treatment and digest grouping in the existing elements. The deliverables are two compositions, their tests and baselines, and the comparison record.

The existing Storybook integration server serves the built iframe without a CSP header. Storybook's own harness includes inline scripts. Inspect the DOM emitted by each composition, including its light-DOM descendants, for inline scripts, style markup and attributes, and inline event-handler attributes. Assert that every loaded request stays on the bound origin from navigation through interaction. Keep the root `gate:csp` in its normal scope and use the existing package browser fixtures for strict-runtime CSP evidence.

## Phase 1. Compare two runnable compositions

| Task area | Exact write paths | Prerequisite |
| --- | --- | --- |
| Draft plan browser tests | `storybook/test/integration/change-list-plan.test.ts` | Agreed story ID and materiality input |
| Draft upgrade browser tests | `storybook/test/integration/change-list-upgrade.test.ts` | Agreed story ID, digest representation and copy contract |
| Build the plan example | `storybook/stories/change-list-plan.stories.ts` | Combined test-only red |
| Build the upgrade example | `storybook/stories/change-list-upgrade.stories.ts` | Combined test-only red |
| Integrate the fixtures | `storybook/.storybook/stories-layout.css`, the four baseline PNGs listed below, the selected inventory paths below, and `specs/031-change-list-discovery/reviews/phase-1/test-scope.txt` | Both examples pass the workers' checks and the owner records the workflow pins |
| Record the pilot and recommendation | `specs/031-change-list-discovery/reviews/phase-1/workflow-pins.md`, other phase evidence, and `specs/031-change-list-discovery/recommendation.md` | Record pins before return verification and inventory integration. Complete the comparison after combined green. |

### Fixture behavior

Use the built Storybook IDs `workflow-studio-plan-revision--reviewed-plan` and `workflow-studio-node-upgrade--pinned-versions`. Keep independent story files and pair each with its own integration test. Both examples use a bounded single-column layout. Both retain their own labels and host actions.

The plan example shows explicit Previous, New and Unchanged labels. It takes `requiresReview` as a boolean story input, defaulting to true. The input supplies the judgment for the retention diff. Load the same built story with both values through Storybook's real args input path. Assert each expected visible judgment and identical Previous, New and Unchanged labels, values and reading order in both renders.

The upgrade example uses facts, notice and explicit Removed and Added labels. For each digest, show the original canonical text in one wrapping `ocelle-code-block` with the public `digest` property. It presents its prefix as supplied and groups the remainder into fours with the existing renderer. Supply the same original, unspaced string as the related `ocelle-copy-field` value so the actual request carries those exact bytes. Limit the CSS rule that hides the duplicated `::part(value)` text to the upgrade fixture. Keep the Copy button, focus ring and status region available. Use separate field group labels and public `copy-label` values for the distinctly named Copy previous digest and Copy new digest actions.

The delivered upgrade host handles a real composed `ocelle-copy-field-request` by recording the text in memory and setting the originating field's `status` property after it receives the request. Its copy result identifies the simulated outcome. Use the delivered host in the browser tests with ordinary clipboard permissions. Observe the actual delayed event and wait for the originating field's polite status result. Assert the complete request sequence with exactly one request per activation, matching each requested string to the canonical code-block text. Check visible digest grouping and the preserved exact canonical text.

### Browser verification and focused scope

Use the `storybook-integration` project's injected per-run Storybook build for both index discovery and rendering. Each browser test asserts that its exact story ID is present in the injected index before opening that story's built iframe. Capture the missing-ID assertion as the test-only red. Run both behaviors together on the canonical integrated candidate.

At 320 CSS pixels, exercise pinned light and dark themes and forced colors. Assert the specified reading order and no horizontal page overflow. Inspect the flat tree, including rendered shadow content, using the existing `readTextBoxes` helper or equivalent rendered-text geometry. Check that each required label, value, change state, judgment and digest has nonempty visible text bounds in the viewport without horizontal clipping, including at internal overflow ancestors. Inspect each whole digest's rendered groups, including the prefix, at the narrow width.

Find each real Copy button by role and its distinct name. Use native Tab to reach the first button. Verify focus and a visible focus ring and check that the button and ring are inside the viewport and their clipping ancestors in both pinned themes and forced colors. Activate the button, assert its exact request and accessible simulated result, and verify focus remains on it. From that position use a real Tab to reach the other named Copy button without programmatic focus. Repeat the focus, bounds, activation, payload and status checks for the second button.

The integration owner writes `reviews/phase-1/test-scope.txt` with explicit repository-relative paths for all runnable consumers affected by the story and CSS changes. Include the following in local scope:

- `storybook/test/integration/change-list-plan.test.ts`
- `storybook/test/integration/change-list-upgrade.test.ts`
- `storybook/test/integration/elements-stories.test.ts`
- `storybook/test/integration/render.test.ts`
- `gates/test/integration/storybook-build.test.ts`
- `gates/test/integration/plant-repo.test.ts`

Check the list against the selected workflow pin and any additional shared support changes. Include eligible count-only Visual and Axe inventory files from the mapping below as `ci-only <repository-relative path>` only if the exact file is allowed by the selected runner and it carries only collateral count updates. Keep named red proofs, behavior cases, any noneligible changed test and both new browser files local. For every deferred case require the candidate revision, `gates-integration` project, exact Unit inventory file and successful shard receipt for that file and the successful corresponding dedicated Visual or Axe gate. Missing, stale or mismatched evidence leaves the review requirement open.

### Inventory and baseline integration

The existing control starts with 392 stories and 784 story-theme PNGs. With the two specified story IDs, inspect the new built index and baseline inventory and expect 394 stories and 788 PNGs. Use the measured inventories when updating exact expectations. Capture the four new PNGs in the pinned visual environment:

- `storybook/baselines/workflow-studio-plan-revision--reviewed-plan.light.png`
- `storybook/baselines/workflow-studio-plan-revision--reviewed-plan.dark.png`
- `storybook/baselines/workflow-studio-node-upgrade--pinned-versions.light.png`
- `storybook/baselines/workflow-studio-node-upgrade--pinned-versions.dark.png`

The integration owner uses the concrete paths for the selected workflow pin:

| Contract | Current control | Reviewed Op 030 candidate with the split |
| --- | --- | --- |
| Whole-repository Visual success count | `gates/test/integration/visual.test.ts` | `gates/test/integration/visual.test.ts` |
| Visual findings count | `gates/test/integration/visual.test.ts` | `gates/test/integration/visual-findings.test.ts` |
| Unchanged baseline write count | `gates/test/integration/visual.test.ts` | `gates/test/integration/visual-capture.test.ts` |
| Whole-repository Axe inventory | `gates/test/integration/axe.test.ts` | `gates/test/integration/axe.test.ts` |
| Exact Storybook build count | `gates/test/integration/storybook-build.test.ts` | `gates/test/integration/storybook-build.test.ts` |
| Plant repository baseline count | `gates/test/integration/plant-repo.test.ts` | `gates/test/integration/plant-repo.test.ts` |
| Visual token Plant expectations | `gates/plants/visual/fail-token-changed/plant.json` | `gates/plants/visual/fail-token-changed/plant.json` |

Verify the candidate mapping against the reviewed split before editing counts. Retain the existing Visual and Axe positive and negative checks. Run the affected Visual token Plant under the pinned capture environment on each inventory used in the comparison. Update that Plant's expected result locations only for measured findings and verify the exact result afterward.

### Workflow pilot checkpoint

The control is the existing workflow at repository base `6a6d74c246e3d64e3470f3d71e7c52c569db8f29`. Record the control and the exact reviewed and verified Op 030 candidate SHA in `reviews/phase-1/workflow-pins.md` before the first worker-return check and before inventory integration. Record the corresponding tree and inventory mapping for each run. The exact Op 030 SHA must contain the reviewed handoff checker, focused review scope and Visual split before using them for the pilot. Test drafting can use the control while Op 030 is pending. A control-only run supplies control evidence. Completing the pilot requires a measured candidate run.

Start the independent implementation worktrees from the canonical test-only red. The worker ownership stays limited to the two disjoint story paths. The integration owner uses the pinned verifier on each return to confirm the head, scope and sign-off, then stages the verified returns and runs combined green. Record dispatch-to-return, return-to-staging, combined green and hosted elapsed time, identifying each tested candidate. Compare the same fixture revision, including identical story code, layout and PNGs, with each workflow's corresponding inventory mapping. Verify that test identities, expected outcomes and required named checks match through the split mapping.

The planned stories, tests and stylesheet produce an empty positive mutation scope with the existing changed-source selectors. Use the separate source-bearing #94 replay on its pinned control and candidate inputs for mutation grouping evidence. Record it as a workflow comparison with its own source and runner receipts.

## Discovery decision and evidence

Map the proposed shared inputs for labels, ordering and change states to both runnable examples, with their distinct domain meanings, materiality and host actions. Recommend a composition recipe when a shared public contract is still unresolved. An extraction recommendation needs a bounded follow-up with the complete contract demonstrated by both examples.

Retain the phase red, final-on-base and green receipts. Record exact candidate Unit, Visual, Axe, strict-CSP and other required check links, affected Plants, and review status. Keep the existing required checks on the final candidate.
