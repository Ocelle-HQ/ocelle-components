// The ocelle-section-header stories (011 FR-033, US1; research.md R-14): a story per variant and state User Story 1
// names, the heading alone, every part filled, the compact size, the eyebrow variant above a list, an empty heading
// slot and a long unbroken heading whose actions wrap under it, in light and dark through the preview's theme global.
// The element is imported from the package source by relative path, as the other element stories import theirs, so
// the Storybook needs no built dist/. The markup has no style attribute (the csp gate's Storybook check); each heading
// is the page's own `h2` or `h3`.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-section-header.ts";

const meta: Meta = { title: "Elements/ocelle-section-header" };
export default meta;

const actions = '<button slot="actions" type="button">Edit</button><button slot="actions" type="button">New run</button>';

export const HeadingOnly: StoryObj = { name: "Heading only", render: () => '<ocelle-section-header><h2 slot="heading">Runs</h2></ocelle-section-header>' };

export const Filled: StoryObj = {
  render: () =>
    `<ocelle-section-header><span slot="eyebrow">Mission</span><h2 slot="heading">Runs</h2><p slot="description">Every run of the mission, newest first.</p>${actions}</ocelle-section-header>`,
};

export const Compact: StoryObj = {
  render: () =>
    `<ocelle-section-header size="compact"><span slot="eyebrow">Mission</span><h2 slot="heading">Runs</h2><p slot="description">Every run of the mission, newest first.</p>${actions}</ocelle-section-header>`,
};

export const EyebrowVariant: StoryObj = {
  name: "Eyebrow variant",
  render: () => `<ocelle-section-header variant="eyebrow"><h3 slot="heading">Recent</h3>${actions}</ocelle-section-header><ul><li>Run 12, passed</li><li>Run 11, failed</li></ul>`,
};

export const EmptyHeading: StoryObj = {
  name: "Empty heading",
  render: () => `<ocelle-section-header><span slot="eyebrow">Mission</span><p slot="description">A header whose heading slot is empty.</p>${actions}</ocelle-section-header>`,
};

export const LongHeading: StoryObj = {
  name: "Long heading",
  render: () => `<ocelle-section-header><h2 slot="heading">Mission${"x".repeat(60)}end</h2><p slot="description">An unbroken heading wraps inside the header.</p>${actions}</ocelle-section-header>`,
};
