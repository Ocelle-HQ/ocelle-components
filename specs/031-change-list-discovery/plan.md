# Plan for the change-list discovery

## Constitution check

The fixtures compose existing framework-free elements and use Storybook's normal CSS and rendering. Data enters as host fixtures. Native headings and facts preserve reading order, and native buttons preserve keyboard activation. Visual emphasis uses existing tokens. The built story contains no inline styles or script and runs under the existing story CSP. The only deliverables are compositions, tests, baselines and the comparison record.

## Phase 1. Compare two runnable compositions

| Task area | Exact write scope | Prerequisite |
| --- | --- | --- |
| Test drafting for plan | `storybook/test/integration/change-list-plan.test.ts` | Agreed story ID and host materiality control |
| Test drafting for upgrade | `storybook/test/integration/change-list-upgrade.test.ts` | Agreed story ID and copy request contract |
| Plan example | `storybook/stories/change-list-plan.stories.ts` | Combined test-only red |
| Upgrade example | `storybook/stories/change-list-upgrade.stories.ts` | Combined test-only red |
| Integration | `storybook/.storybook/stories-layout.css`, four baseline PNGs, current visual and axe inventory selectors, phase evidence, and the recommendation | Both examples pass their assigned checks |

Use Storybook IDs `workflow-studio-plan-revision--reviewed-plan` and `workflow-studio-node-upgrade--pinned-versions`. Each story has an independent title and a single bounded column. The plan uses explicit Previous, New and Unchanged labels. It takes `requiresReview` as a boolean story input, with default true, and labels the supplied materiality independently of the diff. The upgrade groups explicit Removed and Added lines and uses facts, copy fields and notice. It handles `ocelle-copy-field-request` in its Storybook host and writes the outcome to the field's status. Inject a local clipboard test double before loading the built story. Assert the digest payload, accessible status text, and exactly one request for each keyboard activation.

The test workers own separate files. The implementation workers own separate story files and can run in separate worktrees from the canonical red proof. The owner verifies returned scope and sign-off before staging and runs the combined checks. The same owner builds the final Storybook, inspects the inventory and updates capture counts and four baseline PNGs. The team reports dispatch-to-return, return-to-staging, and combined green elapsed time. Hosted CI timing belongs to the tested merge candidate. Use Op 030's handoff check as soon as its verified revision is available.

Each browser test discovers its story by exact ID before using its route, to prove a missing-story assertion on red. On green load the actual built iframe at a 320 CSS-pixel viewport, verify source order and no page overflow, and repeat the semantic observations in forced colors. Check both exact digests where the order matters and verify native Tab order and activation. Apply the same security and configuration checks that protect other built story fixtures.

Use one shared layout only where the named fixtures need a narrow, bounded width. Keep each consumer responsible for its supplied data, labels and host actions. Compare the observed common concepts with their divergent meanings. Record a recipe recommendation if a common public API still needs design decisions. If both examples demonstrate a complete common contract, describe its bounded extraction scope for a follow-up.

## Evidence

Use the phase red, final-on-base and green receipts. Record exact candidate Unit, Visual and Axe check links, affected Plants, and review status. Keep all original hosted checks and compare with the opt-in CI measurements only when the exact inventory and receipts match.
