import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-button.ts";
import "../../packages/elements/src/ocelle-step-indicator.ts";
import { renderPaneActionFooter } from "./pane-action-footer.ts";
import "./pane-action-footer.css";

const meta: Meta = { title: "Recipes/Pane action footer" };
export default meta;

export const PrimaryOnly: StoryObj = {
  render: () => renderPaneActionFooter("primary-only"),
};

export const SecondaryAndPrimary: StoryObj = {
  render: () => renderPaneActionFooter("secondary-and-primary"),
};

export const BackAndPrimary: StoryObj = {
  render: () => renderPaneActionFooter("back-and-primary"),
};

export const Empty: StoryObj = {
  render: () => renderPaneActionFooter("empty"),
};
