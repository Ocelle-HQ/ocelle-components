// `ocelle-pill-tag` (018 spec US3, FR-001 to FR-007, FR-025 to FR-029; research.md R-02, R-06; data-model.md
// § `ocelle-pill-tag`; plan decisions 5 and 15, 15 as amended at the phase-1 recheck): a state pill or a count badge,
// and every variant and mode of it a state pill under constitution II (operator decision SPEC-1-04), so its corners
// take `--ocelle-radius-pill`. This module holds the static pill, the mode with neither `interactive` nor a link-mode
// `href`; the interactive modes are user story 4's.
// - The mode is read from the host's `interactive` and `href` attributes, never from Lit properties: link mode when
//   012's `linkHref` gives an `href` (FR-002 of 012), button mode when `interactive` is present, else static. An `href`
//   that is empty, whitespace only, does not parse or is a `javascript:` URL is no link, so such a pill is static.
// - Static shadow root (R-06 as amended): `.pill` (part `pill`, the visual box: the density padding, the colours, the
//   border and the radius) holding the slot convention's row as merged, `.icon-row` with the icon wrapper and the text
//   in the convention's label wrapper `.label` (012 plan decision 33). While the default slot holds no text the row
//   carries `bare`; whether it has text is read as `ocelle-button` reads it, on `slotchange` and by a `MutationObserver`
//   on the host held for the element's lifetime (an observer holds its target weakly, so it needs no disconnecting).
//   The convention's `.icon-row:not(.bare) > .label { align-self: baseline }` puts a one-line pill on the baseline of
//   the text around it; the pill sets no row alignment of its own (operator decision Q2 (a): plan decision 15's
//   override is dropped). `--ocelle-icon-size: 1lh` on `.pill` makes the icon one line tall, so the row's block padding
//   is 0 and a pill has the same height with and without an icon.
// - Sizes (plan decision 5): default `font-size-sm`, `line-height-tight`, padding `space-1` / `space-3`; compact
//   `font-size-xs`, `line-height-snug` (1.2), padding exactly `space-1` / `space-2`.
// - The static host is `inline-block` capped at its container (`max-inline-size: 100%`), with no `min-inline-size: 0`
//   anywhere, so a flex row does not shrink it below its longest word (operator decision PLAN-FRESH-2-002 (a)); the row
//   is capped too and the text wraps with `overflow-wrap: break-word`, so a long word breaks inside the pill in a block
//   container or a grid track; it never truncates (FR-027). The static `.pill:not(.control)` is `inline-size:
//   fit-content; max-inline-size: 100%; box-sizing: border-box`, so a grid track or a flex column that stretches the
//   host does not stretch the visible pill (PLAN-FRESH-3-002).
// - `pill` fills with `--ocelle-color-<status>-bg` and sets its text in `--ocelle-color-<status>`; `badge` has no fill,
//   a `--ocelle-border-width` border in `--ocelle-color-<status>` and its text in tabular figures; both in Schibsted
//   Grotesk. Every pill has a border, transparent outside forced colours, which forced colours turns into a visible
//   system-colour border (the transparent-border idiom, FR-028).
// - A static pill is inert content: no `delegatesFocus`, no inner control, no click guard, no role of its own; its
//   text is plain text. `title` and ARIA attributes on its host are not observed, so they stay where the host put them;
//   `label` and `disabled` have no effect on it.
// `status`, `variant` and `density` are attribute-backed accessors (R-02's pattern): an unknown value stays in the
// attribute as written and the property reads the default. Importing this module defines `ocelle-pill-tag` and no
// other element.
import { LitElement, css, html, nothing } from "lit";
import { linkHref } from "./control.ts";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";
import { statusOf } from "./status.ts";

/**
 * A state pill or a count badge: its text, with an optional leading icon, on its status's colours with the pill radius.
 *
 * @tagname ocelle-pill-tag
 * @attr {"info" | "success" | "warning" | "danger" | "neutral"} status - The status the pill shows, in its colours: `info`, `success`, `warning`, `danger` or `neutral`. Absent, empty or any other value shows `neutral` and stays in the attribute as written.
 * @attr {"pill" | "badge"} variant - `pill`, the default, filled with the status ground; `badge`, outlined in the status colour with no fill, its text in tabular figures. Any other value is `pill` and stays in the attribute as written.
 * @attr {"default" | "compact"} density - `default` or `compact` (the extra-small text, line height `--ocelle-line-height-snug`, padding `--ocelle-space-1` / `--ocelle-space-2`). Any other value is `default` and stays in the attribute as written.
 * @slot - The text. A static pill wraps a text that does not fit onto further lines; it never truncates.
 * @slot icon - One decorative icon before the text (the slot convention), one line tall.
 * @csspart pill - The visual box: the padding, the colours, the border and the radius.
 */
