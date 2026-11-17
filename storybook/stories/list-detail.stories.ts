// The ocelle-list-detail stories (009 FR-032; contracts/elements.md § Stories; research.md R-11, R-15): three columns
// in Frame R, two columns with the inspector stacked in Frame W, one column showing the list and one showing the
// detail (with `detail-open`) in Frame N, no inspector in Frame R, and right to left in Frame R, in light and dark
// through the preview's theme global, on the preview's `color-canvas` ground. The element is imported from the package
// source by relative path, as the other element stories import theirs. Each list-detail sits in a tested frame, sized
// by the `[data-frame]` rules that .storybook/stories-layout.css copies from packages/elements/test/fixtures/frames.css;
// the markup has no style attribute and no class. The panes hold a work-package list, its detail and an inspector,
// each with its own heading, as a host names its panes.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-list-detail.ts";

const meta: Meta = { title: "Elements/ocelle-list-detail" };
export default meta;

const list =
  '<div slot="list"><h2>Work packages</h2><p><button type="button">WP-12 Implement the overflow region module</button></p><p><button type="button">WP-13 Write the board and lane stories</button></p><p><button type="button">WP-14 Measure the list-detail tiers</button></p></div>';
const detail =
  "<div><h2>WP-12 Implement the overflow region module</h2><p>The scroller and the board share one module that makes a scroll box a tab stop only while it overflows.</p><p>Its fades, arrow keys and focus clearance are tested in both harnesses.</p></div>";
const inspector = '<div slot="inspector"><h2>Details</h2><p>Lane: In review</p><p>Owner: the operator</p></div>';

/** A list-detail in a frame, as markup. */
function listDetail(frame: "R" | "W" | "N", attributes = "", inner = `${list}${detail}${inspector}`): string {
  return `<div data-frame="${frame}"><ocelle-list-detail${attributes}>${inner}</ocelle-list-detail></div>`;
}

export const ThreeColumns: StoryObj = { name: "Three columns", render: () => listDetail("R") };

export const TwoColumnsInspectorStacked: StoryObj = { name: "Two columns, inspector stacked", render: () => listDetail("W") };

export const OneColumnList: StoryObj = { name: "One column, list", render: () => listDetail("N") };

export const OneColumnDetail: StoryObj = { name: "One column, detail", render: () => listDetail("N", " detail-open") };

export const NoInspector: StoryObj = { name: "No inspector", render: () => listDetail("R", "", `${list}${detail}`) };

export const RightToLeft: StoryObj = { name: "Right to left", render: () => `<div dir="rtl">${listDetail("R")}</div>` };
