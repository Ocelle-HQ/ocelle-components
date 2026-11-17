// The ocelle-page-header stories (011 FR-033, US2; research.md R-14; T031): a story per size and state User Story 2
// names, the heading alone, every part filled at the regular and the compact size, an empty heading slot and a long
// unbroken heading whose actions wrap under the description, in light and dark through the preview's theme global.
// The element is imported from the package source by relative path, as the other element stories import theirs, so
// the Storybook needs no built dist/. The markup has no style attribute (the csp gate's Storybook check); each heading
// is the page's own `h1`.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-page-header.ts";

const meta: Meta = { title: "Elements/ocelle-page-header" };
export default meta;

const actions = '<button slot="actions" type="button">Import</button><button slot="actions" type="button">New mission</button>';
const parts = `<span slot="eyebrow">Workspace</span><h1 slot="heading">Missions</h1><p slot="description">Every mission of the workspace, newest first.</p>${actions}`;

export const HeadingOnly: StoryObj = { name: "Heading only", render: () => '<ocelle-page-header><h1 slot="heading">Missions</h1></ocelle-page-header>' };

export const Filled: StoryObj = { render: () => `<ocelle-page-header>${parts}</ocelle-page-header>` };

export const Compact: StoryObj = { render: () => `<ocelle-page-header size="compact">${parts}</ocelle-page-header>` };

export const EmptyHeading: StoryObj = {
  name: "Empty heading",
  render: () => `<ocelle-page-header><span slot="eyebrow">Workspace</span><p slot="description">A page header whose heading slot is empty.</p>${actions}</ocelle-page-header>`,
};

export const LongHeading: StoryObj = {
  name: "Long heading",
  render: () =>
    `<ocelle-page-header><span slot="eyebrow">Workspace</span><h1 slot="heading">Missions${"x".repeat(60)}end</h1><p slot="description">An unbroken heading wraps inside the band.</p>${actions}<button slot="actions" type="button">Export</button></ocelle-page-header>`,
};
