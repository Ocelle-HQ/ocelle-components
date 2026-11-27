# Change-list discovery for Workflow Studio

**Branch** `031-change-list-discovery`

**Issue** #75

## User scenarios

### US1. Review a plan revision (Priority P1)

A Workflow Studio reviewer needs to tell which parts of a reviewed plan changed. The reviewer can read both retention values and understand which field stayed the same.

**Independent test.** Run the plan revision fixture and read its labels and values in document order at 320 CSS pixels with forced colors enabled.

- **Given** a reviewed plan with retention previously set to 24 hours and now set to one hour, **when** the reviewer opens the plan revision fixture, **then** the previous value, 24 hours, precedes the new value, one hour, in reading order. Each value has its own visible previous or new label.
- **Given** a field present with the same value in both revisions, **when** the fixture lays out as one column at 320 CSS pixels in forced colors, **then** its name, value and explicit unchanged state remain readable alongside the ordered retention values without horizontal page scrolling.
- **Given** that the fixture host supplies a materiality judgment for the retention change, **when** the reviewer reads that change, **then** the example presents the supplied judgment with it. Supplying a different judgment for the same diff changes the displayed judgment.

### US2. Compare pinned node versions (Priority P1)

A Workflow Studio reviewer comparing pinned versions needs to identify the digests and the capabilities that differ. The reviewer can copy either digest by keyboard.

**Independent test.** Run the node upgrade fixture and verify its labels, reading order and keyboard Copy results at 320 CSS pixels with forced colors enabled.

- **Given** two distinct long digests, one removed outcome and one added outbound capability, **when** the reviewer opens the node upgrade fixture, **then** the previous digest precedes the new digest in reading order. Visible labels distinguish both digests and identify the removed outcome and added outbound capability as such. Each digest uses the established four-character grouping while preserving its canonical text.
- **Given** that the upgrade fixture lays out as one column at 320 CSS pixels in forced colors, **when** the reviewer follows the comparison in document order, **then** both digests remain readable, the previous and new labels still distinguish them, and the added and removed labels still identify their respective values. The page has no horizontal scrolling and both Copy controls remain reachable.
- **Given** either digest's distinctly named Copy control, **when** the reviewer reaches it and activates it with the keyboard, **then** the host receives one request with that digest's exact value. The fixture host reports an accessible result for that activation and the reviewer can continue using the keyboard. Exercise both controls with the fixture's simulated copy handling.

### US3. Decide whether to extract a shared element (Priority P2)

A library maintainer needs evidence from both consumers to decide whether a shared element would carry a common contract. The decision record recommends keeping a composition recipe or identifies a bounded extraction follow-up.

**Independent test.** Run both examples and compare the decision record with what the examples display and how each is used.

- **Given** both runnable examples, **when** the maintainer compares their presentation and interaction, **then** the decision record explains how each proposed shared input maps to each example and identifies the domain meanings owned by each host, including the diff and materiality judgment.
- **Given** that evidence, **when** the maintainer reads the recommendation, **then** it identifies either the reusable recipe or a bounded extraction follow-up. An extraction recommendation cites the same contract demonstrated by both examples.

## Requirements

- **FR-001** Provide one runnable Storybook composition for each consumer. In the plan composition, label the previous and new retention values in source order and identify the unchanged field, its value and its unchanged state in visible text.
- **FR-002** In the upgrade composition, label the previous and new long digests in that order and identify the removed outcome and added outbound capability in text. Use the existing facts, copy field and notice primitives.
- **FR-003** Keep labels, values and controls readable at 320 CSS pixels without horizontal page scrolling. Preserve the same distinctions and reading order in both compositions in a single column and with forced colors enabled.
- **FR-004** Give each digest's Copy control a distinct accessible name and keep native keyboard operation and visible focus. Present the digest with the established four-character grouping. Each activation requests the exact canonical digest, with its original prefix and characters and without inserted spaces. The fixture host simulates the copy, reports an accessible result through the existing copy-field contract and preserves keyboard focus.
- **FR-005** Supply the diff and materiality judgment as fixture inputs. Display the plan retention change's materiality judgment as supplied by the host. Keep both examples runnable independently of Catalog, policy and upgrade services.
- **FR-006** Document how each proposed shared input applies to both runnable examples, where their semantics diverge, and which decisions stay with the host. Base the recommendation on the observed behavior of both examples. A future public element is a separate decision with its own scope.

## Verification

Use browser assertions against the shipped Storybook examples for reading order, narrow layout, forced colors, both keyboard copy paths and the host's reported results. Verify the plan fixture presents the host's materiality judgment as supplied. Generate the light and dark baselines under the repository's pinned visual environment. Keep the inventory, manifest, root CSP, Storybook, Unit, Visual and Axe evidence on the tested candidate. Verify the rendered compositions are free of inline executable or style markup and load resources from the Storybook origin. Existing package browser fixtures provide strict-runtime CSP evidence. Capture worktree dispatch, scoped returns, staging and hosted checks as separate timings when the task graph permits disjoint work.

## Success criteria

- Both Storybook compositions load and communicate the specified changes and unchanged state with readable labels and the expected reading order at 320 CSS pixels in forced colors.
- Each keyboard Copy activation requests the exact labeled digest once and yields an accessible fixture-host result.
- Changing the supplied materiality judgment for the same retention diff changes the displayed judgment.
- The decision record cites both runnable examples, maps proposed shared inputs to each, and explains the recommendation and host responsibilities.
