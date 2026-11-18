# Squad round 3: fixes 4

Applied to the artifacts at the commit that adds this note, from the unresolved rows of `verify-3.md`.

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-FRESH-3-002 | fixed | contract checks § Dialog "Slotted non-modal dialogs": the `<dialog open>` case split; `closedby` absent/`auto`/`none` keep "one request, no `cancel`" on every press, while an attribute-opened dialog with `closedby="closerequest"`/`"any"` now asserts the first Escape gives one request through one prevented cancelable `cancel` on the overlay's `<dialog>` and later presses give requests with no `cancel` (veto and no-veto), plus a re-arm case after `close()` and reopening by the attribute, matching R-02 § Non-modal dialogs and § `cancel`; data-model § Overlay stack: names the first-press stand-aside, the `cancel` fallback and the no-close-watcher record, and that Tab is not handled while a popover or modal dialog is open; plan decision 19: Tab sentence aligned with R-02 (no Tab while a popover or nested modal is open, non-modal keeps R-04's Tab) and the attribute-opened `closedby` fallback stated. Constitution Check III unchanged (already consistent). |
