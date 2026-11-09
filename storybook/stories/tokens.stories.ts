// The token reference stories (FR-023, US1 scenario 11; research.md R-10): one story per token group of FR-001's
// canonical list, rendered from the token source by relative import (never the package entry, which points at an
// unbuilt dist/), in the theme of the `theme` global (light unless it is "dark"). Swatches get their colour from the
// generated swatch stylesheet by class, never from a style attribute.
import type { Meta, StoryObj } from "@storybook/html-vite";
import type { Group } from "../../packages/tokens/src/generate.ts";
import { source } from "../../packages/tokens/src/source.ts";
import { renderGroup } from "./render.ts";

const meta: Meta = { title: "Tokens" };
export default meta;

function story(group: Group): StoryObj {
  return { render: (_args, context) => renderGroup(source, group, context.globals.theme === "dark" ? "dark" : "light") };
}

export const Colour = story("colour");
export const Type = story("type");
export const Space = story("space");
export const Shape = story("shape");
export const Size = story("size");
export const Shell = story("shell");
export const Elevation = story("elevation");
export const Motion = story("motion");
