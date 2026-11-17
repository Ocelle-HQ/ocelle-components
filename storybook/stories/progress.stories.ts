// The ocelle-progress stories (013 FR-050, US3; research.md R-08): determinate, zero, full, indeterminate, compact,
// labelled, labelled compact, value text, right-to-left and on a tinted ground, in light and dark through the
// preview's theme global. Every bar is named by `label`; no story sets a host `aria-label` and none is unnamed (both
// are proven by browser tests only, FR-050). The "value text" story is a labelled bar at the default size with a
// determinate value and `value-text`, and "labelled compact" carries both too, so both label rows of FR-035 have a
// baseline. The indeterminate bar is captured on the still mark: #10's capture and axe contexts reduce motion. The
// element is imported from the package source by relative path, as the other element stories are. Wrapper widths
// and the inset ground are data-story rules in .storybook/stories-layout.css; no markup has a style attribute, no
// story declares a pointer state, and all text is Latin script.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-progress.ts";

const meta: Meta = { title: "Elements/ocelle-progress" };
export default meta;

/** A bar in a wrapper of the given data-story layout. */
function bar(attributes: string, story = "progress-wide"): string {
  return `<div data-story="${story}"><ocelle-progress${attributes}></ocelle-progress></div>`;
}

const tasks = ' value="7" max="12" label="Tasks done"';

export const Determinate: StoryObj = { render: () => bar(tasks) };

export const Zero: StoryObj = { render: () => bar(' value="0" max="12" label="Tasks done"') };

export const Full: StoryObj = { render: () => bar(' value="12" max="12" label="Tasks done"') };

export const Indeterminate: StoryObj = { render: () => bar(' label="Loading plan"') };

export const Compact: StoryObj = { render: () => bar(` size="compact"${tasks}`) };

export const Labelled: StoryObj = { render: () => bar(`${tasks} show-label`) };

export const LabelledCompact: StoryObj = { name: "Labelled compact", render: () => bar(` size="compact"${tasks} value-text="7 of 12" show-label`) };

export const ValueText: StoryObj = { name: "Value text", render: () => bar(`${tasks} value-text="7 of 12" show-label`) };

export const RightToLeft: StoryObj = { name: "Right to left", render: () => bar(` dir="rtl"${tasks} value-text="7 of 12" show-label`) };

export const TintedGround: StoryObj = { name: "Tinted ground", render: () => bar(` ground="tinted"${tasks}`, "progress-inset") };
