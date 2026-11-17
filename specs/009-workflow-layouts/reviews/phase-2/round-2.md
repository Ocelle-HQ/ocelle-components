---
phase: 2
round: 2
verdict: approved
base: 247991d7f2fdd7163d768f771279d17014d9c0b3
head: fa2839c
tdd_check: pass
---

# Phase 2 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | `specs/009-workflow-layouts/data-model.md:19` | `maskFigures` still says the bar is "`offsetHeight − clientHeight` less block borders". The contract (`contracts/overflow-region.md:107-108`, `:145`) and research.md R-05 (`research.md:210-212`) now say there is no block border to subtract, because the module sets `.region-box { border: 0 }`. The two statements do not contradict each other: with a 0 px border the subtraction is 0, and the code's figure (`overflow-region.ts:385`) equals the data model's. The data model describes the value, and it is still right. The contract is where the measuring rule and its dependence on `border: 0` belong, and that is what R1-01 asked for. The data model's wording is now a redundant term, not a lag, so R1-01 is complete without it. | Optional: when data-model.md is next touched, word it as the contract does ("`offsetHeight − clientHeight`; the module sets `border: 0`"). |
| R2-02 | note | `specs/009-workflow-layouts/contracts/overflow-region.md:121` | R1-02 is carried forward as a note. The fix note defers it as instructed. `hostDisconnected` still says "removes its listeners", which is broader than the code (`overflow-region.ts:344-353`). Nothing observable changes. | None this phase; see R1-02. |

## Test quality

No source, test, stylesheet or configuration file changed after round 1. `git diff --stat 333139e fa2839c -- ':!specs'`
is empty, and the working tree is clean. Round 1's test-quality findings therefore still hold unchanged:

- the red evidence of `ec2e003` and the scaffold `624461c`;
- no weakened test;
- no vacuous assertion;
- full scenario and keyboard coverage;
- `gate:mutation -- --base 247991d`: 438 mutants, none surviving, 23 equivalent records accepted.

The fix is records-only, so the missing `fix-1` red test is correct: `red-commits` needs no `fix-1` entry, because no
behaviour changed.

`tdd-check.json` is `pass`. It was taken at `1a35ac8`. The only commits after it are `333139e` (the check itself),
`11e5348` (an operator-decision record), `c8c9167` (the round 1 review) and `fa2839c` (Markdown only). None of them
touches code, so the result applies to HEAD.

## Checks run

As the caller instructed, the code gates were not re-run. They all passed on `333139e` in round 1, and the code at
`fa2839c` is the same (the diff above is empty). I checked the following by reading:

- **The fix is Markdown only.** `git show fa2839c --stat` lists four files, all under `specs/009-workflow-layouts/`.
- **The contract matches the code.** Each R1-01 item is checked in the next section.
- **No other feature document still carries the old interface.**
  - I searched `specs/009-workflow-layouts/**/*.md` outside `reviews/` for `fadeStart`, `fadeEnd`, `block border`
    and `slotchange`.
  - The remaining `fadeStart`/`fadeEnd` hits (`contracts/overflow-region.md:78`, `data-model.md:15`, `:18`,
    `tasks.md:317`, `research.md:339`) are the module's outputs. They are correct, because they are no longer inputs
    to `clearanceScroll`.
  - The remaining `slotchange` hits name the event, not where it is heard. `tasks.md:326` lists it among the module's
    listeners in general terms, which still holds.
  - The only hit for "less block borders" is `data-model.md:19` (R2-01).
- **Sign-off.** `fa2839c` carries a `Signed-off-by` trailer. Its subject is `fix(...)`, and the fix note reports
  that `gate:signoff` was run on the range.

## Earlier findings

**R1-01 (blocking): resolved.**

1. **Signature.** The contract (`contracts/overflow-region.md:160`) and T012 (`tasks.md:202`) now give
   `clearanceScroll({ ring, box, fade, direction })`. This matches `overflow-region.ts:65`. Both also say that the
   sides that still fade are worked out from the new position. The contract's "an edge within 1 px of its end does not
   fade" matches `fadesStart`/`fadesEnd` at `overflow-region.ts:71-72` (`> 1`). R-06 (`research.md:310-311`) already
   said "each inline edge that would then still fade", so leaving it unchanged is right.
2. **`slotchange`.** § Lifecycle `hostUpdated` (`contracts/overflow-region.md:120`) now says the module listens on
   the box, where `slotchange` bubbles from every slot in the track. This matches `overflow-region.ts:364`. Its
   remark that the event is not composed is accurate. research.md R-03 (`research.md:122-123`) says the same.
3. **`border: 0` and the mask figures.**
   - The § Stylesheet `.region-box` row (`contracts/overflow-region.md:145`) now lists `border: 0`
     (`overflow-region.ts:126`).
   - It names both things that rely on it. The thickness `offsetHeight − clientHeight` is at `:385`. The clearance
     takes the border-box inline start as the client area's at `:459`.
   - § Effects, Mask figures (`:107-108`) and research.md R-05 (`research.md:210-212`) no longer subtract a block
     border.

The required change named every one of these places, and each now agrees with the code. I found nothing new or wrong
in the edited text. The text adds no new requirement that the code does not meet. One edited line in the contract
(`:108`) and one in tasks.md (`:202`) are longer than the surrounding wrapped lines. That is cosmetic: no gate lints
these files.

**Notes R1-02 to R1-05.** They are deferred in `round-1-fixes.md` as round 1 allowed. R1-03 (recheck the `slotchange`
equivalent record when the board reuses the module) remains an obligation of phase 3.
