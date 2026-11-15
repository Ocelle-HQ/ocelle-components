// `ocelle-button` (012 spec US1 and US2, FR-001 to FR-014, FR-018 to FR-023; research.md R-01 to R-06, R-08, R-09,
// R-12; data-model.md § `ocelle-button`; plan decisions 18 to 20, 22 to 24 and 26): one native `<button type="button">`
// (button mode) or `<a>` (link mode, by src/control.ts `linkHref`) with the part `control` in an open shadow root
// attached with `delegatesFocus`, laid out by mission 005's slot convention (an `icon` slot before the label). A
// disabled link has no `href`, `target`, `rel` or `download`, is `role="link" aria-disabled="true"` and is not
// focusable; `target="_blank"` without `rel` gives `rel="noopener"`. The host attributes of FR-009 are moved onto the
// inner control (src/control.ts `MovedAttributes`): ID references by element reflection resolved in the host's tree,
// the name from `aria-labelledby`, then `aria-label`, then `label`, then the content; `aria-pressed` in button mode only;
// `aria-current="false"` applied as no current state; the moved states as custom states (`expanded`, `pressed`,
// `current`). In link mode a click with Ctrl, Meta, Shift or Alt held dispatches no `ocelle-button-activate`, and a
// cancelled activate event cancels the navigation. The host is
// `display: inline-grid` and the inner control its single stretched grid item, so a host stretched by a flex row or a
// grid has no area outside the control; the inner control is `inline-flex`, so a page rule that makes the host a block
// or a flex container leaves it its own size, and the host guard (src/control.ts) stops any click outside it. Each
// click that passes the inner control while available dispatches `ocelle-button-activate` from the host, from a
// listener on the inner control, so before the click reaches any bubble-phase listener on the host or its ancestors;
// a cancelled activate event cancels the click (`preventDefault()`), which a button still delivers. The inner control
// is always `type="button"`, in a shadow root, so it never submits or resets a form.
//
// Colours follow research.md R-08's tables (items 3, 4, 4a, 5, 8): the variant, the `ground` the host states and the
// state (hover, active, disabled), each rule inside `@media not (forced-colors: active)` and written as
// `:host(:where(...)) .control:where(...)`, so every colour rule has the same specificity and the later rule wins:
// variants, then grounds, then hover and active, then flush, then disabled. Sizes follow R-09: `default` at least
// `--ocelle-target-min` in both dimensions, `compact` at least `--ocelle-space-6` (24 px) with the compact text scale;
// `flush` drops the inline padding, the border and the fill and puts the content at the inline start. With no label (no
// non-whitespace text in the default slot's flattened assignment, read on `slotchange` and on text changes inside the
// element) the row takes the class `bare`, which drops the slotted icon's gap, so an icon-only button centres its icon
// (review round 1, R1-01).
// Importing this module defines `ocelle-button` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { MovedAttributes, controlStyles, guardHost, linkHref, resolveIds } from "./control.ts";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";

/** The host attributes `ocelle-button` moves onto its inner control (FR-009). */
const moved = ["aria-expanded", "aria-controls", "aria-current", "aria-haspopup", "aria-pressed", "aria-label", "aria-labelledby", "aria-describedby", "title"] as const;
/** The moved ID references and the inner control's reflection property for each (research.md R-04). */
const references = [
  ["aria-controls", "ariaControlsElements"],
  ["aria-labelledby", "ariaLabelledByElements"],
  ["aria-describedby", "ariaDescribedByElements"],
] as const;

