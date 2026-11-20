# Operator decision: triage 017, Q0 (2026-11-15)

Record: `triage/017-element-shards-by-mutant-count.md` (decision `decision-needed`, approved by the operator).

Question Q0, "Is the work needed at all, given op 015's 45-minute limit?" Answer: **B. Measure first, then decide.**

- Run mission 010's branch (or 010 merged with 008's) on a CI draft PR under main's 30-line plan, as op 015 Q2 A did.
- Go (op `ops/017-element-shards-by-mutant-count`) only if the worst element shard is over the threshold, about
  30 minutes (two thirds of op 015's 45-minute limit). Otherwise no work: close #42 as covered by op 015.
- Q1 to Q5 stay open until the measurement is in; they are asked only if the answer is go.

Source: the operator (jeroennouwsdev), answering the triage gate in the /ocelle-run session for #42.
