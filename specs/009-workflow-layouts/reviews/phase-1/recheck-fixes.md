# Fixes for the #10 recheck (T001, phase 1)

Applies `operator-decisions.md` to the differences of `recheck-10.md`. Task IDs kept; spec.md unchanged (no spec line
names the `csp` gate's Storybook check).

| ID | Resolution | Where |
|---|---|---|
| D1 | decided: (b) copy + red test | research.md R-15 (Decision, Stories; Story test; Rechecked note) and R-17 (Frames); contracts/elements.md § Stories; tasks.md T020 (copy check, red in phase 2), T027, T041, T058 |
| D2 | decided: story test asserts rule | research.md R-15 (Decision, Stories: the `csp` gate's Storybook check dropped; Story test: no `style` attribute or class on story markup, no request outside the origin, no CSP count); contracts/elements.md § Stories; tasks.md T020 ("zero CSP violations" dropped), T037, T053 |
