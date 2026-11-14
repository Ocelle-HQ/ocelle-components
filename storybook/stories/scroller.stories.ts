// The ocelle-scroller stories (009 FR-032; contracts/elements.md § Stories; research.md R-15): a strip that fits, an
// overflowing strip at its start, in the middle and at its end, right to left, and an unlabelled strip, in light and
// dark through the preview's theme global. The element is imported from the package source by relative path, as the
// other element stories import theirs. The strips sit in the tested frames, sized by the `[data-frame]` rules that
// .storybook/stories-layout.css copies from packages/elements/test/fixtures/frames.css; the markup has no style
// attribute and no class. The middle and end stories set the scroll position after the element's `updateComplete`,
// inside their render, so their capture is deterministic.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-scroller.ts";

const meta: Meta = { title: "Elements/ocelle-scroller" };
export default meta;

/** The filter chips of a board's toolbar. */
const chips = ["Backlog", "Ready", "In progress", "In review", "Blocked", "Done", "Archived", "Mine", "Unassigned", "Due today"];

/** One strip of chips in a frame, as markup. */
function strip(frame: "N" | "S", count: number, attributes: string): string {
  const items = chips
    .slice(0, count)
    .map((chip) => `<button type="button">${chip}</button>`)
    .join(" ");
  return `<div data-frame="${frame}"><ocelle-scroller${attributes}>${items}</ocelle-scroller></div>`;
}

/** An overflowing strip, scrolled after its first update to a share of its scroll range (0 is the start, 1 the end). */
function scrolled(share: number): HTMLElement {
  const story = document.createElement("div");
  story.innerHTML = strip("S", chips.length, ' label="Filters"');
  const scroller = story.querySelector("ocelle-scroller");
  void scroller?.updateComplete.then(() => {
    const box = scroller.shadowRoot?.querySelector(".region-box");
    if (box !== null && box !== undefined) box.scrollLeft = Math.round((box.scrollWidth - box.clientWidth) * share);
  });
  return story;
}

export const Fits: StoryObj = { render: () => strip("N", 3, ' label="Filters"') };

export const OverflowingAtStart: StoryObj = { name: "Overflowing at start", render: () => strip("S", chips.length, ' label="Filters"') };

export const OverflowingInTheMiddle: StoryObj = { name: "Overflowing in the middle", render: () => scrolled(0.5) };

export const OverflowingAtTheEnd: StoryObj = { name: "Overflowing at the end", render: () => scrolled(1) };

export const RightToLeft: StoryObj = { name: "Right to left", render: () => `<div dir="rtl">${strip("S", chips.length, ' label="Filters"')}</div>` };

export const Unlabelled: StoryObj = { render: () => strip("S", chips.length, "") };
