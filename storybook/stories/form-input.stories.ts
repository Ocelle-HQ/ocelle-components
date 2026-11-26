// The ocelle-form-input stories (010 FR-033, US4 scenario 1; research.md R-08): empty, placeholder, filled, with a
// description, with an error, required, disabled, read-only, focused and hover, in light and dark through the
// preview's theme global. The element is imported from the package source by relative path, as the icon stories
// import theirs; the markup has no style attribute (the csp gate's Storybook check). The focused state is set by
// script after render, the pattern of #10's plant pass-focus-below-fold, not with `autofocus`: a wrapper element
// defined here waits for the element's definition and first render and then calls its `focus()`, which focuses the
// inner field. The hover state is declared with #10's pointer parameter, on the one element the story renders.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-form-input.ts";

const meta: Meta = { title: "Elements/ocelle-form-input" };
export default meta;

/** Focuses the form control it holds once the control is defined and has rendered. */
class StoryFocusInput extends HTMLElement {
  connectedCallback(): void {
    const target = this.querySelector("ocelle-form-input");
    if (target === null) return;
    void customElements
      .whenDefined("ocelle-form-input")
      .then(() => target.updateComplete)
      .then(() => {
        target.focus();
      });
  }
}
if (customElements.get("ocelle-story-focus-input") === undefined) customElements.define("ocelle-story-focus-input", StoryFocusInput);

const field = (attributes = ""): string => `<ocelle-form-input name="title" label="Title"${attributes}></ocelle-form-input>`;

export const Empty: StoryObj = { render: () => field() };

export const Placeholder: StoryObj = { render: () => field(' placeholder="Fix the lane card"') };

export const Filled: StoryObj = { render: () => field(' value="Fix the lane card"') };

export const WithDescription: StoryObj = { name: "With description", render: () => field(' description="Shown on the lane card"') };

export const WithError: StoryObj = { name: "With error", render: () => field(' value="Fix the lane card" error="A card with this title exists"') };

export const Required: StoryObj = { render: () => field(" required") };

export const Disabled: StoryObj = { render: () => field(' value="Fix the lane card" disabled') };

export const ReadOnly: StoryObj = { name: "Read-only", render: () => field(' value="LANE-7" readonly') };

export const Focused: StoryObj = { render: () => `<ocelle-story-focus-input>${field()}</ocelle-story-focus-input>` };

export const Hover: StoryObj = { render: () => field(), parameters: { ocelle: { pointer: { hover: "ocelle-form-input" } } } };
