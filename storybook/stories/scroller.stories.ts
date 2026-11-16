// The ocelle-scroller stories (009 FR-032; contracts/elements.md § Stories; research.md R-15): a strip that fits, an
// overflowing strip at its start, in the middle and at its end, right to left, and an unlabelled strip, in light and
// dark through the preview's theme global. The element is imported from the package source by relative path, as the
// other element stories import theirs. The strips sit in the tested frames, sized by the `[data-frame]` rules that
// .storybook/stories-layout.css copies from packages/elements/test/fixtures/frames.css; the markup has no style
// attribute and no class. The middle and end stories set the scroll position after the element's `updateComplete`,
// inside their render, so their capture is deterministic. The strip can grow after that first write (a font that loads
// late; CI run 43791016532 left "Overflowing at the end" short of its end), so each holds its share of the scroll range
// once the layout settles: a `ResizeObserver` on the box and its track writes the position for the new range again
// whenever the range changes, in the observer's delivery before the paint, with no timer (research.md R-15).
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

/**
 * An overflowing strip, scrolled after its first update to a share of its scroll range (0 is the start, 1 the end),
 * and scrolled to that share of the new range again whenever its scroll range changes.
 */
function scrolled(share: number): HTMLElement {
  const story = document.createElement("div");
  story.innerHTML = strip("S", chips.length, ' label="Filters"');
  const scroller = story.querySelector("ocelle-scroller");
  void scroller?.updateComplete.then(() => {
    const box = scroller.shadowRoot?.querySelector(".region-box");
    if (box === null || box === undefined) return;
    let range = box.scrollWidth - box.clientWidth;
    box.scrollLeft = Math.round(range * share);
    const hold = new ResizeObserver(() => {
      const now = box.scrollWidth - box.clientWidth;
      if (now === range) return;
      range = now;
      box.scrollLeft = Math.round(range * share);
    });
    hold.observe(box);
    const track = box.querySelector(".region-track");
    if (track !== null) hold.observe(track);
  });
  return story;
}

export const Fits: StoryObj = { render: () => strip("N", 3, ' label="Filters"') };

export const OverflowingAtStart: StoryObj = { name: "Overflowing at start", render: () => strip("S", chips.length, ' label="Filters"') };

export const OverflowingInTheMiddle: StoryObj = { name: "Overflowing in the middle", render: () => scrolled(0.5) };

export const OverflowingAtTheEnd: StoryObj = { name: "Overflowing at the end", render: () => scrolled(1) };

export const RightToLeft: StoryObj = { name: "Right to left", render: () => `<div dir="rtl">${strip("S", chips.length, ' label="Filters"')}</div>` };

export const Unlabelled: StoryObj = { render: () => strip("S", chips.length, "") };
