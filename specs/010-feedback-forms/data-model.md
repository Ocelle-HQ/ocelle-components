# Data Model: Feedback and Forms

The "data" of this feature is element state: what each element holds, what it derives, and how it moves between
states. Public members are in `contracts/elements.md`; the reasons are in `research.md`.

## Notice (`ocelle-notice`)

| Field | Source | Values | Derived from |
|---|---|---|---|
| `tone` | attribute and property, reflected | `info` `success` `warning` `danger` `neutral`; anything else reads `info` | — |
| `size` | attribute and property, reflected | `regular` `compact`; anything else reads `regular` | — |
| `announce` | boolean attribute and property, reflected | true / false | — |
| host `role` | standard attribute, observed | any string | — |
| host `hidden` | standard attribute, observed | present / absent | — |
| heading present | private | true / false | assigned elements of `heading` slot with non-whitespace text content (FR-006) |
| box classes | private | `tone-<tone>`, `size-<size>` | the normalised `tone` and `size` properties, set on the shadow wrapper `.box` (R-03) |
| text | private | string | the notice's text as FR-008 defines it, computed from the light DOM |
| live | private | true / false | `announce`, or host role `alert` or `status` |
| politeness | private | `polite` / `assertive` | host role `alert` → assertive, `status` → polite, else tone (FR-009) |
| announcer `aria-live` | private | `polite` / `assertive` / `off` | the politeness while live, else `off` (R-02) |
| host `ariaLive` | `ElementInternals` default | `off` | always `off`, so a host role `alert` or `status` adds no second live region (R-02; measured in T002) |
| baseline | private | text and politeness, or none | the last announced text and politeness, or those current when the notice began announcing (first load, `announce` or a live role set later, the alert path); none from an insertion or a reveal until the next write, so the end-of-wait re-check never drops an insertion or a reveal (PLAN-FRESH-3-001) |
| alert baseline pending | private | none / `insertion or reveal` / `role change` / `became live` | the trigger that set it: the alert path (an insertion or a reveal, or a change of the host role to `alert`) or the "not live before" row for `alert`; reset to none by the end-of-task step in the next task (the move-detection `MessageChannel` task), which sets the baseline, by the cancel rows, and by a role change away from `alert` that leaves the notice live (PLAN-FRESH-3-002 (b), verify 1); the step changes nothing if the field is already none when it runs (round 3 verify 2) |
| announcer state | private | `empty` / `waiting` / `holding` | `waiting`: empty and live, a timer of `W` running; `holding`: the copy written at a recorded time, emptied after `H`, or by a trigger once it has been current for at least `W` (R-02) |
| first load | private, set once | true / false | constructed during the registration's `customElements.define` call (flag in `src/define.ts`), or connected while `document.readyState === "loading"` (R-02) |
| moving | private | true / false | set on disconnect, cleared in a later task (R-02) |

`W = 2 × D`, with `D` Chromium's accessibility serialisation delay for the document's load state: 150 ms once
`document.readyState` is `"complete"`, 350 ms before (R-01, R-02), so `W` is 300 ms or 700 ms. The hold `H` is
5000 ms, a chosen figure not measured by the capture (R-02, operator decision PLAN-FRESH-2-005 (b)). The three
figures are one internal constant of `src/live.ts`, `announcerDefaults = { delayLoaded: 150, delayLoading: 350, hold:
5000 }`, which the timing in force starts as. In process a test-only setter of `src/live.ts` replaces `D` and `H` and
returns the timing it replaced (R-09, PLAN-FRESH-2-003 (a), PLAN-FRESH-3-004 (a)).

### Announcement transitions (R-02)

