// The ocelle-form-select stories (010 FR-033, US4 scenario 1; research.md R-08): empty, placeholder, filled, with a
// description, with an error, required, disabled, focused, hover and with option groups, in light and dark through
// the preview's theme global. The element is imported from the package source by relative path, as the icon stories
// import theirs; the markup has no style attribute (the csp gate's Storybook check). The focused state is set by
// script after render, the pattern of #10's plant pass-focus-below-fold, not with `autofocus`: a wrapper element
// defined here waits for the element's definition and first render and then calls its `focus()`, which focuses the
// inner select, so its `:focus-visible` ring shows (measured for T064, reviews/phase-5/). The hover state is declared
// with #10's pointer parameter, on the one element the story renders.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-form-select.ts";

const meta: Meta = { title: "Elements/ocelle-form-select" };
export default meta;

/** Focuses the form control it holds once the control is defined and has rendered. */
class StoryFocusSelect extends HTMLElement {
  connectedCallback(): void {
    const target = this.querySelector("ocelle-form-select");
    if (target === null) return;
    void customElements
      .whenDefined("ocelle-form-select")
      .then(() => target.updateComplete)
      .then(() => {
        target.focus();
      });
  }
}
if (customElements.get("ocelle-story-focus-select") === undefined) customElements.define("ocelle-story-focus-select", StoryFocusSelect);

const lanes = '<option value="todo">To do</option><option value="doing">Doing</option><option value="done">Done</option>';
const doing = '<option value="todo">To do</option><option value="doing" selected>Doing</option><option value="done">Done</option>';
const chooseLane = `<option value="">Choose a lane</option>${lanes}`;

const select = (options: string, attributes = ""): string => `<ocelle-form-select name="lane" label="Lane"${attributes}>${options}</ocelle-form-select>`;

export const Empty: StoryObj = { render: () => select("") };

export const Placeholder: StoryObj = { render: () => select(chooseLane) };

export const Filled: StoryObj = { render: () => select(doing) };

export const WithDescription: StoryObj = { name: "With description", render: () => select(lanes, ' description="Only cards in this lane are shown"') };

export const WithError: StoryObj = { name: "With error", render: () => select(chooseLane, ' error="Choose a lane for the card"') };

export const Required: StoryObj = { render: () => select(chooseLane, " required") };

export const Disabled: StoryObj = { render: () => select(doing, " disabled") };

export const Focused: StoryObj = { render: () => `<ocelle-story-focus-select>${select(lanes)}</ocelle-story-focus-select>` };

export const Hover: StoryObj = { render: () => select(lanes), parameters: { ocelle: { pointer: { hover: "ocelle-form-select" } } } };

export const OptionGroups: StoryObj = {
  name: "Option groups",
  render: () =>
    select(
      '<option value="">All lanes</option><optgroup label="Active"><option value="todo">To do</option><option value="doing" selected>Doing</option></optgroup><optgroup label="Closed"><option value="done">Done</option><option value="dropped">Dropped</option></optgroup>',
    ),
};
