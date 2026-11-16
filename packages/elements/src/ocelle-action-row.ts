// `ocelle-action-row` (012 spec US4, US5, FR-001 to FR-006, FR-030 to FR-042; research.md R-01 to R-05, R-08, R-10,
// R-12; data-model.md § `ocelle-action-row`; plan decisions 6, 9, 13, 16, 18, 19, 21 to 25, 30 and 31): an activatable row,
// one native `<button type="button">` (button mode) or `<a>` (link mode, by src/control.ts `linkHref`) with the part
// `control` in an open shadow root attached with `delegatesFocus`. The host is `display: grid; min-inline-size:
// min-content` and the shadow layout wrapper (`.layout`) its single stretched grid item; the inner control holds the
// icon and the title, and its hit layer (`.hit`, absolutely positioned against the layout wrapper) fills the host, so a
// row stretched by a flex row or a grid has no area outside the control's hit layer and a shrink-wrapping container
// never makes it 0 wide. The host guard (src/control.ts) stops any click whose path misses the inner control, and any
// click while the row is unavailable.
//
// Each click on the available inner control (a pointer click, Enter, Space in button mode, the element's `click()`)
// dispatches `ocelle-action-row-activate` from the host, bubbling, composed and cancelable, with `detail` `{ rowId }`,
// the current `row-id` (`""` when absent), before the click reaches any bubble-phase listener and before a link's
// navigation; a cancelled event cancels the click (`preventDefault()`), so a link row does not navigate. In link mode a
// click with Ctrl, Meta, Shift or Alt held dispatches nothing and the element prevents nothing (the browser's own
// modifier handling applies); a middle click delivers no click. `busy` reports `aria-busy="true"` on the inner control
// and does not block activation. `unavailable` (src/control.ts `controlState`) keeps the inner control in the tab
// order with `aria-disabled="true"` and activates nothing; an unavailable link has no `href`, `target` or `rel` and is
// `role="link" tabindex="0"` (plan decision 9). While unavailable the description, tags and trailing wrappers carry
// `aria-disabled="true"` too, so a checker reads their disabled ink as part of the inactive control (plan decision 31);
// an unavailable current row keeps its current surface, with a disabled-ink bar and no hover (decisions 16 and 31). `current` (`page` or `true`; any other value is absent) sets
// `aria-current` on the inner control and draws the current mark.
//
// Name and description (FR-034; research.md R-04, R-05; plan decision 30): the host's `aria-label`,
// `aria-labelledby`, `aria-describedby` and `title` are moved onto the inner control (src/control.ts
// `MovedAttributes`, with their mirrors). The name is the host's `aria-labelledby`, then its `aria-label`, then
// `label`, then the inner control's content, named from content with no internal reference: the control holds only the
// icon (decorative) and the title, so its visible text is its name, and the description, the tags and the trailing
// content, which are `aria-hidden` siblings of the control, never join it. The description is the host's
// `aria-describedby` when it is set, else the elements assigned to the `description` slot followed by those of the
// `tags` slot that hold non-whitespace text (none: no description, so a moved `title` describes the row).
//
// Slot emptiness (FR-031; plan decision 25): the `icon` and `trailing` slots are empty when no element is assigned,
// the `description` and `tags` slots when no assigned element holds non-whitespace text; an empty slot's wrapper is
// hidden, so it takes no space and adds no gap. Emptiness is read again on `slotchange` and when text or children
// inside the element change (a `MutationObserver` on the host's light children), which fire no `slotchange`.
//
// Layout and look (research.md R-08 items 2 to 4a and 7, R-10, R-12): in the row layout the icon, title and
// description share one group and the tags and the trailing icon another, which moves to a second line as a whole
// when the line cannot hold both; in the card layout the layout wrapper is a grid (the groups take `display:
// contents`): the title line with the trailing icon at its end, then the description, then the tags, `--ocelle-space-1`
// apart, the tags wrapping only between tags. Title and description wrap anywhere when a word does not fit. Every row
// is at least `--ocelle-target-min` tall, with the inline padding `--ocelle-space-3` in both presentations. The hit
// layer draws the surface, the border, the hover, the focus ring (inside the row, `--ocelle-focus-offset-inset`) and
// the current bar (`.bar`, 7 to 10 px inside the border edge, clear of the ring's band). It paints beneath the icon
// wrapper, the title and the sibling wrappers (positive stacking: the layer at `z-index: 0`, the content at
// `z-index: 1`, in the layout wrapper's stacking context) and, since the siblings take no pointer events, takes every
// click outside the icon and the title. `default`: a bordered row on `--ocelle-color-sheet` with `--ocelle-radius-row`,
// its border by the `ground` the host states; `flush`: no border and no fill, the block padding `--ocelle-space-1` and
// the compact text scale. Hover fills with `--ocelle-color-hover-bg` and turns a default row's border
// `--ocelle-color-hover-border`; a current row keeps its `--ocelle-color-accent-low` surface (`chrome-hover` on chrome)
// on hover; an unavailable row has no hover and the disabled ink. The title is in `--ocelle-color-ink`, the
// description and the tags in `--ocelle-color-ink-soft`, each set on its own wrapper, since the siblings inherit nothing
// from the control. Colour rules sit inside `@media not (forced-colors: active)`; they target the hit layer, the bar,
// the inner control and the sibling wrappers, keyed on the host's attributes inside `:where(...)` so that rules of one
// kind share a specificity and the later rule wins: presentation, ground, hover, flush, current, then unavailable.
// Importing this module defines `ocelle-action-row` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { MovedAttributes, controlState, controlStyles, guardHost, linkHref, resolveIds } from "./control.ts";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";

