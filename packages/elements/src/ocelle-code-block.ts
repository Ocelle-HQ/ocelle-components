// `ocelle-code-block` (020 spec US2, FR-020 to FR-035; research.md R-05 to R-07; data-model.md § `ocelle-code-block`):
// a preformatted block for code, commands, logs and digests, in the library's sans with tabular figures, never
// monospace. The code is the host's light-DOM `textContent`, read at each render and shown as a copy in the shadow
// `pre` (part `code`) inside the inset box (part `block`); the shadow root has no slot, so child markup adds no element
// or style, and a `MutationObserver` on the host (child list, character data, subtree) re-renders on every text change
// (R-05). The text and every digest unit are Lit text bindings, so markup-like text stays text.
//
// Two policies (R-06): wrap (the default) is 003's `pre-wrap` and `overflow-wrap: anywhere`, with no scroll box, tab
// stop or role; `overflow="scroll"` (trimmed, any ASCII case) renders the overflow-region module's structure inside the
// block, unchanged (src/overflow-region.ts; specs/009-workflow-layouts/contracts/overflow-region.md): a tab stop and a
// named group only while it overflows, the label passed through `setLabel`, a host `aria-label` observed. Each line of
// code is shown left to right (`.code` is `ltr`, isolated, left-aligned) while the block and the scroll box keep the
// page direction, so the module's fade is on the side where text is hidden; under a computed `rtl` scroll box the
// element opens the box at the line starts with one instant `scrollTo` when the box is new or the shown text changed.
// A switch to wrap while focus is in the scroll structure (the box, or the frame after the module's handover) moves
// focus to `.block`, with a temporary `tabindex="-1"` removed on its `focusout`, and `.block:focus-visible` draws the
// library's ring.
//
// Digest mode (R-07): the trimmed text, when it holds no whitespace, is shown as a prefix (to and including the last
// colon) and groups of four code points, inline spans joined by `<wbr>`, each but the last with a `--ocelle-space-1`
// `margin-inline-end`, the groups `nowrap`; no character is added, so a copy and the reading give the digest as
// written. Importing this module defines `ocelle-code-block` and no other element.
import { LitElement, css, html } from "lit";
import type { PropertyValues, TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import { OverflowRegion, overflowRegionStyles } from "./overflow-region.ts";

/** The units of a digest (data-model.md § Digest derivation): the prefix (empty when none) and the groups; null when the text is not a digest. */
function digestUnits(text: string): { readonly prefix: string; readonly groups: readonly string[] } | null {
  const trimmed = text.trim();
  if (/\s/.test(trimmed)) return null;
  const points = Array.from(trimmed);
  const cut = points.lastIndexOf(":") + 1;
  const rest = points.slice(cut);
  const groups: string[] = [];
  for (let at = 0; at < rest.length; at += 4) groups.push(rest.slice(at, at + 4).join(""));
  return { prefix: points.slice(0, cut).join(""), groups };
}

/**
 * A preformatted block for code, commands, logs and digests, in the library's sans with tabular figures. The text is
 * the element's light-DOM text content, read as a copy: child elements add no markup or style.
 *
 * @tagname ocelle-code-block
 * @csspart block - The inset box.
 * @csspart code - The `pre` that holds the text.
 */
export class OcelleCodeBlock extends LitElement {
  static override properties = {
    overflow: { type: String, reflect: true },
    label: { type: String },
    digest: { type: Boolean, reflect: true },
  };

  /** `aria-label` is observed, not a property: a non-blank host `aria-label` names the scroll box, so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = [
    css`
      :host {
        display: block;
        max-inline-size: var(--ocelle-measure-reading);
      }

      :host([hidden]) {
        display: none;
      }

      .block {
        padding: var(--ocelle-space-3);
        border: var(--ocelle-border-width) solid transparent;
        border-radius: var(--ocelle-radius-2);
      }

      .block:focus-visible {
        outline-style: solid;
        outline-width: var(--ocelle-focus-width);
        outline-offset: var(--ocelle-focus-offset);
      }

      .code {
        margin: 0;
        min-block-size: 1lh;
        font-family: var(--ocelle-font-sans);
        font-variant-numeric: var(--ocelle-figures);
        font-size: var(--ocelle-font-size-md);
        line-height: var(--ocelle-line-height-relaxed);
        direction: ltr;
        unicode-bidi: isolate;
        text-align: left;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .region-track > .code {
        white-space: pre;
      }

      .digest > span:not(:last-child) {
        margin-inline-end: var(--ocelle-space-1);
      }

      .digest > .group {
        white-space: nowrap;
      }

      @media not (forced-colors: active) {
        .block {
          background-color: var(--ocelle-color-inset);
        }

        .block:focus-visible {
          outline-color: var(--ocelle-color-focus);
        }
      }

      @media (forced-colors: active) {
        .code {
          color: CanvasText;
        }

        .block {
          border-color: CanvasText;
        }

        .block:focus-visible {
          outline-color: Highlight;
        }
      }
    `,
    overflowRegionStyles,
  ];

  /**
   * The overflow policy: `scroll` (trimmed, any ASCII case) keeps long lines on one line and scrolls the block sideways,
   * a tab stop and a named group only while it overflows; anything else, or none, wraps lines inside the block.
   * Reflected. A switch to wrap while focus is in the scroll block moves focus to the block.
   *
   * @default undefined
   */
  declare overflow: string | undefined;

  /**
   * The scroll box's name while it overflows, trimmed; empty or whitespace-only counts as none, and a non-blank host
   * `aria-label` wins. No effect in wrap mode. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * Shows the text as a digest: a prefix up to the last colon, then groups of four code points with a gap; copied and
   * read text stay unbroken (a whole-block selection ends with the platform's one block newline only when content
   * follows the block). Reflected.
   *
   * @default undefined
   */
  declare digest: boolean | undefined;

  readonly #region = new OverflowRegion(this, { box: () => this.renderRoot.querySelector<HTMLElement>(".region-box") });

  readonly #observer = new MutationObserver(() => {
    this.requestUpdate();
  });

  /** The scroll box and the text the `rtl` opening write last ran for. */
  #opened: { box: Element | null; text: string } = { box: null, text: "" };

  /** Whether the update in progress leaves the scroll policy with focus in the scroll structure. */
  #rescue = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  /** Whether the scroll policy is in force. */
  get #scrolls(): boolean {
    return (this.overflow ?? "").trim().toLowerCase() === "scroll";
  }

  protected override willUpdate(): void {
    const active = this.shadowRoot?.activeElement ?? null;
    this.#rescue = !this.#scrolls && active !== null && active.closest(".region-frame") !== null;
  }

  /** The `pre`'s content: the text, or the digest's units. */
  #content(text: string): unknown {
    const units = this.digest === true ? digestUnits(text) : null;
    if (units === null) return html`<pre class="code" part="code">${text}</pre>`;
    const spans: TemplateResult[] = [];
    if (units.prefix !== "") spans.push(html`<span class="prefix">${units.prefix}</span>`);
    for (const group of units.groups) spans.push(html`<span class="group">${group}</span>`);
    return html`<pre class="code digest" part="code">${spans.map((span, index) => (index === 0 ? span : html`<wbr>${span}`))}</pre>`;
  }

  protected override render(): unknown {
    const text = this.textContent;
    const content = this.#content(text);
    if (!this.#scrolls) return html`<div class="block" part="block">${content}</div>`;
    return html`<div class="block" part="block"><div class="region-frame"><div class="region-box" data-fade=${ifDefined(this.#region.fadeAttribute)}><div class="region-track">${content}</div></div><div class="region-ring" aria-hidden="true"></div><div class="region-edge start" aria-hidden="true"></div><div class="region-edge end" aria-hidden="true"></div></div></div>`;
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.#region.setLabel(this.label);
    const box = this.renderRoot.querySelector<HTMLElement>(".region-box");
    const text = this.textContent;
    if (box !== null && (box !== this.#opened.box || text !== this.#opened.text)) {
      this.#opened = { box, text };
      if (getComputedStyle(box).direction === "rtl") box.scrollTo({ left: -(box.scrollWidth - box.clientWidth), behavior: "instant" });
    }
    if (this.#rescue) {
      this.#rescue = false;
      const target = this.renderRoot.querySelector<HTMLElement>(".block");
      if (target !== null) {
        target.tabIndex = -1;
        target.addEventListener(
          "focusout",
          () => {
            target.removeAttribute("tabindex");
          },
          { once: true },
        );
        target.focus();
      }
    }
  }
}

define("ocelle-code-block", OcelleCodeBlock);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-code-block": OcelleCodeBlock;
  }
}
