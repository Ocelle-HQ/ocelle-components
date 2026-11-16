// The ocelle-notice stories (010 FR-033, US4 scenario 1; research.md R-08): each tone, each size, with and without a
// heading, and an announcing notice, in light and dark through the preview's theme global. The element is imported
// from the package source by relative path, as the icon and mark stories import theirs, so the Storybook needs no
// built dist/; the markup has no style attribute (the csp gate's Storybook check). The announcing notice is shown as
// rendered: its announcement is behaviour, tested in the element's browser scenarios, not in a pixel.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-notice.ts";

const meta: Meta = { title: "Elements/ocelle-notice" };
export default meta;

export const Info: StoryObj = { render: () => '<ocelle-notice tone="info">The lane is queued and starts when a runner is free.</ocelle-notice>' };

export const Success: StoryObj = { render: () => '<ocelle-notice tone="success">Saved.</ocelle-notice>' };

export const Warning: StoryObj = { render: () => '<ocelle-notice tone="warning">Disk almost full.</ocelle-notice>' };

export const Danger: StoryObj = { render: () => '<ocelle-notice tone="danger">The lane stopped at step 3.</ocelle-notice>' };

export const Neutral: StoryObj = { render: () => '<ocelle-notice tone="neutral">No runs yet.</ocelle-notice>' };

export const RegularSize: StoryObj = {
  name: "Regular size",
  render: () => '<ocelle-notice tone="info" size="regular"><span slot="heading">Regular size</span>The regular size sets the text in the body scale.</ocelle-notice>',
};

export const CompactSize: StoryObj = {
  name: "Compact size",
  render: () => '<ocelle-notice tone="info" size="compact"><span slot="heading">Compact size</span>The compact size sets the text in the small scale.</ocelle-notice>',
};

export const WithHeading: StoryObj = {
  name: "With heading",
  render: () => '<ocelle-notice tone="danger"><span slot="heading">Run failed</span>The lane stopped at step 3.</ocelle-notice>',
};

export const WithoutHeading: StoryObj = { name: "Without heading", render: () => '<ocelle-notice tone="danger">The lane stopped at step 3.</ocelle-notice>' };

export const Announcing: StoryObj = {
  render: () => '<ocelle-notice tone="success" announce><span slot="heading">Lane saved</span>The card is in To do.</ocelle-notice>',
};
