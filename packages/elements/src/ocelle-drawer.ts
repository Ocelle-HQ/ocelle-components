// `ocelle-drawer` (008 FR-001 to FR-023, FR-025 to FR-028, FR-048; research.md R-01 to R-09, R-18; data-model.md
// § `ocelle-drawer`): a modal side drawer on the overlays' internal base (src/overlay.ts), against the inline start or
// end edge of the viewport (`side`) at the viewport's full block size, as wide as `--ocelle-drawer-inline` and never
// wider than `--ocelle-dialog-max-inline`, its two inner-edge corners rounded with `--ocelle-radius-2` and the two
// against the viewport square. Its body fills the column between header and footer (R-18). A primary-button click on
// the backdrop asks to close it (R-07). It slides in from its own edge and back (FR-028), on the sheet ground or on the
// chrome (`ground`), and can hide its heading visually (`heading-hidden`, R-08). Importing this module defines
// `ocelle-drawer` and `ocelle-icon`, which it renders, and no other element.
import { css } from "lit";
import type { CSSResultGroup, PropertyDeclarations } from "lit";
import { define } from "./define.ts";
import { OcelleOverlay } from "./overlay.ts";

/**
 * A modal side drawer: a full-height panel against the inline start or end edge of the viewport, with a heading, a
 * body, footer actions and a close control; Escape, the close control and a click on the backdrop ask the host first,
 * which may keep it open.
 *
 * @tagname ocelle-drawer
 * @fires {CustomEvent<{ reason: "escape" | "close-button" | "backdrop" }>} ocelle-drawer-close-request - The user asked to close the drawer, by Escape, the close control or a primary-button click on the backdrop. Cancelable: cancelling it keeps the drawer open.
 * @fires {CustomEvent<{ reason: "escape" | "close-button" | "backdrop" | "host" }>} ocelle-drawer-close - The drawer closed, once it has left the top layer and focus has returned, with the request's reason, or `host` when the host set `open` to false or the platform closed it.
 * @slot - The body: the drawer's content, which fills the panel between the heading and the footer and scrolls when it is taller.
 * @slot footer - The actions, laid out at the end of the panel; not rendered while empty.
 * @csspart panel - The panel, the native `<dialog>`.
 * @csspart heading - The heading, which holds the `label`; visually hidden with `heading-hidden`.
 * @csspart body - The body around the default slot, a Tab stop while it overflows.
 * @csspart footer - The footer around the `footer` slot.
 * @csspart close-button - The close control, a native button named by `close-label`.
 */
export class OcelleDrawer extends OcelleOverlay {
  static override properties: PropertyDeclarations = {
    side: { type: String, reflect: true },
    ground: { type: String, reflect: true },
    headingHidden: { type: Boolean, reflect: true, attribute: "heading-hidden" },
  };

  static override styles: CSSResultGroup = [
    OcelleOverlay.styles,
    css`
      [part="panel"] {
        inline-size: var(--ocelle-drawer-inline);
        block-size: auto;
        max-block-size: none;
        margin-block: 0;
        margin-inline: 0 auto;
        border-start-start-radius: 0;
        border-end-start-radius: 0;
        border-start-end-radius: var(--ocelle-radius-2);
        border-end-end-radius: var(--ocelle-radius-2);
      }

      :host([side="end"]) [part="panel"] {
        margin-inline: auto 0;
        border-start-start-radius: var(--ocelle-radius-2);
        border-end-start-radius: var(--ocelle-radius-2);
        border-start-end-radius: 0;
        border-end-end-radius: 0;
      }

      [part="body"] {
        flex: 1 1 auto;
      }

      :host([heading-hidden]) [part="heading"] {
        position: absolute;
        inline-size: var(--ocelle-size-visually-hidden);
        block-size: var(--ocelle-size-visually-hidden);
        overflow: hidden;
        white-space: nowrap;
        opacity: 0;
      }

      @media not (forced-colors: active) {
        :host([ground="chrome"]) [part="panel"] {
          background: var(--ocelle-color-chrome);
          color: var(--ocelle-color-chrome-ink);
        }
      }
    `,
  ];

  /**
   * The inline edge of the viewport the drawer is placed against, in the drawer's direction: `start` (the left edge
   * under `dir="ltr"`, the right edge under `dir="rtl"`) or `end`. Any other value gives `start`. Reflected.
   *
   * @default "start"
   */
  declare side: "start" | "end";

  /**
   * The drawer's ground: `sheet`, or `chrome`, the chrome ground and ink in both themes. Any other value gives `sheet`.
   * Reflected.
   *
   * @default "sheet"
   */
  declare ground: "sheet" | "chrome";

  /**
   * Whether the heading is hidden visually: not painted and taking no space, but kept in the accessibility tree as the
   * drawer's heading, with the accessible name unchanged. Reflected.
   *
   * @default false
   */
  declare headingHidden: boolean;

  protected override readonly eventPrefix: string = "ocelle-drawer";

  /** Whether the last press began with the primary button outside the panel's border box, on the backdrop (R-07). */
  #pressedOutside = false;

  constructor() {
    super();
    this.side = "start";
    this.ground = "sheet";
    this.headingHidden = false;
    // Only the primary pointer's press is recorded; another pointer's leaves the record as it is.
    this.addEventListener("pointerdown", (event) => {
      if (event.isPrimary) this.#pressedOutside = event.button === 0 && this.#outside(event);
    });
    // A click consumes its press: one with no press of its own (a script's click()) is no backdrop click.
    this.addEventListener("click", (event) => {
      const pressed = this.#pressedOutside;
      this.#pressedOutside = false;
      if (pressed && this.#outside(event)) this.requestClose("backdrop");
    });
  }

  /** The slide from the drawer's own edge (FR-028): the start edge, the end edge with `side="end"`, mirrored under `rtl`. */
  protected override keyframes(entering: boolean): Keyframe[] {
    const right = this.side === "end" ? !this.matches(":dir(rtl)") : this.matches(":dir(rtl)");
    const away = { translate: right ? "100%" : "-100%" };
    const home = { translate: "0" };
    return entering ? [away, home] : [home, away];
  }

  /**
   * Whether a pointer event is on the backdrop (R-07): its target, before retargeting, is the panel itself, and it
   * lies outside the panel's border box, the half-open area [left, right) × [top, bottom) of its pixels. A press or
   * click on a slotted overlay's backdrop has that overlay's `<dialog>` as its target.
   */
  #outside(event: MouseEvent): boolean {
    const panel = this.renderRoot.querySelector("dialog");
    if (event.composedPath()[0] !== panel) return false;
    const box = panel.getBoundingClientRect();
    return event.clientX < box.left || event.clientX >= box.right || event.clientY < box.top || event.clientY >= box.bottom;
  }
}

define("ocelle-drawer", OcelleDrawer);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-drawer": OcelleDrawer;
  }
}
