import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-app-shell.ts";
import "../../packages/elements/src/ocelle-button.ts";
import "../../packages/elements/src/ocelle-personal-rail.ts";

const meta: Meta = { title: "Elements/ocelle-app-shell" };
export default meta;

const action = '<ocelle-button slot="actions" ground="chrome">Settings</ocelle-button>';
const rail = `<ocelle-personal-rail slot="rail" label="Account navigation">
  <ocelle-nav-item href="#workspaces" label="Workspaces" compact current="page"><ocelle-icon slot="icon" name="folder"></ocelle-icon></ocelle-nav-item>
  <ocelle-nav-item href="#search" label="Search" compact><ocelle-icon slot="icon" name="search"></ocelle-icon></ocelle-nav-item>
</ocelle-personal-rail>`;
const sidebar = `<ocelle-context-sidebar slot="sidebar" label="Project navigation">
  <strong slot="head">Atlas Project</strong>
  <section><h2>Project views</h2><ul>
    <li><ocelle-nav-item href="#overview" label="Overview" current="page"><ocelle-icon slot="icon" name="folder"></ocelle-icon></ocelle-nav-item></li>
    <li><ocelle-nav-item href="#activity" label="Activity"><ocelle-icon slot="icon" name="table"></ocelle-icon></ocelle-nav-item></li>
  </ul></section>
  <a slot="footer" href="#project-settings">Project settings</a>
</ocelle-context-sidebar>`;
const personal = `<ocelle-context-sidebar slot="sidebar" label="Personal navigation">
  <strong slot="head">Your account</strong>
  <section><h2>Account views</h2><ul>
    <li><ocelle-nav-item href="#workspaces" label="Your workspaces" current="page"><ocelle-icon slot="icon" name="folder"></ocelle-icon></ocelle-nav-item></li>
    <li><ocelle-nav-item href="#invitations" label="Invitations"><ocelle-icon slot="icon" name="file"></ocelle-icon></ocelle-nav-item></li>
  </ul></section>
</ocelle-context-sidebar>`;
const overview = '<section><h1>Workspace overview</h1><p>Review current missions and recent activity.</p></section>';
const inspector = `<div data-story="app-shell-detail">${overview}<aside aria-label="Mission inspector"><h2>Mission details</h2><p>Assigned to the Atlas team.</p></aside></div>`;

function frame(attributes: string, navigation: string, content = overview): string {
  return `<ocelle-app-shell product-name="Kitty Desktop" ${attributes}>${navigation}${content}</ocelle-app-shell>`;
}

const collapsed = (shell: string): string => `<div data-story="app-shell-collapsed">${shell}</div>`;

export const MissionExpanded: StoryObj = { render: () => frame("", action + rail + sidebar) };
export const MissionCollapsed: StoryObj = { render: () => collapsed(frame("", action + rail + sidebar)) };
export const ProjectExpanded: StoryObj = { render: () => frame('layout="project"', action + sidebar) };
export const ProjectCollapsed: StoryObj = { render: () => collapsed(frame('layout="project"', action + sidebar)) };
export const Personal: StoryObj = { render: () => collapsed(frame('layout="personal"', action + personal)) };
export const OmittedRegions: StoryObj = { render: () => frame("", "") };
export const FlushBlockEnd: StoryObj = { render: () => frame('layout="project" flush-block-end', sidebar, inspector) };
export const FlushInlineEnd: StoryObj = { render: () => frame('layout="project" flush-inline-end', sidebar, inspector) };
export const FlushBothEnds: StoryObj = { render: () => frame('layout="project" flush-block-end flush-inline-end', sidebar, inspector) };

const narrow = (layout: string, navigation: string): string =>
  `<div data-story="app-shell-narrow">${frame(`layout="${layout}"`, action + navigation)}</div>`;

const openNavigation: NonNullable<StoryObj["play"]> = async ({ canvasElement }) => {
  const shell = canvasElement.querySelector("ocelle-app-shell");
  await shell?.updateComplete;
  const bar = shell?.shadowRoot?.querySelector("ocelle-top-bar");
  await bar?.updateComplete;
  const menu = bar?.shadowRoot?.querySelector("button");
  if (shell == null || menu == null) throw new Error("Expected a narrow app shell and menu");
  menu.focus();
  menu.click();
  await shell.updateComplete;
  const drawer = shell.shadowRoot?.querySelector("ocelle-drawer");
  await drawer?.updateComplete;
  if (drawer?.open !== true) throw new Error("Expected the app shell navigation drawer to open");
};

export const MissionNarrow: StoryObj = { render: () => narrow("mission", rail + sidebar) };
export const MissionDrawerOpen: StoryObj = { render: () => narrow("mission", rail + sidebar), play: openNavigation };
export const ProjectNarrow: StoryObj = { render: () => narrow("project", sidebar) };
export const ProjectDrawerOpen: StoryObj = { render: () => narrow("project", sidebar), play: openNavigation };
export const PersonalNarrow: StoryObj = { render: () => narrow("personal", personal) };
export const PersonalDrawerOpen: StoryObj = { render: () => narrow("personal", personal), play: openNavigation };
