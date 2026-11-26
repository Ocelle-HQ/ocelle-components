# Seeded mutation failure parity

The standard Mutation gate ran the existing `gates/plants/mutation/fail-mixed-survivors` fixture on pinned Node 26.13.0. Its tree is `1e706031b90d516b8793c84e77d3764d7b41b35d` at source commit `195967cffdc96bfdbdf7ca3bc4530fb941e5eefc`. The plant builder prepared the existing base and head, and each invocation used the same base and unchanged file selectors. [Plant descriptor](../../../../gates/plants/mutation/fail-mixed-survivors/plant.json)

| Arm | Selectors | Exit | Surviving findings |
|---|---|---:|---|
| Mixed | `gates/lib/x.ts,packages/elements/src/x.ts` | 1 | `gates/lib/x.ts:3` and `packages/elements/src/x.ts:3`, both StringLiteral |
| Default | `gates/lib/x.ts` | 1 | `gates/lib/x.ts:3`, StringLiteral |
| Elements | `packages/elements/src/x.ts` | 1 | `packages/elements/src/x.ts:3`, StringLiteral |

The exact runtime receipts recorded one surviving mutant and two initial tests per configuration. The split findings reproduced the mixed findings, including both empty-string replacements. Feeding the actual receipts to the comparator returned `matched: true, verdict: 1`. This is failure parity evidence. The hosted #87 comparison measures successful timing separately.
