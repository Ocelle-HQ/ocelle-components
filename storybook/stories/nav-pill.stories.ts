import type { Meta, StoryObj } from "@storybook/html-vite";
import { OcelleNavPill, type NavPillItem } from "../../packages/elements/src/ocelle-nav-pill.ts";

const meta: Meta = { title: "Elements/ocelle-nav-pill" };
export default meta;

const links = [
  { label: "Overview", href: "/overview" },
  { label: "Activity", href: "/activity" },
  { label: "Settings", href: "/settings" },
] as const satisfies readonly NavPillItem[];

function navigation(items: readonly NavPillItem[], narrow = false): HTMLElement {
  const pill = new OcelleNavPill();
  pill.label = "Project sections";
  pill.items = items;
  const frame = document.createElement("div");
  if (narrow) frame.dataset.story = "inline-navigation-narrow";
  frame.append(pill);
  return frame;
}

export const Default: StoryObj = { render: () => navigation(links) };
export const Current: StoryObj = {
  render: () => navigation([links[0], { ...links[1], current: true }, links[2]]),
};
export const KeyboardFocus: StoryObj = {
  render: () => navigation(links),
  play: async ({ canvasElement }) => {
    const pill = canvasElement.querySelector("ocelle-nav-pill");
    await pill?.updateComplete;
    pill?.shadowRoot?.querySelector("a")?.focus();
  },
};
export const Empty: StoryObj = {
  render: () => {
    const title = document.createElement("h1");
    title.textContent = "Project overview";
    const page = document.createElement("main");
    page.append(title, navigation([]));
    return page;
  },
};
export const LongContent: StoryObj = {
  render: () => navigation([
    { label: "Project administration and permissions", href: "/settings" },
    { label: "Tasks assigned to external collaborators", href: "/tasks", current: true },
  ], true),
};
