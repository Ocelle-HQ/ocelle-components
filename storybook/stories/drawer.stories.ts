// The ocelle-drawer stories (008 FR-042; data-model.md § Stories; research.md R-16; tasks.md T039): each renders an
// open drawer, which calls showModal() on its first update, so the capture holds it in the top layer inside the story
// root, in light and dark through the preview's theme global: start; end; rtl start; chrome ground; chrome ground with
// heading-hidden; long scrolling body. The element is imported from the package source by relative path, as the other
// element stories import theirs, so the Storybook needs no built dist/. The markup has no style attribute. The
// motion, the backdrop click, sizes at other viewports and forced colours are rows of the element's test matrix, not
// stories: the capture has one viewport and runs with animations off (R-16).
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-drawer.ts";

const meta: Meta = { title: "Elements/ocelle-drawer" };
export default meta;

const actions = (cancel: string, confirm: string): string => `<button slot="footer" type="button">${cancel}</button><button slot="footer" type="button">${confirm}</button>`;

const filters = `<p>Show the missions of the workspace that match every filter.</p><p><label><input type="checkbox" checked> Open missions</label></p><p><label><input type="checkbox"> Archived missions</label></p>${actions("Reset", "Apply")}`;

export const Start: StoryObj = {
  render: () => `<ocelle-drawer open label="Filters" side="start">${filters}</ocelle-drawer>`,
};

export const End: StoryObj = {
  render: () =>
    `<ocelle-drawer open label="Details" side="end"><p>The mission added three elements and three tokens.</p><p>Each phase was reviewed before the next began.</p>${actions("Close", "Open mission")}</ocelle-drawer>`,
};

export const RtlStart: StoryObj = {
  name: "rtl start",
  render: () => `<ocelle-drawer open dir="rtl" label="Filters" side="start">${filters}</ocelle-drawer>`,
};

const personal = "<p>Workspace: ocelle-components</p><p>Three missions in review.</p><p>Two artifacts waiting for you.</p>";

export const ChromeGround: StoryObj = {
  name: "Chrome ground",
  render: () => `<ocelle-drawer open label="Personal" ground="chrome" side="start">${personal}</ocelle-drawer>`,
};

export const ChromeGroundHeadingHidden: StoryObj = {
  name: "Chrome ground, heading hidden",
  render: () => `<ocelle-drawer open label="Personal" ground="chrome" heading-hidden side="start">${personal}</ocelle-drawer>`,
};

const licence = [
  "Licensed under the Apache License, Version 2.0.",
  "Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “as is” basis, without warranties or conditions of any kind, either express or implied.",
  "See the License for the specific language governing permissions and limitations under the License.",
  "The Schibsted Grotesk font is licensed under the SIL Open Font License 1.1; its licence ships beside the font files.",
  "The browser build bundles Lit, under the BSD 3-Clause licence, whose text ships beside the build.",
  "Every icon and the mark are the project's own drawings, under Apache-2.0.",
  "“Ocelle” and the rosette mark are trademarks of their owner. The licence grants no right to use them.",
  "They may be used only to refer to Ocelle.",
  "Contributions are signed off under the Developer Certificate of Origin.",
  "Security issues are reported privately, as the repository's security policy describes.",
  "Each release has a changelog entry per package that names the changes to its public surface.",
  "The public surface is the custom-elements manifest, the token names and the documented base-style hooks.",
  "Removing or renaming any of them, or changing an event's payload, is a major change.",
  "Additions are minor changes, and fixes that keep the surface are patch changes.",
  "Three consumers pin these packages, so the version number tells them whether an upgrade can break them.",
  "The first public release is 1.0.0; before it, the surface may change without a major version.",
];

export const LongScrollingBody: StoryObj = {
  name: "Long scrolling body",
  // The empty, text-free block after the sixth paragraph crosses the body's scroll edge in the 1280 × 800 capture, so
  // no paragraph's box sits across that edge inside the viewport (operator decision 2026-11-15, R-16 generalised,
  // plan decision 24); it is sized by the `[data-story="drawer-scroll-edge"]` rule of stories-layout.css.
  render: () =>
    `<ocelle-drawer open label="Licence" side="end">${licence
      .map((text, index) => `<p>${text}</p>${index === 5 ? '<div data-story="drawer-scroll-edge"></div>' : ""}`)
      .join("")}${actions("Close", "Accept")}</ocelle-drawer>`,
};
