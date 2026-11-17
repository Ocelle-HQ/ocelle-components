# Phase 4: SC-001 coverage check (T054)

Checked at `be51a8c` (exempt: a review record, no behaviour; see `tdd-exempt.md`).

**Sources.** The inventory is research R-11's table (`research.md` § R-11, 53 rows, from `sources/013-inputs.md`
Part A, read at kitty-mission-ui `c994c8ea`). The mapping is `packages/elements/README.md` § Mapping from
kitty-mission-ui (lines 337 to 396): one table, columns "Class family", "Role", "Element and variant", whose rows
fall in three family blocks (`.sk-facts`, `.sk-empty-state`, `.sk-progress`). The task's "three README mapping
sections" are these three blocks of the one table; the readme tests (phases 1 to 3) assert each row by its role name.

**Method.** Both tables were extracted mechanically (the family and role cells of each `| \`.sk-…\` |` row) and
compared with `diff`: the (family, role) pairs are identical, in the same order, with no extra or missing row and no
duplicate role. This also checks each row's `.sk-*` family name against the inventory, which the readme tests cannot
do (operator decision I1: no `sk-` string in test code).

## Result

| Family | Inventory rows | README rows | Rendered uses (R-11) | Family name matches on every row | Missing | Extra |
|---|---|---|---|---|---|---|
| `.sk-facts` | 16 | 16 | 36 | yes | 0 | 0 |
| `.sk-empty-state` | 19 | 19 | 82 | yes | 0 | 0 |
| `.sk-progress` | 18 | 18 | 63 | yes | 0 | 0 |
| **All** | **53** | **53** | **181** | yes | **0** | **0** |

The "Uses" column sums to 181 row-uses because one rendered use can carry several rows (a modifier and a state); R-11
counts 47 rendered uses (8, 25, 14).

**Each row's third cell** is one of the three forms SC-001 allows:

- an element and variant (34 rows), naming `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state` or `ocelle-progress`
  and, where one applies, the attribute, value or slot;
- the consumer's remedy (16 rows, each starting "consumer's:");
- not this mission (3 rows): "empty-state inline" (never used, no inline variant, R-11), "empty-state card dashed"
  (the #509 family, operator decision IQ-07 (a)) and "facts value mono" (see below).

No row's remedy puts a `class` attribute on an element (`class=` occurs in none of the 53 rows).

**Decision behind each non-element row.** The README holds no planning ids (its readme test forbids them), so the
decisions are traced here through R-11: the consumer's rows "facts term regular" (IQ-03 (a)), "facts value tooltip"
and "facts value ellipsis" (IQ-04 (b)), "empty-state message", "empty-state card" and "empty-state ops card"
(IQ-07 (a), IQ-06 (a)), "empty-state focus target" and "progress heading" (IQ-11 (b)), "progress labelled by heading"
(IQ-10 (a)), "progress fallback text" (IQ-15 (b)); the others are content or attributes the consumer already owns
(FR-003). `inputs-decisions.md` holds the operator's choices.

**Observation, not a gap.** "facts value mono" reads "not supported: no monospace; …" in the README where R-11 reads
"Not this mission: no monospace (constitution II)". The row exists and names the reason and the consumer's
alternative (sans with tabular figures, `--ocelle-facts-value-size` or a compact region). The wording says the
variant is ruled out by the constitution rather than deferred, which matches R-11's reason. Recorded for the
reviewer; it leaves no variant without a row.

**Gaps.** None. Every variant of R-11's inventory has a README row with a matching family name, so nothing goes to the
operator.
