// The ocelle-empty-state stories (013 FR-050, US2; research.md R-08): the default and panel variants, a heading only,
// actions only, several actions in a 320 px wrapper, the refusal block with an eyebrow and several body paragraphs, in
// light and dark through the preview's theme global, and since 013 phase 3 the panel loading story, with an
// indeterminate `ocelle-progress` in `visual` (captured on the still mark: #10's contexts reduce motion). The elements are imported from the package source by relative path,
// as the other element stories are, so the Storybook needs no built dist/. Wrapper widths are data-story rules in
// .storybook/stories-layout.css, each capped at the viewport; no markup has a style attribute, no story declares a
// pointer state, and all text is Latin script. The action buttons are slotted light-DOM content, whose font base.css
// sets.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-empty-state.ts";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-progress.ts";

const meta: Meta = { title: "Elements/ocelle-empty-state" };
export default meta;

/** An empty state in a wrapper of the given data-story layout. */
function state(story: string, content: string, attributes = ""): string {
  return `<div data-story="${story}"><ocelle-empty-state${attributes}>${content}</ocelle-empty-state></div>`;
}

const noMissions =
  '<ocelle-icon slot="visual" name="folder"></ocelle-icon>' +
  '<h2 slot="heading">No missions yet</h2>' +
  "<p>Missions you create appear here, with their runs and reviews.</p>" +
  '<button slot="actions" type="button">Create mission</button>';

export const Default: StoryObj = { render: () => state("empty-wide", noMissions) };

export const Panel: StoryObj = { render: () => state("empty-wide", noMissions, ' variant="panel"') };

export const PanelLoading: StoryObj = {
  name: "Panel loading",
  render: () => state("empty-wide", '<ocelle-progress slot="visual" label="Loading missions"></ocelle-progress><h2 slot="heading">Loading missions</h2>', ' variant="panel"'),
};

export const HeadingOnly: StoryObj = { name: "Heading only", render: () => state("empty-wide", '<h2 slot="heading">Nothing to review</h2>') };

export const ActionsOnly: StoryObj = { name: "Actions only", render: () => state("empty-wide", '<button slot="actions" type="button">Open the mission list</button>') };

export const SeveralActionsNarrow: StoryObj = {
  name: "Several actions (320 px)",
  render: () =>
    state(
      "empty-narrow",
      '<h2 slot="heading">No missions have been recorded for this project yet</h2>' +
        "<p>Create a mission, import one from another project, or read the guide to see how missions, runs and reviews fit together.</p>" +
        ["Create mission", "Import missions", "Read the guide", "Open settings"].map((label) => `<button slot="actions" type="button">${label}</button>`).join(""),
    ),
};

export const RefusalWithEyebrow: StoryObj = {
  name: "Refusal with an eyebrow",
  render: () =>
    state(
      "empty-wide",
      '<p slot="eyebrow">Refused</p>' +
        '<h1 slot="heading">Cannot open the mission</h1>' +
        "<p>The mission file is outside the workspace this console may read.</p>" +
        '<p data-ocelle-wrap="anywhere">/srv/projects/kitty/workspaces/archive/2026/missions/data-display-first-slice/mission.yaml</p>' +
        '<button slot="actions" type="button">Back to missions</button>',
    ),
};

export const SeveralBodyParagraphs: StoryObj = {
  name: "Several body paragraphs",
  render: () =>
    state(
      "empty-wide",
      '<h2 slot="heading">No runs yet</h2>' +
        "<p>Runs appear here once an operator starts one from the mission page.</p>" +
        "<p>Each run keeps its own record of what it read and what it wrote.</p>" +
        "<p>Reviews follow the run they belong to.</p>" +
        '<button slot="actions" type="button">Start a run</button>',
    ),
};
