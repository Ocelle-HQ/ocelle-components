// The ocelle-icon stories (005 FR-019, US1 scenario 13; research.md R-14): the close icon, a labelled icon and an
// unknown name, in light and dark through the preview's theme global. The element is imported from the package
// source by relative path, as the token stories import the token source, so the Storybook needs no built dist/; its
// markup has no style attribute (the csp gate's Storybook check). Phase 3 adds one story per icon of the set.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";

const meta: Meta = { title: "Elements/ocelle-icon" };
export default meta;

export const Close: StoryObj = { render: () => '<p>Close <ocelle-icon name="close"></ocelle-icon></p>' };

export const Labelled: StoryObj = { render: () => '<p><ocelle-icon name="close" label="Close"></ocelle-icon> a labelled icon, one image named Close</p>' };

export const UnknownName: StoryObj = { name: "Unknown name", render: () => '<p>An unknown name draws nothing and keeps the box: [<ocelle-icon name="nonexistent"></ocelle-icon>]</p>' };
