// The ocelle-dialog stories (008 FR-042; data-model.md § Stories; research.md R-16; tasks.md T028): each renders an
// open dialog, which calls showModal() on its first update, so the capture holds it in the top layer inside the story
// root, in light and dark through the preview's theme global. The element is imported from the package source by
// relative path, as the icon and mark stories import theirs, so the Storybook needs no built dist/. The markup has no
// style attribute. There is no 320 × 256 story: the capture has one viewport for every story, so the short-viewport
// case is a row of the element's test matrix instead (R-16). The long-scrolling-body and prose-with-a-table stories
// are laid out so no line of text is cut by a scroll edge in the capture (operator decision C at T026): the table is
// narrow enough for the panel, and the long body has an empty block across its scroll edge.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-dialog.ts";

const meta: Meta = { title: "Elements/ocelle-dialog" };
export default meta;

const actions = (cancel: string, confirm: string): string => `<button slot="footer" type="button">${cancel}</button><button slot="footer" type="button">${confirm}</button>`;

export const Default: StoryObj = {
  render: () => '<ocelle-dialog open label="Open project"><p>Choose a folder to open as a project. Its missions and artifacts appear in the workspace.</p></ocelle-dialog>',
};

export const OneLineConfirmation: StoryObj = {
  name: "One-line confirmation",
  render: () => `<ocelle-dialog open label="Delete project"><p>Delete this project?</p>${actions("Cancel", "Delete")}</ocelle-dialog>`,
};

export const WithFooterActions: StoryObj = {
  name: "With footer actions",
  render: () =>
    `<ocelle-dialog open label="Rename project"><p>The new name is shown in the workspace and in every mission of the project.</p><p><label>Name <input type="text" value="ocelle-components"></label></p>${actions("Cancel", "Rename")}</ocelle-dialog>`,
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
  // The empty, text-free block after the tenth paragraph crosses the body's scroll edge in the 1280 × 800 capture, so no
  // paragraph's box sits across that edge inside the viewport (operator decision 2026-11-14, R-16); it is sized by the
  // `[data-story="dialog-scroll-edge"]` rule of stories-layout.css.
  render: () =>
    `<ocelle-dialog open label="Licence">${licence
      .map((text, index) => `<p>${text}</p>${index === 9 ? '<div data-story="dialog-scroll-edge"></div>' : ""}`)
      .join("")}${actions("Close", "Accept")}</ocelle-dialog>`,
};

export const ProseWithATable: StoryObj = {
  name: "Prose with a table",
  render: () =>
    '<ocelle-dialog open label="Mission summary"><div data-ocelle-prose=""><p>The mission added three elements and three tokens. The table lists what each phase delivered.</p><table><thead><tr><th>Phase</th><th>Delivered</th></tr></thead><tbody><tr><td>1</td><td>Test harness</td></tr><tr><td>2</td><td>Dialog</td></tr><tr><td>3</td><td>Drawer</td></tr></tbody></table><p>Each phase was reviewed before the next began.</p></div></ocelle-dialog>',
};

const folders = ["ocelle-components", "kitty-mission-ui", "spec-kitty-design", "ocelle-console"];

export const OpenProject: StoryObj = {
  name: "Open project",
  render: () =>
    `<ocelle-dialog open label="Open project"><p>Choose a folder.</p><ul aria-label="Folders">${folders.map((name) => `<li><button type="button">${name}</button></li>`).join("")}</ul>${actions("Cancel", "Open")}</ocelle-dialog>`,
};

export const LongLabel: StoryObj = {
  name: "Long label",
  render: () =>
    `<ocelle-dialog open label="Move the selected artifacts of this mission to another project of the workspace"><p>The artifacts keep their history.</p>${actions("Cancel", "Move")}</ocelle-dialog>`,
};

export const HostAriaLabel: StoryObj = {
  name: "Host aria-label",
  render: () => '<ocelle-dialog open aria-label="Settings"><p>A dialog named by its host aria-label, with no visible heading text.</p></ocelle-dialog>',
};
