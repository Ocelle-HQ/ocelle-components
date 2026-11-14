// The container-tier rules of `ocelle-list-detail` (009 FR-025, FR-027, FR-034; research.md R-12; data-model.md
// § list-detail): the `*-below` grammar, the resolution of a length, the token default with its published fallback,
// the exclusive comparison and the tier choice. Pure functions; the element reads the computed font sizes and the
// token's computed value and passes them in. Internal, not an entry point.

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
export const publishedCollapse = "40rem";

/** The published value of `--ocelle-list-detail-inspector-collapse`, the fallback for a token value that does not parse. */
export const publishedInspectorCollapse = "60rem";

/** ASCII whitespace (tab, line feed, form feed, carriage return, space), which the grammar trims. */
const ascii = /^[\t\n\f\r ]+|[\t\n\f\r ]+$/g;

/** The grammar of R-12: a unitless `0`, or digits with an optional fraction and a `px`, `rem` or `em` unit. */
const grammar = /^(?:0|([0-9]+(?:\.[0-9]+)?)(px|rem|em))$/i;

/** The length a `*-below` value gives after trimming ASCII whitespace, or none when it is not an accepted form. */
export function parseLength(value: string | null | undefined): Length | undefined {
  const match = grammar.exec((value ?? "").replace(ascii, ""));
  if (match === null) return undefined;
  const [, number, unit] = match;
  if (number === undefined || unit === undefined) return { value: 0, unit: "px" };
  return { value: Number(number), unit: unit.toLowerCase() as Length["unit"] };
}

/** A length in px: `rem` at the root's computed font size, `em` at the host's. */
export function resolveLength(length: Length, rootFontSize: number, hostFontSize: number): number {
  if (length.unit === "rem") return length.value * rootFontSize;
  if (length.unit === "em") return length.value * hostFontSize;
  return length.value;
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
export function threshold({ attribute, token, published, rootFontSize, hostFontSize }: ThresholdInput): number {
  const length = parseLength(attribute) ?? parseLength(token) ?? parseLength(published) ?? { value: 0, unit: "px" };
  return resolveLength(length, rootFontSize, hostFontSize);
}

/** Whether a measured size is below a threshold: exclusive, so the wider layout applies at exactly the threshold. */
export function below(measured: number, at: number): boolean {
  return measured < at;
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
export function chooseTier({ measured, collapseAt, inspectorAt, narrow, hasInspector }: TierInput): Tier {
  if (narrow || below(measured, collapseAt)) return "one";
  if (!hasInspector || below(measured, inspectorAt)) return "two";
  return "three";
}

/** The panes a tier shows: every present pane in two or three columns; in one column the detail (and inspector) with `detail-open`, else the list. */
export function shownPanes(tier: Tier, detailOpen: boolean, hasInspector: boolean): Pane[] {
  if (tier === "one" && !detailOpen) return ["list"];
  const panes: Pane[] = tier === "one" ? ["detail"] : ["list", "detail"];
  return hasInspector ? [...panes, "inspector"] : panes;
}
