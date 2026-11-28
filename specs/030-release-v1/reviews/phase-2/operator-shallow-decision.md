# Operator decision: the `shallow: true` plant header (030, phase 2 review R1-01)

Asked by the run, answered by the operator (multiple choice), 2026-11-28.

**Situation.** The green commit added a `shallow: true` header to the commits.txt plant format. It writes that
record's commit to `.git/shallow`. The `break-shallow` plant needs a shallow repository, and git will not track a plant
file under `.git/`. No operator decision or research entry (R-17) covered the header. Round 1 also found that no test
covers it.

**Options asked:** accept it / drop it and build the shallow plant another way.

**Decision: accept it.** The header joins `args` and `commit:<n>:<path>` (operator-plant-format-decision.md). It stays
documented in spec 001 `contracts/plants.md`. The fix round for R1-01 must still add its red-first unit and
integration tests.
