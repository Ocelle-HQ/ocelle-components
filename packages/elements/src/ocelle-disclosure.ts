// `ocelle-disclosure` (020 spec US1, FR-001 to FR-017; research.md R-01 to R-04, R-08; data-model.md
// § `ocelle-disclosure`): a summary that opens and closes a panel inline, on a native `<details>` and `<summary>` in an
// open shadow root attached **without** `delegatesFocus` (the host also holds the panel's content, so a click on it
// must not move focus to the summary, US1-22). The summary (part `summary`, the one inner control) holds the slot
// convention's labelled row: an `aria-hidden` icon wrapper whose `icon` slot falls back to `ocelle-icon` `chevron-end`
// (closed) or `chevron-down` (open), then the `.label` wrapper around the `summary` slot; the panel (part `panel`)
// wraps the default slot. The platform hides a closed panel (content-visibility, so find in page can still open it,
// R-08); the element adds no `display` rule to it.
//
// The open state (R-02) is `open`, reflected: the render binds it to the `details`, and the native `toggle` (a user
// toggle, find in page, `element.click()`) sets it from `details.open`, waits for the update (so the attribute is
// reflected) and dispatches `ocelle-disclosure-toggle` `{ open }` only when the state differs from the one last reported;
// the last reported state is set at the first update, so the upgrade fires nothing. Lit renders a property set several
// times in one task once, and the platform merges the changes made before the native `toggle` runs, so there is at
// most one event per native `toggle`, with the final state. When the state goes from open to closed while focus is in
// the panel (also inside a panel control's shadow root: the host's root's active element is a light-DOM descendant of
// the host), focus moves to the summary (FR-013).
//
// Host ARIA (R-03): `aria-label`, `aria-labelledby`, `aria-describedby` and `title` are moved onto the summary with
// their mirrors (src/control.ts `MovedAttributes`), the ID references by element reflection resolved in the host's
// tree. The summary is named from its `.label` wrapper by element reference while the host gives neither
// `aria-labelledby` nor `aria-label` (phase 1 operator decision (a): a slotted icon's `<title>` would otherwise join the
// name); a host `aria-labelledby` (its resolved list) or `aria-label` (the reference cleared) takes over. A host
// `aria-expanded` is mapped onto `open` (`"true"` opens, `"false"` closes, any other value changes nothing) and removed
// from the host, with no mirror; at upgrade it is applied after `open`, so it wins. `click()` clicks the summary and
// `focus()` focuses it; no host guard, because clicks on the panel's content must reach the page.
// Importing this module defines `ocelle-disclosure` and, for its chevron, `ocelle-icon`.
import { LitElement, css, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { MovedAttributes, controlStyles, resolveIds } from "./control.ts";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";
import "./ocelle-icon.ts";

/** The host attributes `ocelle-disclosure` moves onto its summary (FR-007). */
const moved = ["aria-label", "aria-labelledby", "aria-describedby", "title"] as const;

/** The host attribute mapped onto `open` and removed (FR-007, R-03). */
const mapped = "aria-expanded";

/**
 * A disclosure: a summary that opens and closes a panel inline, on native `details` and `summary` semantics.
 *
 * @tagname ocelle-disclosure
 * @attr {string} aria-label - Moved onto the summary: its accessible name, over the `summary` slot's text (while no
 * host `aria-labelledby` names it); an empty or whitespace-only value clears it.
 * @attr {string} aria-labelledby - Moved onto the summary: the ids, space-separated, of the elements that name it,
 * resolved in the host's own tree and related by element reference, over `aria-label` and the `summary` slot's text;
 * an empty value clears it.
 * @attr {string} aria-describedby - Moved onto the summary: the ids, space-separated, of the elements that describe
 * it, resolved in the host's own tree and related by element reference; an empty value clears it.
 * @attr {string} title - Moved onto the summary: its advisory title; an empty value clears it.
 * @attr {string} data-ocelle-moved-aria-label - Element-owned mirror of the moved `aria-label`, so copies of the live
 * DOM keep it; hosts do not write or remove it, and the element restores it when it is removed or changed.
 * @attr {string} data-ocelle-moved-aria-labelledby - Element-owned mirror of the moved `aria-labelledby`; hosts do not
 * write or remove it.
 * @attr {string} data-ocelle-moved-aria-describedby - Element-owned mirror of the moved `aria-describedby`; hosts do
 * not write or remove it.
 * @attr {string} data-ocelle-moved-title - Element-owned mirror of the moved `title`; hosts do not write or remove it.
 * @attr {"true" | "false"} aria-expanded - Mapped onto `open` and removed from the host: `"true"` opens, `"false"`
 * closes, any other value changes nothing. No mirror: `open` is the persisted state. Read after `open` at upgrade.
 * @cssstate open - While the disclosure is open.
 * @slot summary - The summary's content; with no host `aria-labelledby` or `aria-label`, its text alone names the
 * control (the summary is labelled by the slot's wrapper, so a slotted icon adds nothing); empty, the control has no
 * name. No interactive content.
 * @slot icon - An icon (`ocelle-icon` or a bare `svg`) that replaces the chevron (`chevron-end` closed, `chevron-down`
 * open) in both states; decorative, never labelled: its wrapper is hidden from assistive technology.
 * @slot - The panel's content.
 * @csspart details - The inner `details`.
 * @csspart summary - The summary control.
 * @csspart panel - The panel wrapper.
 * @fires {CustomEvent<{ open: boolean }>} ocelle-disclosure-toggle - After each change of the open state, whatever
 * caused it, in a later task after the attribute is reflected, with the new state. Changes made before the inner
 * `details`' native `toggle` runs are coalesced (always those of one task): at most one event per native `toggle`, with
 * the final state; none at upgrade or when the state ends where the last event left it. Bubbles, composed, not
 * cancelable.
 */
export class OcelleDisclosure extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
  };

  /** @internal The moved attributes, their mirrors and the mapped `aria-expanded` join Lit's observed attributes. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, ...MovedAttributes.observed(moved), mapped];
  }

  static override styles = [
    css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      summary.control {
        list-style: none;
        box-sizing: border-box;
        padding-block: var(--ocelle-space-1);
        padding-inline: var(--ocelle-space-1);
        border-radius: var(--ocelle-radius-2);
        font-size: var(--ocelle-font-size-md);
        font-weight: var(--ocelle-font-weight-medium);
        line-height: var(--ocelle-line-height-normal);
        cursor: pointer;
      }

      summary::-webkit-details-marker {
        display: none;
      }

      .label {
        min-inline-size: 0;
        overflow-wrap: anywhere;
      }

      .icon-slot .chevron {
        inline-size: var(--ocelle-icon-size);
        block-size: var(--ocelle-icon-size);
        flex: none;
        margin-inline-end: var(--ocelle-space-2);
      }

      .panel {
        padding-block-start: var(--ocelle-space-2);
        padding-inline-start: calc(var(--ocelle-icon-size) + var(--ocelle-space-2) + var(--ocelle-space-1));
      }

      @media not (forced-colors: active) {
        summary.control {
          color: var(--ocelle-color-ink);
        }

        summary.control:hover {
          background-color: var(--ocelle-color-hover-bg);
        }
      }

      @media (forced-colors: active) {
        summary.control {
          color: CanvasText;
          background-color: Canvas;
        }
      }
    `,
    controlStyles,
    iconSlotStyles,
  ];

  /**
   * Whether the panel is shown. Reflected: a user toggle, find in page and a script set the attribute alike, so server
   * markup and htmx morphs keep it.
   *
   * @default undefined
   */
  declare open: boolean | undefined;

  /** The moved host attributes (src/control.ts); any change re-resolves the references, which is idempotent. */
  readonly #moved = new MovedAttributes(this, moved, () => {
    this.#resolve();
    this.requestUpdate();
  });

  /** The elements the moved `aria-labelledby` and `aria-describedby` name, resolved when set and when connected. */
  #labelledBy: Element[] = [];
  #describedBy: Element[] = [];

  /** The custom state `open`. */
  readonly #internals = this.attachInternals();

  /** The state the last `ocelle-disclosure-toggle` reported; undefined until the first update. */
  #reported: boolean | undefined;

  /** Whether the current update closes the disclosure while focus is in the panel (set in each `willUpdate`). */
  #rescue: boolean | undefined;

  /** Whether the element has been connected (the upgrade is over). */
  #upgraded = false;

  /** A host `aria-expanded` read before the first connection, applied after every attribute of the markup there. */
  #pending: string | undefined;

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === mapped) {
      this.#map(value);
      return;
    }
    this.#moved.handle(name, value);
    super.attributeChangedCallback(name, old, value);
  }

  /**
   * Maps a host `aria-expanded` onto `open` (before the upgrade ends, held until the first connection, so it is applied
   * after `open`) and removes it from the host; the removal calls back here with null, which changes nothing.
   */
  #map(value: string | null): void {
    if (this.#upgraded) this.#expand(value);
    else if (value !== null) this.#pending = value;
    this.removeAttribute(mapped);
  }

  /** `"true"` opens, `"false"` closes, any other value (or none) changes nothing. */
  #expand(value: string | null | undefined): void {
    if (value === "true") this.open = true;
    else if (value === "false") this.open = false;
  }

  override connectedCallback(): void {
    this.#moved.connected();
    this.#upgraded = true;
    // A mapped value read at the upgrade is applied once, at the first connection.
    this.#expand(this.#pending);
    this.#pending = undefined;
    // A later connection may put the element in another tree: the references are resolved there (R-03).
    this.#resolve();
    this.requestUpdate();
    super.connectedCallback();
  }

  /** Resolves the moved ID references in the host's own tree. */
  #resolve(): void {
    this.#labelledBy = resolveIds(this, this.#moved.get("aria-labelledby"));
    this.#describedBy = resolveIds(this, this.#moved.get("aria-describedby"));
  }

  /** The summary, once rendered. */
  #summary(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>("summary");
  }

  /** Clicks the summary, so it toggles once. */
  override click(): void {
    this.#summary()?.click();
  }

  /** Focuses the summary (the shadow root has no `delegatesFocus`); before the first render it does nothing. */
  override focus(options?: FocusOptions): void {
    this.#summary()?.focus(options);
  }

  /** The native `toggle` of the inner `details`: syncs `open`, waits for the update, reports a changed state. */
  async #toggled(event: Event): Promise<void> {
    const details = event.currentTarget as HTMLDetailsElement;
    this.open = details.open;
    await this.updateComplete;
    // After the update the render has bound `details.open` to `open`: the final state.
    const now = details.open;
    // The last reported state is set at the first update, before any native `toggle` runs.
    if (now === this.#reported) return;
    this.#reported = now;
    this.dispatchEvent(new CustomEvent("ocelle-disclosure-toggle", { bubbles: true, composed: true, cancelable: false, detail: { open: now } }));
  }

  /**
   * Notes whether this update closes the disclosure while focus is in the panel: the active element of the host's root
   * (retargeted, so a control in the panel whose focus is in its own shadow root counts) is in the host's light DOM.
   * Focus on the summary retargets to the host, which `contains` too; moving it to the summary again changes nothing.
   */
  protected override willUpdate(changed: PropertyValues<this>): void {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    this.#rescue = changed.get("open") === true && this.contains(active);
  }

  protected override render(): unknown {
    const open = this.open === true;
    return html`<details part="details" ?open=${open} @toggle=${this.#toggled}><summary class="control" part="summary" aria-label=${this.#moved.get("aria-label") ?? nothing} title=${this.#moved.get("title") ?? nothing}><span class="icon-row"><span class="icon-slot" aria-hidden="true"><slot name="icon"><ocelle-icon class="chevron" name=${open ? "chevron-down" : "chevron-end"}></ocelle-icon></slot></span><span class="label"><slot name="summary"></slot></span></span></summary><div class="panel" part="panel"><slot></slot></div></details>`;
  }

  /** Relates the summary to its name and description, sets the custom state and rescues focus out of a closed panel. */
  protected override updated(): void {
    const summary = this.#summary();
    const label = this.renderRoot.querySelector(".label");
    if (summary !== null) {
      if (this.#labelledBy.length > 0) summary.ariaLabelledByElements = this.#labelledBy;
      else if (this.#moved.get("aria-label") !== undefined || label === null) summary.ariaLabelledByElements = null;
      else summary.ariaLabelledByElements = [label];
      summary.ariaDescribedByElements = this.#describedBy;
    }
    const open = this.open === true;
    if (open) this.#internals.states.add("open");
    else this.#internals.states.delete("open");
    this.#reported ??= open;
    if (this.#rescue === true) summary?.focus();
  }
}

define("ocelle-disclosure", OcelleDisclosure);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-disclosure": OcelleDisclosure;
  }
}