/** The host attributes `ocelle-action-row` moves onto its inner control (FR-030). */
const moved = ["aria-label", "aria-labelledby", "aria-describedby", "title"] as const;
/** The moved ID references (research.md R-04). */
const references = ["aria-labelledby", "aria-describedby"] as const;

/** Whether an element holds non-whitespace text (FR-031, FR-034). */
function texted(element: Element): boolean {
  return element.textContent.trim() !== "";
}

/**
 * An activatable row: a leading icon, a title, a description, tags and a trailing icon, activated by pointer or
 * keyboard with one `ocelle-action-row-activate` event that carries the row's id; a row or a card, bordered or flush,
 * on the ground the host states, a link with `href`, the current item of a list and an unavailable item.
 *
 * @tagname ocelle-action-row
 * @attr {string} aria-label - Moved onto the inner control (the host keeps no copy): the row's accessible name, over
 * `label` and the title; an empty or whitespace-only value clears it; `removeAttribute` after the move changes nothing.
 * @attr {string} aria-labelledby - Moved onto the inner control: the ids, space-separated, of the elements that name
 * the row, resolved in the host's own tree when set and when the element is connected, over `aria-label`; an empty
 * value clears it.
 * @attr {string} aria-describedby - Moved onto the inner control: the ids, space-separated, of the elements that
 * describe the row, resolved in the host's own tree; it replaces the description and tags slots' description; an
 * empty value clears it.
 * @attr {string} title - Moved onto the inner control: its native tooltip, and its description when nothing else
 * describes the row; an empty value clears it.
 * @attr {string} data-ocelle-moved-aria-label - Element-owned mirror of the moved `aria-label`, so copies of the live
 * DOM keep it; hosts do not write or remove it, and the element restores it when it is removed or changed.
 * @attr {string} data-ocelle-moved-aria-labelledby - Element-owned mirror of the moved `aria-labelledby`; hosts do not
 * write or remove it.
 * @attr {string} data-ocelle-moved-aria-describedby - Element-owned mirror of the moved `aria-describedby`; hosts do
 * not write or remove it.
 * @attr {string} data-ocelle-moved-title - Element-owned mirror of the moved `title`; hosts do not write or remove it.
 * @slot - The title: the row's accessible name; the description, the tags and the trailing content never join it.
 * @slot icon - One icon before the title (the slot convention): `--ocelle-icon-size` square, decorative.
 * @slot description - Elements whose text describes the row, after the title; an element without non-whitespace text
 * contributes nothing, and a slot with no such element takes no space.
 * @slot tags - Elements whose text describes the row after the description, laid out as one group with the trailing
 * icon; a slot with no element holding text takes no space.
 * @slot trailing - One icon at the end of the row (the slot convention), for example `arrow-end`.
 * @csspart control - The row's icon-and-title control: the inner `<button>`, or the inner `<a>` in link mode. It is not
 * the row's surface: the description, tags and trailing content are beside it, and `::part(control)` styles do not
 * reach the row's surface or border.
 * @csspart title - The title's wrapper, the row's name.
 * @csspart description - The description slot's wrapper.
 * @csspart tags - The tags slot's wrapper.
 * @fires {CustomEvent<{ rowId: string }>} ocelle-action-row-activate - Dispatched from the element on each activation
 * (a pointer click, Enter, Space in button mode, `click()`), before a link's navigation; bubbles, composed and
 * cancelable, `detail` `{ rowId }`, the current `row-id` or `""`; `preventDefault()` cancels a link's navigation. Not
 * dispatched for a Ctrl, Meta, Shift or Alt click or a middle click in link mode, nor while the row is unavailable.
 */
