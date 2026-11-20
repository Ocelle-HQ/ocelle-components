// The ocelle-metric stories (018 FR-004, US2; research.md R-12): `Stack`, three metrics with the label above the value;
// `Row`, the same three with `layout="row"`, label and value on one line; and `EmptyValue`, a metric with no
// `display-value` and one with an empty one, stacked and in a row, each keeping the height of a one-line value. All in
// light and dark through the preview's theme global. The element is imported from the package source by relative path,
// as the other element stories are. No markup has a style attribute, no story declares a pointer state, and all text
// is Latin script.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-metric.ts";

const meta: Meta = { title: "Elements/ocelle-metric" };
export default meta;

const figures = [
  ["Open missions", "12"],
  ["Merged this week", "1,204"],
  ["Median review time", "3 h 20 min"],
] as const;

/** The three metrics, each in `layout` (none for the default). */
function metrics(layout: string | null): string {
  return figures.map(([label, value]) => `<ocelle-metric label="${label}" display-value="${value}"${layout === null ? "" : ` layout="${layout}"`}></ocelle-metric>`).join("");
}

export const Stack: StoryObj = { render: () => metrics(null) };

export const Row: StoryObj = { render: () => metrics("row") };

export const EmptyValue: StoryObj = {
  render: () => '<ocelle-metric label="Open missions"></ocelle-metric><ocelle-metric label="Open missions" display-value="" layout="row"></ocelle-metric>',
};
