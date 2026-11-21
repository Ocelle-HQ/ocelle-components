import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-nav-item.ts";

const meta: Meta = { title: "Elements/ocelle-nav-item" };
export default meta;

const folder = '<ocelle-icon slot="icon" name="folder"></ocelle-icon>';
const item = (attributes = 'href="#projects"', label = "Projects"): string => `<ocelle-nav-item ${attributes} label="${label}">${folder}</ocelle-nav-item>`;
const compact = (attributes = ""): string => `<p>Workspace navigation</p><div data-story="compact-nav">${item(`href="#projects" compact ${attributes}`)}</div>`;

class StoryNavItemFocus extends HTMLElement {
  connectedCallback(): void {
    void this.#focus();
  }

  async #focus(): Promise<void> {
    const nav = this.querySelector("ocelle-nav-item");
    await nav?.updateComplete;
    await nav?.shadowRoot?.querySelector("ocelle-tooltip")?.updateComplete;
    nav?.shadowRoot?.querySelector("a")?.focus();
  }
}

if (customElements.get("story-nav-item-focus") === undefined) customElements.define("story-nav-item-focus", StoryNavItemFocus);

export const Expanded: StoryObj = { render: () => item() };
export const CurrentPage: StoryObj = { render: () => item('href="#projects" current="page"') };
export const TextOnly: StoryObj = { render: () => item("") };
export const Compact: StoryObj = { render: () => compact() };
export const CompactCurrent: StoryObj = { render: () => compact('current="true"') };
export const CompactHovered: StoryObj = {
  parameters: { ocelle: { pointer: { hover: "ocelle-nav-item" } } },
  render: () => compact(),
};
export const CompactFocused: StoryObj = { render: () => `<story-nav-item-focus>${compact()}</story-nav-item-focus>` };
