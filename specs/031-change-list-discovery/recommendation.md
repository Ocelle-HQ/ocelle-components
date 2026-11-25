# Change-list discovery outcome

**Keep a composition recipe for Workflow Studio.** Both examples use a heading, ordered changes, and visible state labels. The host supplies the comparison and decides what it means.

| Input or behavior | Reviewed plan | Pinned node upgrade |
| --- | --- | --- |
| Label and reading order | Previous retention, new retention, review judgment, unchanged owner | Previous version, new version, removed outcome, added capability |
| State and value | A changed retention value and a stable owner | Two canonical digests, a removed outcome and an added capability |
| Materiality | The same diff can be supplied with either review judgment | A notice supplies upgrade-specific guidance |
| Host action | Read the comparison | Request a copy of the named digest and receive a result |

The plan uses stacked facts with explicit Previous, New and Unchanged labels. The upgrade combines stacked facts and a notice with a wrapping digest display and two separately named Copy controls. The renderer groups the digests visually. The composed copy requests carry the original strings, and the story host reports the simulated result.

The six built-Storybook tests passed at 320 CSS pixels across light, dark and forced colors. They covered reading order, materiality changes for an identical diff, visible text, the two exact copy requests, focus continuation and local resource loading. The separately built Storybook reports 394 stories. Both hosted Visual and Axe checks passed, and the paired workflow run retained all six discovery cases. [Plan](plan.md) · [Verification](reviews/phase-1/verification.md)

The shared conventions are ordering, explicit labels and host-supplied state. The comparison meanings and actions differ. The recipe lets each host retain those decisions while reusing the existing elements.
