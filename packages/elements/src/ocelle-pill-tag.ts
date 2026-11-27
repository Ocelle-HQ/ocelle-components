// `ocelle-pill-tag` (018 spec US3, US4, FR-001 to FR-007, FR-025 to FR-032, FR-035, FR-043; research.md R-02, R-06 to
// R-08; data-model.md § `ocelle-pill-tag`; plan decisions 5 to 7, 10 to 12 and 15, 15 as amended at the phase-1 recheck):
// a state pill or a count badge, and every variant and mode of it a state pill under constitution II (operator decision
// SPEC-1-04), so its corners take `--ocelle-radius-pill`.
// - The mode is read from the host's `interactive` and `href` attributes, never from Lit properties, in every
//   `attributeChangedCallback`: link mode when 012's `linkHref` gives an `href` (FR-002 of 012), button mode when
//   `interactive` is present, else static. An `href` that is empty, whitespace only, does not parse or is a
//   `javascript:` URL is no link.
// - Static shadow root (R-06 as amended): `.pill` (part `pill`, the visual box: the density padding, the colours, the
//   border and the radius) holding the slot convention's row as merged, `.icon-row` with the icon wrapper and the text
//   in the convention's label wrapper `.label` (012 plan decision 33). While the default slot holds no text the row
//   carries `bare`; whether it has text is read as `ocelle-button` reads it, on `slotchange` and by a `MutationObserver`
//   on the host held for the element's lifetime (an observer holds its target weakly, so it needs no disconnecting).
//   The convention's `.icon-row:not(.bare) > .label { align-self: baseline }` puts a one-line pill on the baseline of
//   the text around it, in every mode; the pill sets no row alignment of its own (operator decision Q2 (a)).
//   `--ocelle-icon-size: 1lh` on `.pill` makes the icon one line tall, so a pill has the same height with and without an
//   icon.
// - Sizes (plan decision 5): default `font-size-sm`, `line-height-tight`, padding `space-1` / `space-3`; compact
//   `font-size-xs`, `line-height-snug` (1.2), padding `space-1` / `space-2`.
// - The static host is `inline-block` capped at its container, with no `min-inline-size: 0` anywhere, so a flex row
//   does not shrink it below its longest word (operator decision PLAN-FRESH-2-002 (a)); the text wraps with
//   `overflow-wrap: break-word` and never truncates (FR-027). The static `.pill:not(.control)` is `inline-size:
//   fit-content; max-inline-size: 100%; box-sizing: border-box`, so a stretched host does not stretch the visible pill.
// - `pill` fills with `--ocelle-color-<status>-bg` and sets its text in `--ocelle-color-<status>`; `badge` has no fill,
//   a `--ocelle-border-width` border in `--ocelle-color-<status>` and its text in tabular figures; both in Schibsted
//   Grotesk. Every pill has a border, transparent outside forced colours, which forced colours turns into a visible
//   system-colour border (the transparent-border idiom, FR-028).
// - A static pill is inert content: no `delegatesFocus` (the shadow root never has it, so a click on a static pill
//   focuses a focusable ancestor), no inner control, no role of its own, plain text; the host guard is inactive, so it
//   swallows no click; `title` and ARIA attributes on its host are left where they are; `label` and `disabled` have no
//   effect on it.
// - Interactive (R-07): the visual box *is* the inner control, a `<button type="button">` or an `<a>` with the parts
//   `pill` and `control` and the class `control` that 012's `controlStyles` select (the token focus ring, a link
//   without its underline, the forced-colours table), holding the same row. 012's helpers as merged: `controlState`
//   (no unavailable state), `MovedAttributes` for the seven names of FR-030 (`aria-pressed` applied on the button only),
//   `resolveIds` for the three ID references (element reflection), `guardHost` with its `active` predicate following the
//   mode. The name is `aria-labelledby`, then `aria-label`, then `label`, then the text (012 FR-006). The activate
//   event copies `ocelle-button`'s pattern: a listener on the inner control dispatches `ocelle-pill-tag-activate` before
//   the click reaches any bubble-phase listener on the host, none while disabled or for a link-mode click with a
//   modifier held, and a cancelled one cancels the click. Custom states: `pressed` in button mode while the applied
//   `aria-pressed` is `"true"`, `current` while the applied `aria-current` is set and not `"false"`.
// - Looks (plan decisions 6, 7): a `pill` control has a resting `--ocelle-color-accent-strong` border; hover takes the
//   status colour on a pill's border and the status ground as a badge's fill; pointer press and the pressed state add an
//   inset `--ocelle-bar-width` cue in the text's (the status) colour, and a pressed badge keeps the status ground; no
//   state changes the box. Disabled: `--ocelle-color-disabled-ink` text and border on `--ocelle-color-disabled-bg`, and
//   `GrayText` in forced colours (012's `.control:disabled` misses a disabled `<a>`); a pressed, enabled control fills
//   with `Highlight` in forced colours, where the cue and the status fill are dropped.
// - The target (FR-029, FR-043): the control is `inline-flex`, centred, at least `--ocelle-target-small` in both axes.
// - The interactive host sheet (plan decision 11), adopted after the static styles while the pill is interactive and
//   removed when it becomes static: the host `inline-grid` (the control its one stretched grid item, 012 FR-001), capped
//   at its container less two focus-ring extents and with one extent of inline margin, so the ring stays inside a
//   clipping container.
// - Mode changes (FR-035; R-08), synchronously in the `interactive` / `href` callback: static → interactive
//   `capture()`s the host's passthrough attributes; interactive → static `release()`s them back to the host; button ↔
//   link keeps them held and the render applies them to the new control, and if the old control had focus the new one
//   is focused in a microtask after the commit, so after `ocelle-tooltip`'s `slotchange` for the new control (R-08), and
//   the ring and the tooltip show only if they showed before. A pill static at its upgrade gives copied mirrors back
//   (`adoptMirrors()`); an interactive one reads them back (`connected()`).
// - Truncation (US5, FR-033, FR-034; R-09; data-model.md § `ocelle-pill-tag`): the interactive control sits in
//   `ocelle-tooltip` (one template for both modes, so a switch keeps the tooltip), its `text` the full text (the default
//   slot's flattened text, trimmed, whitespace collapsed) and disabled while the pill is not truncated, with no
//   `describes`. The host sheet sets an enabled pill's text span `nowrap`, `overflow: hidden`, `text-overflow:
//   ellipsis`, and a disabled one's back to wrapping. Truncated = not disabled and the text's fractional inline extent
//   (a `Range` over the slot's nodes) passing the span's inline end, re-measured in every `updated()` while interactive,
//   by a `ResizeObserver` on the span (re-targeted when the render replaces it), by a `MutationObserver` on the element
//   (`characterData`, `childList`, `subtree`) and on the default slot's `slotchange`; the observers end when the pill
//   becomes static or is removed. While the pill is interactive its own `slotchange` events stop at their slots: the
//   tooltip would take them as a change of its trigger (R-09; review round 1, R1-05). A static pill has no tooltip and
//   lets them bubble, so a forwarded slot's `slotchange` reaches its host's shadow root. The `min-inline-size: 0` chain
//   is the merged one: the text span's own rule, the row's `max-inline-size: 100%`, the control's
//   `--ocelle-target-small` minimum; in Chromium the host's automatic minimum is then the control's padding and border,
//   and no rule of its own was observable (reviews/phase-6/notes.md; operator decision Q-P6-1 (a)).
// `status`, `variant` and `density` are attribute-backed accessors (R-02's pattern): an unknown value stays in the
// attribute as written and the property reads the default. Importing this module defines `ocelle-pill-tag` and the
// `ocelle-tooltip` it renders around an interactive pill's control (FR-034), and no other element.
import { LitElement, css, html, nothing } from "lit";
import { MovedAttributes, controlState, controlStyles, guardHost, linkHref, resolveIds } from "./control.ts";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";
import "./ocelle-tooltip.ts";
import { statusOf } from "./status.ts";

