// The ocelle-action-row stories (012 spec US4, US5, FR-050; research.md R-13; plan decisions 27, 30 and 31; tasks.md
// T058, T065): one story per presentation and state of User Stories 4 and 5 (current, unavailable, link rows and the
// card layout), in light and dark through the preview's theme global. Hover is
// declared with 006's pointer parameter, on the one row of its story; the focused story's wrapper calls the second
// row's plain `focus()` once it has rendered, the method the phase 2 spike measured to show `:focus-visible` in 006's
// pinned capture (reviews/phase-2/spike.md). The grounds come from the generated swatch stylesheet's rule for each
// token, by class and data-token, as in the button stories, so the markup has no style attribute. The description,
// tags and trailing icon are shown beside each row's control (plan decision 30), so a row with every slot keeps 0 axe
// findings. The elements are imported from the package source by relative path.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-action-row.ts";
import "../../packages/elements/src/ocelle-icon.ts";

const meta: Meta = { title: "Elements/ocelle-action-row" };
export default meta;

/** A story-only wrapper that focuses the second `ocelle-action-row` it holds once that has rendered (plan decision 27); the current focused story uses it too. */
class StoryRowFocus extends HTMLElement {
  connectedCallback(): void {
    void customElements.whenDefined("ocelle-action-row").then(async () => {
      const row = this.querySelectorAll("ocelle-action-row")[1];
      if (row === undefined) return;
      await row.updateComplete;
      row.focus();
    });
  }
}
if (customElements.get("story-row-focus") === undefined) customElements.define("story-row-focus", StoryRowFocus);

/** A ground for a story's rows: the swatch rule of `token` as its background, padded. */
function ground(token: string, content: string): string {
  return `<div class="ocelle-swatch" data-token="${token}" data-story="ground">${content}</div>`;
}

const folder = '<ocelle-icon slot="icon" name="folder"></ocelle-icon>';
const arrow = '<ocelle-icon slot="trailing" name="arrow-end"></ocelle-icon>';
const slots = `${folder}Mission 42<span slot="description">Due Friday</span><span slot="tags">Blocked</span><span slot="tags">Design</span>${arrow}`;

/** Three rows of a list, with the attributes given. */
function list(attributes = ""): string {
  return ["41", "42", "43"].map((at) => `<ocelle-action-row row-id="m-${at}"${attributes}>${folder}Mission ${at}</ocelle-action-row>`).join("");
}

/** A default and a flush row with every slot, with the attributes given. */
function pair(attributes = ""): string {
  return `<ocelle-action-row row-id="m-42"${attributes}>${slots}</ocelle-action-row><ocelle-action-row row-id="m-43" presentation="flush"${attributes}>${slots.replace("Mission 42", "Mission 43")}</ocelle-action-row>`;
}

export const Default: StoryObj = { render: () => list() };

export const Flush: StoryObj = { render: () => list(' presentation="flush"') };

export const AllSlots: StoryObj = { name: "All slots", render: () => pair() };

export const Busy: StoryObj = { render: () => pair(" busy") };

export const Hovered: StoryObj = {
  parameters: { ocelle: { pointer: { hover: "ocelle-action-row" } } },
  render: () => `<ocelle-action-row row-id="m-42">${slots}</ocelle-action-row>`,
};

export const FlushHovered: StoryObj = {
  name: "Flush, hovered",
  parameters: { ocelle: { pointer: { hover: "ocelle-action-row" } } },
  render: () => `<ocelle-action-row row-id="m-42" presentation="flush">${slots}</ocelle-action-row>`,
};

export const RightToLeft: StoryObj = { name: "Right to left", render: () => `<div dir="rtl">${pair()}</div>` };

export const Chrome: StoryObj = { render: () => ground("color-chrome", pair(' ground="chrome"')) };

export const GroundAccentLow: StoryObj = { name: "Ground accent-low", render: () => ground("color-accent-low", pair(' ground="accent-low"')) };

export const GroundInset: StoryObj = { name: "Ground inset", render: () => ground("color-inset", pair(' ground="inset"')) };

export const GroundHoverBg: StoryObj = { name: "Ground hover-bg", render: () => ground("color-hover-bg", pair(' ground="hover-bg"')) };

export const GroundState: StoryObj = { name: "Ground state", render: () => ground("color-warning-bg", pair(' ground="state"')) };

export const Focused: StoryObj = { render: () => `<story-row-focus>${list()}</story-row-focus>` };

// User Story 5 (tasks.md T065): the current mark, the unavailable look, link rows and the card layout, each with a
// description and tags, so their axe runs cover the text over the hit layer (plan decisions 30 and 31).

/** A list of three rows with every slot, the second current. */
const currentList = ["41", "42", "43"].map((at) => `<ocelle-action-row row-id="m-${at}"${at === "42" ? ' current="page"' : ""}>${slots.replace("Mission 42", `Mission ${at}`)}</ocelle-action-row>`).join("");

/** A card's tags: enough to wrap onto several lines in the story's 1280 px frame. */
const manyTags = ["Blocked", "Design", "Needs review", "Backend", "Frontend", "Ops", "Security", "Docs", "Release 1.0", "Accessibility", "Tokens", "Storybook", "Visual", "Mutation"]
  .flatMap((tag) => [tag, `${tag} follow-up`])
  .map((tag) => `<span slot="tags">${tag}</span>`)
  .join("");

export const CurrentPage: StoryObj = { name: "Current page", render: () => pair(' current="page"') };

export const CurrentTrue: StoryObj = { name: "Current true", render: () => pair(' current="true"') };

export const CurrentHovered: StoryObj = {
  name: "Current, hovered",
  parameters: { ocelle: { pointer: { hover: "ocelle-action-row" } } },
  render: () => `<ocelle-action-row row-id="m-42" current="page">${slots}</ocelle-action-row>`,
};

export const CurrentFocused: StoryObj = { name: "Current, focused", render: () => `<story-row-focus>${currentList}</story-row-focus>` };

export const Unavailable: StoryObj = { render: () => pair(" unavailable") };

export const UnavailableCurrent: StoryObj = { name: "Unavailable, current", render: () => pair(' unavailable current="page"') };

export const LinkRow: StoryObj = { name: "Link row", render: () => pair(' href="#missions"') };

export const Card: StoryObj = { render: () => pair(' layout="card"') };

export const CardWithManyTags: StoryObj = {
  name: "Card with many tags",
  render: () => `<ocelle-action-row row-id="m-42" layout="card">${folder}Mission 42<span slot="description">Due Friday</span>${manyTags}${arrow}</ocelle-action-row>`,
};

export const CardRightToLeft: StoryObj = { name: "Card, right to left", render: () => `<div dir="rtl">${pair(' layout="card"')}</div>` };

export const ChromeCurrent: StoryObj = { name: "Chrome, current", render: () => ground("color-chrome", pair(' ground="chrome" current="page"')) };
