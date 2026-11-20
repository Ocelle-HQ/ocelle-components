# Spec check 3: fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-3-01 | fixed | Option 1: the current mark takes precedence over the hover surface. spec.md FR-036 (a row with `current` keeps its `--ocelle-color-accent-low` surface and bar on hover; only a `default` current row's border changes, a `flush` current row shows no hover change); FR-037 (the mark stays on hover); FR-031 (a current flush row does not change on hover); FR-042 (hover border also against `--ocelle-color-accent-low`, for a hovered current row; the current bar stays against `accent-low` only, so `color-current`'s declared grounds suffice); US4 scenario 8 (hovered current row, both presentations); US5 scenario 4 (hovered current row keeps the full mark) |
| SPEC-3-05 | fixed | spec.md US4 scenario 6 (limited to a flush row with no `current` and no hover) |

Notes SPEC-3-02, SPEC-3-03, SPEC-3-04, SPEC-3-06 and SPEC-3-07 are not blocking and are left open for the plan.
