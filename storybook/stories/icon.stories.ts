// The ocelle-icon stories (005 FR-019, US1 scenario 13; research.md R-14): the close icon, a labelled icon and an
// unknown name, in light and dark through the preview's theme global. The element is imported from the package
// source by relative path, as the token stories import the token source, so the Storybook needs no built dist/; its
// markup has no style attribute (the csp gate's Storybook check). The set's grid shows the eighteen icons, left to
// right and right to left, where the four inline-direction icons are mirrored (005 T038).
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-button.ts";
import type { IconName } from "../../packages/elements/src/icons.ts";

const meta: Meta = { title: "Elements/ocelle-icon" };
export default meta;

export const Close: StoryObj = { render: () => '<p>Close <ocelle-icon name="close"></ocelle-icon></p>' };

export const Labelled: StoryObj = { render: () => '<p><ocelle-icon name="close" label="Close"></ocelle-icon> a labelled icon, one image named Close</p>' };

export const UnknownName: StoryObj = { name: "Unknown name", render: () => '<p>An unknown name draws nothing and keeps the box: [<ocelle-icon name="nonexistent"></ocelle-icon>]</p>' };

/** The eighteen names of the set (FR-017). */
const names = ["chevron-start", "chevron-end", "chevron-up", "chevron-down", "arrow-start", "arrow-end", "menu", "close", "folder", "file", "search", "table", "copy", "inbox", "history", "settings", "notifications", "appearance"] satisfies readonly IconName[];

function grid(direction: "ltr" | "rtl"): string {
  return `<dl dir="${direction}">${names.map((name) => `<dt><ocelle-icon name="${name}"></ocelle-icon></dt><dd>${name}</dd>`).join("")}</dl>`;
}

export const Set: StoryObj = { name: "Set", render: () => grid("ltr") };

export const SetRightToLeft: StoryObj = { name: "Set, right to left", render: () => grid("rtl") };

function chromeAction(name: IconName, label: string): StoryObj {
  return {
    render: () => `<div class="ocelle-swatch" data-token="color-chrome" data-story="ground">
      <ocelle-button flush ground="chrome" label="${label}"><ocelle-icon slot="icon" name="${name}"></ocelle-icon></ocelle-button>
    </div>`,
  };
}

export const InboxAction: StoryObj = chromeAction("inbox", "Inbox");
export const HistoryAction: StoryObj = chromeAction("history", "History");
export const SettingsAction: StoryObj = chromeAction("settings", "Settings");
export const NotificationsAction: StoryObj = chromeAction("notifications", "Notifications");
export const AppearanceAction: StoryObj = chromeAction("appearance", "Appearance");
