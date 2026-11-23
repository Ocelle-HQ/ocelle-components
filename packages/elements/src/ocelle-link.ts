// `ocelle-link` (014 FR-045 to FR-049, Edge Cases; research.md R-08, R-15, R-16; data-model.md § Link state): a link in
// running text that always tells the host it was activated. Without `href` it never navigates; with `href` it navigates,
// after its event and unless a listener cancelled it, to the `href` resolved against the document's base URL, and only
// when the resolved protocol is `http:`, `https:` or the document's own (src/link-target.ts).
// - The host has no role. Its shadow root (`delegatesFocus`) holds one native anchor, `part="anchor"`, around a default
//   slot. The anchor carries the host's `href` as written while that `href` is allowed, so a user's modified activation
//   (Ctrl, Meta or Shift held, or a middle click) is left to the browser: a new tab or window for Ctrl, Shift and the
//   middle click, and the platform's convention for Meta (Cmd on macOS opens a new tab; Chromium on Linux follows the
//   link in place; phase 6 operator decision 2); without `href`, or with a refused one, it has no `href`, `role="link"`
//   and `tabindex="0"`, so it is still a focusable link. Its state is
//   written imperatively (`#refresh`) on each `href` change and at the first event of each activation (`pointerdown`,
//   the `keydown` of Enter), so it follows the base URL of that moment.
// - The link is named by its text, or by `label` (trimmed, blank as none), set as the anchor's `aria-label`. A host
//   `aria-label` is not read, forwarded or observed, and the element writes no attribute on its host (FR-045, operator
//   decision during phase 6, reviews/phase-6/operator-decisions.md).
// - A plain activation (Enter, or a primary-button click with no modifier or Alt alone) is intercepted: a click's
//   default is prevented (no native navigation, no Alt-click download) and Enter on the anchor without `href`, which
//   fires no click, is taken on its `keydown`, whose default is left alone. The element dispatches the cancelable
//   `ocelle-link-activate` with `{ href }` (the attribute as written, or null) and, unless it was cancelled, calls
//   `location.assign` with the target `navigationTarget` resolves at that moment. A modified activation emits nothing
//   and leaves the click's default alone; Space is not handled.
// Styles: the anchor in `--ocelle-color-link`, underlined, `--ocelle-color-link-hover` under the pointer, the token
// focus ring as an outline, which the engine draws around each line fragment; forced colours: `LinkText`, underlined,
// the ring `Highlight`. No transition or animation. Importing this module defines `ocelle-link` only.
import { LitElement, css } from "lit";
import { define } from "./define.ts";
import { navigationTarget } from "./link-target.ts";

/**
 * A link in running text that tells the host it was activated, and navigates to an allowed `href` unless the host
 * cancels.
 *
 * @tagname ocelle-link
 * @slot - The link's text.
 * @csspart anchor - The link's anchor: the native `<a>` that is focused and activated.
 * @fires {CustomEvent<{ href: string | null }>} ocelle-link-activate - The user activated the link with Enter or a primary-button click (no modifier, or Alt alone): `href` is the `href` attribute as written, not validated, or `null` without one. Cancelable: a cancelled event stops the link's own navigation. A modified activation (Ctrl, Meta or Shift held, or a middle click) emits nothing.
 */
export class OcelleLink extends LitElement {
  /**
   * Focus delegated to the anchor (research.md R-08): focusing the host focuses the link.
   *
   * @internal
   */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    href: { type: String, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  static override styles = css`
    :host {
      display: inline;
    }

    :host([hidden]) {
      display: none;
    }

    [part="anchor"] {
      text-decoration-line: underline;
      cursor: pointer;
      outline: none;
    }

    [part="anchor"]:focus-visible {
      outline: var(--ocelle-focus-width) solid;
      outline-offset: var(--ocelle-focus-offset);
    }

    @media not (forced-colors: active) {
      [part="anchor"] {
        color: var(--ocelle-color-link);
      }

      [part="anchor"]:hover {
        color: var(--ocelle-color-link-hover);
      }

      [part="anchor"]:focus-visible {
        outline-color: var(--ocelle-color-focus);
      }
    }

    @media (forced-colors: active) {
      [part="anchor"] {
        color: LinkText;
      }

      [part="anchor"]:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /**
   * The link's target, as written: the anchor carries it while it resolves to an allowed protocol, and the event's
   * `detail.href` reports it. Without it the link only emits its event. Reflected.
   *
   * @default undefined
   */
  declare href: string | undefined;

  /**
   * The link's accessible name instead of its text, trimmed; blank counts as none. It must contain the visible text.
   * A host `aria-label` does not name the link. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The anchor, built with the element rather than by a template, so it is in the shadow root, focusable, from the
   * moment the host is connected: a parent that counts its content's focusables when the host arrives (a tab panel,
   * FR-023) counts the link before its first update.
   */
  readonly #anchor = document.createElement("a");

  constructor() {
    super();
    this.#anchor.setAttribute("part", "anchor");
    this.#anchor.append(document.createElement("slot"));
    this.#anchor.addEventListener("click", this.#onClick);
    this.#anchor.addEventListener("keydown", this.#onKeydown);
    this.#anchor.addEventListener("pointerdown", this.#refresh);
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();
    root.append(this.#anchor);
    this.#refresh();
    return root;
  }

  /** The `href` attribute's changes reach the anchor at once, also before the first update. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.#refresh();
  }

  protected override updated(): void {
    const name = typeof this.label === "string" ? this.label.trim() : "";
    if (name === "") this.#anchor.removeAttribute("aria-label");
    else this.#anchor.setAttribute("aria-label", name);
  }

  /** The anchor's state for the current `href`, base URL and document protocol (R-08). */
  #refresh = (): void => {
    const anchor = this.#anchor;
    const href = this.getAttribute("href");
    if (href !== null && navigationTarget(href, document.baseURI, location.protocol) !== null) {
      anchor.setAttribute("href", href);
      anchor.removeAttribute("role");
      anchor.removeAttribute("tabindex");
    } else {
      anchor.removeAttribute("href");
      anchor.setAttribute("role", "link");
      anchor.setAttribute("tabindex", "0");
    }
  };

  #onClick = (event: MouseEvent): void => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    // Stryker disable next-line ConditionalExpression: the condition forced `false` is equivalent in Chromium, which fires `click` for the primary button only (a middle click is an `auxclick`, US5-13), kept for engines that are not measured; forced `true` is killed by US5-3 and disabled with it, as Stryker disables by mutator kind
    if (event.button !== 0) return;
    event.preventDefault();
    this.#activate();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter") return;
    this.#refresh();
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!(event.currentTarget as HTMLAnchorElement).hasAttribute("href")) this.#activate();
  };

  /** A plain activation: the cancelable event, then the navigation to the allowed target unless it was cancelled. */
  #activate(): void {
    const href = this.getAttribute("href");
    const go = this.dispatchEvent(new CustomEvent("ocelle-link-activate", { bubbles: true, composed: true, cancelable: true, detail: { href } }));
    if (!go) return;
    const target = navigationTarget(href, document.baseURI, location.protocol);
    if (target !== null) location.assign(target);
  }
}

define("ocelle-link", OcelleLink);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-link": OcelleLink;
  }
}
