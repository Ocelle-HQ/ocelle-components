// The ocelle-brand-mark stories (005 FR-019, US4 scenario 11; research.md R-14): the main-ground variant, the chrome
// variant on the chrome ground, the one-colour mark and a labelled mark, in light and dark through the preview's theme
// global. The element is imported from the package source by relative path, as the icon stories import it, so the
// Storybook needs no built dist/. The markup has no style attribute (the csp gate's Storybook check): the chrome ground
// comes from the generated swatch stylesheet's rule for `color-chrome` (scripts/swatches.ts), by class and data-token,
// so no Storybook configuration file changes.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-brand-mark.ts";

const meta: Meta = { title: "Elements/ocelle-brand-mark" };
export default meta;

export const MainGround: StoryObj = { name: "Main ground", render: () => "<p><ocelle-brand-mark></ocelle-brand-mark> Ocelle</p>" };

export const Chrome: StoryObj = {
  render: () => '<p class="ocelle-swatch" data-token="color-chrome"><ocelle-brand-mark ground="chrome"></ocelle-brand-mark></p>',
};

export const Mono: StoryObj = { render: () => '<p>Ocelle <ocelle-brand-mark tone="mono"></ocelle-brand-mark> in the colour of the text around it</p>' };

export const Labelled: StoryObj = { render: () => '<p><ocelle-brand-mark label="Ocelle"></ocelle-brand-mark> a labelled mark, one image named Ocelle</p>' };
