# Phase 2 design change 2: the wait from the empty state's start; the records aligned to the mutation fixes

## Findings

1. **Stop 2** (`stop-2.md`; review round 1, R1-01). On the fixture pages no cell that changes a first-loaded notice
   in the first task after the load passes reliably. The region is rendered empty 11.7 to 21.9 ms before the load
   ends, so the capture's "settled" rule takes the pre-load `D` (350 ms) for that empty state. The copy is written
   `W` (300 ms, after load) after the trigger, so the empty state was kept 339.9 to 379.2 ms over 15 readings: a few
   ms either side of 350. research.md R-02 step 2 and data-model.md *Announce* counted the wait from the last
   trigger only, and R-02 said "announcements reach the tree `W` after the trigger". In process both load states
   share the test `D`, so the in-process cells cannot tell the difference.
2. **R1-03** (`round-1.md`, against `fdc0eff`). The design no longer described the code after the mutation fixes
   `1b5cb85..ccb2f06` (`mutation.md`, § The survivors fixed). In `1b5cb85`, `onContent()` lost its pending check, so
   a light-DOM change while the alert baseline is pending now starts a wait. `leaveAlert()`'s `role change` branch
   now triggers without comparing. The alert path no longer sets the baseline to none on an insertion or a reveal
   (`clearBaseline()` removed). Data-model rows 52 and 55 and the *Alert path* text (lines 76-89) still described
   the removed behaviour. The review checked each removal and found observable behaviour unchanged: the end-of-task
   step takes the baseline one `MessageChannel` task after the trigger, before any wait of `W` started in that task
   can end, so the wait's re-check drops what the removed guards dropped. A change away from `alert` in the same
   task goes through `leaveAlert()`'s `trigger(true)`, which forgets the baseline. Separately, research.md R-02 said
   the region was hidden by "the clip pattern". Since `2070cc8` the `.announcer` rule is a box of
   `--ocelle-border-width` with `overflow: hidden` and `color: transparent` (`forced-color-adjust: none`), with no
   `clip` or `clip-path`.
3. **Arithmetic.** contracts/testing.md and research.md R-09 gave the quiet window as "700 + 700 + 350 = 2100 ms". The
   sum is 1750 ms. That is what the formula (largest `W` + minimum hold + largest `D`) gives, and what the code
   computes: `quietWindow()` in `packages/elements/test/live.ts` and `quiet = 700 + 700 + 350` in
   `test/browser/live-capture.test.ts`.

## Decision

Stop 2: operator, 2026-11-15 (human:jeroennouwsdev), `decision-stop-2.md`: **option (a), the wait counts from the
empty state's start.** A wait ends no earlier than `W` (now) after the last trigger *and* no earlier than `W` of the
load state in which the region's current empty state began, counted from when it began. For a trigger right after a
first load on Chromium, the copy is written about 650 to 690 ms after the trigger. Elsewhere nothing changes. The
decision also hands R1-03 to the planner. Options (b), (c) and (d) were not taken.

R1-03 and the arithmetic: alignment of the records to the code and to the formula. No behaviour changes.

## Files

- `research.md`
  - R-02, shadow structure: "the clip pattern" is replaced by the `.announcer` rule as written (`2070cc8`).
  - R-02 § The platform alert event: until the step runs, a light-DOM mutation or a `tone` change takes its ordinary
    row and starts a wait that the re-check drops. The alert path leaves the baseline as it was, and a role change
    away from `alert` before the step announces as an insertion, with the baseline none. After a role change to
    `alert`, a change away from it before the step starts a wait whose re-check compares. This replaces "light-DOM mutations start no wait".
  - R-02 § Announcing: `W(s)` is defined. Step 2 gains the floor from the empty state's start. It states when an
    empty state begins (rendered while live, shown again, `aria-live` set from `off`, the copy emptied; not a change
    between `polite` and `assertive`), why the floor is the capture's "settled" rule, the stop-2 measurements, the
    650 to 690 ms result, and why nothing else changes, in process included.
  - R-02 § Costs: "Announcements reach the tree `W` after the trigger" now reads `W` after the last trigger and no
    earlier than `W(s)` after the empty state's start, with the first-load case.
  - R-09 § Timing in process: the quiet window is 1750 ms, not 2100 ms, so a cell costs about 2.1 s, not 2.4 s.
