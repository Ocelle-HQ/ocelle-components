// The ocelle-tabs stories (014 FR-050, FR-051, US2 scenarios 6 and 23; research.md R-02, R-12, R-15): the first tab
// selected, another tab selected, a disabled tab, wrapped rows, a focused tab, a hovered tab, a focused tab panel with
// no focusable content (the panel is itself the tab stop, US2-6) and a tab with an icon, in light and dark through the
// preview's theme global. The elements are imported from the package source by relative path, as the other element
// stories import theirs, so the Storybook needs no built dist/; importing the tabs defines the tab and the panel too.
// The markup has no style attribute and no id or aria-* on a tab or panel (SC-003) other than the `#target` the focus
// and hover stories name: the wrapped story's row width is a rule of stories-layout.css on its data-story attribute.
// The focus stories focus their target in `play`, which ends before the render signal, once the tabs have rendered; the
// hovered story declares the hover with the pointer parameter (006 FR-031), whose selector matches exactly one tab
// inside the first viewport.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-tabs.ts";

const meta: Meta = { title: "Elements/ocelle-tabs" };
export default meta;

const views = ["Spec", "Plan", "Tasks"];

/** The tabs of `names` with a panel each, `value` the selected value, `disabled` the disabled tab and `id` the target tab, by name. */
function tabs(value = "", disabled = "", id = "", names: readonly string[] = views): string {
  const tabMarkup = names.map((name) => `<ocelle-tab value="${name.toLowerCase()}"${name === disabled ? " disabled" : ""}${name === id ? ' id="target"' : ""}>${name}</ocelle-tab>`).join("");
  const panels = names.map((name) => `<ocelle-tab-panel><p>The ${name.toLowerCase()} of the mission.</p></ocelle-tab-panel>`).join("");
  return `<ocelle-tabs label="Mission views"${value === "" ? "" : ` value="${value}"`}>${tabMarkup}${panels}</ocelle-tabs>`;
}

/** Waits until the story's tabs have rendered, then focuses `selector` with the focus ring. */
async function focusAfterRender(canvas: HTMLElement, selector: string): Promise<void> {
  await customElements.whenDefined("ocelle-tabs");
  await (canvas.querySelector("ocelle-tabs") as unknown as { updateComplete?: Promise<unknown> } | null)?.updateComplete;
  canvas.querySelector<HTMLElement>(selector)?.focus({ focusVisible: true });
}

export const FirstSelected: StoryObj = { name: "First selected", render: () => tabs() };

export const AnotherSelected: StoryObj = { name: "Another selected", render: () => tabs("plan") };

export const DisabledTab: StoryObj = { name: "Disabled tab", render: () => tabs("spec", "Plan") };

export const WrappedRows: StoryObj = {
  name: "Wrapped rows",
  render: () => `<div data-story="tabs-wrapped">${tabs("research", "", "", ["Specification", "Planning", "Research", "Contracts", "Quickstart", "Tasks"])}</div>`,
};

export const FocusedTab: StoryObj = {
  name: "Focused tab",
  render: () => tabs("spec", "", "Plan"),
  play: async ({ canvasElement }) => {
    await focusAfterRender(canvasElement, "#target");
  },
};

export const HoveredTab: StoryObj = {
  name: "Hovered tab",
  render: () => tabs("spec", "", "Plan"),
  parameters: { ocelle: { pointer: { hover: "#target" } } },
};

export const FocusedTabPanel: StoryObj = {
  name: "Focused tab panel",
  render: () => tabs("plan"),
  play: async ({ canvasElement }) => {
    await focusAfterRender(canvasElement, "ocelle-tab-panel:nth-of-type(2)");
  },
};

export const TabWithIcon: StoryObj = {
  name: "Tab with icon",
  render: () =>
    '<ocelle-tabs label="Mission views" value="files"><ocelle-tab value="files"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Files</ocelle-tab><ocelle-tab value="search"><ocelle-icon slot="icon" name="search"></ocelle-icon>Search</ocelle-tab><ocelle-tab-panel><p>The files of the mission.</p></ocelle-tab-panel><ocelle-tab-panel><p>Search the mission.</p></ocelle-tab-panel></ocelle-tabs>',
};
