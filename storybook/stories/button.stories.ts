// The ocelle-button stories (012 spec US1, FR-050; research.md R-13; plan decisions 7, 20 and 27; tasks.md T028): one
// story per variant, size and state of User Story 1 in button mode, in light and dark through the preview's theme
// global. Hover and press are declared with 006's pointer parameter, each on the one button of its story; the focused
// story's wrapper calls the button's plain `focus()` once it has rendered, which the phase 2 spike measured to show
// `:focus-visible` in 006's pinned capture (reviews/phase-2/spike.md). The grounds come from the generated swatch
// stylesheet's rule for each token (scripts/swatches.ts), by class and data-token, with the padding of
// stories-layout.css's `[data-story]` rule, so the markup has no style attribute and no Storybook configuration file
// changes. Names that a label gives contain the visible text (label in name). The elements are imported from the
// package source by relative path, as the icon stories import theirs.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-button.ts";
import "../../packages/elements/src/ocelle-icon.ts";

const meta: Meta = { title: "Elements/ocelle-button" };
export default meta;

/** A story-only wrapper that focuses the `ocelle-button` it holds once that has rendered (plan decision 27). */
class StoryFocus extends HTMLElement {
  connectedCallback(): void {
    void customElements.whenDefined("ocelle-button").then(async () => {
      const button = this.querySelector("ocelle-button");
      if (button === null) return;
      await button.updateComplete;
      button.focus();
    });
  }
}
if (customElements.get("story-focus") === undefined) customElements.define("story-focus", StoryFocus);

/** A ground for a story's buttons: the swatch rule of `token` as its background, padded. */
function ground(token: string, content: string): string {
  return `<div class="ocelle-swatch" data-token="${token}" data-story="ground">${content}</div>`;
}

const folder = '<ocelle-icon slot="icon" name="folder"></ocelle-icon>';
const close = '<ocelle-icon slot="icon" name="close"></ocelle-icon>';

export const Secondary: StoryObj = { render: () => "<p><ocelle-button>Save</ocelle-button></p>" };

export const Primary: StoryObj = { render: () => '<p><ocelle-button variant="primary">Save</ocelle-button></p>' };

export const Quiet: StoryObj = { render: () => '<p><ocelle-button variant="quiet">Cancel</ocelle-button></p>' };

export const Compact: StoryObj = {
  render: () => '<p><ocelle-button variant="primary" size="compact">Save</ocelle-button> <ocelle-button variant="secondary" size="compact">Edit</ocelle-button> <ocelle-button variant="quiet" size="compact">Cancel</ocelle-button></p>',
};

export const Flush: StoryObj = {
  render: () => `<h2>Projects</h2><p><ocelle-button flush>Open the list</ocelle-button></p><p><ocelle-button flush size="compact">${folder}Projects</ocelle-button></p>`,
};

export const Icon: StoryObj = {
  render: () => `<p><ocelle-button variant="primary">${folder}Open project</ocelle-button> <ocelle-button variant="secondary">${folder}Open project</ocelle-button> <ocelle-button variant="quiet">${folder}Open project</ocelle-button></p>`,
};

export const IconOnly: StoryObj = {
  name: "Icon only",
  render: () => `<p><ocelle-button variant="quiet" label="Close">${close}</ocelle-button> <ocelle-button variant="quiet" size="compact" label="Close">${close}</ocelle-button></p>`,
};

export const Disabled: StoryObj = {
  render: () => '<p><ocelle-button variant="primary" disabled>Save</ocelle-button> <ocelle-button variant="secondary" disabled>Edit</ocelle-button> <ocelle-button variant="quiet" disabled>Cancel</ocelle-button> <ocelle-button flush disabled>Projects</ocelle-button></p>',
};

export const PrimaryHovered: StoryObj = {
  name: "Primary, hovered",
  parameters: { ocelle: { pointer: { hover: "ocelle-button" } } },
  render: () => '<p><ocelle-button variant="primary">Save</ocelle-button></p>',
};

export const SecondaryHovered: StoryObj = {
  name: "Secondary, hovered",
  parameters: { ocelle: { pointer: { hover: "ocelle-button" } } },
  render: () => "<p><ocelle-button>Save</ocelle-button></p>",
};

export const FlushHovered: StoryObj = {
  name: "Flush, hovered",
  parameters: { ocelle: { pointer: { hover: "ocelle-button" } } },
  render: () => "<p><ocelle-button flush>Projects</ocelle-button></p>",
};

export const SecondaryPressed: StoryObj = {
  name: "Secondary, pressed",
  parameters: { ocelle: { pointer: { press: "ocelle-button" } } },
  render: () => "<p><ocelle-button>Save</ocelle-button></p>",
};

export const Focused: StoryObj = { render: () => "<p><story-focus><ocelle-button>Save</ocelle-button></story-focus></p>" };

export const Grounds: StoryObj = {
  render: () =>
    [
      ["color-accent-low", "accent-low"],
      ["color-inset", "inset"],
      ["color-hover-bg", "hover-bg"],
      ["color-danger-bg", "state"],
    ]
      .map(([token = "", value = ""]) => ground(token, `<ocelle-button ground="${value}">Edit</ocelle-button> <ocelle-button variant="quiet" ground="${value}">Retry</ocelle-button>`))
      .join(""),
};

export const Chrome: StoryObj = {
  render: () =>
    ["color-chrome", "color-chrome-hover"]
      .map((token) =>
        ground(
          token,
          '<ocelle-button variant="primary" ground="chrome">Save</ocelle-button> <ocelle-button ground="chrome">Edit</ocelle-button> <ocelle-button variant="quiet" ground="chrome">Menu</ocelle-button> <ocelle-button flush ground="chrome">Projects</ocelle-button>',
        ),
      )
      .join(""),
};

export const ChangingSurface: StoryObj = {
  name: "Changing surface",
  render: () => ["color-canvas", "color-hover-bg"].map((token) => ground(token, '<ocelle-button variant="quiet" ground="hover-bg">Retry</ocelle-button>')).join(""),
};

export const RightToLeft: StoryObj = {
  name: "Right to left",
  render: () => `<div dir="rtl"><p><ocelle-button>${folder}Open project</ocelle-button></p><p><ocelle-button flush>${folder}Projects</ocelle-button></p></div>`,
};
