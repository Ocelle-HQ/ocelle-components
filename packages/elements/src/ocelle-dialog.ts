// `ocelle-dialog` (008 FR-001 to FR-024; research.md R-01 to R-09, R-18; data-model.md § `ocelle-dialog`): a modal
// dialog on the overlays' internal base (src/overlay.ts), centred in the viewport, at its preferred inline size
// `--ocelle-dialog-inline-size` (the reading measure by default), never wider than `--ocelle-dialog-max-inline` nor
// taller than `--ocelle-dialog-max-block`, with the radius `--ocelle-radius-2` and the raised shadow. A click on the
// backdrop does nothing (operator decision). Importing this module defines `ocelle-dialog` and `ocelle-icon`, which it
// renders, and no other element.
import { css } from "lit";
import type { CSSResultGroup } from "lit";
import { define } from "./define.ts";
import { OcelleOverlay } from "./overlay.ts";

/**
 * A modal dialog over the page, with a heading, a body, footer actions and a close control; Escape and the close
 * control ask the host first, which may keep it open.
 *
 * @tagname ocelle-dialog
 * @fires {CustomEvent<{ reason: "escape" | "close-button" }>} ocelle-dialog-close-request - The user asked to close the dialog, by Escape or the close control. Cancelable: cancelling it keeps the dialog open.
 * @fires {CustomEvent<{ reason: "escape" | "close-button" | "host" }>} ocelle-dialog-close - The dialog closed, once it has left the top layer and focus has returned, with the request's reason, or `host` when the host set `open` to false or the platform closed it.
 * @slot - The body: the dialog's content, which scrolls when it is taller than the space left.
 * @slot footer - The actions, laid out at the end of the panel; not rendered while empty.
 * @csspart panel - The panel, the native `<dialog>`.
 * @csspart heading - The visible heading, which holds the `label`.
 * @csspart body - The body around the default slot, a Tab stop while it overflows.
 * @csspart footer - The footer around the `footer` slot.
 * @csspart close-button - The close control, a native button named by `close-label`.
 * @cssprop --ocelle-dialog-inline-size - The dialog's preferred inline size, capped by `--ocelle-dialog-max-inline`; the reading measure (`--ocelle-measure-reading`) by default.
 */
export class OcelleDialog extends OcelleOverlay {
  static override styles: CSSResultGroup = [
    OcelleOverlay.styles,
    css`
      :host {
        --ocelle-dialog-inline-size: var(--ocelle-measure-reading);
      }

      [part="panel"] {
        inline-size: var(--ocelle-dialog-inline-size);
        border-radius: var(--ocelle-radius-2);
      }
    `,
  ];

  protected override readonly eventPrefix: string = "ocelle-dialog";
}

define("ocelle-dialog", OcelleDialog);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-dialog": OcelleDialog;
  }
}