/** The host attributes an interactive pill moves onto its inner control (FR-030), in the contract's order. */
const moved = ["aria-label", "aria-labelledby", "aria-describedby", "aria-controls", "aria-current", "aria-pressed", "title"] as const;
/** The moved ID references and the inner control's reflection property for each (012 research.md R-04). */
const references = [
  ["aria-controls", "ariaControlsElements"],
  ["aria-labelledby", "ariaLabelledByElements"],
  ["aria-describedby", "ariaDescribedByElements"],
] as const;

/** The pill's mode (FR-035): static, or interactive as a button or a link. */
type Mode = "static" | "button" | "link";

/**
 * The interactive host sheet (plan decision 11; data-model.md § interactive host sheet): adopted after the element's
 * styles while the pill is interactive, so it wins on equal specificity, and removed when the pill becomes static. The
 * host is the inline grid whose one stretched item is the inner control (012 FR-001), capped at its container less two
 * focus-ring extents and offset by one, so the ring stays inside a container that clips. An enabled pill keeps its text
 * on one line and truncates it with an ellipsis; a disabled one wraps it as a static pill does (FR-033).
 */
const interactiveStyles = css`
  :host {
    display: inline-grid;
    max-inline-size: calc(100% - 2 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)));
    margin-inline: calc(var(--ocelle-focus-offset) + var(--ocelle-focus-width));
  }

  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :host([disabled]) .label {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }
`;
/**
 * How far, in fractional CSS pixels, the text of `nodes` (the default slot's flattened assignment) passes the inline end
 * of its text `span` (R-09): a `Range` from before the first to after the last node gives the text's unclipped inline
 * extent, compared with the span's box at its inline end, the left edge in right to left; 0 without text.
 */
