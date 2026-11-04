# Phase 5 notes (implementer)

## For the operator: the `main` ruleset (T062, FR-022)

This phase adds two CI checks, **Contrast** (job `contrast`) and **Brand rules** (job `brand-rules`). They block a
merge only once the ruleset (or branch protection) on `main` requires them: the ruleset must require the fourteen
checks `gates/README.md` lists under "Required checks on `main`" (the twelve of 001 plus these two). Agents do not
change the ruleset; this is the operator's change.

## Contract gap: breaking plants of the pair list (`pairsText`)

contracts/gates.md requires the `contrast` breaking plants `empty-list` and `unparsable-list` (FR-020) and also says
that a plant's `tree/` must not hold `pairs.json`, while the `pairs` part of `delta.json` changes entries by key and
always writes a valid list. No form of the contract can present an empty or unparsable list. The implementation adds
a fourth `delta.json` part, `pairsText`: the pair list's whole text, for a breaking plant whose input is a list that
is not one. It excludes `pairs` in the same delta (the plant job rejects both together). The rule that `tree/` never
holds `pairs.json` stays absolute. The reviewer may prefer another form (for example allowing `tree/pairs.json` in an
error plant only); the change is local to `parseDelta` and `buildRepoTree` in `gates/lib/plant-repo.ts`.

## #5 figures

Every A.7 figure (21 entries with `source: "#5"`) matches the computed ratio at its precision; none was corrected.
The light `color-chrome-muted` on `color-chrome-hover` is recorded as computed, 6.22 (SPEC-2-01). The state colours on
their own grounds are recorded from first computation (5.34 to 9.42, within FR-017's [5.25, 9.45)).
