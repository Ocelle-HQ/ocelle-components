// `ocelle-workflow-lane` (009 FR-012, FR-017 to FR-021, FR-030; contracts/elements.md § `ocelle-workflow-lane`;
// research.md R-08 to R-10; data-model.md § Lane): a column of a board with an optional title, an optional count and a
// variant. Its shadow root holds one wrapper that carries the group role and the name (src/lane-count.ts), with the
// visible header (title and count) hidden from the tree, so the name is not read twice, and the content slot. Without
// a name the wrapper has no role, and the content is in the tree as it would be without the element. The default
// variant draws the lane chrome, a `--ocelle-color-sheet` ground with `--ocelle-radius-row` corners and
// `--ocelle-space-3` padding; `flat` draws none of it and sets the title and count in small uppercase. Variant rules sit
// inside `@media not (forced-colors: active)`; in forced colours the default lane draws a `CanvasText` border. The lane
// sets no inline-size containment of its own: the board's `::slotted(*)` gives every child its containment, minimum
// and share (R-08). Importing this module defines `ocelle-workflow-lane` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import { laneName, parseCount, validCount } from "./lane-count.ts";
import { resolveName } from "./overflow-region.ts";

/**
 * A column of a workflow board with an optional title and count, exposed as one group named by them.
 *
 * @tagname ocelle-workflow-lane
 * @slot - The lane's content.
 */
export class OcelleWorkflowLane extends LitElement {
  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    count: { converter: { fromAttribute: parseCount } },
    countLabel: { type: String, attribute: "count-label" },
    variant: { type: String, reflect: true },
  };

  /** `aria-label` is observed, not a property: a non-blank host `aria-label` names the group, so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      overflow-wrap: anywhere;
    }

    :host([hidden]) {
      display: none;
    }

    .header {
      margin-block-end: var(--ocelle-space-3);
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-sm);
    }

    .title,
    .count {
      unicode-bidi: isolate;
    }

    .title {
      font-weight: var(--ocelle-font-weight-strong);
    }

    .count {
      font-variant-numeric: var(--ocelle-figures);
    }

    ::slotted(*) {
      max-inline-size: 100%;
    }

    @media not (forced-colors: active) {
      :host(:not([variant="flat"])) {
        padding: var(--ocelle-space-3);
        border-radius: var(--ocelle-radius-row);
        background-color: var(--ocelle-color-sheet);
      }

      .title {
        color: var(--ocelle-color-ink);
      }

      .count {
        color: var(--ocelle-color-ink-muted);
      }

      :host([variant="flat"]) .header {
        font-size: var(--ocelle-font-size-xs);
        font-weight: var(--ocelle-font-weight-strong);
        font-variant-numeric: var(--ocelle-figures);
        letter-spacing: var(--ocelle-tracking-caps);
        text-transform: uppercase;
        color: var(--ocelle-color-ink-soft);
      }

      :host([variant="flat"]) .title,
      :host([variant="flat"]) .count {
        color: inherit;
      }
    }

    @media (forced-colors: active) {
      :host(:not([variant="flat"])) {
        padding: var(--ocelle-space-3);
        border: var(--ocelle-border-width) solid CanvasText;
        border-radius: var(--ocelle-radius-row);
      }

      :host([variant="flat"]) .header {
        font-size: var(--ocelle-font-size-xs);
        font-weight: var(--ocelle-font-weight-strong);
        font-variant-numeric: var(--ocelle-figures);
        letter-spacing: var(--ocelle-tracking-caps);
        text-transform: uppercase;
      }
    }
  `;

  /**
   * The lane's title, shown and used as its name, trimmed; empty or whitespace-only counts as absent, and no title is
   * shown. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The count shown after the title with tabular figures, and named after it: a whole number of 0 or more. The
   * attribute counts when, after trimming, it is decimal digits alone, at most `Number.MAX_SAFE_INTEGER`; the
   * property when it is a safe integer of 0 or more; anything else counts as absent. Not reflected.
   *
   * @default undefined
   */
  declare count: number | undefined;

  /**
   * The count's text in the lane's name, such as "3 work packages", trimmed; the visible count still shows the
   * number. Used only while a count is shown. Not reflected.
   *
   * @default undefined
   */
  declare countLabel: string | undefined;

  /**
   * `flat` drops the lane's ground, corners and padding and sets the title and count in small uppercase; absent or any
   * other value draws the default lane chrome. Reflected.
   *
   * @default undefined
   */
  declare variant: "flat" | undefined;

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  protected override render(): unknown {
    const title = resolveName(null, this.label);
    const count = validCount(this.count);
    const name = laneName(this.getAttribute("aria-label"), this.label, count, this.countLabel);
    const shown = title !== undefined || count !== undefined;
    const header = shown
      ? html`<div class="header" aria-hidden="true">${title === undefined ? nothing : html`<span class="title">${title}</span>`}${title !== undefined && count !== undefined ? " " : nothing}${count === undefined ? nothing : html`<span class="count">${String(count)}</span>`}</div>`
      : nothing;
    return html`<div class="lane" role=${ifDefined(name === undefined ? undefined : "group")} aria-label=${ifDefined(name)}>${header}<slot></slot></div>`;
  }
}

define("ocelle-workflow-lane", OcelleWorkflowLane);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-workflow-lane": OcelleWorkflowLane;
  }
}
