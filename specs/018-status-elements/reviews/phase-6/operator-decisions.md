# Phase 6 operator decisions

## Q-P6-1: the three rules no Chromium test can observe

The question: R-07 and data-model.md call for `min-inline-size: 0` on the pill host and on `.icon-row`, and for `overflow-wrap: anywhere` on disabled text. The implementer did not write them because their plants survive every test body in Chromium. The behaviour they stand for is tested and passes: a pill shrinks in a flex row and in a grid track, and a disabled pill breaks a long word.

Options:
- (a) Leave them out and amend the docs.
- (b) Write them and mark them unobservable in Chromium.
- (c) Write them and add a WebKit run.

**Decision: (a) Leave them out, as committed.** data-model.md and R-07 are amended to match. The existing tests pin the behaviour. The amendment is assigned to the round-1 fix or to phase 7 (Polish).
