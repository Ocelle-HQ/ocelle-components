// The ocelle-disclosure stories (020 spec US1, FR-050; research.md R-09; tasks.md T008): closed, open, focused (a
// wrapper that calls the disclosure's `focus()` once it has rendered, as the button's focused story does), hovered (006's
// pointer parameter on the disclosure, whose centre is its summary while closed), a long summary in a 288 px frame (a
// `data-story` rule of stories-layout.css, so the markup has no style attribute), a consumer icon, right to left and
// nested disclosures, in light and dark through the preview's theme global. The unnamed disclosure (an empty summary,
// no host label) has no story: axe fails it by design, and browser tests prove it (plan Complexity Tracking). The
// panels' links point at fragments of the story page, so a capture never navigates. The elements are imported from
// the package source by relative path, as the other element stories import theirs.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-disclosure.ts";
import "../../packages/elements/src/ocelle-icon.ts";

const meta: Meta = { title: "Elements/ocelle-disclosure" };
export default meta;

/** A story-only wrapper that focuses the `ocelle-disclosure` it holds once that has rendered. */
class StoryDisclosureFocus extends HTMLElement {
  connectedCallback(): void {
    void customElements.whenDefined("ocelle-disclosure").then(async () => {
      const disclosure = this.querySelector("ocelle-disclosure");
      if (disclosure === null) return;
      await disclosure.updateComplete;
      disclosure.focus();
    });
  }
}
if (customElements.get("story-disclosure-focus") === undefined) customElements.define("story-disclosure-focus", StoryDisclosureFocus);

const panel = '<p>Artifacts are kept for thirty days after a mission ends. <a href="#retention">Retention policy</a></p>';

/** A disclosure with `summary` text, its `attributes` and the default panel. */
const disclosure = (summary: string, attributes = "", content = panel): string => `<ocelle-disclosure${attributes}><span slot="summary">${summary}</span>${content}</ocelle-disclosure>`;

export const Closed: StoryObj = { render: () => `${disclosure("Advanced settings")}<p>Content after the disclosure.</p>` };

export const Open: StoryObj = { render: () => `${disclosure("Advanced settings", " open")}<p>Content after the disclosure.</p>` };

export const Focused: StoryObj = { render: () => `<story-disclosure-focus>${disclosure("Advanced settings")}</story-disclosure-focus>` };

export const Hovered: StoryObj = {
  parameters: { ocelle: { pointer: { hover: "ocelle-disclosure" } } },
  render: () => disclosure("Advanced settings"),
};

export const LongSummary: StoryObj = {
  name: "Long summary",
  render: () => `<div data-story="disclosure-narrow">${disclosure("Retention, archival and deletion settings for every artifact of this mission", " open")}</div>`,
};

export const ConsumerIcon: StoryObj = {
  name: "Consumer icon",
  render: () => `<ocelle-disclosure><ocelle-icon slot="icon" name="folder"></ocelle-icon><span slot="summary">Mission artifacts</span>${panel}</ocelle-disclosure>`,
};

export const RightToLeft: StoryObj = {
  name: "Right to left",
  render: () => `<div dir="rtl">${disclosure("Advanced settings")}${disclosure("Retention", " open")}</div>`,
};

export const Nested: StoryObj = {
  render: () => disclosure("Mission settings", " open", `<p>Settings of this mission.</p>${disclosure("Advanced settings", " open", "<p>The retention period is thirty days.</p>")}${disclosure("Archival")}`),
};
