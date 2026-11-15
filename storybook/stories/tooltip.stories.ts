// The ocelle-tooltip stories (008 FR-042; data-model.md § Stories; research.md R-16; tasks.md T051): hover top; hover
// bottom; hover start; hover end; flipped at the top edge; rtl hover start; rtl hover end; inside an open dialog; long
// text. Each shows its bubble through the pointer state of 006 FR-031: `parameters.ocelle.pointer.hover` names the
// story's trigger by its id, `#tooltip-trigger`, which matches exactly one element of the page, and the gates move the
// mouse onto its centre. Each story's markup sits inside `<div data-story="tooltip">`, whose rule in
// stories-layout.css sets `--ocelle-tooltip-delay` to 0ms (operator decision A at T026), so the bubble shows in the same
// task as that move, before axe and the capture. The triggers stand inline in a sentence, so each placement has room
// on its side, except in the flipped story, whose trigger is the story's first line. The inside-an-open-dialog story's
// body is short, so it does not scroll at 1280 × 800. The elements are imported from the package source by relative
// path, as the other element stories import theirs; the markup has no style attribute. The hover delay, keyboard focus,
// Escape and the other behaviour are rows of the element's test matrix, not stories (R-16).
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-dialog.ts";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-tooltip.ts";

const meta: Meta = { title: "Elements/ocelle-tooltip" };
export default meta;

/** The pointer state of every story: the mouse on the centre of the trigger. */
const hovered = { ocelle: { pointer: { hover: "#tooltip-trigger" } } };

/** An icon-only button trigger named `label`, as #12's icon-only nav item is. */
const iconButton = (label: string, icon: string): string => `<button id="tooltip-trigger" type="button" aria-label="${label}"><ocelle-icon name="${icon}"></ocelle-icon></button>`;

const intro =
  "<p>The rail lists the places of the workspace. Each icon names its place, and the bubble repeats that name.</p><p>A bubble shows when the pointer rests on its trigger, and at once when the trigger receives keyboard focus.</p><p>Escape hides it again.</p>";

/** A story's markup: the delay override's block around a first paragraph and a sentence that holds `tooltip`. */
const story = (tooltip: string, dir = ""): string => `<div data-story="tooltip"${dir}>${intro}<p>Open the place from the rail with ${tooltip} and its missions appear in the workspace.</p></div>`;

export const HoverTop: StoryObj = {
  name: "Hover top",
  parameters: hovered,
  render: () => story(`<ocelle-tooltip text="Projects">${iconButton("Projects", "folder")}</ocelle-tooltip>`),
};

export const HoverBottom: StoryObj = {
  name: "Hover bottom",
  parameters: hovered,
  render: () => story('<ocelle-tooltip text="Saves a draft you can reopen later" placement="bottom" describes><button id="tooltip-trigger" type="button">Save</button></ocelle-tooltip>'),
};

export const HoverStart: StoryObj = {
  name: "Hover start",
  parameters: hovered,
  render: () => story(`<ocelle-tooltip text="Files" placement="start">${iconButton("Files", "file")}</ocelle-tooltip>`),
};

export const HoverEnd: StoryObj = {
  name: "Hover end",
  parameters: hovered,
  render: () => story(`<ocelle-tooltip text="Search" placement="end">${iconButton("Search", "search")}</ocelle-tooltip>`),
};

export const FlippedAtTheTopEdge: StoryObj = {
  name: "Flipped at the top edge",
  parameters: hovered,
  render: () =>
    `<div data-story="tooltip"><p>The first line of the page holds the trigger, <ocelle-tooltip text="Projects">${iconButton("Projects", "folder")}</ocelle-tooltip>, so there is no room above it and the bubble is shown below.</p></div>`,
};

export const RtlHoverStart: StoryObj = {
  name: "rtl hover start",
  parameters: hovered,
  render: () => story(`<ocelle-tooltip text="Files" placement="start">${iconButton("Files", "file")}</ocelle-tooltip>`, ' dir="rtl"'),
};

export const RtlHoverEnd: StoryObj = {
  name: "rtl hover end",
  parameters: hovered,
  render: () => story(`<ocelle-tooltip text="Search" placement="end">${iconButton("Search", "search")}</ocelle-tooltip>`, ' dir="rtl"'),
};

export const InsideAnOpenDialog: StoryObj = {
  name: "Inside an open dialog",
  parameters: hovered,
  render: () =>
    `<div data-story="tooltip"><ocelle-dialog open label="Open project"><p>Choose a folder to open as a project.</p><p><button type="button">Browse</button> or open a recent folder with ${iconButton("Recent folders", "folder").replace("<button", '<ocelle-tooltip text="Recent folders"><button').replace("</button>", "</button></ocelle-tooltip>")}.</p></ocelle-dialog></div>`,
};

export const LongText: StoryObj = {
  name: "Long text",
  parameters: hovered,
  render: () =>
    story(
      '<ocelle-tooltip text="Shows the missions of the workspace that match every filter you set, and keeps the filters until you reset them, also after a reload" describes><button id="tooltip-trigger" type="button">Filters</button></ocelle-tooltip>',
    ),
};
