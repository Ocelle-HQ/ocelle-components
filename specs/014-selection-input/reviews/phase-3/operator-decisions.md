# Operator decisions during phase 3 (014)

Recorded by the orchestrator, 2026-11-14, human:jeroennouwsdev.

- **Tabs name from `label` only (option c of the T040 spike, reviews/phase-3/spike.md).** A host `aria-label` on
  `ocelle-tabs` leaves a named generic host around the named tablist in every measured host form, so R-01's "exactly
  one named node" cannot hold while it is forwarded. `ocelle-tabs` therefore takes its accessible name from `label`
  only: a host `aria-label` is not forwarded to the tablist, and the element's documentation says to use `label`. The
  element writes no host attribute (mission 005's rule stands). FR-006 is amended for the tabs only; the listbox and the
  segmented choice keep the host `aria-label` path. Options (a), moving the attribute off the host, and (b), accepting
  two named nodes, were declined.

- **Constitution III exception approved.** Not forwarding a host `aria-label` on `ocelle-tabs` is an exception to
  constitution III ("ARIA state set on a host ... an accessible name ... reaches the real inner control"). The operator
  approves it as recorded in plan.md's Complexity Tracking: scope `ocelle-tabs` only; sunset, the op that forwards a
  host `aria-label` with exactly one named node and no host attribute written.

- **Standing decision: phase folds approved (2026-11-15).** From phase 3 on, once a phase's review is approved (or the
  phase is accepted), the history fold with `fold-history.sh`, the push of the pre-fold head to
  `archive/<branch>-prefold-phase-N` and the `--force-with-lease` push of `claude/014-selection-input` are approved
  without the "fold phase N" gate. Relayed by the wave orchestrator session (session_01NUfZSc26YwQLeow31d6R6X) and
  confirmed by the operator in this session ("the folds are approved from here on"). It covers only the fold, the
  archive ref and the force-push with lease of this branch; every other gate still goes to the operator.