function overflow(span: Element, nodes: readonly Node[]): number {
  const [first] = nodes;
  const last = nodes.at(-1);
  if (first === undefined || last === undefined) return 0;
  const range = document.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  const text = range.getBoundingClientRect();
  const box = span.getBoundingClientRect();
  return getComputedStyle(span).direction === "rtl" ? box.left - text.left : text.right - box.right;
}

/** One constructed sheet of `interactiveStyles`, shared by every pill. */
const interactiveSheet = new CSSStyleSheet();
interactiveSheet.replaceSync(interactiveStyles.cssText);

/**
 * A state pill or a count badge: its text, with an optional leading icon, on its status's colours with the pill radius;
 * with `interactive` a toggle or filter button, with a link `href` a link.
 *
 * @tagname ocelle-pill-tag
 * @attr {"info" | "success" | "warning" | "danger" | "neutral"} status - The status the pill shows, in its colours: `info`, `success`, `warning`, `danger` or `neutral`. Absent, empty or any other value shows `neutral` and stays in the attribute as written.
 * @attr {"pill" | "badge"} variant - `pill`, the default, filled with the status ground; `badge`, outlined in the status colour with no fill, its text in tabular figures. Any other value is `pill` and stays in the attribute as written.
 * @attr {"default" | "compact"} density - `default` or `compact` (the extra-small text, line height `--ocelle-line-height-snug`, padding `--ocelle-space-1` / `--ocelle-space-2`). Any other value is `default` and stays in the attribute as written.
 * @attr {string} aria-label - On an interactive pill, moved onto the inner control (the host keeps no copy): its accessible name, over `label` and the text; an empty or whitespace-only value clears it. On a static pill it stays on the host.
 * @attr {string} aria-labelledby - On an interactive pill, moved onto the inner control: the ids, space-separated, of the elements that name it, resolved in the host's own tree, over `aria-label`; an empty value clears it.
 * @attr {string} aria-describedby - On an interactive pill, moved onto the inner control: the ids, space-separated, of the elements that describe it, resolved in the host's own tree; an empty value clears it.
 * @attr {string} aria-controls - On an interactive pill, moved onto the inner control: the ids, space-separated, of the elements it controls, resolved in the host's own tree; an empty value clears it.
 * @attr {string} aria-current - On an interactive pill, moved onto the inner control with any value; `"false"` or an empty value applies none. It draws no mark.
 * @attr {string} aria-pressed - On an interactive pill, moved and held; applied to the inner button as written in button mode only (a link cannot be pressed): `"true"` reports pressed and gives the pressed look, `"false"` not pressed, `"mixed"` mixed; an empty value clears it.
 * @attr {string} title - On an interactive pill, moved onto the inner control: the browser's own tooltip and description (the README advises against it). On a static pill it stays on the host.
 * @attr {string} data-ocelle-moved-aria-label - Element-owned mirror of the moved `aria-label`, so copies of the live DOM keep it; hosts do not write or remove it, and a pill made static gives it back as `aria-label`.
 * @attr {string} data-ocelle-moved-aria-labelledby - Element-owned mirror of the moved `aria-labelledby`; hosts do not write or remove it.
 * @attr {string} data-ocelle-moved-aria-describedby - Element-owned mirror of the moved `aria-describedby`; hosts do not write or remove it.
 * @attr {string} data-ocelle-moved-aria-controls - Element-owned mirror of the moved `aria-controls`; hosts do not write or remove it.
 * @attr {string} data-ocelle-moved-aria-current - Element-owned mirror of the moved `aria-current`; hosts do not write or remove it.
 * @attr {string} data-ocelle-moved-aria-pressed - Element-owned mirror of the moved `aria-pressed`, kept in link mode too; hosts do not write or remove it.
 * @attr {string} data-ocelle-moved-title - Element-owned mirror of the moved `title`; hosts do not write or remove it.
 * @cssstate pressed - While the pill is in button mode and its moved `aria-pressed` is `"true"`; never in link mode.
 * @cssstate current - While the pill is interactive and its moved `aria-current` is set to any value other than `"false"`.
 * @slot - The text. A static or disabled pill wraps a text that does not fit onto further lines; an enabled interactive pill truncates it with an ellipsis and shows it whole in a tooltip on hover and keyboard focus.
 * @slot icon - One decorative icon before the text (the slot convention), one line tall.
 * @csspart pill - The visual box: the padding, the colours, the border and the radius; on an interactive pill, the inner control itself.
 * @csspart control - The inner `<button>`, or the inner `<a>` in link mode, of an interactive pill.
 * @fires {MouseEvent} click - The native click of an interactive pill's inner control, retargeted to the element, once per activation; a disabled pill delivers none.
 * @fires {CustomEvent<Record<string, never>>} ocelle-pill-tag-activate - Dispatched from the element on each activation of an enabled interactive pill that delivers a `click` (a pointer click, Enter, Space in button mode, `click()`), before the `click` reaches any bubble-phase listener on the element or its ancestors; bubbles, composed and cancelable, `detail` `{}`. Calling `preventDefault()` on it cancels the click's default action (in link mode the navigation; in button mode the `click` is still delivered). Not dispatched for a link-mode click with Ctrl, Meta, Shift or Alt held, nor for a middle click, nor by a disabled or static pill.
 */
