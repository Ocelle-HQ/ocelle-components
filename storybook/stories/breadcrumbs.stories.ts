import type { Meta, StoryObj } from "@storybook/html-vite";
import { OcelleBreadcrumbs, type BreadcrumbItem } from "../../packages/elements/src/ocelle-breadcrumbs.ts";

const meta: Meta = { title: "Elements/ocelle-breadcrumbs" };
export default meta;

const items: readonly BreadcrumbItem[] = [
  { label: "Workspaces", href: "/workspaces" },
  { label: "Projects", href: "/projects" },
  { label: "Launch plan" },
];

function page(items: readonly BreadcrumbItem[], title: string, narrow = false): HTMLElement {
  const trails = new OcelleBreadcrumbs();
  trails.label = "Project path";
  trails.items = items;
  const heading = document.createElement("h1");
  heading.textContent = title;
  const region = document.createElement("main");
  if (narrow) region.dataset.story = "inline-navigation-narrow";
  region.append(trails, heading);
  return region;
}

export const Default: StoryObj = { render: () => page(items, "Launch plan") };
export const Current: StoryObj = {
  render: () => page([{ label: "Projects", href: "/projects" }], "Projects"),
};
export const KeyboardFocus: StoryObj = {
  render: () => page(items, "Launch plan"),
  play: async ({ canvasElement }) => {
    const trail = canvasElement.querySelector("ocelle-breadcrumbs");
    await trail?.updateComplete;
    trail?.shadowRoot?.querySelector("a")?.focus();
  },
};
export const Empty: StoryObj = { render: () => page([], "Launch plan") };
export const LongContent: StoryObj = {
  render: () => page([
    { label: "International operations workspaces", href: "/workspaces" },
    { label: "Customer onboarding and support projects", href: "/projects" },
    { label: "Launch plan" },
  ], "Launch plan", true),
};
