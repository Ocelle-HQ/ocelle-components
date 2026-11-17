// The ocelle-workflow-board stories (009 FR-032; contracts/elements.md § Stories; research.md R-15): five lanes that fit
// Frame W, the same five lanes overflowing the narrow Frame N, one lane, no lanes, and right to left, in light and dark
// through the preview's theme global, on the preview's `color-canvas` ground. The elements are imported from the
// package source by relative path, as the other element stories import theirs. The boards sit in the tested frames,
// sized by the `[data-frame]` rules that .storybook/stories-layout.css copies from
// packages/elements/test/fixtures/frames.css; the markup has no style attribute and no class. The cards carry
// sentence-length text, and the first card's tags are a nested `ocelle-scroller` with an item-specific label.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-scroller.ts";
import "../../packages/elements/src/ocelle-workflow-board.ts";
import "../../packages/elements/src/ocelle-workflow-lane.ts";

const meta: Meta = { title: "Elements/ocelle-workflow-board" };
export default meta;

/** The lanes of a work-package board: title and count. */
const lanes: readonly (readonly [string, number])[] = [
  ["Backlog", 4],
  ["Ready", 3],
  ["In progress", 2],
  ["In review", 1],
  ["Done", 5],
];

/** The cards of a lane, sentence-length; the first lane's first card has its tags in a nested scroller. */
function cards(index: number): string {
  const tags = '<ocelle-scroller label="Tags of WP-12"><button type="button">layout</button> <button type="button">board</button> <button type="button">keyboard</button> <button type="button">tokens</button></ocelle-scroller>';
  const first = `<p>Implement the overflow region module and its tests for the scroller</p>${index === 0 ? tags : ""}`;
  return `${first}<p>Write the board and lane stories in light and dark</p>`;
}

/** A board of the first `count` lanes in a frame, as markup. */
function board(frame: "W" | "N", count: number): string {
  const inner = lanes
    .slice(0, count)
    .map(([title, number], index) => `<ocelle-workflow-lane label="${title}" count="${String(number)}">${cards(index)}</ocelle-workflow-lane>`)
    .join("");
  return `<div data-frame="${frame}"><ocelle-workflow-board label="Workflow">${inner}</ocelle-workflow-board></div>`;
}

export const FiveLanes: StoryObj = { name: "Five lanes", render: () => board("W", 5) };

export const FiveLanesNarrow: StoryObj = { name: "Five lanes, narrow", render: () => board("N", 5) };

export const OneLane: StoryObj = { name: "One lane", render: () => board("W", 1) };

export const NoLanes: StoryObj = { name: "No lanes", render: () => board("N", 0) };

export const RightToLeft: StoryObj = { name: "Right to left", render: () => `<div dir="rtl">${board("N", 5)}</div>` };
