# Phase 3 (evidence chain): the operator's inventory decisions

Asked on 2026-11-22 as multiple choice, before phase 3 starts. The questions are in reviews/phase-1/inventory-questions.md § Evidence chain and § Added after the `develop` re-inventory. How the issue texts bear on them is in reviews/issue-texts-check.md.

| Question | Decision |
|---|---|
| IQ-27, the chain is not a Desktop V2 family | (a) Build as specified: phase 3 builds the chain for #13 and the Ocelle console, and the README maps the library's chain role by role. |
| IQ-18, the chain's input | (a) Slotted steps: Q3 (a) stands. The README maps `stages` to one `ocelle-evidence-step` per stage, and a stage's `id` to an `id` the consumer sets on the step. |
| IQ-19, what a stage holds | (a) Free content: the ordinal step as specified. The README maps the label, value and annotation to the consumer's markup in the step's content, and a later issue covers a valued stage. |
| IQ-20, a tone per stage | (a) No tone: the README maps tone to the state worded in the step's text, and to a later issue. |
| IQ-21, the narrow layout | (a) Wrap: FR-034 stands. The README maps the stacked layout to the wrapping chain, which follows its container. |
| IQ-22, a direction arrow | (a) A plain line: the README maps the arrow to the plain connector, and a later issue covers an arrowhead. |
| IQ-23, empty and invalid input | (a) 013's `ocelle-empty-state`: FR-025 stands, and the README maps the empty state to 013's element placed by the consumer. The invalid-input state has no counterpart. |
| IQ-24, the chain's parts | (a) Map, with no new parts: `list` maps to `list`, and `stage` to the `ocelle-evidence-step` host and its `content` part. `connector` and `empty-state` map to none. |

With Q-T4 (a) and Q-T5 (b) (reviews/issue-texts-check.md), every inventory question is now answered.