export class OcelleActionRow extends LitElement {
  /** @internal The open shadow root delegates focus to the inner control (research.md R-01). */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    rowId: { type: String, reflect: true, attribute: "row-id" },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    layout: { type: String, reflect: true },
    presentation: { type: String, reflect: true },
    ground: { type: String, reflect: true },
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    rel: { type: String, reflect: true },
    current: { type: String, reflect: true },
    unavailable: { type: Boolean, reflect: true },
    busy: { type: Boolean, reflect: true },
  };

  /** @internal The moved attributes and their mirrors join Lit's observed attributes (research.md R-03). */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, ...MovedAttributes.observed(moved)];
  }

  static override styles = [
    controlStyles,
    iconSlotStyles,
    css`
      :host {
        display: grid;
        min-inline-size: min-content;
      }

      :host([hidden]) {
        display: none;
      }

      .layout {
        position: relative;
        z-index: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ocelle-space-1) var(--ocelle-space-2);
        box-sizing: border-box;
        min-block-size: var(--ocelle-target-min);
        padding-block: var(--ocelle-space-2);
        padding-inline: calc(var(--ocelle-space-3) + var(--ocelle-border-width));
        font: inherit;
        font-size: var(--ocelle-font-size-md);
        line-height: var(--ocelle-line-height-normal);
      }

      :host([presentation="flush"]) .layout {
        padding-block: var(--ocelle-space-1);
        padding-inline: var(--ocelle-space-3);
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-compact);
      }

      .lead,
      .end {
        display: flex;
        align-items: flex-start;
        pointer-events: none;
      }

      .lead {
        flex: 1 1 auto;
        min-inline-size: min-content;
      }

      .end {
        flex: 0 0 auto;
      }

      .control {
        display: flex;
        flex: 0 1 auto;
        align-items: flex-start;
        min-inline-size: 0;
        margin: 0;
        padding: 0;
        border-style: none;
        background: none;
        font: inherit;
        text-align: start;
        cursor: pointer;
        pointer-events: auto;
      }

      :host .control:focus-visible {
        outline-style: none;
      }

      .hit {
        position: absolute;
        inset: 0;
        z-index: 0;
        box-sizing: border-box;
        border-style: solid;
        border-width: var(--ocelle-border-width);
        border-radius: var(--ocelle-radius-row);
      }

      :host([presentation="flush"]) .hit {
        border-style: none;
      }

      .control:focus-visible .hit {
        outline-style: solid;
        outline-width: var(--ocelle-focus-width);
        outline-color: var(--ocelle-color-focus);
        outline-offset: var(--ocelle-focus-offset-inset);
      }

      .title,
      .description {
        min-inline-size: 0;
        overflow-wrap: anywhere;
      }

      .control > .icon-slot,
      .title,
      .description,
      .tags,
      .trailing {
        position: relative;
        z-index: 1;
      }

      .description,
      .tags,
      .trailing {
        pointer-events: none;
      }

      .description {
        margin-inline-start: var(--ocelle-space-2);
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ocelle-space-1);
      }

      .tags ::slotted(*) {
        max-inline-size: 100%;
        overflow-wrap: anywhere;
      }

      .end[hidden],
      .description[hidden],
      .tags[hidden] {
        display: none;
      }

      :host([layout="card"]) .layout {
        display: grid;
        grid-template-areas: "title trailing";
        grid-template-columns: [full-start] 1fr auto [full-end];
        align-content: start;
        align-items: start;
        gap: var(--ocelle-space-1) 0;
      }

      :host([layout="card"]) .lead,
      :host([layout="card"]) .end {
        display: contents;
      }

      :host([layout="card"]) .control {
        grid-area: title;
      }

      :host([layout="card"]) .trailing {
        grid-area: trailing;
      }

      :host([layout="card"]) .description,
      :host([layout="card"]) .tags {
        grid-column: full;
        margin-inline-start: 0;
      }

      .bar {
        position: absolute;
        inset-block: 0;
        inset-inline-start: calc(var(--ocelle-focus-width) + 2 * var(--ocelle-focus-offset) - var(--ocelle-border-width));
        inline-size: var(--ocelle-bar-width);
      }

      :host([presentation="flush"]) .bar {
        inset-inline-start: calc(var(--ocelle-focus-width) + 2 * var(--ocelle-focus-offset));
      }

      @media not (forced-colors: active) {
        :host .hit {
          background-color: var(--ocelle-color-sheet);
          border-color: var(--ocelle-color-control-border);
        }

        :host .control,
        :host .trailing {
          color: var(--ocelle-color-ink);
        }

        :host .description,
        :host .tags {
          color: var(--ocelle-color-ink-soft);
        }

        :host(:where([ground="accent-low"], [ground="inset"], [ground="hover-bg"], [ground="state"])) .hit {
          border-color: var(--ocelle-color-accent-strong);
        }

        :host(:where([ground="chrome"])) .hit {
          background-color: transparent;
          border-color: var(--ocelle-color-chrome-muted);
        }

        :host(:where([ground="chrome"])) .control,
        :host(:where([ground="chrome"])) .trailing {
          color: var(--ocelle-color-chrome-ink);
        }

        :host(:where([ground="chrome"])) .description,
        :host(:where([ground="chrome"])) .tags {
          color: var(--ocelle-color-chrome-muted);
        }

        :host(:where(:not([unavailable]))) .control:where(:hover) .hit {
          background-color: var(--ocelle-color-hover-bg);
          border-color: var(--ocelle-color-hover-border);
        }

        :host(:where([ground="chrome"]:not([unavailable]))) .control:where(:hover) .hit {
          background-color: var(--ocelle-color-chrome-hover);
          border-color: var(--ocelle-color-chrome-ink);
        }

        :host(:where([presentation="flush"])) .hit {
          background-color: transparent;
        }

        :host(:where([presentation="flush"]:not([unavailable]))) .control:where(:hover) .hit {
          background-color: var(--ocelle-color-hover-bg);
        }

        :host(:where([presentation="flush"][ground="chrome"]:not([unavailable]))) .control:where(:hover) .hit {
          background-color: var(--ocelle-color-chrome-hover);
        }

        :host(:where([current="page"], [current="true"])) .control .hit {
          background-color: var(--ocelle-color-accent-low);
        }

        :host(:where([current="page"][ground="chrome"], [current="true"][ground="chrome"])) .control .hit {
          background-color: var(--ocelle-color-chrome-hover);
        }

        :host .bar {
          background-color: var(--ocelle-color-current);
        }

        :host(:where([unavailable])) .control,
        :host(:where([unavailable])) .description,
        :host(:where([unavailable])) .tags,
        :host(:where([unavailable])) .trailing {
          color: var(--ocelle-color-disabled-ink);
        }

        :host(:where([unavailable])) .bar {
          background-color: var(--ocelle-color-disabled-ink);
        }
      }

      @media (forced-colors: active) {
        .control,
        .description,
        .tags,
        .trailing {
          color: ButtonText;
        }

        .hit {
          background-color: Canvas;
          border-color: ButtonText;
        }

        .layout.link .control,
        .layout.link .description,
        .layout.link .tags,
        .layout.link .trailing {
          color: LinkText;
        }

        .layout.link .hit {
          border-color: LinkText;
        }

        :host(:where(:not([unavailable]))) .control:where(:hover, :active) .hit {
          border-color: Highlight;
        }

        .control:focus-visible .hit {
          outline-color: Highlight;
        }

        :host([presentation="flush"]:where(:not([unavailable]))) .control:where(:hover, :active) .hit {
          outline-style: dashed;
          outline-width: var(--ocelle-focus-width);
          outline-color: Highlight;
          outline-offset: var(--ocelle-focus-offset-inset);
        }

        :host([presentation="flush"]) .control:focus-visible .hit {
          outline-style: solid;
        }

        .bar {
          forced-color-adjust: none;
          background-color: Highlight;
        }

        :host([unavailable]) .control,
        :host([unavailable]) .description,
        :host([unavailable]) .tags,
        :host([unavailable]) .trailing {
          color: GrayText;
        }

        :host([unavailable]) .hit {
          border-color: GrayText;
        }

        :host([unavailable]) .bar {
          background-color: GrayText;
        }
      }
    `,
  ];

  /**
   * The row's id, carried by its `ocelle-action-row-activate` event as `detail.rowId` (`""` when absent). Reflected as
   * `row-id`.
   *
   * @default undefined
   */
  declare rowId: string | undefined;

  /**
   * The accessible name of the row, trimmed; empty or whitespace-only counts as none, and the name is then the title.
   * Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * `row` (icon, title and description, then the tags and the trailing icon, on one line; the tags and the trailing
   * icon move to a second line together when the line cannot hold them) or `card`; absent or any other value renders
   * `row`. Reflected.
   *
   * @default undefined
   */
  declare layout: "row" | "card" | undefined;

  /**
   * `default` (a bordered row on a surface) or `flush` (no border and no surface, the compact navigation density);
   * absent or any other value renders `default`. Reflected.
   *
   * @default undefined
   */
  declare presentation: "default" | "flush" | undefined;

  /**
   * The ground the row sits on: `accent-low`, `inset`, `hover-bg` or `state` (a state ground) give a default row an
   * `--ocelle-color-accent-strong` border; `chrome` gives the chrome look for the chrome grounds; absent or any other
   * value means the other main grounds. Reflected.
   *
   * @default undefined
   */
  declare ground: "accent-low" | "inset" | "hover-bg" | "state" | "chrome" | undefined;

  /**
   * The link's URL: a non-empty `href` that parses as a URL and is not a `javascript:` URL makes the row a link (an
   * inner `<a>` with the `href` as written); any other value is button mode. Reflected.
   *
   * @default undefined
   */
  declare href: string | undefined;

  /**
   * The inner link's `target`, in link mode; with `_blank` and no `rel` the link gets `rel="noopener"`. Reflected.
   *
   * @default undefined
   */
  declare target: string | undefined;

  /** The inner link's `rel`, in link mode. Reflected.
   *
   * @default undefined
   */
  declare rel: string | undefined;

  /**
   * `page` or `true`: the row is the current item, reported as `aria-current` with that value on the inner control and
   * drawn with the current mark (an `--ocelle-color-accent-low` surface, `--ocelle-color-chrome-hover` on chrome, and
   * a bar in `--ocelle-color-current` at the inline start, apart from the focus ring), which stays on hover; absent or
   * any other value is not current. Reflected.
   *
   * @default undefined
   */
  declare current: "page" | "true" | undefined;

  /**
   * Unavailable: the row exists but cannot be used right now. Its inner control stays in the tab order, reports
   * `aria-disabled="true"`, keeps its name and description and is not activated (no event, no click past the element,
   * no navigation: a link row has no `href`); it shows the disabled ink and no hover. Reflected.
   *
   * @default false
   */
  declare unavailable: boolean;

  /**
   * Busy: the row's content is updating; its inner control reports `aria-busy`, and activation still dispatches the
   * event. Reflected.
   *
   * @default false
   */
  declare busy: boolean;

  /** The moved host attributes (src/control.ts); any change of them resolves the moved references again. */
  readonly #moved = new MovedAttributes(this, moved, () => {
    this.#resolve();
    this.requestUpdate();
  });

  /** The elements each moved ID reference names, resolved when it is set and when the element is connected. */
  readonly #resolved: Record<(typeof references)[number], Element[]> = { "aria-labelledby": [], "aria-describedby": [] };

  /** What the slots hold: whether an element is assigned to the icon and trailing slots, and the texted description and tags elements. */
  #slots: { readonly icon: boolean; readonly trailing: boolean; readonly description: readonly Element[]; readonly tags: readonly Element[] } = { icon: false, trailing: false, description: [], tags: [] };

  /**
   * Reads the slots again when text or children inside the element change, which fire no `slotchange` (plan decision
   * 25). It observes the element for its lifetime: an observer holds its target only weakly, so it needs no
   * disconnecting.
   */
  readonly #text = new MutationObserver(() => {
    this.#readSlots();
  });

  constructor() {
    super();
    this.unavailable = false;
    this.busy = false;
    guardHost(this, () => this.#control(), () => !this.unavailable);
    this.#text.observe(this, { characterData: true, childList: true, subtree: true });
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    this.#moved.handle(name, value);
    super.attributeChangedCallback(name, old, value);
  }

  override connectedCallback(): void {
    this.#moved.connected();
    // The mirrors read back, and a later connection may put the element in another tree: the references are resolved
    // there (research.md R-04).
    this.#resolve();
    this.requestUpdate();
    super.connectedCallback();
  }

  /** Resolves the moved ID references in the host's own tree (research.md R-04). */
  #resolve(): void {
    for (const name of references) this.#resolved[name] = resolveIds(this, this.#moved.get(name));
  }

  /** Reads what each slot holds (FR-031, FR-034). */
  #readSlots(): void {
    const assigned = (name: string): Element[] => this.renderRoot.querySelector<HTMLSlotElement>(`slot[name="${name}"]`)?.assignedElements({ flatten: true }) ?? [];
    this.#slots = {
      icon: assigned("icon").length > 0,
      trailing: assigned("trailing").length > 0,
      description: assigned("description").filter(texted),
      tags: assigned("tags").filter(texted),
    };
    this.requestUpdate();
  }

  /** The inner `<button>` or `<a>`, once rendered. */
  #control(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>(".control");
  }

  /** Clicks the inner control, so the click passes through it and the row is activated as by any other click. */
  override click(): void {
    this.#control()?.click();
  }

  /**
   * Dispatches `ocelle-action-row-activate` for a click on the available inner control, unless it is a modifier click
   * on a link; a cancelled one cancels the click, so a link does not navigate.
   */
  #activate(event: MouseEvent): void {
    if (this.unavailable) return;
    if (linkHref(this.href, document.baseURI) !== undefined && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
    const proceed = this.dispatchEvent(new CustomEvent("ocelle-action-row-activate", { bubbles: true, composed: true, cancelable: true, detail: { rowId: this.rowId ?? "" } }));
    if (!proceed) event.preventDefault();
  }

  /** The current value the inner control reports: `page` or `true`, else none. */
  #current(): "page" | "true" | undefined {
    return this.current === "page" || this.current === "true" ? this.current : undefined;
  }

  /** The inner control's name when it is not the title: the host's `aria-label`, then `label` (research.md R-05). */
  #name(): string | undefined {
    if (this.#resolved["aria-labelledby"].length > 0) return undefined;
    const label = this.label?.trim() ?? "";
    return this.#moved.get("aria-label") ?? (label === "" ? undefined : label);
  }

  protected override render(): unknown {
    const slots = this.#slots;
    const description = slots.description.length > 0;
    const tags = slots.tags.length > 0;
    const current = this.#current();
    const bar = current === undefined ? nothing : html`<span class="bar"></span>`;
    const content = html`<span class="hit">${bar}</span><span class="icon-slot" ?hidden=${!slots.icon}><slot name="icon" @slotchange=${this.#readSlots}></slot></span><span part="title" class="title"><slot></slot></span>`;
    const busy = this.busy ? "true" : nothing;
    const name = this.#name() ?? nothing;
    const title = this.#moved.get("title") ?? nothing;
    const available = controlState(false, this.unavailable) === "available";
    const disabled = available ? nothing : "true";
    const href = linkHref(this.href, document.baseURI);
    const rel = this.rel ?? (this.target === "_blank" ? "noopener" : undefined);
    const control =
      href === undefined
        ? html`<button part="control" class="control" type="button" aria-disabled=${disabled} aria-busy=${busy} aria-current=${current ?? nothing} aria-label=${name} title=${title} @click=${this.#activate}>${content}</button>`
        : html`<a part="control" class="control" href=${available ? href : nothing} target=${available ? (this.target ?? nothing) : nothing} rel=${available ? (rel ?? nothing) : nothing} role=${available ? nothing : "link"} tabindex=${available ? nothing : "0"} aria-disabled=${disabled} aria-busy=${busy} aria-current=${current ?? nothing} aria-label=${name} title=${title} @click=${this.#activate}>${content}</a>`;
    return html`<div class=${href === undefined ? "layout" : "layout link"}
      ><span class="lead"
        >${control}<span part="description" class="description" aria-hidden="true" aria-disabled=${disabled} ?hidden=${!description}><slot name="description" @slotchange=${this.#readSlots}></slot></span></span
      ><span class="end" ?hidden=${!tags && !slots.trailing}
        ><span part="tags" class="tags" aria-hidden="true" aria-disabled=${disabled} ?hidden=${!tags}><slot name="tags" @slotchange=${this.#readSlots}></slot></span
        ><span class="icon-slot trailing" aria-hidden="true" aria-disabled=${disabled} ?hidden=${!slots.trailing}><slot name="trailing" @slotchange=${this.#readSlots}></slot></span></span
    ></div>`;
  }

  /** Relates the inner control to its name and description elements (research.md R-04, R-05). */
  protected override updated(): void {
    const inner = this.#control();
    if (inner === null) return;
    const labelledBy = this.#resolved["aria-labelledby"];
    inner.ariaLabelledByElements = labelledBy.length === 0 ? null : labelledBy;
    const slotted = [...this.#slots.description, ...this.#slots.tags];
    const describedBy = this.#moved.get("aria-describedby") === undefined ? slotted : this.#resolved["aria-describedby"];
    inner.ariaDescribedByElements = describedBy.length === 0 ? null : [...describedBy];
  }
}

define("ocelle-action-row", OcelleActionRow);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-action-row": OcelleActionRow;
  }
}
