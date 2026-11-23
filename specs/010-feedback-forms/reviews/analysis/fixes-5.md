# Analysis fixes 5: 010-feedback-forms

Resolves `analysis-report.md` (head b3adf35; 0 critical, 0 high, 1 medium, 2 low). Operator instruction of
2026-11-13 (human:jeroennouwsdev): make everything ready for implementation and fix every finding with the remedy
that keeps the spec's promises, constitution III and constitution VIII. For U11, use 005's outcome for its own
elements where it fits, never one that hides a focusable control from assistive technology. For the notice, state
the outcome in FR-009's table. For A5, prefer 005's "pass it trimmed" or a defined normalisation, with the T031
cell. No promise is narrowed. spec.md changes in these places, each an addition:
- FR-009's table gains a row, and its "Not supported" paragraph names `hidden` and FR-008;
- FR-022 states the form controls' rule for a host `aria-hidden="true"` and how a host `aria-label` is normalised;
- FR-001's list of restated convention text and FR-035's README items gain the new rules;
- US2 scenario 13 gains the surrounding-spaces case.

Task IDs are stable, no task is added and the phase headings are unchanged. Every repository path and line named
was checked against the files.

The whole § Host ARIA paragraph (`packages/elements/README.md:187-196`) and its pinned fragments
(`packages/elements/test/node/readme.test.ts:73-79`) were read. After this fix, every sentence is scoped to the 005
elements or restated for each new element:

| README sentence | Pinned at | Scoped or restated by |
|---|---|---|
| host `aria-label` decides alone | `:74` | scoped in T016b; the form controls' blank-skip fragment in T034a |
| both set | `:75` | scoped in T016b |
| surrounding spaces | `:76` | scoped in T016b; A5's form-control fragment in T034a |
| "An unknown icon name exposes nothing, named or not" | `README.md:192`, not pinned | scoped by its subject, `ocelle-icon`'s `name` |
| host `aria-hidden="true"` | `:77` | scoped in T016b; notice fragment in T016b, form-control fragment in T034a |
| host `hidden` | `:78` | scoped in T016b; the same two fragments |
| host `role` and `aria-hidden="false"` | `:79` | scoped in T016b, as before; notice fragment in T016b, form-control fragment in T034a |

The "form control" fragments cover the select as well. Every pinned sentence is scoped in phase 2's red commit
(T016b), the phase that adds the notice, so no phase leaves an unscoped sentence beside a new element (follow-up row
below; fixes-4's I14 had put `:74` to `:76` in phase 3).

| ID | Resolution | Where |
|---|---|---|
| U11 | fixed with "not supported" on both new kinds of element. 005's outcome (the element hidden, `specs/005-icons-brand-mark/spec.md:746`) does not fit either kind: a hidden notice would hide its slotted links, which stay focusable (FR-011, research.md:224), and a hidden form control stays focusable through `delegatesFocus` (WCAG 2.2 SC 4.1.2, axe `aria-hidden-focus`). **Notice:** FR-009's table gains the row "any role, with a host-written `aria-hidden="true"` on `ocelle-notice`": not supported, hide the notice with its `hidden` attribute (US1 scenario 17). The "Not supported" paragraph names `hidden` as the alternative and puts FR-008's rules, like FR-009's and SC-002's, on the supported rows only. **Form controls:** FR-022 says a host `aria-hidden="true"` is not supported and the README tells hosts to use a host `hidden` attribute instead. **README and tests:** FR-035 lists the rule. FR-001's list of restated convention text names it. contracts/elements.md lists it for the notice and in the form controls' "Documented, not declared". T016b (phase 2's red commit) scopes `readme.test.ts:77` and `:78` to `ocelle-icon` and `ocelle-brand-mark`, and adds the fragment "On `ocelle-notice` a host `aria-hidden="true"` is not supported: hide the notice with a host `hidden` attribute, which gives it no box and announces nothing while it is set". T034a (phase 3's red commit) adds "On a form control a host `aria-hidden="true"` is not supported, since the control stays focusable: hide the control with a host `hidden` attribute instead". Each new text fails against today's README. **Plan:** the Constitution Check's row III notes the rule. | spec.md FR-001 (:598-599), FR-009 (table :713, paragraph :742-747), FR-022 (:797-801), FR-035 (:931-935); contracts/elements.md (:17, :60-61); plan.md Constitution Check (row III), phases 2 and 3; tasks.md T016b, T024, T034a, T041 |
| I16 | fixed: T030 asserts the input's `value` property with default `""`, no `attribute` and no `reflects`. T050a names the same for the select's `value` property. | tasks.md T030, T050a |
| A5 | fixed with a defined normalisation plus 005's rule. FR-022 item 1 now puts the host `aria-label` text into the control's name with whitespace collapsed and trimmed, as item 2 treats the labels' text. The control's name therefore does not depend on how Chromium treats spaces in the referenced hidden span. The host's node keeps the attribute as written, surrounding spaces included (`packages/elements/README.md:190-191`). FR-022 therefore says the two names are the same only for an `aria-label` passed trimmed with single spaces, and the README tells hosts to pass it so, as 005 does. US2 scenario 13 gains the case `aria-label=" Title "`: the field is named exactly "Title" and the host's node " Title ". T031 has the cell (phase 3's red commit). T034a adds the fragment "On a form control the control's name is a host `aria-label` with whitespace collapsed and trimmed, while the host's node keeps it as written, surrounding spaces included, so pass it trimmed with single spaces". FR-035, research R-05 (Naming), data-model.md's computed-name row and contracts/elements.md carry the rule. | spec.md US2 scenario 13 (:380-383), FR-022 (:781-782, :814-817), FR-035; research.md R-05 (:336-340); data-model.md:123; contracts/elements.md:53-57; plan.md phase 3; tasks.md T031, T034a, T041 |
| I14 (follow-up) | fixed: the scoping of `readme.test.ts:74`, `:75` and `:76` to `ocelle-icon` and `ocelle-brand-mark`, which fixes-4 put in T034a (phase 3), moves to T016b (phase 2's red commit), with the same texts, so the README never states them unscoped beside the notice. T034a keeps only the form controls' fragments and restates no pinned fragment. T024 writes § Host ARIA `README.md:189-196` in phase 2. T041 writes the form controls' fragments beside that text. fixes-4.md is left as the record of its round. | tasks.md T016b, T024, T034a, T041; plan.md phases 2 and 3; research.md R-05 (Naming, :330-332) |
