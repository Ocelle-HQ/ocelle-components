// The ocelle-personal-rail stories (011 FR-033, FR-038, US4; research.md R-10, R-14; T046): a story per state User
// Story 4 names, the vertical rail (three primary items and a bottom item), the horizontal rail, no bottom group, no
// primary group, a horizontal rail wrapped at a narrow width, and one story per naming case of US4-11, each rendering
// that one landmark alone: a host `aria-label` only, `label` and a host `aria-label`, and a blank host `aria-label`
// with `label`. Every other story renders one landmark with a distinct `label`. The items are stand-in `<a>` links
// (#12's ocelle-nav-item does not exist yet): the story root sets `data-story="rail-items"`, and the story stylesheet
// (storybook/.storybook/stories-layout.css) sizes them to `--ocelle-size-rail-item` squares that inherit the rail's
// chrome ink. In light and dark through the preview's theme global. The element is imported from the package source
// by relative path, as the other element stories import theirs. The markup has no style attribute (the csp gate's
// Storybook check).
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-personal-rail.ts";
import "../../packages/elements/src/ocelle-button.ts";
import "../../packages/elements/src/ocelle-icon.ts";

const meta: Meta = { title: "Elements/ocelle-personal-rail" };
export default meta;

/** A stand-in item linking to `#<target>`, in `slot` when given. */
const item = (target: string, text: string, slot = ""): string => `<a href="#${target}"${slot === "" ? "" : ` slot="${slot}"`}>${text}</a>`;

const primary = item("inbox", "In") + item("runs", "Ru") + item("docs", "Do");
const account = item("account", "Me", "bottom");

/** A rail with `attributes` holding `inner`, inside the stand-in items' root. */
const rail = (attributes: string, inner: string): string => `<div data-story="rail-items"><ocelle-personal-rail${attributes}>${inner}</ocelle-personal-rail></div>`;

export const Vertical: StoryObj = { render: () => rail(' label="Personal"', primary + account) };

export const Horizontal: StoryObj = { render: () => rail(' label="Personal strip" orientation="horizontal"', primary + account) };

export const NoBottom: StoryObj = { name: "No bottom", render: () => rail(' label="Personal links"', primary) };

export const NoPrimary: StoryObj = { name: "No primary", render: () => rail(' label="Account"', account) };

export const Wrapped: StoryObj = {
  render: () =>
    `<div data-story="rail-items"><div data-story="rail-narrow"><ocelle-personal-rail label="Personal drawer" orientation="horizontal">${Array.from({ length: 8 }, (_, at) => item(`item-${String(at + 1)}`, String(at + 1))).join("")}${account}${item("help", "He", "bottom")}</ocelle-personal-rail></div></div>`,
};

export const HostAriaLabel: StoryObj = { name: "Host aria-label", render: () => rail(' aria-label="Personal"', primary + account) };

export const LabelAndHostAriaLabel: StoryObj = { name: "Label and host aria-label", render: () => rail(' label="Me" aria-label="Other"', primary + account) };

export const BlankHostAriaLabel: StoryObj = { name: "Blank host aria-label", render: () => rail(' label="Me" aria-label=""', primary + account) };

export const InitialsTrigger: StoryObj = {
  render: () => rail(' label="Personal"', primary +
    '<ocelle-button slot="bottom" flush ground="chrome" label="Settings"><ocelle-icon slot="icon" name="settings"></ocelle-icon></ocelle-button>' +
    '<ocelle-button slot="bottom" flush ground="chrome" label="Account actions for WW" initials="WW"></ocelle-button>'),
};
