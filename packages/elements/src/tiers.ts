// The container-tier rules of `ocelle-list-detail` (009 FR-025, FR-027, FR-034; research.md R-12; data-model.md
// § list-detail): phase 4 scaffold. The exported signatures only, with no behaviour; the green step of phase 4
// implements them. Internal, not an entry point.
/* eslint-disable @typescript-eslint/no-unused-vars -- the scaffold has signatures and no behaviour */

/** A list-detail layout: three columns, two columns (the inspector stacked), or one column. */
export type Tier = "three" | "two" | "one";

/** A pane of a list-detail. */
export type Pane = "list" | "detail" | "inspector";

/** A length the grammar accepts: a number of `px`, `rem` or `em` (a unitless `0` is `0px`). */
export interface Length {
  readonly value: number;
  readonly unit: "px" | "rem" | "em";
}

/** The published value of `--ocelle-list-detail-collapse`, the fallback for a token value that does not parse. */
export const publishedCollapse = "";

/** The published value of `--ocelle-list-detail-inspector-collapse`, the fallback for a token value that does not parse. */
export const publishedInspectorCollapse = "";

/** The length a `*-below` value gives after trimming ASCII whitespace, or none when it is not an accepted form. */
export function parseLength(value: string | null | undefined): Length | undefined {
  throw new Error("not implemented");
}

/** A length in px: `rem` at the root's computed font size, `em` at the host's. */
export function resolveLength(length: Length, rootFontSize: number, hostFontSize: number): number {
  throw new Error("not implemented");
}

/** What a threshold is resolved from. */
export interface ThresholdInput {
  /** The attribute's value, or none. */
  readonly attribute: string | null | undefined;
  /** The token's value as computed on the element (empty when it is not set). */
  readonly token: string;
  /** The token's published value. */
  readonly published: string;
  readonly rootFontSize: number;
  readonly hostFontSize: number;
}

/** A threshold in px: the attribute when it parses, else the token's computed value when it parses, else the published value. */
export function threshold(input: ThresholdInput): number {
  throw new Error("not implemented");
}

/** Whether a measured size is below a threshold: exclusive, so the wider layout applies at exactly the threshold. */
export function below(measured: number, at: number): boolean {
  throw new Error("not implemented");
}

/** What the tier is chosen from. */
export interface TierInput {
  readonly measured: number;
  readonly collapseAt: number;
  readonly inspectorAt: number;
  readonly narrow: boolean;
  readonly hasInspector: boolean;
}

/** The tier of data-model.md § list-detail. */
export function chooseTier(input: TierInput): Tier {
  throw new Error("not implemented");
}

/** The panes a tier shows: every present pane in two or three columns; in one column the detail (and inspector) with `detail-open`, else the list. */
export function shownPanes(tier: Tier, detailOpen: boolean, hasInspector: boolean): Pane[] {
  throw new Error("not implemented");
}
