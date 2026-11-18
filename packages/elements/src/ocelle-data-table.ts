// `ocelle-data-table` (019 FR-001 to FR-019, FR-040, FR-050 to FR-061; contracts/ocelle-data-table.md; research.md
// R-01 to R-07, R-16 to R-20): a slotted native `<table>` in the overflow-region module's scroll box, a tab stop and a
// named `group` only while it overflows, styled by `@ocelle/styles`. Phase 1 scaffold: the public surface only, no
// behaviour. Importing this module defines `ocelle-data-table` and no other element.
import { LitElement } from "lit";
import { define } from "./define.ts";

/**
 * A compact data table: a native `<table>` child in a box that scrolls in the inline direction when the table is wider
 * than its room, a tab stop and a named group only while it overflows.
 *
 * @tagname ocelle-data-table
 * @slot - The first direct `<table>` child; other children are not shown after upgrade.
 */
export class OcelleDataTable extends LitElement {
  static override properties = {
    label: { type: String },
    wrap: { type: String, reflect: true },
    stickyHeader: { type: Boolean, reflect: true, attribute: "sticky-header" },
    striped: { type: Boolean, reflect: true },
  };

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

  protected override render(): unknown {
    return undefined;
  }
}

define("ocelle-data-table", OcelleDataTable);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-data-table": OcelleDataTable;
  }
}
