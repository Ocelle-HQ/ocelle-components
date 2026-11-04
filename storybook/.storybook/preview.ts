// The preview configuration (FR-023, research.md R-10, reviews/phase-3/spike.md): a theme global, light at start,
// offered in the toolbar and settable by URL (`globals=theme:dark`); a decorator sets data-theme on the preview's
// <html> from it (light unless it is "dark") before the story renders, so the token stylesheet that
// preview-head.html links shows that theme. preview.css gives the preview's own code elements the token font, so no
// element of the Storybook page has a monospace family (constitution II; spike step 4).
/// <reference types="vite/client" />
import "./preview.css";
import type { Preview } from "@storybook/html-vite";

const preview: Preview = {
  globalTypes: { theme: { description: "Theme of the token stylesheet", toolbar: { title: "Theme", items: ["light", "dark"] } } },
  initialGlobals: { theme: "light" },
  decorators: [
    (story, context) => {
      document.documentElement.dataset.theme = context.globals.theme === "dark" ? "dark" : "light";
      return story();
    },
  ],
};

export default preview;
