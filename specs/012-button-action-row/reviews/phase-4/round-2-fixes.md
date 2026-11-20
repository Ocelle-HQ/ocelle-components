# Phase 4, review round 2 (operator round from the landing review): fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O2-01 | fixed | fix-2 2041399 (red-fix-2.log: rule (f) gave no finding for `motion-pause`, `shell-delay` and `motion-base` with `delay: true`; `validateSource` did not throw for them; `css()` left `motion-pause` out of the block) | packages/tokens/src/generate.ts (`isDelay`, `recordProblems`, `motionDurations`, the `delay` doc comment); gates/bin/brand-rules.ts (rule (f), `motionDurations`); gates/plants/brand-rules/f-delay-marker-misplaced/; gates/README.md and specs/002-design-tokens/contracts/gates.md (plant lists); packages/tokens README and CHANGELOG |
| O2-02 | fixed | fix-2 2041399 (red-fix-2.log: rule (f) gave no finding for `motion-slow` at `1s`, `var(--ocelle-motion-base)`, `calc(2 * 100ms)` and a per-theme value; `validateSource` did not throw for the first three; the pins of 17 brand-rules cases, 239 other plants and 39 contrast and brand-rules plants, and the README row's plant names, failed) | packages/tokens/src/generate.ts (`notDuration`, `recordProblems`); gates/bin/brand-rules.ts (rule (f), `notDuration`); gates/plants/brand-rules/f-motion-not-ms/; the same docs |

## O2-01

`delay: true` is accepted only on a token of group `motion` whose name ends in `-delay` (tooltip-delay today). The
generator's `validateSource` refuses any other marker ("token <name>: delay: true is allowed only on a motion token
whose name ends in -delay"), so the token build fails on it. Rule (f) reports it at the record ("<name> carries delay:
true, which is accepted only on a motion token whose name ends in -delay"), and since a misplaced marker exempts
nothing, the token is still required at `0ms` in the block (the motion-base case gives both findings). The
generator's `motionDurations` leaves out only valid delays. New fail plant `f-delay-marker-misplaced`.

## O2-02

Every motion-group value is a literal `<number>ms` duration, an angle (`deg`, `grad`, `rad`, `turn`) or an easing
function or keyword (the closed list of plan decision 29), unless the record is a valid delay. Anything else (`1s`,
`var()`, `calc()`, a per-theme value) is a finding at the record in rule (f) ("<name> is <value>; a motion duration
must be a literal <number>ms value") and a `validateSource` problem ("token <name>: value <value> of group motion is
not a literal <number>ms duration, an angle or an easing function"), and it is not required in the block. New fail
plant `f-motion-not-ms`. Pins: 17 brand-rules cases, 39 contrast and brand-rules plants, 239 other plants, still 3
other-plant shards and 76 shards in all.

Checks, plants and mutation: notes.md § Fix round 2 and plants.md § Fix round 2.