| Event | Condition | Action |
|---|---|---|
| first connect | first load | none (the announcer is present and empty; the baseline is the current text and politeness) |
| first connect | not first load, live, not `hidden`, host role not `alert` | baseline := none; announce |
| first connect | not first load, not `hidden`, host role `alert` | alert path |
| connect | moving | none (a pending announcement continues) |
| removal not followed by an insertion in the same task | — | cancel; announcer `empty` |
| `hidden` set | — | cancel; announcer `empty` |
| `hidden` removed | live, host role not `alert` | baseline := none; announce |
| `hidden` removed | host role `alert` | alert path |
| `announce` set, or role set to `alert`/`status` | the notice was not live before (no `announce` and no live role) | none; baseline := current text and politeness; for `alert`, Chromium's alert event reads the notice (not measured, README), so the baseline is taken at the end of the task as on the alert path (alert baseline pending := `became live`, PLAN-FRESH-3-002 (b)) |
| host role changed to `alert` (from `status`, or added on a notice with `announce`) | not `hidden` | alert path (whether or not the politeness differs from the baseline) |
| live role removed on a notice with `announce`, or changed from `alert` to `status`, or `status` added on a notice with `announce` | the notice stays live, not `hidden`, alert baseline pending is none, politeness differs from the baseline | announce with the new politeness |
| live role removed on a notice with `announce`, or changed from `alert` to `status`, or `status` added on a notice with `announce` | the notice stays live, alert baseline pending is none, politeness equals the baseline | none |
| live role removed on a notice with `announce`, or changed from `alert` to `status` | alert baseline pending is `insertion or reveal` | alert baseline pending := none; baseline := none; announce with the new politeness (no alert event fires, *Alert path*) |
| live role removed on a notice with `announce`, or changed from `alert` to `status` | alert baseline pending is `role change` | alert baseline pending := none; if the text or the politeness differs from the baseline (still the one from before the change to `alert`), announce with the new politeness; otherwise none |
| live role removed on a notice with `announce`, or changed from `alert` to `status` | alert baseline pending is `became live` | alert baseline pending := none; baseline := current text and politeness; none (as the "not live before" row for the role or `announce` that remains) |
| `tone` changes | alert baseline pending is not none | none (the `alert` role fixes the politeness as `assertive`; the end-of-task step takes it) |
| `tone` changes | live, not `hidden`, alert baseline pending is none, politeness differs from the baseline | announce with the new politeness |
| light-DOM mutation | alert baseline pending is not none | none (the end-of-task step takes the text as the baseline) |
| light-DOM mutation | live, not `hidden`, alert baseline pending is none, text differs from the baseline | announce |
| light-DOM mutation | alert baseline pending is none, text and politeness equal the baseline (an `href` change, the same text again, a re-render) | none |
| `announce` set or removed while a live role stays | the notice stays live; the role sets the politeness (FR-009), so it equals the baseline | none |
| `announce` removed with no live role, or the live role removed (or replaced by a role with no live politeness) on a notice without `announce` | the notice stops being live | cancel; announcer `empty` and `aria-live="off"` |

*Announce*: if the announcer holds a copy, wait until the copy has been current for at least `W` (minimum hold),
then empty the announcer; set its `aria-live` to the politeness, and wait until it has been live, shown and empty for
`W` (a new trigger while waiting restarts the wait, so changes less than `W` apart merge, PLAN-FRESH-2-001 (a)).
When the wait ends, recompute the text and politeness: if the text is empty, or both equal the baseline, write nothing
(the announcer stays `empty`); otherwise write the text as the copy and set the baseline to that text and politeness, hold the copy for
`H` and empty the announcer. A trigger while holding starts again from the first step, which keeps the copy for at
least `W`. A light-DOM mutation that brings the text back to the baseline while waiting matches the "equal the
baseline" row and changes nothing; the re-check at the end of the wait is what drops the write. The visible content
is never hidden from the accessibility tree. An insertion or a reveal sets the baseline to none before the wait, so
the re-check cannot drop it: a notice first loaded hidden and then revealed, or announced, hidden and revealed with
the same text, announces that text once (spec US1-17, SC-002; PLAN-FRESH-3-001). Only a wait made of changes alone
can end on the baseline.

*Alert path* (PLAN-FRESH-2-002 (a), PLAN-FRESH-3-002 (b); R-02 § The platform alert event): cancel any pending wait
(a held copy is emptied once it has been current for `W`), set the announcer's `aria-live` to `assertive`, set *alert
baseline pending* to the trigger (`insertion or reveal`, or `role change`), and post the end-of-task step on the
module's `MessageChannel`. For an insertion or a reveal the baseline is set to none at once (PLAN-FRESH-3-001); for a
role change it stays as it was. The step runs in a later task, after the current task's `MutationObserver` records
are delivered. If *alert baseline pending* is still set, it resets the field to none and sets the baseline to the
text and politeness current then; if the field is already none (reset by a cancel row or by a role change away from
`alert` since the trigger), the step does nothing: it leaves the baseline, and any wait the reset started, as they
are, so the wait's re-check compares with the baseline that reset left (none after an insertion or a reveal), not
with the text the wait is about to write (round 3 verify 2). A new trigger before the step runs sets the field
again and posts its own step; the first step to run takes the baseline and the later one finds none and does
nothing, which is the same result since both run after the same task's records. Until it
runs, light-DOM mutations and `tone` changes match only their "alert baseline pending is not none" rows and start no
wait, so text (or a tone) set in the same task as the insertion, reveal or role change (`host.append(n);
n.textContent = msg`) is part of the alert reading and is not written as a copy. The other rows for these events
carry the condition "alert baseline pending is none", so each event matches one row only. The cancel rows (`hidden`
set, removal, the notice stops being live) also reset the field. A role change away from `alert` that leaves the
notice live (to `status`, or the role removed from a notice with `announce`) while the field is set resets it and
acts as the trigger would have acted under the new role: Chromium has not yet serialised the `alert` role (the
serialisation comes at least `D` after the task, R-01, and the step runs in the next task), so no alert event reads
the notice. After an insertion or a reveal, the baseline is none and the notice announces with the new politeness;
after a role change to `alert`, the text and politeness are compared with the baseline from before that change, as
for any role change that keeps the notice live; after the "not live before" row, the current text and politeness
become the baseline and nothing is announced. No
copy is written: Chromium's alert event for the host's node, which fires on creation, unignoring and a role change to
`alert` at the next serialisation, carries the reading. A change made in a later task but before that serialisation
(less than `D` after the trigger) is read twice, by the alert event and by the copy; the README says so (spec FR-009).

