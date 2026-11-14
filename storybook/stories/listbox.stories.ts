// The ocelle-listbox stories (014 FR-050, FR-051, US1 scenario 23; research.md R-12, R-15): a listbox with no
// selection, a selected option, a disabled option, a focused option, a hovered option, a scrolling listbox and an option
// with an icon, in light and dark through the preview's theme global. The elements are imported from the package
// source by relative path, as the icon stories import theirs, so the Storybook needs no built dist/; importing the
// listbox defines the option too. The markup has no style attribute (the csp gate's Storybook check): the scrolling
// listbox's height limit is a rule of stories-layout.css on its data-story attribute. The focused story focuses its
// option in `play`, which ends before the render signal; the hovered story declares the hover with the pointer
// parameter (006 FR-031), whose selector matches exactly one option inside the first viewport.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-listbox.ts";

const meta: Meta = { title: "Elements/ocelle-listbox" };
export default meta;

const folders = ["alpha", "beta", "gamma", "delta", "epsilon"];

/** The five folder options, `selected` the value of the listbox and `disabled` the disabled one, by name. */
function listbox(value = "", disabled = "", id = ""): string {
  const options = folders.map((name) => `<ocelle-option value="${name}"${name === disabled ? " disabled" : ""}${name === id ? ' id="target"' : ""}>${name}</ocelle-option>`).join("");
  return `<ocelle-listbox label="Folders"${value === "" ? "" : ` value="${value}"`}>${options}</ocelle-listbox>`;
}

export const NoSelection: StoryObj = { name: "No selection", render: () => listbox() };

export const Selected: StoryObj = { render: () => listbox("gamma") };

export const DisabledOption: StoryObj = { name: "Disabled option", render: () => listbox("gamma", "beta") };

export const FocusedOption: StoryObj = {
  name: "Focused option",
  render: () => listbox("gamma", "", "delta"),
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>("#target")?.focus({ focusVisible: true });
  },
};

export const HoveredOption: StoryObj = {
  name: "Hovered option",
  render: () => listbox("gamma", "", "delta"),
  parameters: { ocelle: { pointer: { hover: "#target" } } },
};

export const ScrollingListbox: StoryObj = {
  name: "Scrolling listbox",
  render: () =>
    `<div data-story="listbox-scrolling"><ocelle-listbox label="Folders" value="delta">${["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa"].map((name) => `<ocelle-option value="${name}">${name}</ocelle-option>`).join("")}</ocelle-listbox></div>`,
};

export const OptionWithIcon: StoryObj = {
  name: "Option with icon",
  render: () =>
    '<ocelle-listbox label="Folders" value="projects"><ocelle-option value="projects"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Projects</ocelle-option><ocelle-option value="notes"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Notes</ocelle-option></ocelle-listbox>',
};