- `data-model.md`
  - Row *baseline*: on the alert path the step takes the baseline and leaves it as it was until then. "None from an
    insertion or a reveal" is limited to insertions and reveals outside the alert path.
  - Row *announcer state*: `waiting` ends at the later of the two bounds. The announcer records when its current
    empty state began and the load state then.
  - Row 52 (`role change` pending): announces without comparing first. The re-check compares with the baseline from
    before the change to `alert`.
  - Row 55 removed (light-DOM mutation while pending: "none"). Rows 56 and 57 lose "alert baseline pending is none",
    and row 56 says the re-check drops the wait while the baseline is pending.
  - *Announce*: the floor from the empty state's start, when that state begins, that a restart keeps it, where it
    binds (a trigger after the load, the empty state begun before it), and that it never binds in process.
  - *Alert path*: the baseline is no longer set to none at once. Light-DOM mutations and `tone` changes have no
    pending row, so each still matches at most one row, and the wait they start cannot write. The same-task text and
    tone are part of the alert reading because the step takes the baseline before that wait ends. This replaces
    "start no wait" and "each mutation matches one row only".
- `contracts/testing.md`
  - § Live-region capture: the quiet window is 700 + 700 + 350 = 1750 ms. The longest designed gap from a trigger to
    the write is the largest `W` (`W` after the trigger, or the pre-load `W` from an empty state that began before
    the load). A write after a change right after a first load counts under both rules.
  - § Driver steps, Timing: in process the floor never binds, because there is one `D`. A fake-clock rule test with
    two `D` values (T025a) and the fixture-page cells cover it.
  - § Plants: the new "empty-state start" row (a wait that ignores the empty state's start) must turn red the
    fixture-page first-load cells and the fake-clock rule case. It is added by T025a. The family is named in the
    Seams table's announcer row and in the "Added by" paragraph.
- `contracts/elements.md`, the notice's announcement paragraph: the wait ends no earlier than `W` of the empty
  state's load state after its start.
- `plan.md`, Performance Goals and decisions 7 and 9: the floor and the first-load case, citing the decision.
- `spec.md` FR-008 (the merge sentence): a change right after a first load is announced no earlier than the pre-load
  `W` after the notice was first rendered, about 700 ms. The spec's Assumptions section states no timing and is
  unchanged.
- `tasks.md`
  - T020 (still ticked): names the floor, which comes with T025b.
  - New, unticked: **T025a** (red: `pastFirstLoad` removed from both harnesses, the fake-clock rule test with two `D`
    values, the "empty-state start" plant row, a README item) and **T025b** (green: the rule in `src/live.ts` as a
    protected step, the README sentence, then the unit-test, plant and mutation gates). They follow decision-stop-2.md's
    order of work.
  - § Dependencies: T025a before T025b, and phase 3 takes the rule through the shared `Announcer` (R-06).
- Unchanged: `quickstart.md`, which states no timing figure.

Not changed here (source and tests are outside this role): `pastFirstLoad` in
`packages/elements/test/scenarios/notice.ts` and `notice-matrix.ts`, the `Announcer`'s wait in
`packages/elements/src/live.ts`, the plant fixture and the README. The implementer does them as T025a and T025b.
R1-03 needs no code change.

## Addendum: `withTiming()` (review round 2, R2-03)

T025a (`c3064b5`) added `withTiming(next, run)` to `packages/elements/test/in-process.ts`. It calls
`setAnnouncerTimingForTests` with `next`, runs `run` synchronously and restores the timing it replaced. Its one use
is the fake-clock case of the "empty-state start" plant row (`test/plants.test.ts`), which needs the two `D` values
of `announcerDefaults`. The records said only that in-process.ts calls the setter before each scenario with the test
constant. No behaviour or check changes: both calls are in in-process.ts, so `test/node/timing-setter.test.ts` still
finds that file as the only caller, and `firstTimingReturn()` is not affected.

- `contracts/testing.md` § Driver steps, Timing: names `withTiming()`, its one use, and why the caller check and the
  kept first return stand.
- `research.md` R-09 § Timing in process: the same, after the `test/node/` caller check.
- Unchanged: `data-model.md`, which names the setter without its callers, and `tasks.md`.
