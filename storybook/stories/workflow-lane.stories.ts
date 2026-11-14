// The ocelle-workflow-lane stories (009 FR-032; contracts/elements.md § Stories; research.md R-10, R-15): the default
// lane with and without a count, the flat lane with and without a count, a long title and an untitled lane with a
// count, in light and dark through the preview's theme global, on the preview's `color-canvas` ground. The element is
// imported from the package source by relative path, as the other element stories import theirs. Each lane sits in
// Frame S, sized by the `[data-frame]` rules that .storybook/stories-layout.css copies from
// packages/elements/test/fixtures/frames.css; the markup has no style attribute and no class. The cards carry
// sentence-length text, and the first story's tags are a nested `ocelle-scroller` with an item-specific label.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-scroller.ts";
import "../../packages/elements/src/ocelle-workflow-lane.ts";

const meta: Meta = { title: "Elements/ocelle-workflow-lane" };
export default meta;

const cards = "<p>Implement the overflow region module and its tests for the scroller</p><p>Write the board and lane stories in light and dark</p>";
const tags = '<ocelle-scroller label="Tags of WP-12"><button type="button">layout</button> <button type="button">board</button> <button type="button">keyboard</button> <button type="button">tokens</button></ocelle-scroller>';

/** One lane in Frame S, as markup. */
function lane(attributes: string, inner = cards): string {
  return `<div data-frame="S"><ocelle-workflow-lane${attributes}>${inner}</ocelle-workflow-lane></div>`;
}

export const DefaultWithCount: StoryObj = { name: "Default with count", render: () => lane(' label="Ready" count="3"', `${cards}${tags}`) };

export const DefaultWithoutCount: StoryObj = { name: "Default without count", render: () => lane(' label="Ready"') };

export const FlatWithCount: StoryObj = { name: "Flat with count", render: () => lane(' label="Ready" count="3" variant="flat"') };

export const FlatWithoutCount: StoryObj = { name: "Flat without count", render: () => lane(' label="Ready" variant="flat"') };

export const LongTitle: StoryObj = { name: "Long title", render: () => lane(' label="Waiting for review by the operator and the squad" count="12"') };

export const UntitledWithCount: StoryObj = { name: "Untitled with count", render: () => lane(' count="3"') };