export class OcellePillTag extends LitElement {
  static override properties = {
    interactive: { type: Boolean, reflect: true },
    href: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /** `status`, `variant` and `density` are observed, not Lit properties: their accessors parse the attributes. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "status", "variant", "density"];
  }

  static override styles = [
    css`
      :host {
        display: inline-block;
        max-inline-size: 100%;
      }

      :host([hidden]) {
        display: none;
      }

      .pill {
        --ocelle-icon-size: 1lh;
        display: block;
        padding-block: var(--ocelle-space-1);
        padding-inline: var(--ocelle-space-3);
        border: var(--ocelle-border-width) solid transparent;
        border-radius: var(--ocelle-radius-pill);
        font-family: var(--ocelle-font-sans);
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-tight);
      }

      .pill:not(.control) {
        inline-size: fit-content;
        max-inline-size: 100%;
        box-sizing: border-box;
      }

      .density-compact {
        padding-inline: var(--ocelle-space-2);
        font-size: var(--ocelle-font-size-xs);
        line-height: var(--ocelle-line-height-snug);
      }

      .variant-badge {
        font-variant-numeric: var(--ocelle-figures);
      }

      .icon-row {
        max-inline-size: 100%;
      }

      .label {
        min-inline-size: 0;
        white-space: normal;
        overflow-wrap: break-word;
      }

      @media not (forced-colors: active) {
        .status-info {
          color: var(--ocelle-color-info);
        }

        .variant-pill.status-info {
          background-color: var(--ocelle-color-info-bg);
        }

        .variant-badge.status-info {
          border-color: var(--ocelle-color-info);
        }

        .status-success {
          color: var(--ocelle-color-success);
        }

        .variant-pill.status-success {
          background-color: var(--ocelle-color-success-bg);
        }

        .variant-badge.status-success {
          border-color: var(--ocelle-color-success);
        }

        .status-warning {
          color: var(--ocelle-color-warning);
        }

        .variant-pill.status-warning {
          background-color: var(--ocelle-color-warning-bg);
        }

        .variant-badge.status-warning {
          border-color: var(--ocelle-color-warning);
        }

        .status-danger {
          color: var(--ocelle-color-danger);
        }

        .variant-pill.status-danger {
          background-color: var(--ocelle-color-danger-bg);
        }

        .variant-badge.status-danger {
          border-color: var(--ocelle-color-danger);
        }

        .status-neutral {
          color: var(--ocelle-color-neutral);
        }

        .variant-pill.status-neutral {
          background-color: var(--ocelle-color-neutral-bg);
        }

        .variant-badge.status-neutral {
          border-color: var(--ocelle-color-neutral);
        }

        .variant-badge {
          background-color: transparent;
        }
      }
    `,
    iconSlotStyles,
  ];

  /**
   * Button mode (user story 4): with it, or with a link-mode `href`, the pill is interactive; without either it is
   * static, inert content with no role of its own. Reflected.
   *
   * @default false
   */
  declare interactive: boolean;

  /**
   * The link's URL: a non-empty `href` that parses as a URL and is not a `javascript:` URL puts the pill in link mode
   * (user story 4); any other value leaves it static, or in button mode with `interactive`. Reflected.
   *
   * @default undefined
   */
  declare href: string | undefined;

  /** Disabled, for an interactive pill (user story 4); no effect while the pill is static. Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  /**
   * The accessible name of an interactive pill's inner control (user story 4), trimmed; empty or whitespace-only counts
   * as none. It changes no visible text and has no effect while the pill is static. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /** Whether the default slot holds text: non-whitespace text in its flattened assignment. */
  #labelled = false;

  /**
   * Rereads the text when text inside the element changes, which fires no `slotchange`: a text node's data, or text
   * inserted into or removed from a slotted element, as `ocelle-button` does. It observes the element for its lifetime.
   */
  readonly #text = new MutationObserver(() => {
    this.#readLabel();
  });

  constructor() {
    super();
    this.interactive = false;
    this.disabled = false;
    this.#text.observe(this, { characterData: true, childList: true, subtree: true });
  }

  /**
   * The status the pill shows: the `status` attribute when it is one of `info`, `success`, `warning`, `danger` and
   * `neutral`, else `neutral`. Setting it writes the attribute as given.
   *
   * @default "neutral"
   */
  get status(): "info" | "success" | "warning" | "danger" | "neutral" {
    return statusOf(this.getAttribute("status"));
  }

  set status(value: string) {
    this.setAttribute("status", value);
  }

  /**
   * The look: the `variant` attribute when it is `badge`, else `pill`. Setting it writes the attribute as given.
   *
   * @default "pill"
   */
  get variant(): "pill" | "badge" {
    return this.getAttribute("variant") === "badge" ? "badge" : "pill";
  }

  set variant(value: string) {
    this.setAttribute("variant", value);
  }

  /**
   * The spacing: the `density` attribute when it is `compact`, else `default`. Setting it writes the attribute as given.
   *
   * @default "default"
   */
  get density(): "default" | "compact" {
    return this.getAttribute("density") === "compact" ? "compact" : "default";
  }

  set density(value: string) {
    this.setAttribute("density", value);
  }

  /** Every observed attribute requests an update; `status`, `variant` and `density`, not Lit properties, need it. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  /** Static: neither `interactive` nor a link-mode `href`, read from the attributes (data-model.md § mode). */
  #static(): boolean {
    return linkHref(this.getAttribute("href"), document.baseURI) === undefined && !this.hasAttribute("interactive");
  }

  /** Reads whether the default slot holds text, as `ocelle-button` reads its label. */
  #readLabel(): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>(".label slot");
    this.#labelled = (slot?.assignedNodes({ flatten: true }) ?? []).map((node) => node.textContent).join("").trim() !== "";
    this.requestUpdate();
  }

  protected override render(): unknown {
    // The interactive modes are user story 4's: until then only a static pill renders its box.
    if (!this.#static()) return nothing;
    return html`<span part="pill" class="pill status-${this.status} variant-${this.variant} density-${this.density}"><span class=${this.#labelled ? "icon-row" : "icon-row bare"}><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot @slotchange=${this.#readLabel}></slot></span></span></span>`;
  }
}

define("ocelle-pill-tag", OcellePillTag);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-pill-tag": OcellePillTag;
  }
}
