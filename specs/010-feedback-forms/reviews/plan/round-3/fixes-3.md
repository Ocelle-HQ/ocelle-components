# Squad round 3: fixes 3

Applies the unresolved row of `verify-2.md`.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-002 | fixed | data-model.md: field *alert baseline pending* and *Alert path* now say the end-of-task step acts only while the field is still set; if a cancel row or a role change away from `alert` has reset it, the step does nothing, leaving the baseline (none after an insertion or a reveal) and the wait that reset started, so the inserted or revealed `alert` notice changed to `status` in the same task announces once, polite, and the `role change` pending row keeps its comparison; a re-trigger before the step posts its own step and the later one finds none. research.md R-02 § The platform alert event: the handler sets the baseline only if still pending, else does nothing. plan.md decision 10 notes it. contracts/testing.md: plant "alert step after reset" (US1-15 cells inserted, and revealed, as `alert` and changed to `status` in the same task, count 1 polite). spec.md, quickstart.md unchanged: they already require count 1, polite |
