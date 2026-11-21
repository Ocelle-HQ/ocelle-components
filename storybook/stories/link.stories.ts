// The ocelle-link stories (014 FR-050, FR-051, US5 scenarios 1, 6 and 8; research.md R-08, R-10, R-12, R-15): a link
// in a paragraph, a link wrapped across lines, the focused link, the hovered link and a link named by a `label` that
// starts with its visible text, in light and dark through the preview's theme global. Every link sits inside a
// sentence, where WCAG's target-size rule exempts it (R-10). The element is imported from the package source by
// relative path, as the other element stories import theirs, so the Storybook needs no built dist/. The markup has no
// style attribute: the wrapped story's width is a rule of stories-layout.css on its data-story attribute. The focused
// story focuses its link in `play`, which ends before the render signal, once the link has rendered; the hovered story
// declares the hover with the pointer parameter (006 FR-031), whose selector matches exactly one link inside the first
// viewport. The `label` story's label contains the visible text, as the README requires (WCAG 2.5.3).
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-link.ts";

const meta: Meta = { title: "Elements/ocelle-link" };
export default meta;

/** A sentence holding one link to `href` (none when null) with `attributes` and `text`. */
function sentence(text: string, href: string | null, attributes = ""): string {
  const target = href === null ? "" : ` href="${href}"`;
  return `<p>Open the mission and read <ocelle-link${target}${attributes}>${text}</ocelle-link> before you start the next phase.</p>`;
}

export const InAParagraph: StoryObj = { name: "In a paragraph", render: () => sentence("the mission log", "#mission-log") };

export const WrappedAcrossLines: StoryObj = {
  name: "Wrapped across lines",
  render: () => `<div data-story="link-wrapped">${sentence("the mission log of every selection element in this feature", "#mission-log")}</div>`,
};

export const Focused: StoryObj = {
  render: () => sentence("the mission log", "#mission-log", ' id="target"'),
  play: async ({ canvasElement }) => {
    await customElements.whenDefined("ocelle-link");
    const link = canvasElement.querySelector("#target") as unknown as (HTMLElement & { updateComplete?: Promise<unknown> }) | null;
    await link?.updateComplete;
    link?.focus({ focusVisible: true });
  },
};

export const Hovered: StoryObj = {
  render: () => sentence("the mission log", "#mission-log", ' id="target"'),
  parameters: { ocelle: { pointer: { hover: "#target" } } },
};

export const WithLabel: StoryObj = {
  name: "With label",
  render: () => sentence("the mission log", null, ' label="the mission log, opens in the viewer"'),
};
