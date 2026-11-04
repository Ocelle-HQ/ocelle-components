# Operator decision, phase 5 review round 1

Decided by: human:jeroennouwsdev, 2026-11-04.

## R1-01: `pairsText` in a plant's `delta.json`

Decision: **(c) closed form.** Replace the free-text `pairsText` part with a closed form,
`"pairsList": "empty" | "not-json"`. No plant can then carry a copy of the pair list. Amend contracts/gates.md
§ Configuration set and data-model.md to describe the new part first. Then change `gates/lib/plant-repo.ts`, the two
breaking plants (`empty-list`, `unparsable-list`) and the README test-first. A delta cannot have both `pairs` and
`pairsList`.