Each event matches at most one row; an event that matches no row changes nothing: no announcement, no
cancellation, and the baseline stays as it is (plan review PLAN-CORRECTNESS-1-007). Examples: a `tone` change
whose politeness equals the baseline (`success` → `info`, both polite), a light-DOM mutation on a notice that is not
live or is `hidden`, and a role change that keeps a `hidden` notice live with a different politeness. A `hidden`
notice is announced when `hidden` is removed, with the text and politeness current at that moment. A role change on
a notice without `announce` is either the "not live before" row (role added) or the "stops being live" row (role
removed). Only a role change that leaves the notice live (spec FR-008, "Live host role at runtime") is compared with
the baseline, except a change to `alert`, which takes the alert path whatever the baseline (spec FR-009).

## Form control (shared: `ocelle-form-input`, `ocelle-form-select`)

| Field | Source | Notes |
|---|---|---|
| `name`, `label`, `description`, `error` | attributes and properties, reflected | strings; `error` normalised (collapse, trim) for display and comparison |
| `required`, `disabled` | boolean attributes and properties, reflected | |
| `value` | property | input: string as typed; select: the selected option's value or `""` |
| default value | input: the `value` attribute; select: the `selected` option children | restored on reset |
| dirty | private | set by user edit or script `value`; cleared on reset |
| form disabled | private | from `formDisabledCallback` (fieldset) |
| effective disabled | private | `disabled` or form disabled |
| computed name | private | FR-022 order: host `aria-label`; else labels' text then `label` |
| computed description | private | description, host `aria-description`, error (non-empty parts, in that order) |
| invalid for AT | private | `error` non-empty or host `aria-invalid="true"`; sets the class `invalid` on the control (R-05) |
| required for AT, disabled for AT | private | `required` or host `aria-required="true"`; `aria-disabled` when host `aria-disabled="true"`. Host values other than `"true"` change nothing (not supported, FR-022) |
| last committed value | private | set without an event on connect, reset, restore and script `value`; `commit()` dispatches the change event only when the value differs (R-05) |
| name span, host-description span | private, `hidden` | carry the computed name and a host `aria-description` for `aria-labelledby` / `aria-describedby` without adding StaticText to the tree (R-05) |
| observed labels | private | the elements of `internals.labels`, observed for text changes; refreshed on connect, `focusin` and each recompute |
| error baseline | private | the last announced error text, or the text at first load; empty after `error` is cleared; none from an insertion or a reveal until the next write (PLAN-FRESH-3-001) |
| first load, moving, announcer state | private | as for the notice (the error announcer is always polite) |

Form value submitted: `value` under `name` when `name` is set and not effectively disabled (`setFormValue(null)`
otherwise). Validity: the inner control's flags and message, mirrored after every change (FR-023).

### Error announcement transitions (R-06)

| Event | Condition | Action |
|---|---|---|
| first connect | first load | none; error baseline := the normalised `error` |
| first connect | not first load, `error` non-empty, not `hidden` | error baseline := none; announce the error |
| connect | moving | none |
| `hidden` set | — | cancel; announcer `empty` |
| `hidden` removed | `error` non-empty | error baseline := none; announce the error |
| `error` changes to a non-empty normalised text that differs from the error baseline | not `hidden` | announce the error |
| `error` changes to the same normalised text | — | none |
| `error` cleared (empty or whitespace only) | — | cancel; announcer `empty`; error baseline := empty |

*Announce the error*: as *announce* for the notice, with the normalised error text as the copy and polite
politeness; an insertion or a reveal sets the error baseline to none, so the re-check cannot drop it (spec US2-22).

## Input-only fields (`ocelle-form-input`)

`type` (reflected; unknown reads `text`), `placeholder`, `readOnly`, `autocomplete`, `inputMode`, `minLength`,
`maxLength` (numbers, absent = no limit), `pattern`, `min`, `max`, `step` (strings): passed to the inner `<input>`.

## Select-only fields (`ocelle-form-select`)

Options: an ordered list mirrored from the host's light-DOM `<option>` and `<optgroup>` children (label, value,
`selected` as default selection, `disabled`, group label). Single choice only. The indicator is drawn in the shadow
root from `iconOf("chevron-down")`, `aria-hidden`, with `pointer-events: none` (R-07).
