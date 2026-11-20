// `ocelle-data-table` (019 FR-001 to FR-019, FR-040, FR-050 to FR-061; contracts/ocelle-data-table.md; research.md
// R-01 to R-07, R-16 to R-20): a slotted native `<table>` in the overflow-region module's scroll box, a tab stop and a
// named `group` only while it overflows, styled by `@ocelle/styles`. The element writes nothing on the table and emits
// no event; it measures its box for the caption's cap (the base-style hook `--data-table-box-size` and
// `--data-table-end-fade`, written in its own per-instance sheet), and with `sticky-header` turns the module's block-axis
// option on. Importing this module defines `ocelle-data-table` and no other element.
import { LitElement, adoptStyles, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import { OverflowRegion, overflowRegionStyles } from "./overflow-region.ts";

/**
 * The caption's text for the region's name (research.md R-04): its text nodes in tree order, skipping any element with
 * `hidden` or `aria-hidden="true"` and its subtree, an `<img>` giving its `alt`; white space collapsed and trimmed;
 * empty counts as absent.
 */
function captionText(table: Element | undefined): string | undefined {
  const caption = table?.querySelector(":scope > caption");
  if (caption === null || caption === undefined) return undefined;
  const parts: string[] = [];
  const walk = (node: Node): void => {
    for (const child of node.childNodes) {
      if (child instanceof Text) parts.push(child.data);
      else if (child instanceof Element && !child.hasAttribute("hidden") && child.getAttribute("aria-hidden") !== "true") {
        if (child.localName === "img") parts.push(child.getAttribute("alt") ?? "");
        else walk(child);
      }
    }
  };
  walk(caption);
  // Stryker disable next-line MethodExpression: equivalent, the name goes through the module's resolveName, which trims it (T025)
  const text = parts.join("").replace(/\s+/g, " ").trim();
  // Stryker disable next-line ConditionalExpression,StringLiteral: equivalent for the `false` variant and the string, which give "" for a blank caption: resolveName treats a blank name as absent, as undefined; the `true` variant is killed by every caption-named body (T025)
  return text === "" ? undefined : text;
}

/**
 * A compact data table: a native `<table>` child in a box that scrolls in the inline direction when the table is wider
 * than its room, a tab stop and a named group only while it overflows.
 *
 * @tagname ocelle-data-table
 * @slot - The first direct `<table>` child; other children are not shown after upgrade.
 */
export class OcelleDataTable extends LitElement {
  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, String is Lit's default type and label does not reflect (T025)
    label: { type: String },
    wrap: { type: String, reflect: true },
    stickyHeader: { type: Boolean, reflect: true, attribute: "sticky-header" },
    striped: { type: Boolean, reflect: true },
  };

  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = [
    css`
      :host {
        display: block;
        min-inline-size: 0;
      }

      :host([hidden]) {
        display: none;
      }

      :host .region-track {
        inline-size: fit-content;
      }

      :host .box-size {
        block-size: 0;
      }

      :host([sticky-header]) {
        display: flex;
        flex-direction: column;
      }

      :host([sticky-header]) .region-frame {
        display: flex;
        flex-direction: column;
        min-block-size: 0;
      }

      :host([sticky-header]) .region-box {
        min-block-size: 0;
      }
    `,
    overflowRegionStyles,
  ];

  /**
   * Names the scroll region while the table overflows; not shown. Trimmed; empty or whitespace-only counts as absent.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * `anywhere` breaks long identifiers in body cells anywhere (`overflow-wrap: anywhere` through `@ocelle/styles`); any
   * other value acts as unset.
   *
   * @default undefined
   */
  declare wrap: "anywhere" | undefined;

  /**
   * Present (any value): the `<thead>` stays pinned at the region's block start while the body scrolls in a block size
   * the page bounds on the host. Toggles at run time.
   *
   * @default undefined
   */
  declare stickyHeader: boolean | undefined;

  /**
   * Present (any value): each `<tbody>`'s even rows get the `--ocelle-color-inset` ground through `@ocelle/styles`.
   *
   * @default undefined
   */
  declare striped: boolean | undefined;

  // Typed explicitly: the initializer refers to `this`, and Stryker's type checker otherwise sees a circular inference
  // in every mutant of this file and reports each as a compile error (T025).
  readonly #region: OverflowRegion = new OverflowRegion(this, {
    box: () => this.renderRoot.querySelector<HTMLElement>(".region-box"),
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, without sticky-header the host is not a flex column, so its box is as tall as the table and never overflows in the block axis, and the option does nothing (T025)
    blockAxis: () => this.stickyHeader === true,
    blockStartBox: (): Element | null => this.#table()?.querySelector(":scope > thead") ?? null,
  });

  /** The element's own per-instance sheet: the caption cap's measured figures on `.region-track`, px only. */
  readonly #sheet = new CSSStyleSheet();
  // The table is re-derived and assigned in the observer's own callback, which runs before the slot's `slotchange`
  // of the same change: the module then measures the new table, so a handover finds its focusable content.
  readonly #children = new MutationObserver(() => {
    this.#assign();
    this.requestUpdate();
  });
  readonly #size = new ResizeObserver((entries) => {
    const entry = entries.at(-1);
    const size = entry?.contentBoxSize[0]?.inlineSize ?? 0;
    // A box with no inline size (the host or an ancestor not rendered) keeps the last cap, or the fallback before one.
    if (size === 0) return;
    this.#measured = size;
    this.#writeBoxSize();
  });
  // Review R1-01: the cap is measured from the box, and in a shrink-to-fit host the box is as wide as the table, which
  // the cap itself bounds. A caption that grows later (its text edited, a style or a late web font) would stay at the
  // old cap where a fresh load measures it at the fallback. Any change of the track's size (the table's, and so the
  // caption's) remeasures as a fresh load does, one frame later, outside any ResizeObserver delivery.
  readonly #track = new ResizeObserver(() => {
    if (this.#refitFrame === 0) {
      this.#refitFrame = requestAnimationFrame(() => {
        this.#refitFrame = 0;
        this.#refit();
      });
    }
  });
  /** The `.box-size` inline size last measured, kept for the rewrite when `data-axis` changes. */
  #measured: number | undefined;
  /** The pending animation frame of the remeasure at the fallback cap, or 0. */
  #refitFrame = 0;
  /** The pending animation frame of the end fade and the box-size rewrite, or 0. */
  #frame = 0;
  /** The end-fade and `data-axis` states the last frame wrote for. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first update of a fitting table then asks for one frame, which removes an absent property and writes the box size the observer writes (T025)
  #endWritten = false;
  #axisWritten: string | null = null;

  constructor() {
    super();
    this.#sheet.replaceSync(".region-track {}");
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const root = this.renderRoot as ShadowRoot;
    if (!root.adoptedStyleSheets.includes(this.#sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.#sheet];
    this.#children.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "alt"] });
    this.#observe();
    // Q-M2 (a), T086: the child observer is off while the element is detached, so a <table> replaced then is assigned
    // here, and the update that follows re-reads the name, the caption cap and the end fade for it.
    this.#assign();
    this.requestUpdate();
  }

  // Stryker disable next-line BlockStatement: equivalent since T086 (Q-M2 (a)), with the body empty the module's observer also stays connected (Lit's disconnectedCallback calls its hostDisconnected), so it measures the detached box and the attached box again, and the frames that follow rewrite every figure; the frame-cancel body ("R-07 a table that starts to overflow and is detached before the frame of that change") passes with it (T025)
  override disconnectedCallback(): void {
    // Stryker disable next-line all: equivalent, the module's hostDisconnected records its own equivalence (overflow-region.ts) (T025)
    super.disconnectedCallback();
    // Stryker disable next-line all: equivalent since T086 (Q-M2 (a)), a child change made while detached is then assigned and updated while detached, and connectedCallback assigns and updates again, with the same result (T085's body passes with it) (T025)
    this.#children.disconnect();
    // Stryker disable next-line all: equivalent, a detached .box-size reports an inline size of 0, which the callback ignores, and connectedCallback observes it again, which delivers its size (T025)
    this.#size.disconnect();
    this.#track.disconnect();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    cancelAnimationFrame(this.#refitFrame);
    this.#refitFrame = 0;
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, an update for another attribute, with no property changed, writes the state already there (T025)
    if (name === "aria-label") this.requestUpdate();
  }

  /** An open shadow root with manual slot assignment, holding the element's styles. */
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    const root = this.attachShadow({ mode: "open", slotAssignment: "manual" });
    adoptStyles(root, (this.constructor as typeof LitElement).elementStyles);
    return root;
  }

  /** The first direct child with the local name `table`, re-derived on every child-list change. */
  #table(): Element | undefined {
    return [...this.children].find((child) => child.localName === "table");
  }

  protected override render(): unknown {
    return html`<div class="region-frame">
        <div class="region-box" data-fade=${ifDefined(this.#region.fadeAttribute)}>
          <div class="region-track"><slot></slot></div>
        </div>
        <div class="region-ring" aria-hidden="true"></div>
        <div class="region-edge start" aria-hidden="true"></div>
        <div class="region-edge end" aria-hidden="true"></div>
        <div class="region-edge block-end" aria-hidden="true"></div>
      </div>
      <div class="box-size" aria-hidden="true"></div>`;
  }

  protected override firstUpdated(): void {
    this.#observe();
  }

  /** Observes `.box-size` for the cap and `.region-track` for the remeasure, once they are rendered. */
  #observe(): void {
    const sizer = this.renderRoot.querySelector(".box-size");
    if (sizer !== null) this.#size.observe(sizer);
    const track = this.renderRoot.querySelector(".region-track");
    if (track !== null) this.#track.observe(track);
  }

  /** Assigns the slot the first direct `table` child, or nothing; other children stay unassigned. */
  #assign(): void {
    const table = this.#table();
    const slot = this.renderRoot.querySelector("slot");
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant of the second test, assigning the nodes already assigned changes nothing and fires no slotchange (T025)
    if (slot !== null && slot.assignedNodes()[0] !== table) slot.assign(...(table === undefined ? [] : [table]));
  }

  protected override updated(): void {
    this.#assign();
    // The label when it is not blank, else the caption's text (blank counts as absent in both).
    const label = this.label?.trim() ?? "";
    this.#region.setLabel(label === "" ? captionText(this.#table()) : label);
    const fade = this.#region.fadeAttribute;
    const end = fade === "end" || fade === "both";
    // Stryker disable next-line LogicalOperator,StringLiteral: not killed in process, where the block-axis scrollbar's room is 0 (--hide-scrollbars); covered by elements-browser (not mutated): test/browser/data-table-scrollbar.test.ts "the sticky caption at 320 px: --data-table-box-size the measured .box-size less the room (305px) with every caption line inside the unmasked extent; 320px once the bound is lifted, 305px again once it is set, each one frame after settle; no ResizeObserver loop error", which fails with this mutant (reviews/phase-1/element-plants.md § T025)
    const axis = this.renderRoot.querySelector(".region-box")?.getAttribute("data-axis") ?? null;
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, it only asks for more frames, and a frame writes what it reads from the box, so an extra frame writes the state already there; the `false` variant is killed by the end-fade bodies (R-07) (T025)
    const fadeChanged = end !== this.#endWritten;
    // Stryker disable next-line ConditionalExpression,EqualityOperator: equivalent for the `true` variant, as fadeChanged's (extra frames only; the classic-scrollbar suite passes with it); the `false` variant and the EqualityOperator are not killed in process, where the block-axis scrollbar's room is 0 (--hide-scrollbars); covered by elements-browser (not mutated): test/browser/data-table-scrollbar.test.ts "the sticky caption at 320 px: --data-table-box-size the measured .box-size less the room (305px) with every caption line inside the unmasked extent; 320px once the bound is lifted, 305px again once it is set, each one frame after settle; no ResizeObserver loop error", which fails with this mutant (reviews/phase-1/element-plants.md § T025)
    const axisChanged = axis !== this.#axisWritten;
    // Stryker disable next-line ConditionalExpression,LogicalOperator: equivalent, the variants only ask for more frames, and a frame writes what it reads from the box (data-fade, data-axis, the edge's width and the measured size), so an extra frame writes the state already there (T025)
    if ((fadeChanged || axisChanged) && this.#frame === 0) {
      this.#frame = requestAnimationFrame(() => {
        this.#frame = 0;
        this.#writeFrame();
      });
    }
  }

  /** One frame after the fade or the axis changed: the end fade's depth while it shows, and the box size again. */
  #writeFrame(): void {
    const box = this.renderRoot.querySelector(".region-box");
    const fade = box?.getAttribute("data-fade") ?? null;
    const end = fade === "end" || fade === "both";
    const style = (this.#sheet.cssRules[0] as CSSStyleRule).style;
    if (end) {
      const depth = this.renderRoot.querySelector(".region-edge.end")?.getBoundingClientRect().width ?? 0;
      style.setProperty("--data-table-end-fade", `${String(depth)}px`);
    } else style.removeProperty("--data-table-end-fade");
    this.#endWritten = end;
    // Stryker disable next-line StringLiteral: not killed in process, where the block-axis scrollbar's room is 0 (--hide-scrollbars); covered by elements-browser (not mutated): test/browser/data-table-scrollbar.test.ts "the sticky caption at 320 px: --data-table-box-size the measured .box-size less the room (305px) with every caption line inside the unmasked extent; 320px once the bound is lifted, 305px again once it is set, each one frame after settle; no ResizeObserver loop error", which fails with this mutant (reviews/phase-1/element-plants.md § T025)
    this.#axisWritten = box?.getAttribute("data-axis") ?? null;
    // Stryker disable next-line all: not killed in process, where the block-axis scrollbar's room is 0 (--hide-scrollbars); covered by elements-browser (not mutated): test/browser/data-table-scrollbar.test.ts "the sticky caption at 320 px: --data-table-box-size the measured .box-size less the room (305px) with every caption line inside the unmasked extent; 320px once the bound is lifted, 305px again once it is set, each one frame after settle; no ResizeObserver loop error", which fails with this mutant (reviews/phase-1/element-plants.md § T025)
    this.#writeBoxSize();
  }

  /**
   * The remeasure (review R1-01): the cap is removed, so the caption lays out at the fallback as on a fresh load, and
   * `.box-size`'s inline size there (its used value, as unrounded and untransformed as the observer's entry) is written
   * again. A box with no inline size (the host not rendered) keeps the last measure.
   */
  #refit(): void {
    const sizer = this.renderRoot.querySelector(".box-size");
    if (sizer === null) return;
    (this.#sheet.cssRules[0] as CSSStyleRule).style.removeProperty("--data-table-box-size");
    const size = Number.parseFloat(getComputedStyle(sizer).inlineSize);
    if (size > 0) this.#measured = size;
    this.#writeBoxSize();
  }

  /** The box's measured inline size, less the block-axis scrollbar's room while `sticky-header` is set, when changed. */
  #writeBoxSize(): void {
    if (this.#measured === undefined) return;
    const box = this.renderRoot.querySelector<HTMLElement>(".region-box");
    // Stryker disable next-line ConditionalExpression,EqualityOperator,BooleanLiteral: equivalent for the `true` variant of the sticky-header test, without it the box never has data-axis, so the room is 0 (the classic-scrollbar suite passes with it); the other variants of this line that type-check (`!==` and the literal `true` written `false`; the rest are compile errors, box possibly null) are not killed in process, where the block-axis scrollbar's room is 0 (--hide-scrollbars); covered by elements-browser (not mutated): test/browser/data-table-scrollbar.test.ts "the sticky caption at 320 px: --data-table-box-size the measured .box-size less the room (305px) with every caption line inside the unmasked extent; 320px once the bound is lifted, 305px again once it is set, each one frame after settle; no ResizeObserver loop error", which fails with this mutant (reviews/phase-1/element-plants.md § T025)
    const room = this.stickyHeader === true && box !== null ? box.offsetWidth - box.clientWidth : 0;
    // Stryker disable next-line ArithmeticOperator: not killed in process, where the block-axis scrollbar's room is 0 (--hide-scrollbars); covered by elements-browser (not mutated): test/browser/data-table-scrollbar.test.ts "the sticky caption at 320 px: --data-table-box-size the measured .box-size less the room (305px) with every caption line inside the unmasked extent; 320px once the bound is lifted, 305px again once it is set, each one frame after settle; no ResizeObserver loop error", which fails with this mutant (reviews/phase-1/element-plants.md § T025)
    const value = `${String(this.#measured - room)}px`;
    const style = (this.#sheet.cssRules[0] as CSSStyleRule).style;
    // Stryker disable next-line ConditionalExpression,StringLiteral: equivalent, the variants set the property to the value it already has (T025)
    if (style.getPropertyValue("--data-table-box-size") !== value) style.setProperty("--data-table-box-size", value);
  }
}

define("ocelle-data-table", OcelleDataTable);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-data-table": OcelleDataTable;
  }
}
