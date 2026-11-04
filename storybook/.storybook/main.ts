// The Storybook configuration (FR-023, research.md R-10), as the phase 3 spike reached zero CSP violations with it
// (reviews/phase-3/spike.md): the HTML framework over Vite, the token stories, and the generated directory
// (scripts/swatches.ts: the token and swatch stylesheets and the fonts) as the static directory. Telemetry is off,
// so the build makes no network request; the core addons whose preview code injects <style> elements are off, so
// the preview, the Storybook page, runs under `style-src 'self'`.
import type { StorybookConfig } from "@storybook/html-vite";

const config: StorybookConfig = {
  framework: { name: "@storybook/html-vite", options: {} },
  stories: ["../stories/*.stories.ts"],
  staticDirs: ["../.generated"],
  core: { disableTelemetry: true },
  features: {
    highlight: false,
    backgrounds: false,
    measure: false,
    outline: false,
    viewport: false,
    actions: false,
    controls: false,
    interactions: false,
  },
};

export default config;
