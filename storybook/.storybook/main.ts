// The Storybook configuration (FR-023, research.md R-10): the HTML framework over Vite, the token stories, and the
// generated directory (scripts/swatches.ts) as the static directory. Scaffold: the settings of the phase 3 spike
// (reviews/phase-3/spike.md) come with the implementation.
import type { StorybookConfig } from "@storybook/html-vite";

const config: StorybookConfig = {
  framework: { name: "@storybook/html-vite", options: {} },
  stories: ["../stories/*.stories.ts"],
};

export default config;
