import type { Meta, StoryObj } from "@storybook/html-vite";
import { OcelleSkipLink } from "../../packages/elements/src/ocelle-skip-link.ts";

const meta: Meta = { title: "Elements/ocelle-skip-link" };
export default meta;

function page(label?: string): HTMLElement {
  const frame = document.createElement("div");
  const target = document.createElement("main");
  const title = document.createElement("h1");
  title.textContent = label === undefined ? "Project overview" : "Projektübersicht";
  target.dataset.story = "skip-link-content";
  target.tabIndex = -1;
  target.append(title);

  const skip = new OcelleSkipLink();
  skip.target = target;
  if (label !== undefined) {
    skip.textContent = label;
    frame.dataset.story = "inline-navigation-narrow";
  }
  frame.append(skip, target);
  return frame;
}

const reveal: NonNullable<StoryObj["play"]> = async ({ canvasElement }) => {
  const skip = canvasElement.querySelector("ocelle-skip-link");
  await skip?.updateComplete;
  skip?.shadowRoot?.querySelector("button")?.focus();
};

export const Default: StoryObj = { render: () => page() };
export const KeyboardFocus: StoryObj = { render: () => page(), play: reveal };
export const LocalizedNarrow: StoryObj = {
  render: () => page("Direkt zum Hauptinhalt der Projektübersicht"),
  play: reveal,
};
