// The base-style stories (003 FR-023, research.md R-12): one story per family of base.css, rendered by
// renderFamily() from the stories' text (base-content.json), with no style attribute and no class. The preview links
// base.css after tokens.css for every story (preview-head.html), so these show the base layer itself.
import type { Meta, StoryObj } from "@storybook/html-vite";
import { renderFamily } from "./render.ts";

const meta: Meta = { title: "Base styles" };
export default meta;

export const BasePage: StoryObj = { name: "Base page", render: () => renderFamily("base") };
