import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-top-bar.ts";
import "../../packages/elements/src/ocelle-button.ts";

const meta: Meta = { title: "Elements/ocelle-top-bar" };
export default meta;

const settings = '<ocelle-button slot="actions" ground="chrome">Settings</ocelle-button>';
const bar = (attributes = "", actions = "", product = "Kitty Dashboard"): string =>
  `<ocelle-top-bar product-name="${product}"${attributes}>${actions}</ocelle-top-bar>`;

class StoryTopBarFocus extends HTMLElement {
  connectedCallback(): void {
    void this.#focus();
  }

  async #focus(): Promise<void> {
    const top = this.querySelector("ocelle-top-bar");
    await top?.updateComplete;
    top?.shadowRoot?.querySelector("button")?.focus();
  }
}

if (customElements.get("story-top-bar-focus") === undefined) customElements.define("story-top-bar-focus", StoryTopBarFocus);

export const BrandOnly: StoryObj = { render: () => bar() };
export const WithActions: StoryObj = { render: () => bar("", settings) };
export const MenuClosed: StoryObj = { render: () => bar(" show-menu", settings) };
export const MenuExpanded: StoryObj = { render: () => bar(" show-menu menu-expanded", settings) };
export const Focused: StoryObj = { render: () => `<story-top-bar-focus>${bar(" show-menu", settings)}</story-top-bar-focus>` };
export const Narrow: StoryObj = {
  render: () => `<div data-story="top-bar-narrow">${bar(' show-menu menu-label="Navigation öffnen"', settings, "Eine sehr lange Übersetzung des Produktnamens")}</div>`,
};
