// Plant for the content-security check: a story whose markup string carries a style attribute.
import type { StoryObj } from "@storybook/html-vite";

export default { title: "Plant" };

export const Swatch: StoryObj = {
  render: (): string => '<span class="ocelle-swatch" style="background: var(--ocelle-color-accent)"></span>',
};