/**
 * A native button in the Ocelle look, or a link that looks like one: three variants, two sizes, a flush look, the
 * ground it sits on, a label, a disabled state, an icon slot, link mode with `href`, and host ARIA moved onto the inner
 * control.
 *
 * @tagname ocelle-button
 * @attr {string} aria-expanded - Moved onto the inner control (the host keeps no copy): `"true"` reports expanded,
 * `"false"` collapsed, an empty value clears it; `removeAttribute` after the move changes nothing.
 * @attr {string} aria-controls - Moved onto the inner control: the ids, space-separated, of the elements it controls,
 * resolved in the host's own tree when set and when the element is connected; an empty value clears it.
 * @attr {string} aria-current - Moved onto the inner control with any value; `"false"` or an empty value clears it. It
 * draws no mark.
 * @attr {string} aria-haspopup - Moved onto the inner control: the kind of popup it opens; an empty value clears it.
 * @attr {string} aria-pressed - Moved onto the inner control in button mode only: `"true"` reports pressed, `"false"`
 * not pressed, an empty value clears it.
 * @attr {string} aria-label - Moved onto the inner control: its accessible name, over `label` and the content; an empty
 * or whitespace-only value clears it.
 * @attr {string} aria-labelledby - Moved onto the inner control: the ids, space-separated, of the elements that name
 * it, resolved in the host's own tree, over `aria-label`; an empty value clears it.
 * @attr {string} aria-describedby - Moved onto the inner control: the ids, space-separated, of the elements that
 * describe it, resolved in the host's own tree; an empty value clears it.
 * @attr {string} title - Moved onto the inner control: its native tooltip and description, or its name when nothing
 * else names it; an empty value clears it.
 * @attr {string} data-ocelle-moved-aria-expanded - Element-owned mirror of the moved `aria-expanded`, so copies of the
 * live DOM keep it; hosts do not write or remove it, and the element restores it when it is removed or changed.
 * @attr {string} data-ocelle-moved-aria-controls - Element-owned mirror of the moved `aria-controls`; hosts do not
 * write or remove it.
 * @attr {string} data-ocelle-moved-aria-current - Element-owned mirror of the moved `aria-current`; hosts do not write
 * or remove it.
 * @attr {string} data-ocelle-moved-aria-haspopup - Element-owned mirror of the moved `aria-haspopup`; hosts do not
 * write or remove it.
 * @attr {string} data-ocelle-moved-aria-pressed - Element-owned mirror of the moved `aria-pressed`; hosts do not write
 * or remove it.
 * @attr {string} data-ocelle-moved-aria-label - Element-owned mirror of the moved `aria-label`; hosts do not write or
 * remove it.
 * @attr {string} data-ocelle-moved-aria-labelledby - Element-owned mirror of the moved `aria-labelledby`; hosts do not
 * write or remove it.
 * @attr {string} data-ocelle-moved-aria-describedby - Element-owned mirror of the moved `aria-describedby`; hosts do
 * not write or remove it.
 * @attr {string} data-ocelle-moved-title - Element-owned mirror of the moved `title`; hosts do not write or remove it.
 * @cssstate expanded - While the moved `aria-expanded` is `"true"`.
 * @cssstate pressed - While the moved `aria-pressed` is `"true"`.
 * @cssstate current - While the moved `aria-current` is set to any value other than `"false"`.
 * @slot - The label.
 * @slot icon - One icon before the label (the slot convention): `--ocelle-icon-size` square, decorative.
 * @csspart control - The inner `<button>`, or the inner `<a>` in link mode.
 * @fires {CustomEvent<Record<string, never>>} ocelle-button-activate - Dispatched from the element on each activation
 * that delivers a `click` (a pointer click, Enter, Space in button mode, `click()`), before the `click` reaches any
 * bubble-phase listener on the element or its ancestors; bubbles, composed and cancelable, `detail` `{}`. Calling
 * `preventDefault()` on it cancels the click's default action (in link mode the navigation; in button mode the
 * `click` is still delivered). Not dispatched for a link-mode click with Ctrl, Meta, Shift or Alt held, nor for a
 * middle click. A disabled button dispatches neither.
 */
export class OcelleButton extends LitElement {
  /** @internal The open shadow root delegates focus to the inner control (research.md R-01). */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    flush: { type: Boolean, reflect: true },
    ground: { type: String, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    rel: { type: String, reflect: true },
    download: { type: String, reflect: true },
  };

