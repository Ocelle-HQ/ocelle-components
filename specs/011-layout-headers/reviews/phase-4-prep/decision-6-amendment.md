# Decision 6 amendment (011-layout-headers)

Operator decision 6 of `reviews/operator-decisions-implementation.md` ("README statement"), from phase 4's
measurement in `reviews/phase-4/flex-column-probe.log`: with `align-self: start` the sidebar takes its content's
inline size (95 of 800 px) in a flex column and a flex row; `align-self: start` stays and no scenario changes.

Changed:

- `spec.md`: header gains "Operator decision in phase 4"; FR-036 gains one sidebar statement: in a flex column or
  flex row the container or the page sets the sidebar's inline size (an `inline-size`, a `flex` value, a grid track,
  or `align-self: stretch` on the host).
- `tasks.md` T035: the matching assertion added to the sidebar's own README statements.
- `research.md` R-09 (Stretching containers): "this case was not measured" replaced by the measurement and the
  README statement.
- `plan.md` item 5 (sidebar box): notes the flex-column/flex-row inline size and the README statement.
- `checklists/requirements.md`: a note recording this amendment.

Checked, unchanged: `quickstart.md` and `contracts/` (no text on the sidebar's inline size in a flex container or on
the README statement list); FR-023 already leaves the inline size to the container. No other FR, task or scenario
changed.
