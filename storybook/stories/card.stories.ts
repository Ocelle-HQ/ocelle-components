// The ocelle-card stories (011 FR-033, US1; research.md R-14): a story per variant and state User Story 1 names, the
// regular and the compact density, each with and without inset, a card with no header and a compact card nested in a
// regular one, in light and dark through the preview's theme global. The elements are imported from the package
// source by relative path, as the other element stories import theirs; each card with a header holds an
// `ocelle-section-header` with the page's own `h2`. The markup has no style attribute (the csp gate's Storybook check).
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-card.ts";
import "../../packages/elements/src/ocelle-section-header.ts";

const meta: Meta = { title: "Elements/ocelle-card" };
export default meta;

const header = '<ocelle-section-header slot="header"><span slot="eyebrow">Mission</span><h2 slot="heading">Runs</h2><button slot="actions" type="button">New run</button></ocelle-section-header>';
const body = "<p>Twelve runs this week, ten passed.</p><p>The last run finished an hour ago.</p>";

export const Regular: StoryObj = { render: () => `<ocelle-card>${header}${body}</ocelle-card>` };

export const Compact: StoryObj = { render: () => `<ocelle-card density="compact">${header}${body}</ocelle-card>` };

export const Inset: StoryObj = { render: () => `<ocelle-card inset>${header}${body}</ocelle-card>` };

export const InsetCompact: StoryObj = { name: "Inset compact", render: () => `<ocelle-card density="compact" inset>${header}${body}</ocelle-card>` };

export const NoHeader: StoryObj = { name: "No header", render: () => `<ocelle-card>${body}</ocelle-card>` };

export const Nested: StoryObj = {
  render: () => `<ocelle-card>${header}<p>The outer card holds an inset compact card.</p><ocelle-card density="compact" inset>${header}<p>The nested card.</p></ocelle-card></ocelle-card>`,
};
