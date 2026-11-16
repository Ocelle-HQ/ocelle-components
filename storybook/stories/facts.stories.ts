// The ocelle-facts stories (013 FR-050, US1; research.md R-08): every layout, density and state of the sheet, and of
// layout="grid", in light and dark through the preview's theme global. The elements are imported from the package
// source by relative path, as the other element stories are, so the Storybook needs no built dist/. Wrapper widths are
// data-story rules in .storybook/stories-layout.css, each capped at the viewport, so no story scrolls sideways at
// 320 px; no markup has a style attribute, no story declares a pointer state, and all text is Latin script.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-facts.ts";

const meta: Meta = { title: "Elements/ocelle-facts" };
export default meta;

const identifier = "4f3c2a1b0e9d8c7b6a5f4e3d2c1b0a99887766554433221100ffeeddccbbaa99";

/** One fact; `label` null leaves the attribute out. */
function fact(label: string | null, value: string, attributes = ""): string {
  return `<ocelle-fact${label === null ? "" : ` label="${label}"`}${attributes}>${value}</ocelle-fact>`;
}

/** A sheet in a wrapper of the given data-story layout. */
function sheet(story: string, facts: readonly string[], attributes = ""): string {
  return `<div data-story="${story}"><ocelle-facts${attributes}>${facts.join("")}</ocelle-facts></div>`;
}

const three = [fact("Owner", "Ada Lovelace"), fact("Created", "2026-11-14"), fact("Status", "Running")];
const four = [...three, fact("Mission", "Facts sheet")];

export const Default: StoryObj = {
  render: () => sheet("facts-wide", [...three, fact("Mission", "Data display, first slice"), fact("Digest", identifier, ' wrap="anywhere"')]),
};

export const Compact: StoryObj = { render: () => sheet("facts-wide", three, ' density="compact"') };

export const Stacked: StoryObj = { name: "Stacked (300 px)", render: () => sheet("facts-narrow", three) };

export const ColumnsShrinkToFit: StoryObj = {
  name: "Columns in a shrink-to-fit host",
  render: () => sheet("facts-shrink", [fact("Owner", "Ada"), fact("Status", "Running")], ' layout="columns"'),
};

export const StackedWide: StoryObj = { name: "Stacked in a wide host", render: () => sheet("facts-wide", three, ' layout="stacked"') };

export const IdentifierWrap: StoryObj = { name: "Identifier wrap", render: () => sheet("facts-wide", [fact("Owner", "Ada Lovelace"), fact("Digest", identifier, ' wrap="anywhere"')]) };

export const MissingLabel: StoryObj = { name: "Missing label", render: () => sheet("facts-wide", [fact("Owner", "Ada Lovelace"), fact(null, "A value without a label"), fact("Status", "Running")]) };

export const MissingValue: StoryObj = { name: "Missing value", render: () => sheet("facts-wide", [fact("Owner", "Ada Lovelace"), fact("Reviewer", ""), fact("Status", "Running")]) };

export const LinkInValue: StoryObj = { name: "Link in value", render: () => sheet("facts-wide", [fact("Owner", "Ada Lovelace"), fact("Run", '<a href="#run-42">Run 42</a>')]) };

export const RightToLeft: StoryObj = { name: "Right to left", render: () => `<div dir="rtl">${sheet("facts-wide", three, ' dir="rtl"')}</div>` };

export const CompactRegion: StoryObj = {
  name: "Inside a compact region",
  render: () => `<div data-ocelle-density="compact">${sheet("facts-wide", three)}</div>`,
};

export const GridStrip: StoryObj = { name: "Grid, four-field strip", render: () => sheet("facts-strip", four, ' layout="grid"') };

export const GridTwoColumns: StoryObj = { name: "Grid, two columns (600 px)", render: () => sheet("facts-medium", four, ' layout="grid"') };

export const GridOneColumn: StoryObj = { name: "Grid, one column (300 px)", render: () => sheet("facts-narrow", four, ' layout="grid"') };

export const GridOneFact: StoryObj = { name: "Grid, one fact", render: () => sheet("facts-strip", [fact("Owner", "Ada Lovelace")], ' layout="grid"') };

export const GridThreeFacts: StoryObj = { name: "Grid, three facts", render: () => sheet("facts-strip", three, ' layout="grid"') };

export const GridEightFacts: StoryObj = {
  name: "Grid, eight facts",
  render: () =>
    sheet(
      "facts-strip",
      [...four, fact("Lane", "Review"), fact("Updated", "2026-11-14"), fact("Phase", "1 of 4"), fact("Owner team", "Elements")],
      ' layout="grid"',
    ),
};

export const GridLongLabelAndIdentifier: StoryObj = {
  name: "Grid, long label and identifier",
  render: () =>
    sheet(
      "facts-medium",
      [fact("Owner", "Ada Lovelace"), fact("The person who reviewed this work package on behalf of the operator", "Charles Babbage"), fact("Digest", identifier, ' wrap="anywhere"'), fact("Status", "Running")],
      ' layout="grid"',
    ),
};

export const GridLinkAndStatus: StoryObj = {
  name: "Grid, link and status value",
  render: () => sheet("facts-strip", [fact("Run", '<a href="#run-42">Run 42</a>'), fact("Status", "Running"), fact("Owner", "Ada Lovelace")], ' layout="grid"'),
};

export const GridUnavailableValue: StoryObj = {
  name: "Grid, unavailable value",
  render: () => sheet("facts-strip", [fact("Owner", "Ada Lovelace"), fact("Reviewer", "Not recorded"), fact("Status", "Running")], ' layout="grid"'),
};

export const GridCompact: StoryObj = { name: "Grid, compact", render: () => sheet("facts-medium", four, ' layout="grid" density="compact"') };

export const GridRightToLeft: StoryObj = { name: "Grid, right to left", render: () => `<div dir="rtl">${sheet("facts-strip", four, ' layout="grid" dir="rtl"')}</div>` };
