# Change-list discovery for Workflow Studio

**Branch** `031-change-list-discovery`
**Issue** #75

## User scenarios

### US1. Review a plan revision

A reviewer opens the plan revision example and reads that retention changed from 24 hours to one hour. The previous value appears before the new value in the document order, and each value has an explicit label. The same example presents an unchanged field and its value.

### US2. Compare pinned node versions

A reviewer opens the node upgrade example and identifies the previous and new digests, one removed outcome, and one added outbound capability. The digest labels distinguish the versions, and the change labels explain which value was added or removed. The reviewer can reach and activate either digest's Copy control from the keyboard.

### US3. Decide whether to extract a shared element

A library maintainer runs the two examples and compares their presentation inputs, interaction and semantics. The maintainer can see which rules both consumers can use and which remain owned by the host. The decision record recommends keeping a recipe or identifies a bounded extraction follow-up with a common contract.

## Requirements

- **FR-001** Provide one runnable Storybook composition for each consumer. Show the plan's previous and new retention values in source order and label its unchanged field.
- **FR-002** In the upgrade composition, label both long digests and identify the removed outcome and added outbound capability in text. Use the existing facts, copy field and notice primitives.
- **FR-003** Keep labels, values and controls readable at 320 CSS pixels without horizontal page scrolling. Preserve meaning in a single column and with forced colors enabled.
- **FR-004** Give each digest's Copy control a distinct accessible name and keep native keyboard operation. The host reports the result of the copy request using the existing copy-field contract.
- **FR-005** Supply the difference and any materiality judgment as fixture inputs. Keep both examples runnable without live Catalog, policy, or upgrade services.
- **FR-006** Document common inputs, divergent domain meanings and the recommendation after running the examples. A future public element is a separate decision with its own scope.

## Verification

Use browser assertions against the shipped Storybook examples for reading order, narrow layout, forced colors and keyboard copy. Generate the light and dark baselines under the repository's pinned visual environment. Keep the inventory, manifest, strict CSP, Storybook, Unit, Visual and Axe evidence on the tested candidate. Capture worktree dispatch, scoped returns, staging and hosted checks as separate timings when the task graph permits disjoint work.

## Success criteria

- Both Storybook compositions load and demonstrate their distinct changes with readable labels across the supported presentation modes.
- Each keyboard Copy activation requests the exact labeled digest once.
- The decision record cites observed evidence from both examples and states which decisions and behavior stay with the host.
