# Phase 3 spikes: tab-to-panel association, the tabs host's exposure, axe on labelled panels (T040)

Measured 2026-11-14 in Chromium 153.0.8010.12 (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`),
driven by Playwright 1.64.1, with axe-core 4.14.0 (the version #10's `axe` gate pins). The tree is Chromium's full
accessibility tree over CDP (`Accessibility.getFullAXTree`), ignored nodes, static text and inline text boxes left
out, read two animation frames after the change; `controls` is mapped to the controlled node's role and name.

The page is a plain model of `ocelle-tabs` as research R-01, R-02 and R-05 design it (no Lit, no package code): a
`#before` button, then an `x-tabs` host whose open shadow root uses `slotAssignment: "manual"` and holds
`<div part="tablist" role="tablist"><slot name="t"></slot></div><div part="panels"><slot name="p"></slot></div>`;
three light-DOM `x-tab` children (`Spec`, `Plan`, `Tasks`, role `tab` through `ElementInternals`) and three `x-panel`
children (role `tabpanel` through internals, each holding a paragraph). The three tabs are assigned to the tablist's
slot, only the first panel to the panels' slot; the tabs carry `aria-selected` and roving `tabindex`, the assigned
panel `tabindex="0"`. The tablist part carries `aria-label="Mission views"` (the forwarded name), except where a row
says otherwise.

## (1) R-02: generated ids against ARIA element reflection

| Association | Tree (unignored, interactive and structural nodes) |
|---|---|
| Generated ids `ocelle-tabs-1-tab-<i>` / `ocelle-tabs-1-panel-<i>` on the children, `aria-controls` on every tab, `aria-labelledby` on the assigned panel only (the R-02 design) | generic → tablist "Mission views" → tab "Spec" (selected, controls tabpanel "Spec"), tab "Plan", tab "Tasks"; beside the tablist, generic → tabpanel "Spec" → paragraph |
| `Element.ariaControlsElements` on every tab and `Element.ariaLabelledByElements` on the assigned panel, no id | the same tree: tab "Spec" controls tabpanel "Spec", the tabpanel is named "Spec" |
| `ElementInternals.ariaControlsElements` / `ariaLabelledByElements` on the children's internals, no id | the same tree |

- The generated ids give "the selected tab controls its panel" and "the panel is named by its tab" in Chromium's
  tree, and no tabpanel has the tablist as an ancestor. R-02's stop condition does not hold.
- `Plan` and `Tasks` show no `controls` relation: their `aria-controls` names a panel assigned to no slot, which has
  no node (FR-024). That matches US2-1, which reads the relation on the selected tab only.
- For a later mission: both forms of ARIA element reflection (`"ariaControlsElements" in Element.prototype` and in
  `ElementInternals.prototype` are both `true` in Chromium 153) would have given the same tree with no id. They stay
  out of this feature because of the WebKit 16.4 floor (R-02).

## (2) R-01: the tabs host with a host `aria-label`

The host carries `aria-label="Mission views"`; the element forwards it to `part="tablist"` (FR-006). R-01 requires
exactly one named node, the tablist.

| Form | Named nodes in the tree |
|---|---|
| No host role (the R-01 design), label forwarded | **two**: generic "Mission views" (the host) → tablist "Mission views" |
| Internals role `none` on the host, label forwarded | **two**: generic "Mission views" → tablist "Mission views" (Chromium ignores `none` on an element with a global ARIA attribute) |
| Internals role `presentation` on the host, label forwarded | **two**, as with `none` |
| `:host { display: contents }`, label forwarded | **two**: generic "Mission views" → tablist "Mission views" |
| `display: contents` and internals role `none`, label forwarded | **two**, as above |
| No host role, label **not** forwarded | one, but the wrong one: generic "Mission views" → tablist "" (unnamed tablist, against US2-1 and FR-019) |
| Internals role `group` on the host, label not forwarded | one, but a group: group "Mission views" → tablist "" (against US2-1 and FR-019) |
| Internals role `tablist` on the host (R-01's rejected form, for the record) | two tablists, the outer one named, and the tabpanel inside the outer tablist (against US2-1) |
| The element copies the host's `aria-label` to the tablist part and removes the attribute from the host | **one**: generic "" → tablist "Mission views" |

For comparison, with `label` only (no host `aria-label`), the R-01 design has exactly one named node: generic "" →
tablist "Mission views".

**Result: the stop condition of T040 holds.** Chromium names a role-less host from its `aria-label`, so in the R-01
design a host `aria-label` gives a named generic around the named tablist: two named nodes. No form that leaves the
host's attribute in place gives one named node: `none`, `presentation` and `display: contents` all keep the named
generic. The one form that gives exactly one named node, the tablist, is the element removing the host's
`aria-label` after copying it. That departs from mission 005's Host ARIA rule that an element never writes its host's
attributes (`src/naming.ts`). Phase 3 stops here for the operator's decision (tasks.md "Stop-and-ask points", T040
spikes; plan.md decision 7; research R-01 and R-08: "If no form gives one named node, the phase stops and the
operator decides"). No scaffold, red or green work has been done.

## (3) axe-core 4.14.0 on unassigned panels named by `aria-labelledby` (PLAN-FRESH-2-002, for an upstream report)

Here the axe-core 4.14.0 source runs in the page: `axe.run(document, { resultTypes: ["violations", "incomplete"] })`.
That is the default rule set; the model's internals are in a plain property `i`, which axe does not read, so the
model's own `aria-allowed-attr` and `aria-required-children` violations are expected and not part of this record.

| `aria-labelledby` on | `color-contrast` |
|---|---|
| every panel, assigned or not | `incomplete`, impact **serious**, node `#ocelle-tabs-1-tab-1` (the first tab whose panel is unassigned), check `error-occurred`: `TypeError: Cannot read properties of undefined (reading '_isDisabled')` thrown in `color-contrast-matches`. axe then reports "Skipping color-contrast rule." |
| the assigned panel only (the R-02 design) | no `incomplete` |

The defect for the upstream report: axe-core 4.14.0's `color-contrast-matches` throws on a tab (an element named by
the `aria-labelledby` of another element) when the labelling element is a light-DOM child that is assigned to no slot
under manual slot assignment, so it is outside the flat tree and has no virtual node. axe then marks the rule
incomplete with impact serious. Reproduction: the model above with `aria-labelledby` written on every panel.
R-02's design, `aria-labelledby` on the assigned panel only, avoids it, as the plan expects.

## Open question for the operator (stop-and-ask, T040)

With a host `aria-label`, how should `ocelle-tabs` be exposed? These are the options the spike supports. The first is
the only measured form with exactly one named node.

- **(a)** The element moves a host `aria-label` to `part="tablist"`. It copies the value and removes the host's
  attribute, observing the attribute, so a later host write is moved again. Result: one named node, the tablist,
  measured above. Cost: an exception to mission 005's "the element never writes its host's attributes". A host
  framework that re-renders the attribute will see it removed, and `getAttribute("aria-label")` on the host then
  reads `null`. The README would state this, and R-01 and the contract would be amended.
- **(b)** The R-01 design as it is, accepting two named nodes: the host as a named generic around the tablist of the
  same name. R-01's "exactly one named node" and plan decision 7 would be amended. A screen reader may announce the
  name twice.
- **(c)** `ocelle-tabs` takes its name from `label` only. A host `aria-label` is not forwarded and is left to name the
  host's generic, and the README tells hosts to use `label`. This changes FR-006 for the tabs and needs a spec
  amendment.
