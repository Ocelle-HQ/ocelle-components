// The ocelle-data-table stories (019 FR-050; contracts/checks.md § Stories; inventory decisions IQ-2 to IQ-5, spike
// Q1 (b), re-analysis C1 (b), fixes-2 Q-1 (b)): the 21 states of the data table, in light and dark through the preview's
// theme global. The element is imported from the package source by relative path, as the other element stories import
// theirs; its look is base.css's, which the preview links. Widths and the sticky stories' block bounds are data-story
// rules of .storybook/stories-layout.css (calc() over tokens, each capped at the viewport); the markup has no style
// attribute and no class, all text is Latin script, and only the two hover stories declare a pointer state.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-data-table.ts";

const meta: Meta = { title: "Elements/ocelle-data-table" };
export default meta;

/** An unbroken 26-character identifier. */
const identifier = "01JD8X2K7Q9M4N6P3R5T0V2W8Y";
const lanes = ["Planned", "Doing", "Review", "Done"];
const owners = ["Ada", "Grace", "Linus", "Barbara"];

interface Options {
  readonly caption?: string;
  readonly rows?: number;
  readonly ident?: boolean;
  readonly head?: string;
  readonly hover?: number;
}

/** The work-packages table: a caption, a header row of Id, Title, Lane and Owner, and `rows` rows. */
function table({ caption = "Work packages", rows = 4, ident = false, head, hover }: Options = {}): string {
  const header = head ?? "<tr><th scope=\"col\">Id</th><th scope=\"col\">Title</th><th scope=\"col\">Lane</th><th scope=\"col\">Owner</th></tr>";
  const body = Array.from({ length: rows }, (_, index) => {
    const id = ident ? `${identifier.slice(0, 20)}${String(index + 10).padStart(6, "0")}` : `WP${String(index + 1).padStart(2, "0")}`;
    const first = hover === index ? ` id="${hover % 2 === 1 ? "hovered-even-cell" : "hovered-cell"}"` : "";
    return `<tr><td${first}>${id}</td><td>Write the specification</td><td>${lanes[index % 4] ?? ""}</td><td>${owners[index % 4] ?? ""}</td></tr>`;
  }).join("");
  return `<table>${caption === "" ? "" : `<caption>${caption}</caption>`}<thead>${header}</thead><tbody>${body}</tbody></table>`;
}

/** A data table in a story wrapper. */
const story = (wrapper: string, attributes: string, content: string): string => `<div data-story="${wrapper}"><ocelle-data-table${attributes}>${content}</ocelle-data-table></div>`;

export const Fits: StoryObj = { render: () => story("data-table", ' label="Work packages"', table()) };

export const OverflowsNamedByLabel: StoryObj = { render: () => story("data-table-narrow", ' label="Work packages"', table({ ident: true })) };

export const OverflowsNamedByCaption: StoryObj = { render: () => story("data-table-narrow", "", table({ ident: true })) };

export const OverflowsUnnamed: StoryObj = { render: () => story("data-table-narrow", "", table({ ident: true, caption: "" })) };

export const OverflowsNamedByHostAriaLabel: StoryObj = { render: () => story("data-table-narrow", ' aria-label="Deployments" label="Work packages"', table({ ident: true })) };

export const OverflowsBlankHostAriaLabel: StoryObj = { render: () => story("data-table-narrow", ' aria-label="  " label="Work packages"', table({ ident: true })) };

export const RowHeaders: StoryObj = {
  render: () =>
    story(
      "data-table",
      ' label="Lanes"',
      '<table><caption>Lanes</caption><thead><tr><th scope="col">Lane</th><th scope="col">Open</th><th scope="col">Done</th></tr></thead><tbody><tr><th scope="row">Planned</th><td>4</td><td>0</td></tr><tr><th scope="row">Doing</th><td>2</td><td>1</td></tr><tr><th scope="row">Review</th><td>1</td><td>3</td></tr></tbody></table>',
    ),
};

export const CornerHeader: StoryObj = {
  render: () =>
    story(
      "data-table",
      ' label="Lanes"',
      '<table><caption>Lanes</caption><thead><tr><th scope="row">Lane</th><th scope="col">Open</th><th scope="col">Done</th></tr></thead><tbody><tr><th scope="row">Planned</th><td>4</td><td>0</td></tr><tr><th scope="row">Doing</th><td>2</td><td>1</td></tr></tbody></table>',
    ),
};

export const WrapAnywhere: StoryObj = { render: () => story("data-table-narrow", ' wrap="anywhere" label="Work packages"', table({ ident: true })) };

export const InsideProse: StoryObj = {
  render: () => `<div data-story="data-table" data-ocelle-prose=""><p>The work packages of the mission, newest first.</p><ocelle-data-table label="Work packages">${table()}</ocelle-data-table></div>`,
};

export const RightToLeft: StoryObj = { render: () => `<div dir="rtl">${story("data-table-narrow", ' label="Work packages"', table({ ident: true }))}</div>` };

export const EmptyBody: StoryObj = { render: () => story("data-table", ' label="Work packages"', table({ rows: 0 })) };

export const Width320: StoryObj = { render: () => story("data-table-narrow", ' label="Work packages"', table({ ident: true })) };

export const NoTable: StoryObj = { render: () => story("data-table", ' label="Work packages"', "") };

export const StickyHeaderBounded: StoryObj = { render: () => story("data-table-bounded", ' sticky-header label="Work packages"', table({ rows: 20 })) };

export const StickyHeaderUnbounded: StoryObj = { render: () => story("data-table", ' sticky-header label="Work packages"', table({ rows: 20 })) };

export const StickyHeaderRoomRule: StoryObj = { render: () => story("data-table-room-rule", ' sticky-header label="Work packages"', table({ rows: 20, caption: "" })) };

export const NumericColumn: StoryObj = {
  render: () =>
    story(
      "data-table",
      ' label="Estimates"',
      '<table><caption>Estimates</caption><thead><tr><th scope="col">Id</th><th scope="col">Title</th><th scope="col" data-ocelle-align="end">Estimate</th></tr></thead><tbody><tr><td>WP01</td><td>Write the specification</td><td data-ocelle-align="end">3.5</td></tr><tr><td>WP02</td><td>Build the table</td><td data-ocelle-align="end">12</td></tr><tr><td>WP03</td><td>Review</td><td data-ocelle-align="end">0.75</td></tr></tbody></table>',
    ),
};

/** Two row groups of five rows, for the stripe. */
function groups(hover?: number): string {
  const group = (offset: number): string =>
    `<tbody>${Array.from({ length: 5 }, (_, index) => {
      const first = hover === offset + index ? ' id="hovered-even-cell"' : "";
      return `<tr><td${first}>WP${String(offset + index + 1).padStart(2, "0")}</td><td>Write the specification</td><td>${lanes[index % 4] ?? ""}</td></tr>`;
    }).join("")}</tbody>`;
  return `<table><caption>Work packages</caption><thead><tr><th scope="col">Id</th><th scope="col">Title</th><th scope="col">Lane</th></tr></thead>${group(0)}${group(5)}</table>`;
}

export const Striped: StoryObj = { render: () => story("data-table", ' striped label="Work packages"', groups()) };

export const RowHovered: StoryObj = {
  render: () => story("data-table", ' label="Work packages"', table({ hover: 0 })),
  parameters: { ocelle: { pointer: { hover: "#hovered-cell" } } },
};

export const StripedEvenRowHovered: StoryObj = {
  render: () => story("data-table", ' striped label="Work packages"', groups(1)),
  parameters: { ocelle: { pointer: { hover: "#hovered-even-cell" } } },
};