export class OcellePillTag extends LitElement {
  static override properties = {
    interactive: { type: Boolean, reflect: true },
    href: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /**
   * @internal `status`, `variant` and `density` are observed, not Lit properties: their accessors parse the attributes;
   * the moved attributes and their mirrors join them (012 research.md R-03).
   */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "status", "variant", "density", ...MovedAttributes.observed(moved)];
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

      .control {
        margin: 0;
        font: inherit;
        text-align: center;
        cursor: pointer;
      }

      :host([disabled]) .control {
        cursor: default;
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

      .pill.control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-block-size: var(--ocelle-target-small);
        min-inline-size: var(--ocelle-target-small);
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

        .control.variant-pill {
          border-color: var(--ocelle-color-accent-strong);
        }

        :host(:not([disabled])) .control.variant-pill:is(:hover, :active) {
          border-color: currentColor;
        }

        :host(:not([disabled])) .control.variant-badge.status-info:is(:hover, :active),
        :host(:state(pressed):not([disabled])) .control.variant-badge.status-info {
          background-color: var(--ocelle-color-info-bg);
        }

        :host(:not([disabled])) .control.variant-badge.status-success:is(:hover, :active),
        :host(:state(pressed):not([disabled])) .control.variant-badge.status-success {
          background-color: var(--ocelle-color-success-bg);
        }

        :host(:not([disabled])) .control.variant-badge.status-warning:is(:hover, :active),
        :host(:state(pressed):not([disabled])) .control.variant-badge.status-warning {
          background-color: var(--ocelle-color-warning-bg);
        }

        :host(:not([disabled])) .control.variant-badge.status-danger:is(:hover, :active),
        :host(:state(pressed):not([disabled])) .control.variant-badge.status-danger {
          background-color: var(--ocelle-color-danger-bg);
        }

        :host(:not([disabled])) .control.variant-badge.status-neutral:is(:hover, :active),
        :host(:state(pressed):not([disabled])) .control.variant-badge.status-neutral {
          background-color: var(--ocelle-color-neutral-bg);
        }

        :host(:not([disabled])) .control:active,
        :host(:state(pressed):not([disabled])) .control {
          box-shadow: inset 0 0 0 var(--ocelle-bar-width) currentColor;
        }

        :host([disabled]) .control {
          background-color: var(--ocelle-color-disabled-bg);
          border-color: var(--ocelle-color-disabled-ink);
          color: var(--ocelle-color-disabled-ink);
        }
      }
    `,
    iconSlotStyles,
    controlStyles,
    css`
      @media (forced-colors: active) {
        :host([disabled]) .control {
          color: GrayText;
          border-color: GrayText;
        }

        :host(:state(pressed):not([disabled])) .control {
          background-color: Highlight;
          color: HighlightText;
          border-color: Highlight;
        }
      }
    `,
  ];

  /**
   * Button mode: with it, or with a link-mode `href`, the pill is interactive; without either it is static, inert
   * content with no role of its own. Reflected.
   *
   * @default false
   */
  declare interactive: boolean;

  /**
   * The link's URL: a non-empty `href` that parses as a URL and is not a `javascript:` URL puts the pill in link mode
   * (an inner `<a>` with the `href` as written); any other value leaves it static, or in button mode with
   * `interactive`. Reflected.
   *
   * @default undefined
   */
  declare href: string | undefined;

  /**
   * Disabled, for an interactive pill: out of the tab order, reported disabled and not activated (no `click`, no
   * `ocelle-pill-tag-activate`), a link without its `href`, in the disabled look; no effect while the pill is static.
   * Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  /**
   * The accessible name of an interactive pill's inner control, trimmed; empty or whitespace-only counts as none, and the
   * name is then the text. It changes no visible text and has no effect while the pill is static. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The moved host attributes (src/control.ts), held while the pill is interactive. A change of any of them resolves
   * the references again; the update follows from the attribute callback that caused it.
   */
  readonly #moved = new MovedAttributes(this, moved, () => {
    this.#resolve();
  });

  /** The elements each moved ID reference names, resolved when it is set and when the element is connected. */
  readonly #resolved: Record<(typeof references)[number][0], Element[]> = { "aria-controls": [], "aria-labelledby": [], "aria-describedby": [] };

  /** The custom states (`pressed`, `current`). */
  readonly #internals = this.attachInternals();

  /** The mode the passthrough attributes last followed: the transitions of FR-035 run when it changes. */
  #mode: Mode;

  /** Whether the inner control had focus when the mode switched between button and link (FR-035 (d)). */
  #refocus = false;

  /** Whether the element has been connected once (the upgrade). */
  #upgraded = false;

  /** Whether the default slot holds text: non-whitespace text in its flattened assignment. */
  #labelled = false;

  /** The full text: the default slot's flattened text, trimmed and with its whitespace collapsed (R-09). */
  // Stryker disable next-line StringLiteral: equivalent, the first updated() measures before any focus or hover can reach the tooltip and replaces the value whatever it was (the tooltip shows no bubble while it is disabled, as it is until then unless the mutant of #truncated below is also applied)
  #fullText = "";

  /** Whether an enabled interactive pill's text passes its text span's inline end (R-09): the tooltip is enabled. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first updated() measures and replaces it before any focus or hover can reach the tooltip, and until then the tooltip's text is the empty initial full text, with which it shows no bubble
  #truncated = false;

  /**
   * The truncation observers (R-09), while the pill is connected and interactive: a `ResizeObserver` on the text span
   * (`#span`, the one it observes) and a `MutationObserver` on the element for the text inside it.
   */
  #resize: ResizeObserver | undefined;
  #span: Element | undefined;
  #changes: MutationObserver | undefined;

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
    this.#mode = this.#modeNow();
    guardHost(
      this,
      () => this.#control(),
      () => controlState(this.disabled, false) === "available",
      () => this.#modeNow() !== "static",
    );
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