  /** @internal The moved attributes and their mirrors join Lit's observed attributes (research.md R-03). */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, ...MovedAttributes.observed(moved)];
  }

  static override styles = [
    css`
      :host {
        display: inline-grid;
      }

      :host([hidden]) {
        display: none;
      }

      .control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-block-size: var(--ocelle-target-min);
        min-inline-size: var(--ocelle-target-min);
        margin: 0;
        padding-block: 0;
        padding-inline: var(--ocelle-space-4);
        border-style: solid;
        border-width: var(--ocelle-border-width);
        border-radius: var(--ocelle-radius-2);
        font: inherit;
        font-size: var(--ocelle-font-size-md);
        line-height: var(--ocelle-line-height-normal);
        text-align: center;
        cursor: pointer;
      }

      :host([disabled]) .control {
        cursor: default;
      }

      .label {
        min-inline-size: 0;
        overflow-wrap: anywhere;
      }

      .icon-row.bare slot[name="icon"]::slotted(*) {
        margin-inline-end: 0 !important;
      }

      :host([size="compact"]) .control {
        min-block-size: var(--ocelle-space-6);
        min-inline-size: var(--ocelle-space-6);
        padding-inline: var(--ocelle-space-2);
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-compact);
      }

      :host([flush]) .control {
        justify-content: flex-start;
        padding-inline: 0;
        border-style: none;
      }

      @media not (forced-colors: active) {
        :host .control {
          background-color: var(--ocelle-color-sheet);
          border-color: var(--ocelle-color-control-border);
          color: var(--ocelle-color-ink);
        }

        :host(:where([variant="quiet"])) .control {
          background-color: transparent;
        }

        :host(:where([variant="primary"])) .control {
          background-color: var(--ocelle-color-accent);
          border-color: var(--ocelle-color-accent-strong);
          color: var(--ocelle-color-on-accent);
        }

        :host(:where([ground="accent-low"], [ground="inset"], [ground="hover-bg"], [ground="state"])) .control {
          border-color: var(--ocelle-color-accent-strong);
        }

        :host(:where([ground="chrome"]:not([variant="primary"]))) .control {
          background-color: transparent;
          border-color: var(--ocelle-color-chrome-muted);
          color: var(--ocelle-color-chrome-ink);
        }

        :host .control:where(:hover) {
          background-color: var(--ocelle-color-hover-bg);
          border-color: var(--ocelle-color-hover-border);
        }

        :host .control:where(:active) {
          background-color: var(--ocelle-color-active-bg);
          border-color: var(--ocelle-color-hover-border);
        }

        :host(:where([variant="primary"])) .control:where(:hover) {
          background-color: var(--ocelle-color-accent-hover);
        }

        :host(:where([variant="primary"])) .control:where(:active) {
          background-color: var(--ocelle-color-accent);
        }

        :host(:where([ground="chrome"])) .control:where(:hover, :active) {
          border-color: var(--ocelle-color-chrome-ink);
        }

        :host(:where([ground="chrome"]:not([variant="primary"]))) .control:where(:hover) {
          background-color: var(--ocelle-color-chrome-hover);
        }

        :host(:where([ground="chrome"]:not([variant="primary"]))) .control:where(:active) {
          background-color: var(--ocelle-color-chrome-active);
        }

        :host(:where([flush])) .control {
          background-color: transparent;
          color: var(--ocelle-color-ink);
        }

        :host(:where([flush][ground="chrome"])) .control {
          color: var(--ocelle-color-chrome-ink);
        }

        :host(:where([flush])) .control:where(:hover) {
          background-color: var(--ocelle-color-hover-bg);
        }

        :host(:where([flush])) .control:where(:active) {
          background-color: var(--ocelle-color-active-bg);
        }

        :host(:where([flush][ground="chrome"])) .control:where(:hover) {
          background-color: var(--ocelle-color-chrome-hover);
        }

        :host(:where([flush][ground="chrome"])) .control:where(:active) {
          background-color: var(--ocelle-color-chrome-active);
        }

        :host(:where([disabled])) .control {
          background-color: var(--ocelle-color-disabled-bg);
          border-color: var(--ocelle-color-disabled-ink);
          color: var(--ocelle-color-disabled-ink);
        }

        :host(:where([disabled][variant="quiet"], [disabled][flush], [disabled][ground="chrome"]:not([variant="primary"]))) .control {
          background-color: transparent;
        }
      }

      @media (forced-colors: active) {
        :host([flush]) .control:where(:hover, :active) {
          outline-style: dashed;
          outline-width: var(--ocelle-focus-width);
          outline-color: Highlight;
          outline-offset: var(--ocelle-focus-offset);
        }

        :host([flush]) .control:focus-visible {
          outline-style: solid;
        }

        :host([flush][disabled]) .control {
          outline-style: none;
        }

        :host([disabled]) .control {
          color: GrayText;
          border-color: GrayText;
        }
      }
    `,
    controlStyles,
    iconSlotStyles,
  ];

  /**
   * The look: `primary` (filled), `secondary` (bordered on a surface) or `quiet` (bordered, no fill); absent or any
   * other value renders `secondary`. Reflected.
   *
   * @default undefined
   */
  declare variant: "primary" | "secondary" | "quiet" | undefined;

  /**
   * `default` (at least `--ocelle-target-min` in both dimensions) or `compact` (the compact text scale, at least 24 px
   * in both dimensions); absent or any other value renders `default`. Reflected.
   *
   * @default undefined
   */
  declare size: "default" | "compact" | undefined;

  /**
   * No inline padding, no border and no fill: a text-like control whose content starts at its inline start, with only
   * its hover surface and focus ring. Reflected.
   *
   * @default false
   */
  declare flush: boolean;

  /**
   * The ground the button sits on: `accent-low`, `inset`, `hover-bg` or `state` (a state ground) give a bordered
   * variant an `--ocelle-color-accent-strong` border; `chrome` gives the chrome look for the chrome grounds; absent or
   * any other value means the other main grounds. Reflected.
   *
   * @default undefined
   */
  declare ground: "accent-low" | "inset" | "hover-bg" | "state" | "chrome" | undefined;

  /**
   * The accessible name of the button, trimmed; empty or whitespace-only counts as none, and the name is then the
   * content. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * Disabled: out of the tab order, reported disabled and not activated (no `click`, no `ocelle-button-activate`).
   * Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  /**
   * The link's URL: a non-empty `href` that parses as a URL and is not a `javascript:` URL puts the button in link mode
   * (an inner `<a>` with the `href` as written); any other value is button mode. Reflected.
   *
   * @default undefined
   */
  declare href: string | undefined;

  /**
   * The inner link's `target`, in link mode while available; with `_blank` and no `rel` the link gets `rel="noopener"`.
   * Reflected.
   *
   * @default undefined
   */
  declare target: string | undefined;

  /** The inner link's `rel`, in link mode while available. Reflected.
   *
   * @default undefined
   */
  declare rel: string | undefined;

  /** The inner link's `download`, in link mode while available. Reflected.
   *
   * @default undefined
   */
  declare download: string | undefined;

  /** The moved host attributes (src/control.ts). */
  readonly #moved = new MovedAttributes(this, moved, (name) => {
    if (name === undefined || references.some(([reference]) => reference === name)) this.#resolve();
    this.requestUpdate();
  });

  /** The elements each moved ID reference names, resolved when it is set and when the element is connected. */
  readonly #resolved = new Map<string, Element[]>();

  /** The custom states (`expanded`, `pressed`, `current`). */
  readonly #internals = this.attachInternals();

  /** Whether the default slot holds a label: non-whitespace text in its flattened assignment. */
  #labelled = false;

  /**
   * Rereads the label when text inside the element changes, which fires no `slotchange`: a text node's data, or text
   * inserted into or removed from a slotted element (a child-list change inside it, review R2-01). It observes the
   * element for its lifetime: an observer holds its target only weakly, so it needs no disconnecting.
   */
  readonly #text = new MutationObserver(() => {
    this.#readLabel();
  });

  constructor() {
    super();
    this.flush = false;
    this.disabled = false;
    guardHost(this, () => this.#control(), () => !this.disabled);
    this.#text.observe(this, { characterData: true, childList: true, subtree: true });
  }

  /**
   * Reads whether the default slot holds a label, as FR-031 defines an empty slot: non-whitespace text in its
   * flattened assignment. Without one the icon is the only content and takes no gap, so it is centred (review R1-01).
   */
  #readLabel(): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>(".label slot");
    this.#labelled = (slot?.assignedNodes({ flatten: true }) ?? []).map((node) => node.textContent).join("").trim() !== "";
    this.requestUpdate();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (this.#moved.handle(name, value)) return;
    super.attributeChangedCallback(name, old, value);
  }

  override connectedCallback(): void {
    this.#moved.connected();
    this.#resolve();
    super.connectedCallback();
  }

  /** Resolves the moved ID references in the host's own tree (research.md R-04). */
  #resolve(): void {
    for (const [name] of references) this.#resolved.set(name, resolveIds(this, this.#moved.get(name)));
  }

  /** The inner `<button>` or `<a>`, once rendered. */
  #control(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>(".control");
  }

  /**
   * Clicks the inner control, so the click passes through it and is guarded like any other: a disabled button ignores
   * it.
   */
  override click(): void {
    this.#control()?.click();
  }

  /** Dispatches `ocelle-button-activate` for a click on the available inner control; a cancelled one cancels the click. */
  #activate(event: MouseEvent): void {
    if (this.disabled) return;
    if (linkHref(this.href, document.baseURI) !== undefined && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
    const proceed = this.dispatchEvent(new CustomEvent("ocelle-button-activate", { bubbles: true, composed: true, cancelable: true, detail: {} }));
    if (!proceed) event.preventDefault();
  }

  /** The inner control's name, when it is not its content: the host's `aria-label`, then `label` (research.md R-05). */
  #name(): string | undefined {
    if ((this.#resolved.get("aria-labelledby") ?? []).length > 0) return undefined;
    const label = this.label?.trim() ?? "";
    return this.#moved.get("aria-label") ?? (label === "" ? undefined : label);
  }

  /** The moved `aria-current`, unless it is the off value `"false"`. */
  #current(): string | undefined {
    const current = this.#moved.get("aria-current");
    return current === "false" ? undefined : current;
  }

  protected override render(): unknown {
    const value = (name: string): string | typeof nothing => this.#moved.get(name) ?? nothing;
    const content = html`<span class=${this.#labelled ? "icon-row" : "icon-row bare"}><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot @slotchange=${this.#readLabel}></slot></span></span>`;
    const href = linkHref(this.href, document.baseURI);
    if (href !== undefined) {
      const available = !this.disabled;
      const rel = this.rel ?? (this.target === "_blank" ? "noopener" : undefined);
      return html`<a part="control" class="control" href=${available ? href : nothing} target=${available ? (this.target ?? nothing) : nothing} rel=${available ? (rel ?? nothing) : nothing} download=${available ? (this.download ?? nothing) : nothing} role=${available ? nothing : "link"} aria-disabled=${available ? nothing : "true"} aria-label=${this.#name() ?? nothing} aria-expanded=${value("aria-expanded")} aria-current=${this.#current() ?? nothing} aria-haspopup=${value("aria-haspopup")} title=${value("title")} @click=${this.#activate}>${content}</a>`;
    }
    return html`<button part="control" class="control" type="button" ?disabled=${this.disabled} aria-label=${this.#name() ?? nothing} aria-expanded=${value("aria-expanded")} aria-current=${this.#current() ?? nothing} aria-haspopup=${value("aria-haspopup")} aria-pressed=${value("aria-pressed")} title=${value("title")} @click=${this.#activate}>${content}</button>`;
  }

  /** Relates the inner control to the resolved references and sets the custom states from the moved values. */
  protected override updated(): void {
    const inner = this.#control();
    if (inner !== null) {
      for (const [name, property] of references) {
        const found = this.#resolved.get(name) ?? [];
        inner[property] = found.length === 0 ? null : found;
      }
    }
    const states: readonly (readonly [string, boolean])[] = [
      ["expanded", this.#moved.get("aria-expanded") === "true"],
      ["pressed", this.#moved.get("aria-pressed") === "true"],
      ["current", this.#current() !== undefined],
    ];
    for (const [state, on] of states) {
      if (on) this.#internals.states.add(state);
      else this.#internals.states.delete(state);
    }
  }
}

define("ocelle-button", OcelleButton);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-button": OcelleButton;
  }
}
