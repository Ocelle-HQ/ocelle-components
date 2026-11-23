// The ocelle-segmented-choice stories (014 FR-050, FR-051, US3 scenarios 8 to 10 and 19; research.md R-06, R-12, R-15):
// the default variant, the joined variant on one row and wrapped onto two rows, another segment pressed, a disabled
// segment, a focused segment, a hovered segment in the default variant and in the joined variant, and a segment with an
// icon, in light and dark through the preview's theme global. The elements are imported from the package source by
// relative path, as the other element stories import theirs, so the Storybook needs no built dist/; importing the
// segmented choice defines the segment too. The markup has no style attribute and no id or aria-* on a segment other
// than the `#target` the focus and hover stories name: the wrapped story's width is a rule of stories-layout.css on its
// data-story attribute. The focused story focuses its target in `play`, which ends before the render signal, once the
// group has rendered; the hovered stories declare the hover with the pointer parameter (006 FR-031), whose selector
// matches exactly one segment inside the first viewport.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-segmented-choice.ts";

const meta: Meta = { title: "Elements/ocelle-segmented-choice" };
export default meta;

const lanes = ["All", "Mine", "Blocked", "Done"];

/** The four lane segments: `value` the pressed value, `disabled` the disabled segment and `id` the target segment, by name. */
function group(options: { readonly value?: string; readonly disabled?: string; readonly id?: string; readonly joined?: boolean } = {}): string {
  const segments = lanes.map((name) => `<ocelle-segment value="${name.toLowerCase()}"${name === options.disabled ? " disabled" : ""}${name === options.id ? ' id="target"' : ""}>${name}</ocelle-segment>`).join("");
  const value = options.value === undefined ? "" : ` value="${options.value}"`;
  return `<ocelle-segmented-choice label="Lane filter"${value}${options.joined === true ? " joined" : ""}>${segments}</ocelle-segmented-choice>`;
}

export const Default: StoryObj = { render: () => group() };

export const JoinedOneRow: StoryObj = { name: "Joined one row", render: () => group({ joined: true }) };

export const JoinedWrapped: StoryObj = {
  name: "Joined wrapped",
  render: () => `<div data-story="segmented-choice-wrapped">${group({ value: "mine", joined: true })}</div>`,
};

export const Pressed: StoryObj = { render: () => group({ value: "blocked" }) };

export const DisabledSegment: StoryObj = { name: "Disabled segment", render: () => group({ value: "all", disabled: "Mine" }) };

export const FocusedSegment: StoryObj = {
  name: "Focused segment",
  render: () => group({ value: "all", id: "Mine" }),
  play: async ({ canvasElement }) => {
    await customElements.whenDefined("ocelle-segmented-choice");
    await (canvasElement.querySelector("ocelle-segmented-choice") as unknown as { updateComplete?: Promise<unknown> } | null)?.updateComplete;
    canvasElement.querySelector<HTMLElement>("#target")?.focus({ focusVisible: true });
  },
};

export const HoveredSegment: StoryObj = {
  name: "Hovered segment",
  render: () => group({ value: "all", id: "Blocked" }),
  parameters: { ocelle: { pointer: { hover: "#target" } } },
};

export const HoveredJoinedSegment: StoryObj = {
  name: "Hovered joined segment",
  render: () => group({ value: "all", id: "Blocked", joined: true }),
  parameters: { ocelle: { pointer: { hover: "#target" } } },
};

export const SegmentWithIcon: StoryObj = {
  name: "Segment with icon",
  render: () =>
    '<ocelle-segmented-choice label="View" value="files"><ocelle-segment value="files"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Files</ocelle-segment><ocelle-segment value="table"><ocelle-icon slot="icon" name="table"></ocelle-icon>Table</ocelle-segment></ocelle-segmented-choice>',
};