  /** Focuses the inner control of an interactive pill; a static pill, which has none, takes no focus. */
  override focus(options?: FocusOptions): void {
    this.#control()?.focus(options);
  }

  /**
   * Clicks the inner control of an interactive pill, so the click passes through it and is guarded like any other (a
   * disabled pill ignores it); on a static pill, the element's own native click.
   */
  override click(): void {
    const inner = this.#control();
    if (inner === null) super.click();
    else inner.click();
  }

  /**
   * @internal The mode follows `interactive` and `href` (FR-035); the moved attributes and their mirrors are handed to
   * 012's `MovedAttributes` only while the mode read from the attributes is interactive, so a static pill leaves them on
   * its host. Every observed attribute requests an update: `status`, `variant` and `density` are not Lit properties.
   */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === "interactive" || name === "href") this.#modeChanged();
    else if (this.#modeNow() !== "static") this.#moved.handle(name, value);
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  /**
   * @internal At the upgrade a static pill gives copied mirrors back to its host and an interactive one reads them back
   * (FR-035 (e); 012 FR-004); every connection resolves the moved references in the tree the element is in.
   */
  override connectedCallback(): void {
    if (!this.#upgraded) {
      this.#upgraded = true;
      // Stryker disable next-line ConditionalExpression: equivalent, on an interactive pill adoptMirrors() writes each mirror back as its attribute and the passthrough callback moves and mirrors it again at once, so the held values and mirrors end as connected() leaves them; it also covers the killed false mutant (connected() on a static pill), which US4-12 and this line's EqualityOperator mutant still cover (Stryker disables by mutator and line only; operator decision R1-03 (a))
      if (this.#modeNow() === "static") this.#moved.adoptMirrors();
      else this.#moved.connected();
    }
    this.#resolve();
    this.requestUpdate();
    super.connectedCallback();
  }

  /** Removed: the truncation observers end; a reconnection's update creates them again (R-09). */
  // Stryker disable next-line BlockStatement: equivalent, observer teardown has no public observable (contracts/checks.md § US5, R-09): a removed pill's observers see no layout, and kept ones measure correctly after a reconnection
  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection serves reactive controllers and async directives; the pill uses neither (as ocelle-tooltip's record, reviews/phase-4/notes.md)
    super.disconnectedCallback();
    // Stryker disable next-line CallExpression: equivalent, observer teardown has no public observable (contracts/checks.md § US5, R-09)
    this.#unwatch();
  }

  /** Static, button or link, read from the attributes (data-model.md § mode). */
  #modeNow(): Mode {
    if (linkHref(this.getAttribute("href"), document.baseURI) !== undefined) return "link";
    return this.hasAttribute("interactive") ? "button" : "static";
  }

  /**
   * Runs the transition of FR-035 when the mode read from the attributes changes, synchronously: the host's passthrough
   * attributes captured on → interactive, released back to the host on → static; on a switch between button and link it
   * notes whether the inner control has focus, so the new one takes it after the render.
   */
  #modeChanged(): void {
    const next = this.#modeNow();
    const previous = this.#mode;
    this.#mode = next;
    if (previous === next) return;
    if (previous === "static") this.#moved.capture();
    else if (next === "static") this.#moved.release();
    // Only a rendered inner control that holds focus is refocused: before the first render there is none (R1-01).
    else this.#refocus = this.#control()?.matches(":focus") === true;
  }

  /** Resolves the moved ID references in the host's own tree (012 research.md R-04). */
  #resolve(): void {
    for (const [name] of references) this.#resolved[name] = resolveIds(this, this.#moved.get(name));
  }

  /**
   * The inner `<button>` or `<a>`, once rendered; null while the pill is static, and before its first connection, when
   * Lit has not attached the shadow root yet (review round 1, R1-01: a mode switch on a pill not yet appended).
   */
  #control(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>(".control") ?? null;
  }

  /**
   * Reads whether the default slot holds text, as `ocelle-button` reads its label, and renders again when that changes;
   * the truncation observers re-measure a text that changes otherwise.
   */
  #readLabel(): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>(".label slot");
    const labelled = (slot?.assignedNodes({ flatten: true }) ?? []).map((node) => node.textContent).join("").trim() !== "";
    // Stryker disable next-line ConditionalExpression: equivalent, the false mutant renders again on every text change, which re-renders the same template and re-measures what the truncation observers already measure; the true mutant (never rendering) is killed by the bare-row bodies
    if (labelled === this.#labelled) return;
    this.#labelled = labelled;
    this.requestUpdate();
  }

  /**
   * Stops a `slotchange` of the pill's own slots where it is dispatched while the pill is interactive (R-09; review
   * round 1, R1-05). The slots then sit inside the inner control, which is `ocelle-tooltip`'s trigger, and the tooltip
   * takes any `slotchange` that reaches its own slot as a change of its trigger (the first element assigned to the slot
   * the event came from): a pill's text or icon changing would otherwise leave the tooltip without its trigger, or with
   * the icon as its trigger. A static pill has no tooltip, so the event bubbles on, and a host that forwards its own
   * `<slot>` into the pill hears it above the pill.
   */
  #stop(event: Event): void {
    if (this.#modeNow() !== "static") event.stopPropagation();
  }

  /**
   * A change of the default slot: the label is read again and the truncation re-measured (a reassignment no observer
   * records). While the pill is interactive the event stops at the slot, as the icon slot's does (`#stop`).
   */
  #onSlotchange(event: Event): void {
    this.#stop(event);
    this.#readLabel();
    this.#measure();
  }

  /**
   * Measures the full text and whether it is truncated (R-09), and renders again when either changed: truncated while
   * the pill is not disabled and its text passes its text span's inline end (`overflow`).
   */
  #measure(): void {
    const span = this.renderRoot.querySelector(".label");
    const nodes = span?.querySelector("slot")?.assignedNodes({ flatten: true }) ?? [];
    const fullText = nodes.map((node) => node.textContent).join("").replace(/\s+/g, " ").trim();
    const truncated = !this.disabled && (span === null ? 0 : overflow(span, nodes)) > 0;
    if (fullText === this.#fullText && truncated === this.#truncated) return;
    this.#fullText = fullText;
    this.#truncated = truncated;
    this.requestUpdate();
  }

  /**
   * Keeps the truncation observers while the pill is interactive (R-09): the `MutationObserver` on the element, and the
   * `ResizeObserver` on the current text span, re-targeted when the render replaced it (a switch between button and
   * link) or after the observers ended; then a measure.
   */
  #watch(): void {
    const span = this.renderRoot.querySelector(".label");
    this.#changes ??= new MutationObserver(() => {
      this.#measure();
    });
    this.#changes.observe(this, { characterData: true, childList: true, subtree: true });
    this.#resize ??= new ResizeObserver(() => {
      this.#measure();
    });
    // Stryker disable next-line ConditionalExpression: equivalent, the true mutant observes the same span again, which only adds an initial notification and a measure that changes nothing; the false mutant is a compile error
    if (span !== null && span !== this.#span) {
      // Stryker disable next-line CallExpression: equivalent, observer teardown (R-09): a replaced span left observed is detached, and its one notification measures the current span, which changes nothing
      this.#resize.disconnect();
      this.#resize.observe(span);
      this.#span = span;
    }
    this.#measure();
  }

  /** Ends the truncation observers: the pill became static or was removed; the next `#watch()` observes again. */
  // Stryker disable next-line BlockStatement: equivalent, observer teardown has no public observable (contracts/checks.md § US5, R-09): observers left running keep measuring the same span correctly, and a static pill ignores the result; ending the observers but keeping #span is killed by the reconnection body
  #unwatch(): void {
    this.#resize?.disconnect();
    this.#changes?.disconnect();
    this.#span = undefined;
  }

  /**
   * Dispatches `ocelle-pill-tag-activate` for a click on the enabled inner control, but not for a link-mode click with a
   * modifier held; a cancelled one cancels the click (FR-031).
   */
  #activate(event: MouseEvent): void {
    if (controlState(this.disabled, false) !== "available") return;
    if (this.#modeNow() === "link" && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
    const proceed = this.dispatchEvent(new CustomEvent("ocelle-pill-tag-activate", { bubbles: true, composed: true, cancelable: true, detail: {} }));
    if (!proceed) event.preventDefault();
  }

  /** The inner control's name, when it is not its text: the host's `aria-label`, then `label` (012 FR-006). */
  #name(): string | undefined {
    if (this.#resolved["aria-labelledby"].length > 0) return undefined;
    const label = this.label?.trim() ?? "";
    return this.#moved.get("aria-label") ?? (label === "" ? undefined : label);
  }

  /** The moved `aria-current`, unless it is the off value `"false"`. */
  #current(): string | undefined {
    const current = this.#moved.get("aria-current");
    return current === "false" ? undefined : current;
  }

  protected override render(): unknown {
    const mode = this.#modeNow();
    const classes = `pill status-${this.status} variant-${this.variant} density-${this.density}`;
    const row = html`<span class=${this.#labelled ? "icon-row" : "icon-row bare"}><span class="icon-slot"><slot name="icon" @slotchange=${this.#stop}></slot></span><span class="label"><slot @slotchange=${this.#onSlotchange}></slot></span></span>`;
    if (mode === "static") return html`<span part="pill" class=${classes}>${row}</span>`;
    const value = (name: string): string | typeof nothing => this.#moved.get(name) ?? nothing;
    if (mode === "link") {
      const available = controlState(this.disabled, false) === "available";
      return this.#tooltip(html`<a part="pill control" class="control ${classes}" href=${available ? (linkHref(this.getAttribute("href"), document.baseURI) ?? nothing) : nothing} role=${available ? nothing : "link"} aria-disabled=${available ? nothing : "true"} aria-label=${this.#name() ?? nothing} aria-current=${this.#current() ?? nothing} title=${value("title")} @click=${this.#activate}>${row}</a>`);
    }
    return this.#tooltip(html`<button part="pill control" class="control ${classes}" type="button" ?disabled=${this.disabled} aria-label=${this.#name() ?? nothing} aria-current=${this.#current() ?? nothing} aria-pressed=${value("aria-pressed")} title=${value("title")} @click=${this.#activate}>${row}</button>`);
  }

  /**
   * The inner control in `ocelle-tooltip` (FR-034): the full text, disabled while not truncated, no `describes`. One
   * template for both modes, so a switch between button and link replaces the control and keeps the tooltip, which then
   * learns its new trigger from its own `slotchange` (R-08).
   */
  #tooltip(inner: unknown): unknown {
    return html`<ocelle-tooltip text=${this.#fullText} ?disabled=${!this.#truncated}>${inner}</ocelle-tooltip>`;
  }

  /**
   * Relates the inner control to the resolved references, sets the custom states from the applied values, adopts the
   * interactive host sheet while the pill is interactive (and removes it while static), and gives focus to a new inner
   * control after a switch between button and link, in a microtask after the commit.
   */
  protected override updated(): void {
    const mode = this.#modeNow();
    const inner = this.#control();
    if (inner !== null) {
      for (const [name, property] of references) {
        const found = this.#resolved[name];
        inner[property] = found.length === 0 ? null : found;
      }
    }
    const states: readonly (readonly [string, boolean])[] = [
      // A link has no pressed state (plan decision 12): `pressed` is set in button mode only.
      ["pressed", mode === "button" && this.#moved.get("aria-pressed") === "true"],
      ["current", this.#current() !== undefined],
    ];
    for (const [state, on] of states) {
      if (on) this.#internals.states.add(state);
      else this.#internals.states.delete(state);
    }
    const root = this.renderRoot as ShadowRoot;
    const adopted = root.adoptedStyleSheets.includes(interactiveSheet);
    if (mode !== "static" && !adopted) root.adoptedStyleSheets = [...root.adoptedStyleSheets, interactiveSheet];
    if (mode === "static" && adopted) root.adoptedStyleSheets = root.adoptedStyleSheets.filter((sheet) => sheet !== interactiveSheet);
    if (mode === "static") this.#unwatch();
    else this.#watch();
    if (this.#refocus) {
      this.#refocus = false;
      queueMicrotask(() => {
        this.#control()?.focus();
      });
    }
  }
}

define("ocelle-pill-tag", OcellePillTag);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-pill-tag": OcellePillTag;
  }
}
